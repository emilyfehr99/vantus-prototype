/**
 * Detection Processor API
 * Processes frames through detection models
 * Can be called from mobile app or server-side
 */

const logger = require('../utils/logger');
const llmVisionService = require('../services/llmVisionService');

class DetectionProcessor {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
  }

  /**
   * Process a single frame through detection models
   * @param {Object} frame - Frame object with base64 image data
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Detection results
   */
  async processFrame(frame, options = {}) {
    const {
      officerName = null,
      context = null,
      calibrationData = null,
      enableWeaponDetection = true,
      enableStanceDetection = true,
      enableHandDetection = true,
      enableCrowdDetection = true,
      enableVehicleDetection = true,
      enableEnvironmentDetection = true,
      enableAudioDetection = false,
    } = options;

    const results = {
      frameNumber: frame.frameNumber,
      videoTime: frame.videoTime,
      timestamp: frame.timestamp,
      detections: {},
    };

    try {
      // Build detection types array
      const detectionTypes = [];
      if (enableWeaponDetection) detectionTypes.push('weapon');
      if (enableStanceDetection) detectionTypes.push('stance');
      if (enableHandDetection) detectionTypes.push('hands');
      if (enableCrowdDetection) detectionTypes.push('crowd');
      if (enableVehicleDetection) detectionTypes.push('vehicle');
      if (enableEnvironmentDetection) detectionTypes.push('environment');

      // Single LLM vision call for all detections (more efficient)
      if (detectionTypes.length > 0 && frame.base64) {
        const analysis = await llmVisionService.analyzeImage(frame.base64, {
          frameTime: frame.videoTime,
          officerName,
          detectionTypes,
        });

        // Add all detection results
        if (enableWeaponDetection && analysis.weapon) {
          results.detections.weapon = analysis.weapon;
        }
        if (enableStanceDetection && analysis.stance) {
          results.detections.stance = analysis.stance;
        }
        if (enableHandDetection && analysis.hands) {
          results.detections.hands = analysis.hands;
        }
        if (enableCrowdDetection && analysis.crowd) {
          results.detections.crowd = analysis.crowd;
        }
        if (enableVehicleDetection && analysis.vehicle) {
          results.detections.vehicle = analysis.vehicle;
        }
        if (enableEnvironmentDetection && analysis.environment) {
          results.detections.environment = analysis.environment;
        }
      }

      // Audio Detection (if audio data available)
      if (enableAudioDetection && frame.audioData) {
        results.detections.audio = await this.detectAudio(frame.audioData);
      }

      return results;
    } catch (error) {
      logger.error('Frame detection processing error', error);
      results.error = error.message;
      return results;
    }
  }

  /**
   * Process multiple frames
   * @param {Array<Object>} frames - Array of frame objects
   * @param {Object} options - Processing options
   * @returns {Promise<Array<Object>>} Array of detection results
   */
  async processFrames(frames, options = {}) {
    const results = [];
    const { onProgress = null } = options;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const frameResult = await this.processFrame(frame, options);
      results.push(frameResult);

      if (onProgress) {
        onProgress(i + 1, frames.length, frameResult);
      }
    }

    return results;
  }

  /**
   * Detect weapons in frame using LLM vision
   * @deprecated Use processFrame with enableWeaponDetection instead
   */
  async detectWeapons(frame) {
    if (!frame.base64) {
      return {
        detected: false,
        category: 'weapon',
        confidence: 0,
        detections: [],
        model: 'llm-vision',
        error: 'No image data',
      };
    }

    try {
      const analysis = await llmVisionService.analyzeImage(frame.base64, {
        frameTime: frame.videoTime,
        detectionTypes: ['weapon'],
      });

      return analysis.weapon || {
        detected: false,
        category: 'weapon',
        confidence: 0,
        detections: [],
        model: 'llm-vision',
      };
    } catch (error) {
      logger.error('Weapon detection error', error);
      return {
        detected: false,
        category: 'weapon',
        confidence: 0,
        detections: [],
        model: 'llm-vision',
        error: error.message,
      };
    }
  }

  /**
   * Detect stance patterns using LLM vision
   * @deprecated Use processFrame with enableStanceDetection instead
   */
  async detectStance(frame) {
    if (!frame.base64) {
      return {
        detected: false,
        category: 'stance',
        confidence: 0,
        type: null,
        model: 'llm-vision',
        error: 'No image data',
      };
    }

    try {
      const analysis = await llmVisionService.analyzeImage(frame.base64, {
        frameTime: frame.videoTime,
        detectionTypes: ['stance'],
      });

      return analysis.stance || {
        detected: false,
        category: 'stance',
        confidence: 0,
        type: null,
        model: 'llm-vision',
      };
    } catch (error) {
      logger.error('Stance detection error', error);
      return {
        detected: false,
        category: 'stance',
        confidence: 0,
        type: null,
        model: 'llm-vision',
        error: error.message,
      };
    }
  }

  /**
   * Detect hand patterns using LLM vision
   * @deprecated Use processFrame with enableHandDetection instead
   */
  async detectHands(frame) {
    if (!frame.base64) {
      return {
        detected: false,
        category: 'hands',
        confidence: 0,
        pattern: null,
        model: 'llm-vision',
        error: 'No image data',
      };
    }

    try {
      const analysis = await llmVisionService.analyzeImage(frame.base64, {
        frameTime: frame.videoTime,
        detectionTypes: ['hands'],
      });

      return analysis.hands || {
        detected: false,
        category: 'hands',
        confidence: 0,
        pattern: null,
        model: 'llm-vision',
      };
    } catch (error) {
      logger.error('Hand detection error', error);
      return {
        detected: false,
        category: 'hands',
        confidence: 0,
        pattern: null,
        model: 'llm-vision',
        error: error.message,
      };
    }
  }

  /**
   * Detect audio patterns
   * In production: Would use LLM analysis
   */
  async detectAudio(audioData) {
    // TODO: Integrate LLM audio analysis
    // For now, return structure ready for integration
    
    return {
      detected: false,
      category: 'audio',
      confidence: 0,
      pattern: null,
      model: 'llm-analysis',
      ready: false, // LLM service not configured on server yet
    };
  }

  /**
   * Get processing status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.processingQueue.length,
    };
  }
}

module.exports = new DetectionProcessor();
