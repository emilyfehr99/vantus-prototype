/**
 * Signal Persistence System
 * Requires signals to persist over time before sending
 * Reduces false positives from transient patterns
 */

const logger = require('../utils/logger');

class SignalPersistence {
  constructor() {
    this.signalBuffer = new Map(); // officerName -> signal history
    this.persistenceRequirements = {
      weapon: { duration: 5000, count: 2 }, // 5 seconds, 2 detections
      stance: { duration: 3000, count: 2 }, // 3 seconds, 2 detections
      hands: { duration: 3000, count: 2 },
      crowd: { duration: 10000, count: 3 }, // 10 seconds, 3 detections
      vehicle: { duration: 5000, count: 2 },
      movement_pattern_anomaly: { duration: 10000, count: 2 },
      vocal_stress_proxy: { duration: 15000, count: 3 }, // 15 seconds, 3 detections
    };
  }

  /**
   * Check if signal should be sent (has persisted)
   * @param {string} officerName - Officer name
   * @param {Object} signal - Signal to check
   * @returns {Object} Persistence check result
   */
  checkPersistence(officerName, signal) {
    const signalType = signal.signalCategory || signal.category || 'unknown';
    const requirement = this.persistenceRequirements[signalType] || { duration: 5000, count: 2 };

    // Get signal history for officer
    if (!this.signalBuffer.has(officerName)) {
      this.signalBuffer.set(officerName, []);
    }

    const history = this.signalBuffer.get(officerName);
    
    // Add current signal to buffer
    history.push({
      ...signal,
      timestamp: signal.timestamp || new Date().toISOString(),
    });

    // Clean old signals (older than requirement duration)
    const now = Date.now();
    const cutoff = now - requirement.duration;
    const recentSignals = history.filter(s => {
      const signalTime = new Date(s.timestamp).getTime();
      return signalTime >= cutoff;
    });

    // Update history
    this.signalBuffer.set(officerName, recentSignals);

    // Check if requirement is met
    const similarSignals = recentSignals.filter(s => {
      const sType = s.signalCategory || s.category || 'unknown';
      return sType === signalType;
    });

    const hasPersisted = similarSignals.length >= requirement.count;

    return {
      persisted: hasPersisted,
      currentCount: similarSignals.length,
      requiredCount: requirement.count,
      duration: requirement.duration,
      ready: hasPersisted,
      reason: hasPersisted
        ? `Signal persisted: ${similarSignals.length}/${requirement.count} detections in ${requirement.duration}ms`
        : `Signal not persistent: ${similarSignals.length}/${requirement.count} detections (need ${requirement.count})`,
    };
  }

  /**
   * Clear old signals from buffer
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 60000; // 1 minute

    for (const [officerName, history] of this.signalBuffer.entries()) {
      const recent = history.filter(s => {
        const signalTime = new Date(s.timestamp).getTime();
        return (now - signalTime) <= maxAge;
      });

      if (recent.length === 0) {
        this.signalBuffer.delete(officerName);
      } else {
        this.signalBuffer.set(officerName, recent);
      }
    }
  }

  /**
   * Get persistence statistics
   */
  getStats() {
    return {
      officersTracked: this.signalBuffer.size,
      totalSignalsBuffered: Array.from(this.signalBuffer.values())
        .reduce((sum, history) => sum + history.length, 0),
      requirements: this.persistenceRequirements,
    };
  }
}

module.exports = new SignalPersistence();
