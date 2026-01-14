/**
 * REAL-TIME VIDEO PROCESSOR
 * Processes live camera frames in real-time for detection
 * Handles frame capture, processing, and detection pipeline
 */

import logger from '../utils/logger';
import multiModelDetection from './multiModelDetection';
import modelRegistry from './modelRegistry';

class RealtimeVideoProcessor {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
    this.frameInterval = 2000; // Process frame every 2 seconds (adjustable)
    this.cameraRef = null;
    this.frameCount = 0;
    this.processedFrames = 0;
    this.detectionHistory = [];
    this.onDetectionCallback = null; // Callback for when detections occur
    this.onPeripheralScan = null; // Callback for peripheral scan requests
  }

  /**
   * Set camera reference
   * @param {Object} cameraRef - Camera reference from CameraView
   */
  setCameraRef(cameraRef) {
    this.cameraRef = cameraRef;
    logger.info('Camera reference set for real-time processing');
  }

  /**
   * Start real-time video processing
   * @param {Object} options - Processing options
   * @param {number} options.frameInterval - Milliseconds between frame captures (default: 2000)
   * @param {Function} options.onDetection - Callback when detection occurs
   * @param {string} options.officerName - Officer name for context
   * @param {Object} options.context - Operational context
   * @param {Object} options.calibrationData - Calibration data for biometric baseline
   */
  startProcessing(options = {}) {
    if (this.isProcessing) {
      logger.warn('Real-time processing already active');
      return;
    }

    if (!this.cameraRef) {
      logger.error('Camera reference not set - cannot start processing');
      return;
    }

    const {
      frameInterval = 2000,
      onDetection = null,
      officerName = null,
      context = null,
      calibrationData = null,
    } = options;

    this.frameInterval = frameInterval;
    this.onDetectionCallback = onDetection;
    this.isProcessing = true;
    this.frameCount = 0;
    this.processedFrames = 0;

    logger.info('Starting real-time video processing', {
      frameInterval,
      officerName,
    });

    // Start processing loop
    this.processingInterval = setInterval(async () => {
      await this.processFrame(officerName, context, calibrationData);
    }, frameInterval);
  }

  /**
   * Stop real-time video processing
   */
  stopProcessing() {
    if (!this.isProcessing) {
      return;
    }

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.isProcessing = false;
    logger.info('Real-time video processing stopped', {
      totalFrames: this.frameCount,
      processedFrames: this.processedFrames,
    });
  }

  /**
   * Process a single frame from the camera
   * @param {string} officerName - Officer name
   * @param {Object} context - Operational context
   * @param {Object} calibrationData - Calibration data
   */
  async processFrame(officerName, context, calibrationData) {
    if (!this.cameraRef || !this.isProcessing) {
      return;
    }

    try {
      this.frameCount++;

      // Capture frame from camera
      const photo = await this.captureFrame();
      
      if (!photo || !photo.uri) {
        logger.debug('Failed to capture frame');
        return;
      }

      logger.debug(`Processing frame ${this.frameCount}`, { uri: photo.uri });

      // Run all detections on the frame
      const detectionResults = await multiModelDetection.runAllDetections(
        photo.uri, // imageUri - now using actual camera frame
        null, // audioData - would be from audio capture
        null, // heartRate - would be from wearable
        officerName,
        context,
        calibrationData
      );

      this.processedFrames++;

      // 1. PERIPHERAL OVERWATCH: Scan entire frame for peripheral threats
      // Convert photo to base64 for server processing
      try {
        const FileSystem = require('expo-file-system');
        const base64 = await FileSystem.readAsStringAsync(photo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const frameBase64 = `data:image/jpeg;base64,${base64}`;

        // Request peripheral scan from bridge server
        // Emit peripheral scan request (will be handled in App.js)
        if (typeof this.onPeripheralScan === 'function') {
          this.onPeripheralScan(frameBase64, officerName, context);
        }
      } catch (error) {
        logger.error('Peripheral overwatch frame conversion error', error);
      }

      // Check if any detections occurred
      const hasDetections = this.checkForDetections(detectionResults);

      if (hasDetections) {
        logger.info('Detection found in frame', {
          frameNumber: this.frameCount,
          detections: detectionResults.detections,
        });

        // Store in history
        this.detectionHistory.push({
          frameNumber: this.frameCount,
          timestamp: new Date().toISOString(),
          detections: detectionResults.detections,
        });

        // Limit history size
        if (this.detectionHistory.length > 100) {
          this.detectionHistory.shift();
        }

        // Call detection callback if provided
        if (this.onDetectionCallback) {
          this.onDetectionCallback(detectionResults);
        }
      }

      // Log processing stats periodically
      if (this.frameCount % 10 === 0) {
        logger.debug('Video processing stats', {
          framesProcessed: this.processedFrames,
          totalFrames: this.frameCount,
          detectionRate: (this.detectionHistory.length / this.frameCount * 100).toFixed(1) + '%',
        });
      }
    } catch (error) {
      logger.error('Frame processing error', error);
      // Continue processing even if one frame fails
    }
  }

  /**
   * Capture a frame from the camera
   * @returns {Promise<Object>} Photo object with URI
   */
  async captureFrame() {
    if (!this.cameraRef) {
      throw new Error('Camera reference not set');
    }

    try {
      // Take a picture from the camera
      const photo = await this.cameraRef.takePictureAsync({
        quality: 0.7, // Balance between quality and file size
        base64: false, // Don't need base64 for detection
        skipProcessing: true, // Faster capture
      });

      return photo;
    } catch (error) {
      logger.error('Frame capture error', error);
      throw error;
    }
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

    // Check each detection category
    return Object.values(detectionResults.detections).some(detection => {
      // Check if detection is positive
      if (detection.detected === true) {
        return true;
      }

      // Check if confidence meets threshold
      if (detection.confidence && detection.confidence >= (detection.threshold || 0.7)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Get processing statistics
   * @returns {Object} Processing statistics
   */
  getStats() {
    return {
      isProcessing: this.isProcessing,
      frameInterval: this.frameInterval,
      totalFrames: this.frameCount,
      processedFrames: this.processedFrames,
      detectionCount: this.detectionHistory.length,
      detectionRate: this.frameCount > 0 
        ? (this.detectionHistory.length / this.frameCount * 100).toFixed(1) + '%'
        : '0%',
      modelsReady: {
        weapon: modelRegistry.isModelReady('weapon'),
        stance: modelRegistry.isModelReady('stance'),
        hands: modelRegistry.isModelReady('hands'),
      },
    };
  }

  /**
   * Get recent detection history
   * @param {number} limit - Number of recent detections to return
   * @returns {Array<Object>} Recent detections
   */
  getRecentDetections(limit = 10) {
    return this.detectionHistory.slice(-limit);
  }

  /**
   * Clear detection history
   */
  clearHistory() {
    this.detectionHistory = [];
    logger.info('Detection history cleared');
  }
}

// Export singleton instance
export default new RealtimeVideoProcessor();
