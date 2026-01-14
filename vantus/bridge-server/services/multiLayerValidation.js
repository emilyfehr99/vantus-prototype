/**
 * Multi-Layer Validation System
 * Multiple validation layers for near-100% accuracy
 * Only signals passing all layers are sent
 */

const logger = require('../utils/logger');
const signalPersistence = require('./signalPersistence');
const signalQualityScoring = require('./signalQualityScoring');
const confidenceCalibration = require('./confidenceCalibration');
const accuracyEnsemble = require('./accuracyEnsemble');

class MultiLayerValidation {
  constructor() {
    this.layers = [
      { name: 'ensemble', required: true, weight: 0.30 },
      { name: 'persistence', required: true, weight: 0.25 },
      { name: 'quality', required: true, weight: 0.25 },
      { name: 'calibration', required: true, weight: 0.20 },
    ];
    this.validationHistory = [];
  }

  /**
   * Validate signal through all layers
   * @param {Object} signal - Signal to validate
   * @param {Object} context - Context
   * @returns {Object} Validation result
   */
  async validate(signal, context = {}) {
    const validation = {
      signal,
      passed: true,
      layers: [],
      finalConfidence: signal.probability || signal.confidence || 0,
      reasons: [],
    };

    // Layer 1: Ensemble Consensus (for visual detections)
    if (context.frameData) {
      const ensembleResult = await accuracyEnsemble.processEnsemble(context.frameData, {
        detectionTypes: [signal.signalCategory || signal.category],
        officerName: context.officerName,
      });

      const ensemblePassed = ensembleResult.consensus && 
        ensembleResult.confidence >= 0.80;

      validation.layers.push({
        name: 'ensemble',
        passed: ensemblePassed,
        confidence: ensembleResult.confidence,
        reason: ensemblePassed
          ? `Ensemble consensus: ${ensembleResult.consensusRate * 100}% agreement`
          : 'Failed ensemble consensus',
      });

      if (!ensemblePassed && this.layers.find(l => l.name === 'ensemble')?.required) {
        validation.passed = false;
        validation.reasons.push('Failed ensemble consensus');
      } else if (ensemblePassed) {
        validation.finalConfidence = Math.max(validation.finalConfidence, ensembleResult.confidence);
      }
    }

    // Layer 2: Persistence Check
    const persistenceResult = signalPersistence.checkPersistence(
      context.officerName || 'unknown',
      signal
    );

    validation.layers.push({
      name: 'persistence',
      passed: persistenceResult.persisted,
      duration: persistenceResult.duration,
      count: persistenceResult.currentCount,
      required: persistenceResult.requiredCount,
      reason: persistenceResult.reason,
    });

    if (!persistenceResult.persisted && this.layers.find(l => l.name === 'persistence')?.required) {
      validation.passed = false;
      validation.reasons.push('Signal not persistent');
    }

    // Layer 3: Quality Scoring
    const qualityResult = signalQualityScoring.scoreSignal(signal, {
      ...context,
      persistence: persistenceResult,
    });

    validation.layers.push({
      name: 'quality',
      passed: qualityResult.passes,
      score: qualityResult.totalScore,
      threshold: signalQualityScoring.qualityThreshold,
      reason: qualityResult.passes
        ? `Quality score: ${(qualityResult.totalScore * 100).toFixed(1)}%`
        : `Quality score too low: ${(qualityResult.totalScore * 100).toFixed(1)}%`,
    });

    if (!qualityResult.passes && this.layers.find(l => l.name === 'quality')?.required) {
      validation.passed = false;
      validation.reasons.push('Quality score too low');
    }

    // Layer 4: Confidence Calibration
    const detectionType = signal.signalCategory || signal.category || 'unknown';
    const calibratedConfidence = confidenceCalibration.calibrateConfidence(
      detectionType,
      validation.finalConfidence,
      context
    );

    validation.layers.push({
      name: 'calibration',
      passed: calibratedConfidence >= 0.75, // Calibrated confidence threshold
      originalConfidence: validation.finalConfidence,
      calibratedConfidence,
      reason: calibratedConfidence >= 0.75
        ? `Calibrated confidence: ${(calibratedConfidence * 100).toFixed(1)}%`
        : `Calibrated confidence too low: ${(calibratedConfidence * 100).toFixed(1)}%`,
    });

    if (calibratedConfidence < 0.75 && this.layers.find(l => l.name === 'calibration')?.required) {
      validation.passed = false;
      validation.reasons.push('Calibrated confidence too low');
    }

    // Update final confidence with calibration
    validation.finalConfidence = calibratedConfidence;

    // Store validation history
    this.validationHistory.push({
      timestamp: new Date().toISOString(),
      signalCategory: detectionType,
      passed: validation.passed,
      layersPassed: validation.layers.filter(l => l.passed).length,
      totalLayers: validation.layers.length,
      finalConfidence: validation.finalConfidence,
    });

    // Limit history
    if (this.validationHistory.length > 1000) {
      this.validationHistory.shift();
    }

    return validation;
  }

  /**
   * Get validation statistics
   */
  getStats() {
    const total = this.validationHistory.length;
    if (total === 0) {
      return {
        totalValidations: 0,
        passRate: 0,
        averageLayersPassed: 0,
      };
    }

    const passed = this.validationHistory.filter(v => v.passed).length;
    const avgLayersPassed = this.validationHistory.reduce((sum, v) => sum + v.layersPassed, 0) / total;

    return {
      totalValidations: total,
      passRate: (passed / total) * 100,
      averageLayersPassed: avgLayersPassed.toFixed(2),
      averageConfidence: this.validationHistory.reduce((sum, v) => sum + v.finalConfidence, 0) / total,
    };
  }
}

module.exports = new MultiLayerValidation();
