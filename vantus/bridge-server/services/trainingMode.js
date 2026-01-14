/**
 * Training Mode Service
 * Allows officers to practice with system in training scenarios
 */

const logger = require('../utils/logger');
const EventEmitter = require('events');

class TrainingMode extends EventEmitter {
  constructor() {
    super();
    this.activeSessions = new Map(); // officerName -> session
    this.scenarios = new Map();
  }

  /**
   * Start training session
   * @param {string} officerName - Officer name
   * @param {string} scenarioId - Scenario ID
   * @returns {Object} Training session
   */
  startTrainingSession(officerName, scenarioId) {
    const session = {
      id: `training_${Date.now()}`,
      officerName,
      scenarioId,
      startTime: new Date().toISOString(),
      signals: [],
      status: 'active',
    };

    this.activeSessions.set(officerName, session);
    this.emit('sessionStarted', session);
    
    logger.info('Training session started', { officerName, scenarioId });
    
    return session;
  }

  /**
   * End training session
   * @param {string} officerName - Officer name
   * @returns {Object} Session summary
   */
  endTrainingSession(officerName) {
    const session = this.activeSessions.get(officerName);
    if (!session) {
      return null;
    }

    session.endTime = new Date().toISOString();
    session.status = 'completed';
    
    const summary = {
      sessionId: session.id,
      duration: new Date(session.endTime) - new Date(session.startTime),
      signalCount: session.signals.length,
      signals: session.signals,
    };

    this.activeSessions.delete(officerName);
    this.emit('sessionEnded', summary);
    
    logger.info('Training session ended', { officerName, summary });
    
    return summary;
  }

  /**
   * Add signal to training session
   */
  addTrainingSignal(officerName, signal) {
    const session = this.activeSessions.get(officerName);
    if (!session) return;

    session.signals.push({
      ...signal,
      training: true,
      timestamp: new Date().toISOString(),
    });

    this.emit('signalAdded', { officerName, signal });
  }

  /**
   * Check if officer is in training mode
   */
  isTrainingMode(officerName) {
    return this.activeSessions.has(officerName);
  }

  /**
   * Register training scenario
   */
  registerScenario(scenarioId, scenario) {
    this.scenarios.set(scenarioId, scenario);
    logger.info('Training scenario registered', { scenarioId });
  }

  /**
   * Get training scenario
   */
  getScenario(scenarioId) {
    return this.scenarios.get(scenarioId);
  }
}

module.exports = new TrainingMode();
