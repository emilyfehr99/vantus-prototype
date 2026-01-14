/**
 * Video Batch Processing Service
 * Handles batch video processing with progress tracking
 */

const logger = require('../utils/logger');
const videoProcessingService = require('./videoProcessingService');
const detectionProcessor = require('../api/detectionProcessor');
const EventEmitter = require('events');

class VideoBatchProcessor extends EventEmitter {
  constructor() {
    super();
    this.processingQueue = [];
    this.activeJobs = new Map(); // jobId -> job info
    this.completedJobs = new Map(); // jobId -> results
  }

  /**
   * Process multiple videos in batch
   * @param {Array} videoPaths - Array of video file paths
   * @param {Object} options - Processing options
   * @returns {Promise<string>} Job ID
   */
  async processBatch(videoPaths, options = {}) {
    const jobId = `batch_${Date.now()}`;
    const job = {
      id: jobId,
      videos: videoPaths,
      total: videoPaths.length,
      processed: 0,
      failed: 0,
      results: [],
      status: 'queued',
      startTime: new Date().toISOString(),
      options,
    };

    this.processingQueue.push(job);
    this.activeJobs.set(jobId, job);

    // Start processing (async)
    this.processQueue().catch(error => {
      logger.error('Batch processing error', error);
    });

    return jobId;
  }

  /**
   * Process queue
   */
  async processQueue() {
    while (this.processingQueue.length > 0) {
      const job = this.processingQueue.shift();
      await this.processJob(job);
    }
  }

  /**
   * Process a single job
   */
  async processJob(job) {
    job.status = 'processing';
    this.emit('jobStarted', job.id);

    for (let i = 0; i < job.videos.length; i++) {
      const videoPath = job.videos[i];
      
      try {
        this.emit('videoStarted', { jobId: job.id, videoIndex: i, videoPath });
        
        // Extract frames
        const frames = await videoProcessingService.extractFrames(videoPath, {
          interval: job.options.interval || 1,
        });

        // Convert to base64
        const framesWithBase64 = await Promise.all(
          frames.map(async (frame) => ({
            ...frame,
            base64: await videoProcessingService.frameToBase64(frame.path),
          }))
        );

        // Process detections
        const detectionResults = await detectionProcessor.processFrames(framesWithBase64, {
          ...job.options,
          onProgress: (current, total) => {
            this.emit('videoProgress', {
              jobId: job.id,
              videoIndex: i,
              current,
              total,
            });
          },
        });

        job.results.push({
          videoPath,
          frames: framesWithBase64.length,
          detections: detectionResults,
        });

        job.processed++;
        this.emit('videoCompleted', { jobId: job.id, videoIndex: i, videoPath });
      } catch (error) {
        logger.error(`Error processing video ${videoPath}`, error);
        job.failed++;
        job.results.push({
          videoPath,
          error: error.message,
        });
        this.emit('videoFailed', { jobId: job.id, videoIndex: i, videoPath, error: error.message });
      }

      // Emit progress
      this.emit('jobProgress', {
        jobId: job.id,
        processed: job.processed,
        total: job.total,
        failed: job.failed,
      });
    }

    job.status = 'completed';
    job.endTime = new Date().toISOString();
    this.completedJobs.set(job.id, job);
    this.activeJobs.delete(job.id);
    this.emit('jobCompleted', job.id);
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    if (this.completedJobs.has(jobId)) {
      return this.completedJobs.get(jobId);
    }
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId);
    }
    return null;
  }

  /**
   * Get all active jobs
   */
  getActiveJobs() {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get all completed jobs
   */
  getCompletedJobs() {
    return Array.from(this.completedJobs.values());
  }
}

module.exports = new VideoBatchProcessor();
