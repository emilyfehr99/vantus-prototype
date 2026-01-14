/**
 * SIGNAL VALIDATION SERVICE
 * Validates signals to reduce false positives
 * Cross-validates signals against each other and context
 * Maintains non-diagnostic approach
 */

import logger from '../utils/logger';
import baselineCalibration from './baselineCalibration';
import knowledgeBase from './knowledgeBase';

class SignalValidation {
  constructor() {
    this.validationHistory = [];
    this.falsePositivePatterns = new Map(); // Track patterns that were false positives
  }

  /**
   * Validate a signal
   * @param {Object} signal - Signal to validate
   * @param {Array<Object>} otherSignals - Other signals for context
   * @param {Object} telemetryState - Current telemetry state
   * @param {Object} context - Operational context
   * @returns {Object} Validation result with adjusted confidence
   */
  validateSignal(signal, otherSignals = [], telemetryState = {}, context = {}) {
    const validation = {
      signal,
      valid: true,
      confidence: signal.probability || signal.confidence || 0,
      adjustedConfidence: signal.probability || signal.confidence || 0,
      validationChecks: [],
      warnings: [],
    };

    // 1. Baseline validation
    const baselineCheck = this.validateAgainstBaseline(signal, context);
    validation.validationChecks.push(baselineCheck);
    if (!baselineCheck.passed) {
      validation.valid = false;
      validation.adjustedConfidence *= 0.5; // Reduce confidence significantly
    }

    // 2. Temporal validation
    const temporalCheck = this.validateTemporalConsistency(signal, otherSignals);
    validation.validationChecks.push(temporalCheck);
    if (!temporalCheck.passed) {
      validation.warnings.push('Signal may be transient or inconsistent');
      validation.adjustedConfidence *= 0.8; // Slight reduction
    }

    // 3. Context validation
    const contextCheck = this.validateContext(signal, context, telemetryState);
    validation.validationChecks.push(contextCheck);
    if (!contextCheck.passed) {
      validation.warnings.push('Signal may not match operational context');
      validation.adjustedConfidence *= 0.7; // Moderate reduction
    }

    // 4. Cross-signal validation
    const crossSignalCheck = this.validateCrossSignal(signal, otherSignals);
    validation.validationChecks.push(crossSignalCheck);
    if (!crossSignalCheck.passed) {
      validation.warnings.push('Signal conflicts with other signals');
      validation.adjustedConfidence *= 0.6; // Significant reduction
    }

    // 5. Persistence validation
    const persistenceCheck = this.validatePersistence(signal, otherSignals);
    validation.validationChecks.push(persistenceCheck);
    if (persistenceCheck.passed && persistenceCheck.persistent) {
      // Boost confidence for persistent signals
      validation.adjustedConfidence = Math.min(0.95, validation.adjustedConfidence * 1.1);
    }

    // 6. Historical false positive check
    const falsePositiveCheck = this.checkFalsePositivePattern(signal);
    validation.validationChecks.push(falsePositiveCheck);
    if (falsePositiveCheck.isFalsePositivePattern) {
      validation.warnings.push('Similar pattern was previously identified as false positive');
      validation.adjustedConfidence *= 0.5; // Significant reduction
    }

    // Clamp adjusted confidence
    validation.adjustedConfidence = Math.max(0, Math.min(1, validation.adjustedConfidence));

    // Store validation history
    this.validationHistory.push({
      timestamp: new Date().toISOString(),
      signalCategory: signal.signalCategory || signal.category,
      originalConfidence: validation.confidence,
      adjustedConfidence: validation.adjustedConfidence,
      validationChecks: validation.validationChecks.length,
      passedChecks: validation.validationChecks.filter(c => c.passed).length,
    });

    // Limit history size
    if (this.validationHistory.length > 1000) {
      this.validationHistory.shift();
    }

    return validation;
  }

  /**
   * Validate signal against baseline
   * @param {Object} signal - Signal to validate
   * @param {Object} context - Operational context
   * @returns {Object} Validation check result
   */
  validateAgainstBaseline(signal, context) {
    const baselineContext = signal.baselineContext || {};
    
    // Check if baseline data exists
    if (!baselineContext.baselineMean && !baselineContext.baselineMedian) {
      return {
        check: 'baseline',
        passed: false,
        reason: 'No baseline data available',
      };
    }

    // Check if deviation is significant
    const comparisonValue = baselineContext.comparisonValue;
    const baselineMean = baselineContext.baselineMean || baselineContext.baselineMedian;
    const baselineStd = baselineContext.baselineStd || baselineContext.baselineIQR || 1;
    
    if (!comparisonValue || !baselineMean) {
      return {
        check: 'baseline',
        passed: false,
        reason: 'Missing baseline comparison data',
      };
    }

    // Calculate z-score
    const zScore = Math.abs((comparisonValue - baselineMean) / baselineStd);
    
    // Signal should have significant deviation (z > 1.0)
    const passed = zScore > 1.0;
    
    return {
      check: 'baseline',
      passed,
      reason: passed 
        ? `Significant deviation detected (z-score: ${zScore.toFixed(2)})`
        : `Deviation not significant (z-score: ${zScore.toFixed(2)})`,
      zScore: zScore.toFixed(2),
    };
  }

  /**
   * Validate temporal consistency
   * @param {Object} signal - Signal to validate
   * @param {Array<Object>} otherSignals - Other signals for context
   * @returns {Object} Validation check result
   */
  validateTemporalConsistency(signal, otherSignals) {
    const signalTime = new Date(signal.timestamp).getTime();
    const now = Date.now();
    const age = now - signalTime;
    
    // Signal should be recent (within last 5 minutes)
    if (age > 300000) { // 5 minutes
      return {
        check: 'temporal',
        passed: false,
        reason: 'Signal is too old',
        age: Math.round(age / 1000), // seconds
      };
    }

    // Check for similar signals in recent history
    const similarSignals = otherSignals.filter(s => {
      if (s.signalCategory !== signal.signalCategory) return false;
      const timeDiff = Math.abs(new Date(s.timestamp).getTime() - signalTime);
      return timeDiff < 60000; // Within 1 minute
    });

    // If similar signals exist, it's more consistent
    const passed = similarSignals.length > 0 || age < 30000; // Recent or has similar signals

    return {
      check: 'temporal',
      passed,
      reason: passed
        ? 'Signal is temporally consistent'
        : 'Signal may be transient',
      similarSignals: similarSignals.length,
    };
  }

  /**
   * Validate signal context
   * @param {Object} signal - Signal to validate
   * @param {Object} context - Operational context
   * @param {Object} telemetryState - Telemetry state
   * @returns {Object} Validation check result
   */
  validateContext(signal, context, telemetryState) {
    const operationalContext = context.operationalContext || telemetryState.operationalContext;
    
    // Some signals are expected in certain contexts
    const expectedPatterns = {
      traffic_stop: ['routine_duration_drift', 'stationary_duration'],
      checkpoint: ['routine_duration_drift', 'stationary_duration'],
      routine: ['abrupt_stop', 'pacing_pattern'],
    };

    const signalCategory = signal.signalCategory || signal.category || '';
    
    // Check if signal makes sense in context
    if (operationalContext && expectedPatterns[operationalContext]) {
      const expected = expectedPatterns[operationalContext].some(pattern => 
        signalCategory.includes(pattern)
      );
      
      return {
        check: 'context',
        passed: true,
        reason: expected 
          ? 'Signal matches expected patterns for context'
          : 'Signal may be unexpected for context',
        context: operationalContext,
      };
    }

    return {
      check: 'context',
      passed: true,
      reason: 'Context validation passed',
    };
  }

  /**
   * Validate cross-signal consistency
   * @param {Object} signal - Signal to validate
   * @param {Array<Object>} otherSignals - Other signals
   * @returns {Object} Validation check result
   */
  validateCrossSignal(signal, otherSignals) {
    const signalCategory = signal.signalCategory || signal.category || '';
    
    // Check for conflicting signals
    const conflicts = otherSignals.filter(s => {
      const otherCategory = s.signalCategory || s.category || '';
      
      // Movement vs stationary conflict
      if (signalCategory.includes('movement') && otherCategory.includes('stationary')) {
        return true;
      }
      
      // Fast vs slow speech conflict
      if (signalCategory.includes('speech_rate') && otherCategory.includes('speech_rate')) {
        const signalRate = signal.indicators?.find(i => i.includes('rate')) || '';
        const otherRate = s.indicators?.find(i => i.includes('rate')) || '';
        if (signalRate.includes('fast') && otherRate.includes('slow')) {
          return true;
        }
      }
      
      return false;
    });

    return {
      check: 'cross_signal',
      passed: conflicts.length === 0,
      reason: conflicts.length === 0
        ? 'No conflicting signals detected'
        : `${conflicts.length} conflicting signals detected`,
      conflicts: conflicts.length,
    };
  }

  /**
   * Validate signal persistence
   * @param {Object} signal - Signal to validate
   * @param {Array<Object>} otherSignals - Other signals
   * @returns {Object} Validation check result
   */
  validatePersistence(signal, otherSignals) {
    const signalCategory = signal.signalCategory || signal.category || '';
    const signalTime = new Date(signal.timestamp).getTime();
    
    // Look for similar signals in the past 2 minutes
    const timeWindow = 120000; // 2 minutes
    const similarSignals = otherSignals.filter(s => {
      if ((s.signalCategory || s.category) !== signalCategory) return false;
      const timeDiff = signalTime - new Date(s.timestamp).getTime();
      return timeDiff > 0 && timeDiff <= timeWindow;
    });

    const persistent = similarSignals.length >= 2; // At least 2 similar signals in window

    return {
      check: 'persistence',
      passed: true,
      persistent,
      reason: persistent
        ? `Signal persists (${similarSignals.length} similar signals in past 2 minutes)`
        : 'Signal may be transient',
      similarSignals: similarSignals.length,
    };
  }

  /**
   * Check if signal matches false positive pattern
   * @param {Object} signal - Signal to check
   * @returns {Object} Validation check result
   */
  checkFalsePositivePattern(signal) {
    const signalCategory = signal.signalCategory || signal.category || '';
    const pattern = this.falsePositivePatterns.get(signalCategory);
    
    if (!pattern) {
      return {
        check: 'false_positive',
        passed: true,
        isFalsePositivePattern: false,
        reason: 'No false positive pattern found',
      };
    }

    // Check if signal matches false positive pattern
    const matches = this.matchesFalsePositivePattern(signal, pattern);
    
    return {
      check: 'false_positive',
      passed: !matches,
      isFalsePositivePattern: matches,
      reason: matches
        ? 'Signal matches known false positive pattern'
        : 'Signal does not match false positive pattern',
    };
  }

  /**
   * Check if signal matches false positive pattern
   * @param {Object} signal - Signal to check
   * @param {Object} pattern - False positive pattern
   * @returns {boolean} True if matches
   */
  matchesFalsePositivePattern(signal, pattern) {
    // Simple pattern matching - can be enhanced
    const signalConfidence = signal.probability || signal.confidence || 0;
    const patternConfidence = pattern.confidence || 0;
    
    // Check if confidence is similar
    if (Math.abs(signalConfidence - patternConfidence) > 0.2) {
      return false;
    }

    // Check if indicators match
    const signalIndicators = signal.indicators || [];
    const patternIndicators = pattern.indicators || [];
    
    const matchingIndicators = signalIndicators.filter(i => 
      patternIndicators.includes(i)
    ).length;
    
    return matchingIndicators >= patternIndicators.length * 0.5; // 50% match
  }

  /**
   * Record false positive for learning
   * @param {Object} signal - Signal that was false positive
   * @param {string} reason - Reason it was false positive
   * @param {Object} context - Operational context
   */
  async recordFalsePositive(signal, reason, context = {}) {
    const category = signal.signalCategory || signal.category || '';
    
    if (!this.falsePositivePatterns.has(category)) {
      this.falsePositivePatterns.set(category, {
        confidence: signal.probability || signal.confidence || 0,
        indicators: signal.indicators || [],
        count: 0,
        reasons: [],
      });
    }
    
    const pattern = this.falsePositivePatterns.get(category);
    pattern.count++;
    if (reason && !pattern.reasons.includes(reason)) {
      pattern.reasons.push(reason);
    }
    
    // Store in knowledge base if available
    if (knowledgeBase.isAvailable()) {
      await knowledgeBase.storeFalsePositivePattern(signal, reason, context);
    }
    
    logger.info('False positive recorded', { category, reason, count: pattern.count });
  }

  /**
   * Get validation statistics
   * @returns {Object} Validation statistics
   */
  getValidationStats() {
    const total = this.validationHistory.length;
    if (total === 0) {
      return {
        totalValidations: 0,
        averageConfidenceReduction: 0,
        averageChecksPassed: 0,
      };
    }

    const avgConfidenceReduction = this.validationHistory.reduce((sum, v) => {
      return sum + (v.originalConfidence - v.adjustedConfidence);
    }, 0) / total;

    const avgChecksPassed = this.validationHistory.reduce((sum, v) => {
      return sum + (v.passedChecks / v.validationChecks);
    }, 0) / total;

    return {
      totalValidations: total,
      averageConfidenceReduction: avgConfidenceReduction.toFixed(3),
      averageChecksPassed: (avgChecksPassed * 100).toFixed(1) + '%',
      falsePositivePatterns: this.falsePositivePatterns.size,
    };
  }
}

// Export singleton instance
export default new SignalValidation();
