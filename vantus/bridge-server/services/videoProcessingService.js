/**
 * VIDEO PROCESSING SERVICE
 * Server-side video processing using FFmpeg
 * Extracts frames from video files and processes them
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class VideoProcessingService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp/video-processing');
    this.framesDir = path.join(this.tempDir, 'frames');
    this.ensureDirectories();
  }

  /**
   * Ensure temp directories exist
   */
  async ensureDirectories() {
    try {
      await fs.ensureDir(this.tempDir);
      await fs.ensureDir(this.framesDir);
      logger.info('Video processing directories ensured');
    } catch (error) {
      logger.error('Failed to create video processing directories', error);
    }
  }

  /**
   * Extract frames from video file
   * @param {string} videoPath - Path to video file
   * @param {Object} options - Extraction options
   * @param {number} options.interval - Interval between frames in seconds (default: 1)
   * @param {string} options.outputFormat - Output format (default: 'jpg')
   * @param {number} options.quality - JPEG quality 1-31 (default: 2, lower is better)
   * @returns {Promise<Array<Object>>} Array of frame objects with paths and timestamps
   */
  async extractFrames(videoPath, options = {}) {
    const {
      interval = 1, // Extract frame every 1 second
      outputFormat = 'jpg',
      quality = 2, // JPEG quality (1-31, lower is better)
    } = options;

    return new Promise((resolve, reject) => {
      const frames = [];
      const timestamp = Date.now();
      const outputPattern = path.join(this.framesDir, `frame_${timestamp}_%03d.${outputFormat}`);

      logger.info('Starting frame extraction', {
        videoPath,
        interval,
        outputPattern,
      });

      // Check if video file exists
      if (!fs.existsSync(videoPath)) {
        return reject(new Error(`Video file not found: ${videoPath}`));
      }

      // Get video duration first
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          logger.error('FFprobe error', err);
          return reject(err);
        }

        const duration = metadata.format.duration; // in seconds
        logger.info('Video metadata', {
          duration,
          format: metadata.format.format_name,
          size: metadata.format.size,
        });

        // Generate timestamps for frame extraction
        const timestamps = this.generateTimestamps(duration, interval);
        
        // Extract frames at intervals
        ffmpeg(videoPath)
          .on('start', (commandLine) => {
            logger.debug('FFmpeg command', { commandLine });
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              logger.debug(`Frame extraction progress: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', async () => {
            logger.info('Frame extraction complete');
            
            // Read extracted frames
            try {
              const files = await fs.readdir(this.framesDir);
              const frameFiles = files
                .filter(f => f.startsWith(`frame_${timestamp}_`) && f.endsWith(`.${outputFormat}`))
                .sort();

              // Create frame objects with timestamps
              for (let i = 0; i < frameFiles.length; i++) {
                const frameFile = frameFiles[i];
                const framePath = path.join(this.framesDir, frameFile);
                const videoTime = i * interval; // Time in video (seconds)

                frames.push({
                  path: framePath,
                  filename: frameFile,
                  videoTime, // Time in video (seconds)
                  frameNumber: i + 1,
                  timestamp: new Date().toISOString(),
                });
              }

              logger.info(`Extracted ${frames.length} frames from video`);
              resolve(frames);
            } catch (error) {
              logger.error('Error reading extracted frames', error);
              reject(error);
            }
          })
          .on('error', (err) => {
            logger.error('FFmpeg error', err);
            reject(err);
          })
          .screenshots({
            timestamps: timestamps,
            filename: `frame_${timestamp}_%03d.${outputFormat}`,
            folder: this.framesDir,
            size: '1920x1080', // Max size, maintains aspect ratio
          });
      });
    });
  }

  /**
   * Generate timestamps for frame extraction
   * @param {number} duration - Video duration in seconds
   * @param {number} interval - Interval between frames in seconds
   * @returns {Array<string>} Array of timestamp strings (e.g., ['00:00:01', '00:00:02'])
   */
  generateTimestamps(duration, interval) {
    const timestamps = [];
    for (let time = 0; time < duration; time += interval) {
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = Math.floor(time % 60);
      timestamps.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }
    return timestamps;
  }

  /**
   * Get video metadata
   * @param {string} videoPath - Path to video file
   * @returns {Promise<Object>} Video metadata
   */
  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(videoPath)) {
        return reject(new Error(`Video file not found: ${videoPath}`));
      }

      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          logger.error('FFprobe error', err);
          return reject(err);
        }

        resolve({
          duration: metadata.format.duration,
          size: metadata.format.size,
          bitrate: metadata.format.bit_rate,
          format: metadata.format.format_name,
          codec: metadata.streams[0]?.codec_name,
          width: metadata.streams[0]?.width,
          height: metadata.streams[0]?.height,
          fps: metadata.streams[0]?.r_frame_rate,
        });
      });
    });
  }

  /**
   * Clean up temporary files
   * @param {Array<string>} framePaths - Array of frame file paths to delete
   */
  async cleanupFrames(framePaths) {
    try {
      for (const framePath of framePaths) {
        if (fs.existsSync(framePath)) {
          await fs.remove(framePath);
        }
      }
      logger.info(`Cleaned up ${framePaths.length} frame files`);
    } catch (error) {
      logger.error('Error cleaning up frames', error);
    }
  }

  /**
   * Clean up all temporary files in frames directory
   */
  async cleanupAllFrames() {
    try {
      const files = await fs.readdir(this.framesDir);
      for (const file of files) {
        await fs.remove(path.join(this.framesDir, file));
      }
      logger.info('Cleaned up all frame files');
    } catch (error) {
      logger.error('Error cleaning up all frames', error);
    }
  }

  /**
   * Convert frame path to base64 for transmission
   * @param {string} framePath - Path to frame file
   * @returns {Promise<string>} Base64 encoded image
   */
  async frameToBase64(framePath) {
    try {
      const imageBuffer = await fs.readFile(framePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      logger.error('Error converting frame to base64', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new VideoProcessingService();
