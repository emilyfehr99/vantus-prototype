/**
 * Adaptive Threshold System
 * Adjusts confidence thresholds based on historical performance
 * Maintains near-100% accuracy by adapting to actual performance
 */

const logger = require('../utils/logger');
const confidenceCalibration = require('./confidenceCalibration');
const patternLearning = require('./patternLearning');

class AdaptiveThresholds {
  constructor() {
    this.baseThresholds = {
      weapon: 0.80, // 80% minimum
      stance: 0.75, // 75% minimum
      hands: 0.70, // 70% minimum
      crowd: 0.70,
      vehicle: 0.70,
      movement_pattern_anomaly: 0.70,
      vocal_stress_proxy: 0.75,
      multi_speaker: 0.70,
      communication_pattern: 0.70,
    };
    
    this.currentThresholds = { ...this.baseThresholds };
    this.performanceHistory = new Map(); // detectionType -> performance data
    this.minSamples = 100; // Minimum samples before adjusting
  }

  /**
   * Get adaptive threshold for detection type
   * @param {string} detectionType - Type of detection
   * @param {Object} context - Context
   * @returns {number} Adaptive threshold
   */
  getThreshold(detectionType, context = {}) {
    let threshold = this.currentThresholds[detectionType] || this.baseThresholds[detectionType] || 0.70;

    // Check pattern learning for adjusted threshold
    const learnedThreshold = patternLearning.getAdjustedThreshold(detectionType);
    if (learnedThreshold) {
      threshold = learnedThreshold;
    }

    // Context-based adjustment
    if (context.operationalContext) {
      // Higher threshold for routine contexts (reduce false positives)
      if (context.operationalContext === 'routine_patrol') {
        threshold = Math.min(0.90, threshold + 0.05);
      }
    }

    return threshold;
  }

  /**
   * Check if detection passes threshold
   * @param {string} detectionType - Type of detection
   * @param {number} confidence - Confidence score
   * @param {Object} context - Context
   * @returns {boolean} True if passes threshold
   */
  passesThreshold(detectionType, confidence, context = {}) {
    const threshold = this.getThreshold(detectionType, context);
    
    // Apply calibration
    const calibratedConfidence = confidenceCalibration.calibrateConfidence(
      detectionType,
      confidence,
      context
    );

    return calibratedConfidence >= threshold;
  }

  /**
   * Record performance and adjust thresholds
   * @param {string} detectionType - Type of detection
   * @param {number} confidence - Confidence score
   * @param {boolean} wasCorrect - Was detection correct
   */
  recordPerformance(detectionType, confidence, wasCorrect) {
    if (!this.performanceHistory.has(detectionType)) {
      this.performanceHistory.set(detectionType, {
        samples: 0,
        correct: 0,
        incorrect: 0,
        confidenceDistribution: [],
      });
    }

    const performance = this.performanceHistory.get(detectionType);
    performance.samples++;
    performance.confidenceDistribution.push({ confidence, wasCorrect });

    if (wasCorrect) {
      performance.correct++;
    } else {
      performance.incorrect++;
    }

    // Adjust threshold if enough samples
    if (performance.samples >= this.minSamples) {
      this.adjustThreshold(detectionType, performance);
    }

    // Also record in calibration system
    confidenceCalibration.recordOutcome(detectionType, confidence, wasCorrect);
  }

  /**
   * Adjust threshold based on performance
   */
  adjustThreshold(detectionType, performance) {
    const accuracyRate = performance.correct / performance.samples;
    const currentThreshold = this.currentThresholds[detectionType] || this.baseThresholds[detectionType];
    
    // If accuracy is below target (95%), raise threshold
    // If accuracy is above target, can slightly lower threshold
    const targetAccuracy = 0.95;
    
    if (accuracyRate < targetAccuracy) {
      // Raise threshold to reduce false positives
      const adjustment = (targetAccuracy - accuracyRate) * 0.1;
      this.currentThresholds[detectionType] = Math.min(
        0.95,
        currentThreshold + adjustment
      );
      
      logger.info('Threshold raised', {
        detectionType,
        oldThreshold: currentThreshold,
        newThreshold: this.currentThresholds[detectionType],
        accuracyRate,
      });
    } else if (accuracyRate > targetAccuracy + 0.02) {
      // Slightly lower threshold if accuracy is very high
      const adjustment = (accuracyRate - targetAccuracy) * 0.05;
      this.currentThresholds[detectionType] = Math.max(
        this.baseThresholds[detectionType],
        currentThreshold - adjustment
      );
      
      logger.info('Threshold lowered', {
        detectionType,
        oldThreshold: currentThreshold,
        newThreshold: this.currentThresholds[detectionType],
        accuracyRate,
      });
    }
  }

  /**
   * Get threshold statistics
   */
  getStats() {
    const stats = {};
    
    for (const [type, threshold] of Object.entries(this.currentThresholds)) {
      const performance = this.performanceHistory.get(type);
      stats[type] = {
        currentThreshold: threshold,
        baseThreshold: this.baseThresholds[type],
        adjusted: threshold !== this.baseThresholds[type],
        samples: performance?.samples || 0,
        accuracyRate: performance ? (performance.correct / performance.samples) : null,
      };
    }
    
    return stats;
  }

  /**
   * Reset thresholds to base
   */
  resetThresholds() {
    this.currentThresholds = { ...this.baseThresholds };
    logger.info('Thresholds reset to base values');
  }
}

module.exports = new AdaptiveThresholds();
