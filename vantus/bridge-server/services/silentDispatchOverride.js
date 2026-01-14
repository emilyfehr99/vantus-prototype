/**
 * Silent Dispatch Override System
 * Automates Priority 1 request with live GPS only when:
 * - Situational thresholds are crossed
 * - AND not de-escalated
 */

const logger = require('../utils/logger');
const intelligentTriageGate = require('./intelligentTriageGate');
const deEscalationReferee = require('./deEscalationReferee');
const cadService = require('./cadService');

class SilentDispatchOverride {
  constructor() {
    this.dispatchHistory = [];
    this.thresholdCrossed = new Map(); // officerName -> threshold data
  }

  /**
   * Check if dispatch should proceed (thresholds crossed AND not de-escalated)
   * @param {string} officerName - Officer name
   * @param {Object} threatData - Threat detection data
   * @param {Object} detectionResults - Detection results
   * @param {Object} telemetryState - Telemetry state
   * @param {Object} audioTranscripts - Audio transcripts
   * @returns {Promise<Object>} Dispatch decision
   */
  async shouldDispatch(officerName, threatData, detectionResults, telemetryState, audioTranscripts = []) {
    try {
      // 1. Check if thresholds are crossed
      const thresholdsCrossed = this.checkThresholds(threatData, detectionResults, telemetryState);

      if (!thresholdsCrossed.crossed) {
        return {
          shouldDispatch: false,
          reason: 'Thresholds not crossed',
          thresholds: thresholdsCrossed,
        };
      }

      // 2. Check de-escalation status
      const deEscalation = await deEscalationReferee.checkStabilization(
        officerName,
        detectionResults,
        telemetryState,
        audioTranscripts
      );

      // 3. If de-escalating, do NOT dispatch
      if (deEscalation.stabilizing) {
        logger.info('Dispatch prevented: Situation de-escalating', {
          officerName,
          deEscalation,
        });

        return {
          shouldDispatch: false,
          reason: 'Situation de-escalating',
          thresholds: thresholdsCrossed,
          deEscalation,
        };
      }

      // 4. Thresholds crossed AND not de-escalated = proceed to triage gate
      const dispatchPayload = this.createDispatchPayload(
        officerName,
        threatData,
        detectionResults,
        telemetryState
      );

      // 5. Initiate intelligent triage gate (10-second countdown)
      const triageResult = intelligentTriageGate.initiateCountdown(
        officerName,
        threatData,
        dispatchPayload
      );

      return {
        shouldDispatch: true,
        reason: 'Thresholds crossed and not de-escalated',
        thresholds: thresholdsCrossed,
        deEscalation,
        dispatchPayload,
        triageGate: triageResult,
        message: 'Triage gate initiated - 10-second countdown started',
      };
    } catch (error) {
      logger.error('Silent dispatch override error', error);
      return {
        shouldDispatch: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if thresholds are crossed
   */
  checkThresholds(threatData, detectionResults, telemetryState) {
    const thresholds = {
      weaponDetected: false,
      criticalThreat: false,
      heartRateElevated: false,
      multiModalSOS: false,
    };

    // Weapon detected with high confidence
    if (detectionResults?.detections?.weapon?.detected &&
        detectionResults.detections.weapon.confidence >= 0.85) {
      thresholds.weaponDetected = true;
    }

    // Critical threat (multiple indicators)
    const threatCount = [
      detectionResults?.detections?.weapon?.detected,
      detectionResults?.detections?.stance?.detected &&
        detectionResults.detections.stance.stanceType === 'fighting_stance',
      detectionResults?.detections?.hands?.detected &&
        detectionResults.detections.hands.pattern === 'waistband_reach',
    ].filter(Boolean).length;

    if (threatCount >= 2) {
      thresholds.criticalThreat = true;
    }

    // Heart rate elevated
    const baselineHR = telemetryState?.calibrationData?.heartRateBaseline;
    const currentHR = telemetryState?.currentHeartRate;
    if (baselineHR && currentHR && currentHR >= 160) {
      thresholds.heartRateElevated = true;
    }

    // Multi-modal SOS (would be checked separately)
    // For now, assume false unless explicitly set

    const crossed = thresholds.weaponDetected || 
                    thresholds.criticalThreat || 
                    thresholds.heartRateElevated;

    return {
      crossed,
      thresholds,
    };
  }

  /**
   * Create dispatch payload with live GPS
   */
  createDispatchPayload(officerName, threatData, detectionResults, telemetryState) {
    const location = telemetryState?.lastLocation || threatData?.location || { lat: 0, lng: 0 };

    return {
      type: 'PRIORITY_1_BACKUP',
      timestamp: new Date().toISOString(),
      officer: {
        id: officerName,
        name: null, // Would come from roster
        unit: null, // Would come from roster
      },
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || 0,
        address: null, // Would be reverse geocoded
        liveGPS: true, // Flag for live GPS tracking
      },
      situation: {
        threat_type: this.determineThreatType(detectionResults),
        confidence: this.calculateConfidence(detectionResults),
        biometric_state: this.getBiometricState(telemetryState),
        heart_rate: telemetryState?.currentHeartRate || null,
      },
      context: {
        call_type: this.getCallType(telemetryState),
        time_on_scene: this.getTimeOnScene(telemetryState),
      },
      tacticalIntent: this.getTacticalIntent(detectionResults, telemetryState),
      silentDispatch: true, // Flag for silent dispatch
    };
  }

  /**
   * Determine threat type
   */
  determineThreatType(detectionResults) {
    if (detectionResults?.detections?.weapon?.detected) {
      return 'WEAPON_DETECTED';
    }
    if (detectionResults?.detections?.stance?.detected &&
        detectionResults.detections.stance.stanceType === 'fighting_stance') {
      return 'FIGHTING_STANCE';
    }
    return 'THREAT_DETECTED';
  }

  /**
   * Calculate overall confidence
   */
  calculateConfidence(detectionResults) {
    const confidences = [];
    
    if (detectionResults?.detections?.weapon?.confidence) {
      confidences.push(detectionResults.detections.weapon.confidence);
    }
    if (detectionResults?.detections?.stance?.confidence) {
      confidences.push(detectionResults.detections.stance.confidence);
    }
    if (detectionResults?.detections?.hands?.confidence) {
      confidences.push(detectionResults.detections.hands.confidence);
    }

    if (confidences.length === 0) return 0.75; // Default

    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }

  /**
   * Get biometric state
   */
  getBiometricState(telemetryState) {
    const baselineHR = telemetryState?.calibrationData?.heartRateBaseline;
    const currentHR = telemetryState?.currentHeartRate;

    if (!baselineHR || !currentHR) return 'NORMAL';

    const increase = (currentHR - baselineHR) / baselineHR;
    if (currentHR >= 160) return 'CRITICAL';
    if (increase > 0.40) return 'ELEVATED';
    return 'NORMAL';
  }

  /**
   * Get call type
   */
  getCallType(telemetryState) {
    const activeMarkers = telemetryState?.markerEvents?.filter(m => {
      const markerTime = new Date(m.timestamp);
      const now = new Date();
      return (now - markerTime) / 1000 < 3600; // Active within last hour
    }) || [];

    if (activeMarkers.length > 0) {
      return activeMarkers[activeMarkers.length - 1].eventType.toUpperCase();
    }
    return 'ROUTINE';
  }

  /**
   * Get time on scene
   */
  getTimeOnScene(telemetryState) {
    const activeMarkers = telemetryState?.markerEvents || [];
    if (activeMarkers.length > 0) {
      const firstMarker = activeMarkers[0];
      return Math.floor((Date.now() - new Date(firstMarker.timestamp).getTime()) / 1000);
    }
    return 0;
  }

  /**
   * Get tactical intent metadata
   */
  getTacticalIntent(detectionResults, telemetryState) {
    return {
      weaponDetected: detectionResults?.detections?.weapon?.detected || false,
      fightingStance: detectionResults?.detections?.stance?.detected &&
                       detectionResults.detections.stance.stanceType === 'fighting_stance',
      handsHidden: detectionResults?.detections?.hands?.detected &&
                   detectionResults.detections.hands.pattern === 'hands_hidden',
      heartRateElevated: this.getBiometricState(telemetryState) !== 'NORMAL',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute dispatch after triage gate
   */
  async executeDispatch(officerName, dispatchPayload) {
    try {
      // Send to CAD system
      if (cadService.isEnabled()) {
        const cadResult = await cadService.dispatchBackup(dispatchPayload);
        
        this.dispatchHistory.push({
          officerName,
          dispatchPayload,
          cadResult,
          timestamp: new Date().toISOString(),
        });

        logger.info('Silent dispatch executed', {
          officerName,
          cadResult,
        });

        return {
          dispatched: true,
          cadResult,
          dispatchPayload,
        };
      } else {
        logger.warn('CAD service not enabled - dispatch not sent', { officerName });
        return {
          dispatched: false,
          reason: 'CAD service not enabled',
          dispatchPayload,
        };
      }
    } catch (error) {
      logger.error('Silent dispatch execution error', error);
      return {
        dispatched: false,
        error: error.message,
      };
    }
  }

  /**
   * Get dispatch history
   */
  getDispatchHistory(officerName = null) {
    if (officerName) {
      return this.dispatchHistory.filter(d => d.officerName === officerName);
    }
    return this.dispatchHistory;
  }
}

module.exports = new SilentDispatchOverride();
