/**
 * Intelligent Triage Gate System
 * 10-second "Wait-and-See" countdown on Lieutenant's dashboard
 * Allows supervisor to veto backup if situation appears stabilized
 */

const logger = require('../utils/logger');
const deEscalationReferee = require('./deEscalationReferee');

class IntelligentTriageGate {
  constructor() {
    this.activeCountdowns = new Map(); // officerName -> countdown data
    this.countdownDuration = 10000; // 10 seconds in milliseconds
  }

  /**
   * Initiate triage gate countdown
   * @param {string} officerName - Officer name
   * @param {Object} threatData - Threat detection data
   * @param {Object} dispatchPayload - Proposed dispatch payload
   * @returns {Object} Countdown initiation result
   */
  initiateCountdown(officerName, threatData, dispatchPayload) {
    // Check if countdown already active
    if (this.activeCountdowns.has(officerName)) {
      logger.warn('Triage countdown already active', { officerName });
      return {
        initiated: false,
        reason: 'Countdown already active',
        countdown: this.activeCountdowns.get(officerName),
      };
    }

    const countdownId = `triage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const endTime = startTime + this.countdownDuration;

    const countdown = {
      id: countdownId,
      officerName,
      threatData,
      dispatchPayload,
      startTime,
      endTime,
      remaining: this.countdownDuration,
      vetoed: false,
      dispatched: false,
      status: 'active',
    };

    this.activeCountdowns.set(officerName, countdown);

    logger.info('Triage gate countdown initiated', {
      officerName,
      countdownId,
      duration: this.countdownDuration,
    });

    return {
      initiated: true,
      countdownId,
      countdown,
      message: '10-second countdown started - supervisor can veto',
    };
  }

  /**
   * Veto the dispatch (supervisor override)
   * @param {string} officerName - Officer name
   * @param {string} supervisorId - Supervisor ID
   * @param {string} reason - Reason for veto
   * @returns {Object} Veto result
   */
  vetoDispatch(officerName, supervisorId, reason = '') {
    const countdown = this.activeCountdowns.get(officerName);

    if (!countdown) {
      return {
        vetoed: false,
        reason: 'No active countdown found',
      };
    }

    if (countdown.vetoed || countdown.dispatched) {
      return {
        vetoed: false,
        reason: countdown.vetoed ? 'Already vetoed' : 'Already dispatched',
      };
    }

    countdown.vetoed = true;
    countdown.status = 'vetoed';
    countdown.vetoedBy = supervisorId;
    countdown.vetoReason = reason;
    countdown.vetoedAt = new Date().toISOString();

    // Clear countdown
    this.activeCountdowns.delete(officerName);

    logger.info('Dispatch vetoed by supervisor', {
      officerName,
      supervisorId,
      reason,
      countdownId: countdown.id,
    });

    return {
      vetoed: true,
      countdown,
      message: 'Dispatch vetoed - backup cancelled',
    };
  }

  /**
   * Check if countdown should proceed to dispatch
   * @param {string} officerName - Officer name
   * @param {Object} detectionResults - Current detection results
   * @param {Object} telemetryState - Telemetry state
   * @param {Object} audioTranscripts - Audio transcripts
   * @returns {Object} Check result
   */
  async checkCountdownStatus(officerName, detectionResults, telemetryState, audioTranscripts) {
    const countdown = this.activeCountdowns.get(officerName);

    if (!countdown) {
      return {
        active: false,
        shouldDispatch: false,
      };
    }

    // Check if countdown expired
    const now = Date.now();
    const remaining = Math.max(0, countdown.endTime - now);
    countdown.remaining = remaining;

    // Check de-escalation status
    const deEscalation = await deEscalationReferee.checkStabilization(
      officerName,
      detectionResults,
      telemetryState,
      audioTranscripts
    );

    // If de-escalating, auto-veto
    if (deEscalation.stabilizing) {
      logger.info('Auto-veto: Situation stabilizing', { officerName });
      countdown.vetoed = true;
      countdown.status = 'auto_vetoed';
      countdown.autoVetoReason = 'Situation stabilizing';
      this.activeCountdowns.delete(officerName);

      return {
        active: false,
        shouldDispatch: false,
        autoVetoed: true,
        reason: 'Situation stabilizing',
      };
    }

    // If countdown expired and not vetoed, proceed to dispatch
    if (remaining === 0 && !countdown.vetoed) {
      countdown.dispatched = true;
      countdown.status = 'dispatched';
      this.activeCountdowns.delete(officerName);

      return {
        active: false,
        shouldDispatch: true,
        countdown,
      };
    }

    return {
      active: true,
      shouldDispatch: false,
      remaining,
      countdown,
    };
  }

  /**
   * Get active countdowns
   */
  getActiveCountdowns() {
    return Array.from(this.activeCountdowns.values());
  }

  /**
   * Get countdown for officer
   */
  getCountdown(officerName) {
    return this.activeCountdowns.get(officerName) || null;
  }

  /**
   * Cancel countdown
   */
  cancelCountdown(officerName) {
    const countdown = this.activeCountdowns.get(officerName);
    if (countdown) {
      this.activeCountdowns.delete(officerName);
      return {
        cancelled: true,
        countdown,
      };
    }
    return {
      cancelled: false,
      reason: 'No active countdown',
    };
  }
}

module.exports = new IntelligentTriageGate();
