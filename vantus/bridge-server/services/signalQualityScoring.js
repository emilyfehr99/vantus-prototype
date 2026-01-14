/**
 * Signal Quality Scoring System
 * Scores signals based on multiple quality factors
 * Only high-quality signals are sent
 */

const logger = require('../utils/logger');

class SignalQualityScoring {
  constructor() {
    this.qualityThreshold = 0.75; // Minimum quality score to send signal
    this.scoringWeights = {
      confidence: 0.30,
      baselineDeviation: 0.20,
      persistence: 0.15,
      crossValidation: 0.15,
      contextMatch: 0.10,
      dataQuality: 0.10,
    };
  }

  /**
   * Score signal quality
   * @param {Object} signal - Signal to score
   * @param {Object} context - Context
   * @returns {Object} Quality score and breakdown
   */
  scoreSignal(signal, context = {}) {
    const scores = {
      confidence: this.scoreConfidence(signal),
      baselineDeviation: this.scoreBaselineDeviation(signal),
      persistence: this.scorePersistence(signal, context),
      crossValidation: this.scoreCrossValidation(signal, context),
      contextMatch: this.scoreContextMatch(signal, context),
      dataQuality: this.scoreDataQuality(signal),
    };

    // Calculate weighted total
    const totalScore = Object.entries(scores).reduce((sum, [factor, score]) => {
      return sum + (score * (this.scoringWeights[factor] || 0));
    }, 0);

    const quality = {
      totalScore: Math.max(0, Math.min(1, totalScore)),
      scores,
      weights: this.scoringWeights,
      passes: totalScore >= this.qualityThreshold,
      factors: Object.keys(scores).length,
      breakdown: this.getScoreBreakdown(scores, totalScore),
    };

    return quality;
  }

  /**
   * Score confidence factor
   */
  scoreConfidence(signal) {
    const confidence = signal.probability || signal.confidence || 0;
    // Higher confidence = higher score (but cap at 0.95 to leave room for other factors)
    return Math.min(0.95, confidence);
  }

  /**
   * Score baseline deviation
   */
  scoreBaselineDeviation(signal) {
    const baselineContext = signal.baselineContext || {};
    const zScore = baselineContext.zScore || 0;
    
    // Higher z-score = higher score
    // z-score > 2 = very significant (0.9)
    // z-score > 1 = significant (0.7)
    // z-score < 1 = not significant (0.3)
    if (zScore >= 2) return 0.9;
    if (zScore >= 1.5) return 0.8;
    if (zScore >= 1) return 0.7;
    if (zScore >= 0.5) return 0.5;
    return 0.3;
  }

  /**
   * Score persistence
   */
  scorePersistence(signal, context) {
    const persistence = context.persistence || {};
    
    if (persistence.persisted) {
      // More persistent = higher score
      const persistenceRate = persistence.currentCount / (persistence.requiredCount || 1);
      return Math.min(1.0, 0.7 + (persistenceRate - 1) * 0.3);
    }
    
    return 0.4; // Low score if not persistent
  }

  /**
   * Score cross-validation
   */
  scoreCrossValidation(signal, context) {
    const crossValidation = context.crossValidation || {};
    
    if (crossValidation.validated) {
      // Multiple sources agree = higher score
      const agreementRate = crossValidation.agreementRate || 0;
      return 0.6 + (agreementRate * 0.4);
    }
    
    return 0.5; // Neutral if no cross-validation
  }

  /**
   * Score context match
   */
  scoreContextMatch(signal, context) {
    const operationalContext = context.operationalContext || {};
    const signalCategory = signal.signalCategory || signal.category || '';
    
    // Check if signal matches expected patterns for context
    const expectedPatterns = {
      traffic_stop: ['routine_duration_drift', 'stationary_duration'],
      checkpoint: ['routine_duration_drift', 'stationary_duration'],
    };

    if (operationalContext && expectedPatterns[operationalContext]) {
      const matches = expectedPatterns[operationalContext].some(pattern =>
        signalCategory.includes(pattern)
      );
      return matches ? 0.9 : 0.6;
    }

    return 0.7; // Default score
  }

  /**
   * Score data quality
   */
  scoreDataQuality(signal) {
    let score = 0.7; // Base score

    // Check if signal has good explanation
    if (signal.explanation && signal.explanation.description) {
      score += 0.1;
    }

    // Check if signal has traceability
    if (signal.explanation && signal.explanation.traceability) {
      score += 0.1;
    }

    // Check if signal has origin data
    if (signal.explanation && signal.explanation.originData) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Get score breakdown for explanation
   */
  getScoreBreakdown(scores, totalScore) {
    return Object.entries(scores)
      .map(([factor, score]) => ({
        factor,
        score: (score * 100).toFixed(1) + '%',
        weight: (this.scoringWeights[factor] * 100).toFixed(1) + '%',
        contribution: ((score * this.scoringWeights[factor]) * 100).toFixed(1) + '%',
      }))
      .sort((a, b) => parseFloat(b.contribution) - parseFloat(a.contribution));
  }

  /**
   * Filter signals by quality
   */
  filterByQuality(signals, context = {}) {
    return signals
      .map(signal => ({
        signal,
        quality: this.scoreSignal(signal, context),
      }))
      .filter(item => item.quality.passes)
      .map(item => ({
        ...item.signal,
        qualityScore: item.quality.totalScore,
        qualityBreakdown: item.quality.breakdown,
      }));
  }
}

module.exports = new SignalQualityScoring();
