/**
 * Temporal Analysis Service
 * Analyzes time-based patterns and trends
 * All analysis is non-diagnostic and provides contextual indicators only
 */

const logger = require('../utils/logger');

class TemporalAnalysis {
  constructor() {
    this.patternHistory = new Map(); // officerName -> pattern history
  }

  /**
   * Correlate patterns with time of day
   * @param {Array} signals - Current signals
   * @param {Object} options - Options
   * @returns {Object} Time-of-day correlation
   */
  correlateTimeOfDay(signals = [], options = {}) {
    if (!signals || signals.length === 0) {
      return {
        detected: false,
        category: 'temporal_pattern',
        confidence: 0,
        timeOfDay: null,
        typicalPattern: null,
        deviation: null,
        description: 'No signals to analyze',
        model: 'local',
        source: 'local',
      };
    }

    try {
      const now = new Date();
      const hour = now.getHours();
      const timeOfDay = this.getTimeOfDayCategory(hour);
      
      // Get typical patterns for this time of day (if available)
      const typicalPattern = this.getTypicalPattern(timeOfDay, options);
      
      // Check if current patterns deviate from typical
      const deviation = this.calculateDeviation(signals, typicalPattern);
      
      return {
        detected: deviation !== null && deviation > 0.3,
        category: 'temporal_pattern',
        confidence: deviation !== null ? Math.min(0.7, deviation) : 0.2,
        timeOfDay,
        typicalPattern,
        deviation,
        description: deviation !== null && deviation > 0.3
          ? `Patterns deviate from typical ${timeOfDay} patterns (${(deviation * 100).toFixed(0)}% deviation)`
          : `Patterns align with typical ${timeOfDay} patterns`,
        model: 'local',
        source: 'local',
      };
    } catch (error) {
      logger.error('Time-of-day correlation error', error);
      return {
        detected: false,
        category: 'temporal_pattern',
        confidence: 0,
        timeOfDay: null,
        typicalPattern: null,
        deviation: null,
        model: 'local',
        source: 'local',
        error: error.message,
      };
    }
  }

  /**
   * Analyze pattern trends over time
   * @param {string} officerName - Officer name
   * @param {Array} currentSignals - Current signals
   * @param {Object} options - Options
   * @returns {Object} Trend analysis
   */
  analyzePatternTrends(officerName, currentSignals = [], options = {}) {
    try {
      const history = this.getPatternHistory(officerName);
      
      // Update history
      this.updatePatternHistory(officerName, currentSignals);
      
      if (history.length < 10) {
        return {
          detected: false,
          category: 'pattern_trend',
          confidence: 0,
          trend: null,
          direction: null,
          timeframe: null,
          description: 'Insufficient history for trend analysis',
          model: 'local',
          source: 'local',
        };
      }
      
      // Analyze trends
      const trend = this.calculateTrend(history, options);
      
      return {
        detected: trend.direction !== 'stable',
        category: 'pattern_trend',
        confidence: trend.direction !== 'stable' ? Math.min(0.7, 0.3 + Math.abs(trend.rate)) : 0.2,
        trend: trend.direction,
        direction: trend.direction,
        timeframe: options.timeframe || 'recent',
        description: trend.direction !== 'stable'
          ? `Pattern ${trend.direction} trend detected (${(trend.rate * 100).toFixed(0)}% change)`
          : 'Pattern frequency stable',
        model: 'local',
        source: 'local',
      };
    } catch (error) {
      logger.error('Pattern trend analysis error', error);
      return {
        detected: false,
        category: 'pattern_trend',
        confidence: 0,
        trend: null,
        direction: null,
        timeframe: null,
        model: 'local',
        source: 'local',
        error: error.message,
      };
    }
  }

  /**
   * Get time of day category
   */
  getTimeOfDayCategory(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get typical pattern for time of day
   */
  getTypicalPattern(timeOfDay, options) {
    // This would typically come from historical data
    // For now, return null (would be populated from actual data)
    return options.typicalPatterns?.[timeOfDay] || null;
  }

  /**
   * Calculate deviation from typical pattern
   */
  calculateDeviation(signals, typicalPattern) {
    if (!typicalPattern) return null;
    
    const signalCategories = signals.map(s => s.signalCategory || s.category || 'unknown');
    const typicalCategories = typicalPattern.categories || [];
    
    // Simple deviation calculation
    const signalSet = new Set(signalCategories);
    const typicalSet = new Set(typicalCategories);
    
    const intersection = new Set([...signalSet].filter(c => typicalSet.has(c)));
    const union = new Set([...signalSet, ...typicalSet]);
    
    const similarity = intersection.size / union.size;
    return 1 - similarity; // Deviation = 1 - similarity
  }

  /**
   * Calculate trend from history
   */
  calculateTrend(history, options) {
    const windowSize = options.windowSize || 20;
    const recent = history.slice(-windowSize);
    const older = history.slice(-windowSize * 2, -windowSize);
    
    if (recent.length === 0 || older.length === 0) {
      return { direction: 'stable', rate: 0 };
    }
    
    const recentCount = recent.length;
    const olderCount = older.length;
    
    const rate = (recentCount - olderCount) / Math.max(olderCount, 1);
    
    let direction = 'stable';
    if (rate > 0.2) direction = 'increasing';
    else if (rate < -0.2) direction = 'decreasing';
    
    return { direction, rate };
  }

  /**
   * Get pattern history
   */
  getPatternHistory(officerName) {
    if (!this.patternHistory.has(officerName)) {
      this.patternHistory.set(officerName, []);
    }
    return this.patternHistory.get(officerName);
  }

  /**
   * Update pattern history
   */
  updatePatternHistory(officerName, signals) {
    const history = this.getPatternHistory(officerName);
    history.push({
      timestamp: new Date().toISOString(),
      signals: signals.map(s => ({
        category: s.signalCategory || s.category,
        probability: s.probability || 0,
      })),
    });
    
    // Keep last 1000 entries
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }
}

module.exports = new TemporalAnalysis();
