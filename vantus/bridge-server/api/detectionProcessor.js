/**
 * Detection Processor API
 * Processes frames through detection models
 * Can be called from mobile app or server-side
 */

const logger = require('../utils/logger');
const llmVisionService = require('../services/llmVisionService');
const accuracyEnsemble = require('../services/accuracyEnsemble');
const multiLayerValidation = require('../services/multiLayerValidation');
const signalPersistence = require('../services/signalPersistence');
const signalQualityScoring = require('../services/signalQualityScoring');
const confidenceCalibration = require('../services/confidenceCalibration');
const adaptiveThresholds = require('../services/adaptiveThresholds');

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

      // Use ensemble for high accuracy (multiple passes, consensus)
      if (detectionTypes.length > 0 && frame.base64) {
        const ensembleResult = await accuracyEnsemble.processEnsemble(frame, {
          detectionTypes,
          officerName,
        });

        // Only use detections that passed ensemble consensus
        if (ensembleResult.consensus && ensembleResult.detections) {
          // Apply adaptive thresholds and multi-layer validation
          const validatedDetections = {};
          
          for (const [type, detection] of Object.entries(ensembleResult.detections)) {
            if (!detection.detected) continue;
            
            const confidence = detection.confidence || 0;
            const detectionType = detection.category || type;
            
            // Check adaptive threshold
            const passesThreshold = adaptiveThresholds.passesThreshold(
              detectionType,
              confidence,
              { officerName, ...context }
            );
            
            if (!passesThreshold) {
              logger.debug('Detection failed adaptive threshold', {
                type: detectionType,
                confidence,
                threshold: adaptiveThresholds.getThreshold(detectionType, { officerName }),
              });
              continue;
            }

            // Multi-layer validation
            const validation = await multiLayerValidation.validate(detection, {
              officerName,
              frameData: frame,
              ...context,
            });

            if (!validation.passed) {
              logger.debug('Detection failed multi-layer validation', {
                type: detectionType,
                reasons: validation.reasons,
              });
              continue;
            }

            // Quality scoring
            const quality = signalQualityScoring.scoreSignal(detection, {
              officerName,
              persistence: signalPersistence.checkPersistence(officerName || 'unknown', detection),
            });

            if (!quality.passes) {
              logger.debug('Detection failed quality scoring', {
                type: detectionType,
                qualityScore: quality.totalScore,
              });
              continue;
            }

            // All checks passed - add detection
            validatedDetections[type] = {
              ...detection,
              confidence: validation.finalConfidence,
              qualityScore: quality.totalScore,
              validation: {
                passed: true,
                layers: validation.layers.length,
                layersPassed: validation.layers.filter(l => l.passed).length,
              },
            };
          }

          // Add validated detections to results
          if (enableWeaponDetection && validatedDetections.weapon) {
            results.detections.weapon = validatedDetections.weapon;
          }
          if (enableStanceDetection && validatedDetections.stance) {
            results.detections.stance = validatedDetections.stance;
          }
          if (enableHandDetection && validatedDetections.hands) {
            results.detections.hands = validatedDetections.hands;
          }
          if (enableCrowdDetection && validatedDetections.crowd) {
            results.detections.crowd = validatedDetections.crowd;
          }
          if (enableVehicleDetection && validatedDetections.vehicle) {
            results.detections.vehicle = validatedDetections.vehicle;
          }
          if (enableEnvironmentDetection && validatedDetections.environment) {
            results.detections.environment = validatedDetections.environment;
          }

          // Add ensemble metadata
          results.ensemble = {
            consensus: ensembleResult.consensus,
            consensusRate: ensembleResult.consensusRate,
            analyses: ensembleResult.analyses,
          };
        } else {
          logger.debug('Ensemble consensus not met, skipping detections', {
            consensus: ensembleResult.consensus,
            confidence: ensembleResult.confidence,
          });
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
