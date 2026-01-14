/**
 * Real-Time Fact Anchoring System
 * Creates timestamped fact log in real-time
 * Millisecond precision for CA SB 524 compliance
 */

const logger = require('../utils/logger');

class FactAnchoring {
  constructor() {
    this.factLogs = new Map(); // officerName -> fact log array
    this.maxFactsPerOfficer = 1000;
  }

  /**
   * Anchor a fact with timestamp
   * @param {string} officerName - Officer name
   * @param {string} fact - Fact description
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Anchored fact entry
   */
  anchorFact(officerName, fact, metadata = {}) {
    const timestamp = new Date();
    const millisecondTimestamp = timestamp.toISOString();
    
    const factEntry = {
      id: this.generateFactId(),
      timestamp: millisecondTimestamp,
      timestampMs: timestamp.getTime(), // Millisecond precision
      fact,
      officerName,
      metadata,
    };

    // Add to officer's fact log
    if (!this.factLogs.has(officerName)) {
      this.factLogs.set(officerName, []);
    }

    const log = this.factLogs.get(officerName);
    log.push(factEntry);

    // Limit log size
    if (log.length > this.maxFactsPerOfficer) {
      log.shift();
    }

    logger.info('Fact anchored', {
      officerName,
      fact,
      timestamp: millisecondTimestamp,
    });

    return factEntry;
  }

  /**
   * Anchor fact from detection event
   */
  anchorDetectionFact(officerName, detection, context = {}) {
    let fact = '';
    
    if (detection.category === 'weapon' && detection.detected) {
      fact = `Weapon detected: ${detection.detections?.[0]?.class || 'weapon'}`;
    } else if (detection.category === 'stance' && detection.detected) {
      fact = `Stance detected: ${detection.stanceType || 'fighting stance'}`;
    } else if (detection.category === 'hands' && detection.detected) {
      fact = `Hand pattern detected: ${detection.pattern || 'unknown'}`;
    } else {
      fact = `${detection.category || 'Detection'} detected`;
    }

    return this.anchorFact(officerName, fact, {
      detection,
      context,
      type: 'detection',
    });
  }

  /**
   * Anchor fact from movement event
   */
  anchorMovementFact(officerName, movementEvent, context = {}) {
    let fact = '';
    
    if (movementEvent.type === 'abrupt_stop') {
      fact = 'Abrupt stop detected';
    } else if (movementEvent.type === 'pacing') {
      fact = 'Pacing pattern detected';
    } else if (movementEvent.type === 'flee') {
      fact = 'Suspect fled on foot';
    } else if (movementEvent.type === 'pursuit') {
      fact = 'Foot pursuit initiated';
    } else if (movementEvent.type === 'pursuit_end') {
      fact = 'Foot pursuit ended';
    } else {
      fact = `Movement: ${movementEvent.type || 'unknown'}`;
    }

    return this.anchorFact(officerName, fact, {
      movementEvent,
      context,
      type: 'movement',
    });
  }

  /**
   * Anchor fact from use of force event
   */
  anchorUseOfForceFact(officerName, uofEvent, context = {}) {
    const fact = `Use of force: ${uofEvent.type || 'takedown'}`;
    
    return this.anchorFact(officerName, fact, {
      uofEvent,
      context,
      type: 'use_of_force',
    });
  }

  /**
   * Anchor fact from audio/voice event
   */
  anchorVoiceFact(officerName, voiceEvent, context = {}) {
    let fact = '';
    
    if (voiceEvent.type === 'command') {
      fact = `Command issued: ${voiceEvent.command || 'unknown'}`;
    } else if (voiceEvent.type === 'keyword') {
      fact = `Keyword detected: ${voiceEvent.keyword || 'unknown'}`;
    } else if (voiceEvent.type === 'compliance') {
      fact = 'Suspect compliance detected';
    } else {
      fact = `Voice event: ${voiceEvent.type || 'unknown'}`;
    }

    return this.anchorFact(officerName, fact, {
      voiceEvent,
      context,
      type: 'voice',
    });
  }

  /**
   * Get fact log for officer
   */
  getFactLog(officerName, options = {}) {
    const log = this.factLogs.get(officerName) || [];
    
    const { startTime, endTime, limit } = options;
    
    let filtered = log;
    
    if (startTime) {
      filtered = filtered.filter(f => new Date(f.timestamp) >= new Date(startTime));
    }
    
    if (endTime) {
      filtered = filtered.filter(f => new Date(f.timestamp) <= new Date(endTime));
    }
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  /**
   * Format fact log as timeline
   */
  formatTimeline(officerName, options = {}) {
    const log = this.getFactLog(officerName, options);
    
    return log.map(fact => {
      const time = new Date(fact.timestamp);
      const timeStr = time.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3, // Milliseconds
      });
      
      return `${timeStr} - ${fact.fact}`;
    });
  }

  /**
   * Generate unique fact ID
   */
  generateFactId() {
    return `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export fact log for compliance (CA SB 524)
   */
  exportFactLog(officerName, options = {}) {
    const log = this.getFactLog(officerName, options);
    
    return {
      officerName,
      exportedAt: new Date().toISOString(),
      factCount: log.length,
      facts: log,
      format: 'CA_SB_524_COMPLIANT',
      timestampPrecision: 'millisecond',
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalFacts = Array.from(this.factLogs.values())
      .reduce((sum, log) => sum + log.length, 0);
    
    const officersWithLogs = this.factLogs.size;

    return {
      totalFacts,
      officersWithLogs,
      averageFactsPerOfficer: officersWithLogs > 0 ? totalFacts / officersWithLogs : 0,
    };
  }
}

module.exports = new FactAnchoring();
