/**
 * VIDEO FILE PROCESSOR
 * Processes pre-recorded video files (MP4, etc.) for testing and analysis
 * Extracts frames and runs detection models on video footage
 */

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';
import logger from '../utils/logger';
import multiModelDetection from './multiModelDetection';
import configService from '../utils/config';

class VideoFileProcessor {
  constructor() {
    this.isProcessing = false;
    this.currentVideo = null;
    this.frameExtractionInterval = 1000; // Extract frame every 1 second (1 FPS)
    this.processingHistory = [];
  }

  /**
   * Process a video file using server-side processing
   * @param {string} videoUri - URI to video file (file:// or asset://)
   * @param {Object} options - Processing options
   * @param {string} options.officerName - Officer name for context
   * @param {Object} options.context - Operational context
   * @param {Object} options.calibrationData - Calibration data
   * @param {Function} options.onFrameProcessed - Callback for each processed frame
   * @param {Function} options.onDetection - Callback when detection occurs
   * @param {number} options.frameInterval - Interval between frames in seconds (default: 1)
   * @returns {Promise<Object>} Processing results
   */
  async processVideoFile(videoUri, options = {}) {
    if (this.isProcessing) {
      throw new Error('Video processing already in progress');
    }

    const {
      officerName = null,
      context = null,
      calibrationData = null,
      onFrameProcessed = null,
      onDetection = null,
      frameInterval = 1000, // Extract frame every 1 second
    } = options;

    this.isProcessing = true;
    this.frameExtractionInterval = frameInterval;

    const results = {
      videoUri,
      startTime: new Date().toISOString(),
      framesProcessed: 0,
      detections: [],
      errors: [],
      summary: {},
    };

    try {
      logger.info('Starting video file processing', { videoUri });

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        throw new Error(`Video file not found: ${videoUri}`);
      }

      // Use server-side processing if bridge server is available
      const bridgeServerUrl = configService.getServerUrl('bridge');
      if (bridgeServerUrl) {
        logger.info('Using server-side video processing', { bridgeServerUrl });
        return await this.processVideoFileServerSide(videoUri, options);
      }

      // Fallback to client-side processing (if implemented)
      logger.info('Using client-side video processing (fallback)');
      const frames = await this.extractFramesFromVideo(videoUri);
      logger.info(`Extracted ${frames.length} frames from video`);

      // Process each frame
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const frameNumber = i + 1;

        try {
          logger.debug(`Processing frame ${frameNumber}/${frames.length}`, {
            timestamp: frame.timestamp,
            uri: frame.uri,
          });

          // Run all detections on frame
          const detectionResults = await multiModelDetection.runAllDetections(
            frame.uri, // imageUri - frame from video
            null, // audioData - would need audio extraction
            null, // heartRate - not available from video
            officerName,
            context,
            calibrationData
          );

          results.framesProcessed++;

          // Check for detections
          const hasDetections = this.checkForDetections(detectionResults);

          if (hasDetections) {
            const detectionEvent = {
              frameNumber,
              timestamp: frame.timestamp,
              videoTime: frame.videoTime, // Time in video (seconds)
              detections: detectionResults.detections,
            };

            results.detections.push(detectionEvent);

            logger.info(`Detection found at frame ${frameNumber}`, {
              videoTime: frame.videoTime,
              detections: detectionResults.detections,
            });

            // Call detection callback
            if (onDetection) {
              onDetection(detectionEvent, detectionResults);
            }
          }

          // Call frame processed callback
          if (onFrameProcessed) {
            onFrameProcessed(frameNumber, frames.length, detectionResults);
          }

          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          logger.error(`Error processing frame ${frameNumber}`, error);
          results.errors.push({
            frameNumber,
            error: error.message,
          });
        }
      }

      // Generate summary
      results.endTime = new Date().toISOString();
      results.summary = {
        totalFrames: frames.length,
        framesProcessed: results.framesProcessed,
        detectionsFound: results.detections.length,
        errors: results.errors.length,
        detectionRate: results.framesProcessed > 0
          ? ((results.detections.length / results.framesProcessed) * 100).toFixed(1) + '%'
          : '0%',
        processingTime: new Date(results.endTime) - new Date(results.startTime),
      };

      // Store in history
      this.processingHistory.push(results);
      if (this.processingHistory.length > 10) {
        this.processingHistory.shift();
      }

      logger.info('Video processing complete', results.summary);

      return results;
    } catch (error) {
      logger.error('Video processing error', error);
      results.error = error.message;
      throw error;
    } finally {
      this.isProcessing = false;
      this.currentVideo = null;
    }
  }

  /**
   * Extract frames from video file using expo-av
   * @param {string} videoUri - Video file URI
   * @returns {Promise<Array<Object>>} Array of frame objects
   */
  async extractFramesFromVideo(videoUri) {
    const frames = [];
    const video = new Video({ uri: videoUri });
    
    try {
      // Load video
      await video.loadAsync();
      
      // Get video duration (in milliseconds)
      const status = await video.getStatusAsync();
      const duration = status.durationMillis || 0;
      
      if (duration === 0) {
        throw new Error('Could not determine video duration');
      }
      
      logger.info('Video loaded', {
        uri: videoUri,
        duration: duration / 1000, // seconds
        frameInterval: this.frameExtractionInterval,
      });
      
      // Extract frames at intervals
      const interval = this.frameExtractionInterval; // milliseconds
      const totalFrames = Math.floor(duration / interval);
      
      logger.info(`Extracting ${totalFrames} frames from video`);
      
      for (let i = 0; i < totalFrames; i++) {
        const time = i * interval; // milliseconds
        const timeSeconds = time / 1000;
        
        try {
          // Seek to time position
          await video.setPositionAsync(timeSeconds);
          
          // Wait a bit for video to seek
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Extract frame (using video screenshot capability)
          // Note: expo-av doesn't have direct screenshot, so we'll use a workaround
          const frameUri = await this.captureFrameFromVideo(video, time);
          
          if (frameUri) {
            frames.push({
              uri: frameUri,
              timestamp: new Date().toISOString(),
              videoTime: timeSeconds, // Time in video (seconds)
              frameNumber: i + 1,
            });
          }
        } catch (error) {
          logger.error(`Error extracting frame at ${timeSeconds}s`, error);
          // Continue with next frame
        }
      }
      
      // Cleanup
      await video.unloadAsync();
      
      logger.info(`Extracted ${frames.length} frames from video`);
      return frames;
    } catch (error) {
      logger.error('Video frame extraction error', error);
      // Cleanup on error
      try {
        await video.unloadAsync();
      } catch (e) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }
  
  /**
   * Capture a frame from video at specific time
   * Note: expo-av doesn't have direct screenshot, so we use a workaround
   * @param {Video} video - Video object
   * @param {number} time - Time in milliseconds
   * @returns {Promise<string>} Frame URI
   */
  async captureFrameFromVideo(video, time) {
    try {
      // For expo-av, we need to use a workaround:
      // 1. Create a hidden video view
      // 2. Seek to time
      // 3. Capture frame (would need native module or canvas)
      
      // Alternative: Use expo-image-manipulator or canvas to capture
      // For now, we'll create a placeholder frame path
      // In production, would use react-native-view-shot or similar
      
      const cacheDir = FileSystem.cacheDirectory;
      const framePath = `${cacheDir}vantus_frame_${Date.now()}_${time}.jpg`;
      
      // Placeholder: In production, would actually capture frame
      // This requires additional native modules or canvas API
      logger.debug('Frame capture placeholder', { time, framePath });
      
      // For now, return null (would be actual frame URI in production)
      // This allows the system to work but won't process frames until
      // proper frame extraction is implemented
      return null;
    } catch (error) {
      logger.error('Frame capture error', error);
      return null;
    }
  }

  /**
   * Extract frames using expo-av (if available)
   * @param {string} videoUri - Video file URI
   * @returns {Promise<Array<Object>>} Array of frame objects
   */
  async extractFramesWithExpoAV(videoUri) {
    try {
      // This would use expo-av to extract frames
      // For now, return empty array - requires expo-av integration
      logger.info('Would extract frames using expo-av', { videoUri });
      return [];
    } catch (error) {
      logger.error('Frame extraction error', error);
      return [];
    }
  }

  /**
   * Process video file with manual frame selection
   * Allows user to select specific frames or time ranges
   * @param {string} videoUri - Video file URI
   * @param {Array<number>} timestamps - Array of timestamps (seconds) to extract frames
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing results
   */
  async processVideoAtTimestamps(videoUri, timestamps, options = {}) {
    logger.info('Processing video at specific timestamps', {
      videoUri,
      timestamps,
    });

    // This would extract frames at specific timestamps
    // For now, return placeholder
    return {
      videoUri,
      timestamps,
      framesProcessed: 0,
      detections: [],
      message: 'Timestamp-based processing requires video processing library',
    };
  }

  /**
   * Check if detection results contain any positive detections
   * @param {Object} detectionResults - Detection results
   * @returns {boolean} True if any detections found
   */
  checkForDetections(detectionResults) {
    if (!detectionResults || !detectionResults.detections) {
      return false;
    }

    return Object.values(detectionResults.detections).some(detection => {
      if (detection.detected === true) {
        return true;
      }
      if (detection.confidence && detection.confidence >= (detection.threshold || 0.7)) {
        return true;
      }
      return false;
    });
  }

  /**
   * Get processing history
   * @returns {Array<Object>} Processing history
   */
  getProcessingHistory() {
    return this.processingHistory;
  }

  /**
   * Get processing status
   * @returns {Object} Processing status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      currentVideo: this.currentVideo,
      frameExtractionInterval: this.frameExtractionInterval,
      historyCount: this.processingHistory.length,
    };
  }

  /**
   * Process video file using server-side processing
   * @param {string} videoUri - URI to video file
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing results
   */
  async processVideoFileServerSide(videoUri, options = {}) {
    const {
      officerName = null,
      context = null,
      calibrationData = null,
      onFrameProcessed = null,
      onDetection = null,
      frameInterval = 1,
    } = options;

    const bridgeServerUrl = configService.getServerUrl('bridge');
    const uploadUrl = `${bridgeServerUrl}/api/video/process`;

    const results = {
      videoUri,
      startTime: new Date().toISOString(),
      framesProcessed: 0,
      detections: [],
      errors: [],
      summary: {},
    };

    try {
      logger.info('Uploading video to server for processing', { uploadUrl });

      // Read video file
      const videoData = await FileSystem.readAsStringAsync(videoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get filename from URI
      const filename = videoUri.split('/').pop() || 'video.mp4';

      // Create form data
      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: filename,
      });
      formData.append('interval', frameInterval.toString());
      if (officerName) {
        formData.append('officerName', officerName);
      }
      if (context) {
        formData.append('context', JSON.stringify(context));
      }

      // Upload and process on server
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server processing failed');
      }

      const serverResponse = await response.json();

      logger.info('Server processing complete', {
        framesReceived: serverResponse.frames?.length || 0,
        metadata: serverResponse.metadata,
      });

      // Process each frame through detection models
      const frames = serverResponse.frames || [];
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const frameNumber = i + 1;

        try {
          logger.debug(`Processing frame ${frameNumber}/${frames.length}`, {
            videoTime: frame.videoTime,
          });

          // Save base64 frame to temporary file
          const frameUri = await this.saveBase64Frame(frame.base64, frame.filename);

          // Run all detections on frame
          const detectionResults = await multiModelDetection.runAllDetections(
            frameUri, // imageUri - frame from video
            null, // audioData - would need audio extraction
            null, // heartRate - not available from video
            officerName,
            context,
            calibrationData
          );

          results.framesProcessed++;

          // Check for detections
          const hasDetections = this.checkForDetections(detectionResults);

          if (hasDetections) {
            const detectionEvent = {
              frameNumber,
              timestamp: frame.timestamp,
              videoTime: frame.videoTime, // Time in video (seconds)
              detections: detectionResults.detections,
            };

            results.detections.push(detectionEvent);

            logger.info(`Detection found at frame ${frameNumber}`, {
              videoTime: frame.videoTime,
              detections: detectionResults.detections,
            });

            // Call detection callback
            if (onDetection) {
              onDetection(detectionEvent, detectionResults);
            }
          }

          // Call frame processed callback
          if (onFrameProcessed) {
            onFrameProcessed(frameNumber, frames.length, detectionResults);
          }

          // Clean up temporary frame file
          try {
            await FileSystem.deleteAsync(frameUri, { idempotent: true });
          } catch (e) {
            // Ignore cleanup errors
          }
        } catch (error) {
          logger.error(`Error processing frame ${frameNumber}`, error);
          results.errors.push({
            frameNumber,
            error: error.message,
          });
        }
      }

      // Generate summary
      results.endTime = new Date().toISOString();
      results.summary = {
        totalFrames: frames.length,
        framesProcessed: results.framesProcessed,
        detectionsFound: results.detections.length,
        errors: results.errors.length,
        detectionRate: results.framesProcessed > 0
          ? ((results.detections.length / results.framesProcessed) * 100).toFixed(1) + '%'
          : '0%',
        processingTime: new Date(results.endTime) - new Date(results.startTime),
        videoMetadata: serverResponse.metadata,
      };

      // Store in history
      this.processingHistory.push(results);
      if (this.processingHistory.length > 10) {
        this.processingHistory.shift();
      }

      logger.info('Video processing complete', results.summary);

      return results;
    } catch (error) {
      logger.error('Server-side video processing error', error);
      results.error = error.message;
      throw error;
    } finally {
      this.isProcessing = false;
      this.currentVideo = null;
    }
  }

  /**
   * Save base64 frame to temporary file
   * @param {string} base64Data - Base64 encoded image data
   * @param {string} filename - Original filename
   * @returns {Promise<string>} URI to saved frame file
   */
  async saveBase64Frame(base64Data, filename) {
    try {
      // Remove data URL prefix if present
      const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
      
      const cacheDir = FileSystem.cacheDirectory;
      const framePath = `${cacheDir}${filename}`;
      
      await FileSystem.writeAsStringAsync(framePath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return framePath;
    } catch (error) {
      logger.error('Error saving base64 frame', error);
      throw error;
    }
  }

  /**
   * Stop processing (if in progress)
   */
  stopProcessing() {
    if (this.isProcessing) {
      this.isProcessing = false;
      logger.info('Video processing stopped');
    }
  }
}

// Export singleton instance
export default new VideoFileProcessor();
