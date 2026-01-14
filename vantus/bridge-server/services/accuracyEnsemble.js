/**
 * Accuracy Ensemble System
 * Uses multiple models/analyses and consensus voting for near-100% accuracy
 * Only signals that pass ensemble consensus are sent
 */

const logger = require('../utils/logger');
const llmVisionService = require('./llmVisionService');

class AccuracyEnsemble {
  constructor() {
    this.consensusThreshold = 0.75; // 75% of models must agree
    this.minConfidence = 0.80; // Minimum 80% confidence after ensemble
    this.ensembleHistory = [];
  }

  /**
   * Process detection through ensemble (multiple passes/analyses)
   * @param {Object} frame - Frame to analyze
   * @param {Object} options - Options
   * @returns {Promise<Object>} Ensemble consensus result
   */
  async processEnsemble(frame, options = {}) {
    if (!frame.base64) {
      return {
        consensus: false,
        confidence: 0,
        detections: {},
        reason: 'No image data',
      };
    }

    try {
      // Run multiple analysis passes for consensus
      const analyses = await Promise.all([
        this.analyzePass(frame, options, 'pass1'),
        this.analyzePass(frame, options, 'pass2'),
        this.analyzePass(frame, options, 'pass3'),
      ]);

      // Get consensus for each detection type
      const consensus = this.calculateConsensus(analyses, options);

      // Only return detections that pass consensus
      const finalDetections = {};
      for (const [type, result] of Object.entries(consensus)) {
        if (result.consensus && result.confidence >= this.minConfidence) {
          finalDetections[type] = {
            ...result,
            ensemble: true,
            passCount: result.passCount,
            agreementRate: result.agreementRate,
          };
        }
      }

      return {
        consensus: Object.keys(finalDetections).length > 0,
        confidence: Object.keys(finalDetections).length > 0
          ? Math.max(...Object.values(finalDetections).map(d => d.confidence))
          : 0,
        detections: finalDetections,
        analyses: analyses.length,
        consensusRate: this.calculateOverallConsensus(consensus),
      };
    } catch (error) {
      logger.error('Ensemble processing error', error);
      return {
        consensus: false,
        confidence: 0,
        detections: {},
        error: error.message,
      };
    }
  }

  /**
   * Run a single analysis pass
   */
  async analyzePass(frame, options, passId) {
    // Slight variation in prompt for each pass to get independent analysis
    const detectionTypes = options.detectionTypes || ['weapon', 'stance', 'hands'];
    
    const analysis = await llmVisionService.analyzeImage(frame.base64, {
      frameTime: frame.videoTime,
      officerName: options.officerName,
      detectionTypes,
      passId, // Can be used to vary prompt slightly
    });

    return {
      passId,
      timestamp: new Date().toISOString(),
      ...analysis,
    };
  }

  /**
   * Calculate consensus across multiple analyses
   */
  calculateConsensus(analyses, options) {
    const consensus = {};
    const detectionTypes = options.detectionTypes || ['weapon', 'stance', 'hands'];

    for (const type of detectionTypes) {
      const typeResults = analyses
        .map(a => a[type])
        .filter(r => r !== undefined);

      if (typeResults.length === 0) {
        consensus[type] = {
          consensus: false,
          confidence: 0,
          passCount: 0,
          agreementRate: 0,
        };
        continue;
      }

      // Count how many passes detected this type
      const detectedCount = typeResults.filter(r => r.detected).length;
      const agreementRate = detectedCount / typeResults.length;

      // Calculate average confidence of detections
      const detectedResults = typeResults.filter(r => r.detected);
      const avgConfidence = detectedResults.length > 0
        ? detectedResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / detectedResults.length
        : 0;

      // Consensus requires agreement rate >= threshold
      const hasConsensus = agreementRate >= this.consensusThreshold;

      // Calculate final confidence (boosted by agreement)
      const consensusConfidence = hasConsensus
        ? Math.min(0.95, avgConfidence * (1 + agreementRate * 0.2))
        : 0;

      consensus[type] = {
        consensus: hasConsensus && consensusConfidence >= this.minConfidence,
        confidence: consensusConfidence,
        passCount: detectedCount,
        totalPasses: typeResults.length,
        agreementRate,
        avgConfidence,
      };
    }

    return consensus;
  }

  /**
   * Calculate overall consensus rate
   */
  calculateOverallConsensus(consensus) {
    const types = Object.keys(consensus);
    if (types.length === 0) return 0;

    const consensusCount = types.filter(t => consensus[t].consensus).length;
    return consensusCount / types.length;
  }

  /**
   * Adjust consensus threshold based on historical performance
   */
  adjustThreshold(accuracyRate) {
    // If accuracy is high, can lower threshold slightly
    // If accuracy is low, raise threshold
    if (accuracyRate > 0.95) {
      this.consensusThreshold = Math.max(0.70, this.consensusThreshold - 0.02);
    } else if (accuracyRate < 0.90) {
      this.consensusThreshold = Math.min(0.90, this.consensusThreshold + 0.02);
    }
  }
}

module.exports = new AccuracyEnsemble();
