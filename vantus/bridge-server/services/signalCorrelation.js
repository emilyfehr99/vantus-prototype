/**
 * Signal Correlation Service
 * Correlates multiple signals for richer contextual awareness
 * All analysis is non-diagnostic and provides contextual indicators only
 */

const logger = require('../utils/logger');

class SignalCorrelation {
  constructor() {
    this.signalHistory = new Map(); // officerName -> signal history
    this.correlationWindow = 60; // seconds
  }

  /**
   * Correlate multiple signals
   * @param {string} officerName - Officer name
   * @param {Array} currentSignals - Current signals
   * @param {Object} options - Options
   * @returns {Object} Correlation analysis
   */
  correlateSignals(officerName, currentSignals = [], options = {}) {
    if (!currentSignals || currentSignals.length === 0) {
      return {
        detected: false,
        category: 'signal_correlation',
        confidence: 0,
        correlatedSignals: [],
        pattern: null,
        description: 'No signals to correlate',
        model: 'local',
        source: 'local',
      };
    }

    try {
      // Get recent signal history
      const history = this.getSignalHistory(officerName);
      const recentSignals = this.getRecentSignals(history, this.correlationWindow);
      
      // Combine current and recent signals
      const allSignals = [...recentSignals, ...currentSignals];
      
      // Find correlated signals (same time window, related categories)
      const correlated = this.findCorrelatedSignals(allSignals, options);
      
      // Detect patterns
      const pattern = this.detectCorrelationPattern(correlated);
      
      // Update history
      this.updateSignalHistory(officerName, currentSignals);
      
      return {
        detected: correlated.length > 1,
        category: 'signal_correlation',
        confidence: correlated.length > 1 ? Math.min(0.8, 0.3 + correlated.length * 0.1) : 0.2,
        correlatedSignals: correlated.map(s => s.signalCategory || s.category),
        pattern,
        description: correlated.length > 1
          ? `${correlated.length} signals correlated (${pattern || 'multiple patterns'})`
          : 'No signal correlation detected',
        model: 'local',
        source: 'local',
      };
    } catch (error) {
      logger.error('Signal correlation error', error);
      return {
        detected: false,
        category: 'signal_correlation',
        confidence: 0,
        correlatedSignals: [],
        pattern: null,
        model: 'local',
        source: 'local',
        error: error.message,
      };
    }
  }

  /**
   * Find correlated signals
   */
  findCorrelatedSignals(signals, options) {
    if (signals.length < 2) return [];
    
    const correlated = [];
    const timeWindow = options.timeWindow || 30; // seconds
    
    // Group signals by time proximity
    for (let i = 0; i < signals.length; i++) {
      const signal1 = signals[i];
      const time1 = new Date(signal1.timestamp).getTime();
      
      const related = [signal1];
      
      for (let j = i + 1; j < signals.length; j++) {
        const signal2 = signals[j];
        const time2 = new Date(signal2.timestamp).getTime();
        
        const timeDiff = Math.abs(time2 - time1) / 1000; // seconds
        
        if (timeDiff <= timeWindow) {
          // Check if categories are related
          if (this.areCategoriesRelated(signal1, signal2)) {
            related.push(signal2);
          }
        }
      }
      
      if (related.length > 1) {
        correlated.push(...related);
      }
    }
    
    // Remove duplicates
    const unique = [];
    const seen = new Set();
    for (const sig of correlated) {
      const key = `${sig.timestamp}-${sig.signalCategory || sig.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(sig);
      }
    }
    
    return unique;
  }

  /**
   * Check if signal categories are related
   */
  areCategoriesRelated(signal1, signal2) {
    const cat1 = signal1.signalCategory || signal1.category || '';
    const cat2 = signal2.signalCategory || signal2.category || '';
    
    // Related categories
    const relatedGroups = [
      ['movement_pattern_anomaly', 'abrupt_stop', 'pacing_pattern'],
      ['vocal_stress_proxy', 'audio_pattern_anomaly', 'communication_pattern'],
      ['weapon', 'stance', 'hands'],
      ['crowd', 'vehicle', 'environment'],
      ['officer_proximity', 'backup_pattern', 'coordination_pattern'],
    ];
    
    for (const group of relatedGroups) {
      if (group.some(cat => cat1.includes(cat) || cat1 === cat) &&
          group.some(cat => cat2.includes(cat) || cat2 === cat)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Detect correlation pattern
   */
  detectCorrelationPattern(signals) {
    if (signals.length < 2) return null;
    
    const categories = signals.map(s => s.signalCategory || s.category || 'unknown');
    
    // Pattern detection
    if (categories.some(c => c.includes('movement')) && 
        categories.some(c => c.includes('audio'))) {
      return 'movement_audio_correlation';
    }
    
    if (categories.some(c => c.includes('weapon') || c.includes('stance')) &&
        categories.some(c => c.includes('crowd') || c.includes('vehicle'))) {
      return 'threat_environment_correlation';
    }
    
    if (categories.some(c => c.includes('officer')) &&
        categories.some(c => c.includes('backup'))) {
      return 'coordination_correlation';
    }
    
    if (categories.filter(c => c.includes('pattern_anomaly')).length >= 2) {
      return 'multiple_anomaly_correlation';
    }
    
    return 'general_correlation';
  }

  /**
   * Match current patterns to historical patterns
   * @param {string} officerName - Officer name
   * @param {Array} currentSignals - Current signals
   * @param {Object} options - Options
   * @returns {Object} Historical pattern match
   */
  matchHistoricalPatterns(officerName, currentSignals = [], options = {}) {
    if (!currentSignals || currentSignals.length === 0) {
      return {
        detected: false,
        category: 'historical_pattern_match',
        confidence: 0,
        similarPatterns: [],
        matchScore: 0,
        description: 'No signals to match',
        model: 'local',
        source: 'local',
      };
    }

    try {
      const history = this.getSignalHistory(officerName);
      const similarPatterns = this.findSimilarPatterns(currentSignals, history, options);
      
      return {
        detected: similarPatterns.length > 0,
        category: 'historical_pattern_match',
        confidence: similarPatterns.length > 0 
          ? Math.min(0.7, similarPatterns[0].matchScore || 0)
          : 0.2,
        similarPatterns: similarPatterns.slice(0, 3).map(p => ({
          timestamp: p.timestamp,
          matchScore: p.matchScore,
          categories: p.categories,
        })),
        matchScore: similarPatterns.length > 0 ? similarPatterns[0].matchScore : 0,
        description: similarPatterns.length > 0
          ? `Found ${similarPatterns.length} similar historical pattern(s) (match: ${(similarPatterns[0].matchScore * 100).toFixed(0)}%)`
          : 'No similar historical patterns found',
        model: 'local',
        source: 'local',
      };
    } catch (error) {
      logger.error('Historical pattern matching error', error);
      return {
        detected: false,
        category: 'historical_pattern_match',
        confidence: 0,
        similarPatterns: [],
        matchScore: 0,
        model: 'local',
        source: 'local',
        error: error.message,
      };
    }
  }

  /**
   * Find similar patterns in history
   */
  findSimilarPatterns(currentSignals, history, options) {
    if (history.length === 0) return [];
    
    const currentCategories = currentSignals.map(s => s.signalCategory || s.category || 'unknown').sort();
    const similar = [];
    
    // Compare to historical patterns (sliding window)
    const windowSize = currentSignals.length;
    
    for (let i = 0; i <= history.length - windowSize; i++) {
      const window = history.slice(i, i + windowSize);
      const windowCategories = window.map(s => s.signalCategory || s.category || 'unknown').sort();
      
      // Calculate similarity
      const matchScore = this.calculateCategorySimilarity(currentCategories, windowCategories);
      
      if (matchScore > (options.similarityThreshold || 0.5)) {
        similar.push({
          timestamp: window[0].timestamp,
          matchScore,
          categories: windowCategories,
        });
      }
    }
    
    // Sort by match score
    similar.sort((a, b) => b.matchScore - a.matchScore);
    
    return similar;
  }

  /**
   * Calculate category similarity
   */
  calculateCategorySimilarity(cats1, cats2) {
    if (cats1.length === 0 || cats2.length === 0) return 0;
    
    const set1 = new Set(cats1);
    const set2 = new Set(cats2);
    
    const intersection = new Set([...set1].filter(c => set2.has(c)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Get signal history for officer
   */
  getSignalHistory(officerName) {
    if (!this.signalHistory.has(officerName)) {
      this.signalHistory.set(officerName, []);
    }
    return this.signalHistory.get(officerName);
  }

  /**
   * Get recent signals
   */
  getRecentSignals(history, windowSeconds) {
    const now = new Date().getTime();
    const windowMs = windowSeconds * 1000;
    
    return history.filter(sig => {
      const sigTime = new Date(sig.timestamp).getTime();
      return (now - sigTime) <= windowMs;
    });
  }

  /**
   * Update signal history
   */
  updateSignalHistory(officerName, signals) {
    const history = this.getSignalHistory(officerName);
    history.push(...signals);
    
    // Keep last 1000 signals
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }
}

module.exports = new SignalCorrelation();
