/**
 * Confidence Calibration System
 * Calibrates confidence scores based on historical accuracy
 * Ensures confidence scores accurately reflect true accuracy
 */

const logger = require('../utils/logger');

class ConfidenceCalibration {
  constructor() {
    this.calibrationHistory = new Map(); // detectionType -> calibration data
    this.minSamples = 50; // Minimum samples before calibrating
  }

  /**
   * Calibrate confidence score based on historical performance
   * @param {string} detectionType - Type of detection
   * @param {number} rawConfidence - Raw confidence from model
   * @param {Object} context - Context
   * @returns {number} Calibrated confidence
   */
  calibrateConfidence(detectionType, rawConfidence, context = {}) {
    const calibration = this.calibrationHistory.get(detectionType);
    
    if (!calibration || calibration.samples < this.minSamples) {
      // Not enough data, use conservative adjustment
      return this.conservativeCalibration(rawConfidence);
    }

    // Calculate calibration curve
    const calibrated = this.applyCalibrationCurve(rawConfidence, calibration);
    
    return Math.max(0, Math.min(1, calibrated));
  }

  /**
   * Conservative calibration when insufficient data
   */
  conservativeCalibration(rawConfidence) {
    // Be conservative - slightly reduce confidence
    // This reduces false positives
    return rawConfidence * 0.9;
  }

  /**
   * Apply calibration curve based on historical data
   */
  applyCalibrationCurve(rawConfidence, calibration) {
    // Use Platt scaling or isotonic regression approach
    // For now, use linear adjustment based on accuracy rate
    
    const accuracyRate = calibration.accuracyRate || 0.85;
    const expectedAccuracy = rawConfidence;
    const actualAccuracy = accuracyRate;
    
    // Adjust confidence to match actual accuracy
    const adjustment = actualAccuracy / expectedAccuracy;
    
    return rawConfidence * adjustment;
  }

  /**
   * Record detection outcome for calibration
   * @param {string} detectionType - Type of detection
   * @param {number} confidence - Confidence score
   * @param {boolean} wasCorrect - Was detection correct
   */
  recordOutcome(detectionType, confidence, wasCorrect) {
    if (!this.calibrationHistory.has(detectionType)) {
      this.calibrationHistory.set(detectionType, {
        samples: 0,
        correct: 0,
        incorrect: 0,
        accuracyRate: 0,
        confidenceBins: new Map(), // Track accuracy by confidence bin
      });
    }

    const calibration = this.calibrationHistory.get(detectionType);
    calibration.samples++;
    
    if (wasCorrect) {
      calibration.correct++;
    } else {
      calibration.incorrect++;
    }

    calibration.accuracyRate = calibration.correct / calibration.samples;

    // Track by confidence bin
    const bin = Math.floor(confidence * 10) / 10; // 0.0, 0.1, 0.2, etc.
    if (!calibration.confidenceBins.has(bin)) {
      calibration.confidenceBins.set(bin, { total: 0, correct: 0 });
    }
    
    const binData = calibration.confidenceBins.get(bin);
    binData.total++;
    if (wasCorrect) {
      binData.correct++;
    }

    logger.debug('Calibration updated', {
      detectionType,
      samples: calibration.samples,
      accuracyRate: calibration.accuracyRate,
    });
  }

  /**
   * Get calibration statistics
   */
  getCalibrationStats() {
    const stats = {};
    
    for (const [type, calibration] of this.calibrationHistory.entries()) {
      stats[type] = {
        samples: calibration.samples,
        accuracyRate: calibration.accuracyRate,
        correct: calibration.correct,
        incorrect: calibration.incorrect,
        calibrated: calibration.samples >= this.minSamples,
      };
    }
    
    return stats;
  }
}

module.exports = new ConfidenceCalibration();
