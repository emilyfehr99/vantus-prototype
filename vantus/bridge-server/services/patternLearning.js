/**
 * Pattern Learning Service
 * Learns from supervisor feedback to improve pattern detection
 */

const logger = require('../utils/logger');

class PatternLearning {
  constructor() {
    this.feedbackHistory = new Map(); // signalId -> feedback
    this.patternAdjustments = new Map(); // patternType -> adjustments
  }

  /**
   * Record supervisor feedback
   * @param {string} signalId - Signal ID
   * @param {Object} feedback - Feedback data
   */
  recordFeedback(signalId, feedback) {
    const feedbackEntry = {
      signalId,
      feedback,
      timestamp: new Date().toISOString(),
    };

    if (!this.feedbackHistory.has(signalId)) {
      this.feedbackHistory.set(signalId, []);
    }

    this.feedbackHistory.get(signalId).push(feedbackEntry);

    // Analyze feedback for pattern adjustments
    this.analyzeFeedback(signalId, feedback);

    logger.info('Feedback recorded', { signalId, feedback });
  }

  /**
   * Analyze feedback for pattern adjustments
   */
  analyzeFeedback(signalId, feedback) {
    // Extract pattern type from signal (would come from actual signal data)
    const patternType = feedback.patternType || 'unknown';
    
    if (!this.patternAdjustments.has(patternType)) {
      this.patternAdjustments.set(patternType, {
        falsePositiveCount: 0,
        truePositiveCount: 0,
        adjustments: {},
      });
    }

    const adjustment = this.patternAdjustments.get(patternType);

    if (feedback.type === 'false_positive') {
      adjustment.falsePositiveCount++;
      // Adjust confidence threshold upward
      adjustment.adjustments.confidenceThreshold = 
        (adjustment.adjustments.confidenceThreshold || 0.6) + 0.05;
    } else if (feedback.type === 'true_positive') {
      adjustment.truePositiveCount++;
      // Keep or slightly lower threshold
      adjustment.adjustments.confidenceThreshold = 
        (adjustment.adjustments.confidenceThreshold || 0.6) - 0.02;
    }

    // Cap adjustments
    if (adjustment.adjustments.confidenceThreshold) {
      adjustment.adjustments.confidenceThreshold = Math.max(0.5, 
        Math.min(0.9, adjustment.adjustments.confidenceThreshold));
    }
  }

  /**
   * Get adjusted confidence threshold for pattern type
   */
  getAdjustedThreshold(patternType) {
    const adjustment = this.patternAdjustments.get(patternType);
    if (!adjustment || !adjustment.adjustments.confidenceThreshold) {
      return 0.6; // Default threshold
    }
    return adjustment.adjustments.confidenceThreshold;
  }

  /**
   * Get learning statistics
   */
  getStatistics() {
    const stats = {
      totalFeedback: 0,
      falsePositives: 0,
      truePositives: 0,
      patternAdjustments: {},
    };

    for (const [patternType, adjustment] of this.patternAdjustments.entries()) {
      stats.totalFeedback += adjustment.falsePositiveCount + adjustment.truePositiveCount;
      stats.falsePositives += adjustment.falsePositiveCount;
      stats.truePositives += adjustment.truePositiveCount;
      stats.patternAdjustments[patternType] = adjustment.adjustments;
    }

    return stats;
  }
}

module.exports = new PatternLearning();
