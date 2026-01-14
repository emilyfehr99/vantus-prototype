/**
 * Accuracy Monitoring System
 * Tracks accuracy metrics and provides real-time monitoring
 * Ensures system maintains near-100% accuracy
 */

const logger = require('../utils/logger');
const adaptiveThresholds = require('./adaptiveThresholds');
const confidenceCalibration = require('./confidenceCalibration');
const multiLayerValidation = require('./multiLayerValidation');

class AccuracyMonitoring {
  constructor() {
    this.metrics = {
      totalDetections: 0,
      validatedDetections: 0,
      falsePositives: 0,
      truePositives: 0,
      accuracyRate: 0,
      byType: new Map(),
    };
    this.targetAccuracy = 0.95; // 95% target accuracy
  }

  /**
   * Record detection outcome
   * @param {string} detectionType - Type of detection
   * @param {number} confidence - Confidence score
   * @param {boolean} wasCorrect - Was detection correct
   */
  recordOutcome(detectionType, confidence, wasCorrect) {
    this.metrics.totalDetections++;
    
    if (wasCorrect) {
      this.metrics.truePositives++;
    } else {
      this.metrics.falsePositives++;
    }

    // Update accuracy rate
    this.metrics.accuracyRate = this.metrics.truePositives / this.metrics.totalDetections;

    // Track by type
    if (!this.metrics.byType.has(detectionType)) {
      this.metrics.byType.set(detectionType, {
        total: 0,
        correct: 0,
        incorrect: 0,
        accuracyRate: 0,
      });
    }

    const typeMetrics = this.metrics.byType.get(detectionType);
    typeMetrics.total++;
    if (wasCorrect) {
      typeMetrics.correct++;
    } else {
      typeMetrics.incorrect++;
    }
    typeMetrics.accuracyRate = typeMetrics.correct / typeMetrics.total;

    // Record in other systems
    adaptiveThresholds.recordPerformance(detectionType, confidence, wasCorrect);
    confidenceCalibration.recordOutcome(detectionType, confidence, wasCorrect);

    // Log if accuracy drops below target
    if (this.metrics.accuracyRate < this.targetAccuracy && this.metrics.totalDetections >= 50) {
      logger.warn('Accuracy below target', {
        currentAccuracy: this.metrics.accuracyRate,
        targetAccuracy: this.targetAccuracy,
        falsePositives: this.metrics.falsePositives,
        totalDetections: this.metrics.totalDetections,
      });
    }
  }

  /**
   * Get accuracy metrics
   */
  getMetrics() {
    const validationStats = multiLayerValidation.getStats();
    const thresholdStats = adaptiveThresholds.getStats();
    const calibrationStats = confidenceCalibration.getCalibrationStats();

    return {
      overall: {
        totalDetections: this.metrics.totalDetections,
        truePositives: this.metrics.truePositives,
        falsePositives: this.metrics.falsePositives,
        accuracyRate: this.metrics.accuracyRate,
        targetAccuracy: this.targetAccuracy,
        meetsTarget: this.metrics.accuracyRate >= this.targetAccuracy,
      },
      byType: Object.fromEntries(this.metrics.byType),
      validation: validationStats,
      thresholds: thresholdStats,
      calibration: calibrationStats,
    };
  }

  /**
   * Get accuracy report
   */
  getAccuracyReport() {
    const metrics = this.getMetrics();
    
    return {
      summary: {
        accuracyRate: (metrics.overall.accuracyRate * 100).toFixed(2) + '%',
        targetAccuracy: (metrics.overall.targetAccuracy * 100).toFixed(2) + '%',
        meetsTarget: metrics.overall.meetsTarget,
        totalDetections: metrics.overall.totalDetections,
        falsePositiveRate: ((metrics.overall.falsePositives / metrics.overall.totalDetections) * 100).toFixed(2) + '%',
      },
      details: metrics,
      recommendations: this.getRecommendations(metrics),
    };
  }

  /**
   * Get recommendations for improving accuracy
   */
  getRecommendations(metrics) {
    const recommendations = [];

    if (metrics.overall.accuracyRate < this.targetAccuracy) {
      recommendations.push({
        priority: 'high',
        issue: 'Overall accuracy below target',
        recommendation: 'Review false positive patterns and adjust thresholds',
      });
    }

    // Check each type
    for (const [type, typeMetrics] of Object.entries(metrics.byType)) {
      if (typeMetrics.accuracyRate < 0.90 && typeMetrics.total >= 20) {
        recommendations.push({
          priority: 'medium',
          issue: `${type} accuracy below 90%`,
          recommendation: `Consider raising threshold for ${type} or improving detection logic`,
        });
      }
    }

    // Check validation pass rate
    if (metrics.validation.passRate < 80) {
      recommendations.push({
        priority: 'medium',
        issue: 'Low validation pass rate',
        recommendation: 'Review validation criteria - may be too strict or signals need improvement',
      });
    }

    return recommendations;
  }
}

module.exports = new AccuracyMonitoring();
