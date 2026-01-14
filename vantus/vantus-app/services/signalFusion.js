/**
 * SIGNAL FUSION SERVICE
 * Combines signals from multiple modalities to improve accuracy
 * Reduces false positives through cross-validation
 * Maintains non-diagnostic approach
 */

import logger from '../utils/logger';

class SignalFusion {
  constructor() {
    this.fusionHistory = [];
    this.correlationMatrix = new Map(); // Track signal correlations
  }

  /**
   * Fuse multiple signals into unified insights
   * @param {Array<Object>} signals - Array of signals from different modalities
   * @param {Object} context - Operational context
   * @returns {Array<Object>} Fused signals with improved accuracy
   */
  fuseSignals(signals, context = {}) {
    if (!signals || signals.length === 0) {
      return [];
    }

    // Group signals by category and time window
    const groupedSignals = this.groupSignalsByCategory(signals);
    
    // Fuse related signals
    const fusedSignals = [];
    
    // 1. Fuse movement-related signals
    const movementSignals = this.fuseMovementSignals(
      groupedSignals.movement || [],
      context
    );
    fusedSignals.push(...movementSignals);

    // 2. Fuse audio-related signals
    const audioSignals = this.fuseAudioSignals(
      groupedSignals.audio || [],
      context
    );
    fusedSignals.push(...audioSignals);

    // 3. Fuse multi-modal signals (movement + audio + biometric)
    const multiModalSignals = this.fuseMultiModalSignals(
      groupedSignals,
      context
    );
    fusedSignals.push(...multiModalSignals);

    // Store fusion history
    this.fusionHistory.push({
      timestamp: new Date().toISOString(),
      inputSignals: signals.length,
      fusedSignals: fusedSignals.length,
      context,
    });

    // Limit history size
    if (this.fusionHistory.length > 1000) {
      this.fusionHistory.shift();
    }

    return fusedSignals;
  }

  /**
   * Group signals by category
   * @param {Array<Object>} signals - Array of signals
   * @returns {Object} Grouped signals
   */
  groupSignalsByCategory(signals) {
    const grouped = {
      movement: [],
      audio: [],
      biometric: [],
      visual: [],
      contextual: [],
    };

    signals.forEach(signal => {
      const category = this.getSignalCategory(signal);
      if (grouped[category]) {
        grouped[category].push(signal);
      }
    });

    return grouped;
  }

  /**
   * Get signal category
   * @param {Object} signal - Signal object
   * @returns {string} Signal category
   */
  getSignalCategory(signal) {
    const category = signal.signalCategory || signal.category || '';
    
    if (category.includes('movement') || category.includes('stop') || category.includes('pacing')) {
      return 'movement';
    }
    if (category.includes('audio') || category.includes('speech') || category.includes('vocal')) {
      return 'audio';
    }
    if (category.includes('biometric') || category.includes('heart')) {
      return 'biometric';
    }
    if (category.includes('weapon') || category.includes('stance') || category.includes('hands')) {
      return 'visual';
    }
    return 'contextual';
  }

  /**
   * Fuse movement-related signals
   * @param {Array<Object>} signals - Movement signals
   * @param {Object} context - Operational context
   * @returns {Array<Object>} Fused movement signals
   */
  fuseMovementSignals(signals, context) {
    if (signals.length === 0) return [];
    if (signals.length === 1) return signals;

    // Check for correlated movement patterns
    const correlated = this.findCorrelatedSignals(signals, 'movement');
    
    if (correlated.length > 1) {
      // Fuse correlated signals
      return [this.createFusedSignal(correlated, 'movement_fusion', context)];
    }

    return signals;
  }

  /**
   * Fuse audio-related signals
   * @param {Array<Object>} signals - Audio signals
   * @param {Object} context - Operational context
   * @returns {Array<Object>} Fused audio signals
   */
  fuseAudioSignals(signals, context) {
    if (signals.length === 0) return [];
    if (signals.length === 1) return signals;

    // Check for correlated audio patterns
    const correlated = this.findCorrelatedSignals(signals, 'audio');
    
    if (correlated.length > 1) {
      // Fuse correlated signals
      return [this.createFusedSignal(correlated, 'audio_fusion', context)];
    }

    return signals;
  }

  /**
   * Fuse multi-modal signals (movement + audio + biometric)
   * @param {Object} groupedSignals - Grouped signals by category
   * @param {Object} context - Operational context
   * @returns {Array<Object>} Fused multi-modal signals
   */
  fuseMultiModalSignals(groupedSignals, context) {
    const fused = [];
    
    // Look for patterns across modalities
    const movementSignals = groupedSignals.movement || [];
    const audioSignals = groupedSignals.audio || [];
    const biometricSignals = groupedSignals.biometric || [];
    const visualSignals = groupedSignals.visual || [];

    // Check for multi-modal patterns within time window (30 seconds)
    const timeWindow = 30000; // 30 seconds in milliseconds
    
    // Movement + Audio correlation
    if (movementSignals.length > 0 && audioSignals.length > 0) {
      const correlated = this.findTemporalCorrelation(
        movementSignals,
        audioSignals,
        timeWindow
      );
      
      if (correlated.length > 0) {
        fused.push(this.createMultiModalFusedSignal(
          correlated,
          'movement_audio_fusion',
          context
        ));
      }
    }

    // Movement + Biometric correlation
    if (movementSignals.length > 0 && biometricSignals.length > 0) {
      const correlated = this.findTemporalCorrelation(
        movementSignals,
        biometricSignals,
        timeWindow
      );
      
      if (correlated.length > 0) {
        fused.push(this.createMultiModalFusedSignal(
          correlated,
          'movement_biometric_fusion',
          context
        ));
      }
    }

    // Audio + Biometric correlation
    if (audioSignals.length > 0 && biometricSignals.length > 0) {
      const correlated = this.findTemporalCorrelation(
        audioSignals,
        biometricSignals,
        timeWindow
      );
      
      if (correlated.length > 0) {
        fused.push(this.createMultiModalFusedSignal(
          correlated,
          'audio_biometric_fusion',
          context
        ));
      }
    }

    // Visual + Movement correlation (weapon detected + movement anomaly)
    if (visualSignals.length > 0 && movementSignals.length > 0) {
      const correlated = this.findTemporalCorrelation(
        visualSignals,
        movementSignals,
        timeWindow
      );
      
      if (correlated.length > 0) {
        fused.push(this.createMultiModalFusedSignal(
          correlated,
          'visual_movement_fusion',
          context
        ));
      }
    }

    return fused;
  }

  /**
   * Find correlated signals within same category
   * @param {Array<Object>} signals - Signals to check
   * @param {string} category - Signal category
   * @returns {Array<Object>} Correlated signals
   */
  findCorrelatedSignals(signals, category) {
    if (signals.length < 2) return [];

    const correlated = [];
    const timeWindow = 10000; // 10 seconds

    for (let i = 0; i < signals.length; i++) {
      const signal1 = signals[i];
      const time1 = new Date(signal1.timestamp).getTime();
      
      const group = [signal1];
      
      for (let j = i + 1; j < signals.length; j++) {
        const signal2 = signals[j];
        const time2 = new Date(signal2.timestamp).getTime();
        
        if (Math.abs(time1 - time2) <= timeWindow) {
          group.push(signal2);
        }
      }
      
      if (group.length > 1) {
        correlated.push(...group);
      }
    }

    return correlated;
  }

  /**
   * Find temporal correlation between two signal arrays
   * @param {Array<Object>} signals1 - First signal array
   * @param {Array<Object>} signals2 - Second signal array
   * @param {number} timeWindow - Time window in milliseconds
   * @returns {Array<Object>} Correlated signals
   */
  findTemporalCorrelation(signals1, signals2, timeWindow) {
    const correlated = [];

    signals1.forEach(s1 => {
      const time1 = new Date(s1.timestamp).getTime();
      
      signals2.forEach(s2 => {
        const time2 = new Date(s2.timestamp).getTime();
        
        if (Math.abs(time1 - time2) <= timeWindow) {
          correlated.push(s1, s2);
        }
      });
    });

    return correlated;
  }

  /**
   * Create fused signal from correlated signals
   * @param {Array<Object>} signals - Signals to fuse
   * @param {string} fusionType - Type of fusion
   * @param {Object} context - Operational context
   * @returns {Object} Fused signal
   */
  createFusedSignal(signals, fusionType, context) {
    // Calculate weighted average confidence
    const totalWeight = signals.reduce((sum, s) => sum + (s.probability || s.confidence || 0), 0);
    const avgConfidence = totalWeight / signals.length;
    
    // Boost confidence when multiple signals agree
    const agreementBoost = this.calculateAgreementBoost(signals);
    const fusedConfidence = Math.min(0.95, avgConfidence * (1 + agreementBoost));

    // Combine indicators
    const allIndicators = signals.flatMap(s => s.indicators || []);
    const uniqueIndicators = [...new Set(allIndicators)];

    // Combine explanations
    const explanations = signals.map(s => s.explanation?.summary || '').filter(Boolean);

    return {
      signalType: 'fused_signal',
      signalCategory: fusionType,
      probability: fusedConfidence,
      timestamp: new Date().toISOString(),
      sourceSignals: signals.map(s => ({
        category: s.signalCategory || s.category,
        probability: s.probability || s.confidence,
        timestamp: s.timestamp,
      })),
      indicators: uniqueIndicators,
      explanation: {
        summary: `Multiple ${fusionType} signals detected simultaneously. ${explanations.join(' ')}`,
        method: 'Multi-signal fusion with agreement boost',
        sourceCount: signals.length,
        agreementBoost: agreementBoost.toFixed(2),
        limitations: [
          'Fused signal represents pattern correlation, not threat assessment',
          'Confidence boost based on signal agreement',
          'Requires multiple independent signal sources',
        ],
      },
      traceability: {
        dataSources: signals.flatMap(s => s.traceability?.dataSources || []),
        calculationVersion: 'fusion_v1.0',
        algorithm: 'multi_signal_fusion',
        sourceSignals: signals.length,
      },
      context: context,
    };
  }

  /**
   * Create multi-modal fused signal
   * @param {Array<Object>} signals - Signals from different modalities
   * @param {string} fusionType - Type of fusion
   * @param {Object} context - Operational context
   * @returns {Object} Fused multi-modal signal
   */
  createMultiModalFusedSignal(signals, fusionType, context) {
    const fused = this.createFusedSignal(signals, fusionType, context);
    
    // Additional boost for multi-modal agreement
    const multiModalBoost = 0.1; // 10% boost for multi-modal
    fused.probability = Math.min(0.95, fused.probability + multiModalBoost);
    
    fused.explanation.summary = `Multi-modal pattern detected: ${fusionType.replace('_', ' and ')}. ${fused.explanation.summary}`;
    fused.explanation.multiModalBoost = multiModalBoost;
    
    return fused;
  }

  /**
   * Calculate agreement boost based on signal agreement
   * @param {Array<Object>} signals - Signals to check
   * @returns {number} Agreement boost factor (0-0.2)
   */
  calculateAgreementBoost(signals) {
    if (signals.length < 2) return 0;

    // Calculate variance in confidence scores
    const confidences = signals.map(s => s.probability || s.confidence || 0);
    const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = higher agreement = higher boost
    // Boost ranges from 0 to 0.2 (20%)
    const boost = Math.max(0, 0.2 - (stdDev * 2));
    
    return boost;
  }

  /**
   * Validate signal consistency
   * @param {Object} signal - Signal to validate
   * @param {Array<Object>} otherSignals - Other signals for context
   * @returns {boolean} True if signal is consistent
   */
  validateSignalConsistency(signal, otherSignals) {
    // Check if signal makes sense in context
    const context = signal.context || {};
    
    // Check temporal consistency (signal should persist or be recent)
    const signalTime = new Date(signal.timestamp).getTime();
    const now = Date.now();
    const age = now - signalTime;
    
    // Signal should be recent (within last 5 minutes)
    if (age > 300000) { // 5 minutes
      return false;
    }

    // Check if signal conflicts with other signals
    const conflicting = otherSignals.find(s => {
      // Check for logical conflicts
      if (signal.signalCategory?.includes('movement') && 
          s.signalCategory?.includes('stationary')) {
        return true;
      }
      return false;
    });

    return !conflicting;
  }

  /**
   * Get fusion statistics
   * @returns {Object} Fusion statistics
   */
  getFusionStats() {
    return {
      totalFusions: this.fusionHistory.length,
      averageInputSignals: this.fusionHistory.reduce((sum, f) => sum + f.inputSignals, 0) / Math.max(1, this.fusionHistory.length),
      averageFusedSignals: this.fusionHistory.reduce((sum, f) => sum + f.fusedSignals, 0) / Math.max(1, this.fusionHistory.length),
      reductionRate: this.fusionHistory.length > 0 
        ? (1 - (this.fusionHistory.reduce((sum, f) => sum + f.fusedSignals, 0) / this.fusionHistory.reduce((sum, f) => sum + f.inputSignals, 0))) * 100
        : 0,
    };
  }
}

// Export singleton instance
export default new SignalFusion();
