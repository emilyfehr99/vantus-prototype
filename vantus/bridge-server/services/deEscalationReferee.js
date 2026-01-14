/**
 * De-escalation Referee System
 * Detects situation stabilization and halts auto-dispatch countdown
 * Prevents "swarming" scene with unnecessary units
 */

const logger = require('../utils/logger');
const enhancedAudioAnalysis = require('./enhancedAudioAnalysis');

class DeEscalationReferee {
  constructor() {
    this.stabilizationHistory = [];
    this.activeDispatchCountdowns = new Map(); // officerName -> countdown info
  }

  /**
   * Monitor situation and detect stabilization
   * @param {string} officerName - Officer name
   * @param {Object} detectionResults - Current detection results
   * @param {Object} telemetryState - Telemetry state
   * @param {Object} audioTranscripts - Recent audio transcripts
   * @returns {Object} Stabilization check result
   */
  async checkStabilization(officerName, detectionResults, telemetryState, audioTranscripts = []) {
    try {
      // 1. Check suspect compliance
      const compliance = this.checkSuspectCompliance(audioTranscripts, detectionResults);
      
      // 2. Check officer control signals
      const controlSignals = this.checkOfficerControlSignals(audioTranscripts, detectionResults);
      
      // 3. Check threat reduction
      const threatReduction = this.checkThreatReduction(detectionResults, telemetryState);
      
      // 4. Determine if situation is stabilizing
      const isStabilizing = compliance.compliant || controlSignals.underControl || threatReduction.reduced;

      const result = {
        stabilizing: isStabilizing,
        compliance,
        controlSignals,
        threatReduction,
        timestamp: new Date().toISOString(),
        shouldHaltDispatch: isStabilizing,
      };

      // If stabilizing, halt any active dispatch countdowns
      if (isStabilizing && this.activeDispatchCountdowns.has(officerName)) {
        this.haltDispatchCountdown(officerName, result);
      }

      // Store history
      this.stabilizationHistory.push({
        officerName,
        ...result,
      });

      if (this.stabilizationHistory.length > 1000) {
        this.stabilizationHistory.shift();
      }

      return result;
    } catch (error) {
      logger.error('De-escalation referee error', error);
      return {
        stabilizing: false,
        shouldHaltDispatch: false,
        error: error.message,
      };
    }
  }

  /**
   * Check suspect compliance
   */
  checkSuspectCompliance(audioTranscripts, detectionResults) {
    const recentTranscripts = audioTranscripts.slice(-10); // Last 10 transcripts
    
    // Compliance indicators
    const complianceKeywords = [
      'yes sir', 'okay', 'understood', 'i understand', 'i will',
      'hands up', 'hands behind', 'on the ground', 'compliant',
      'cooperating', 'i surrender',
    ];

    const hasComplianceKeywords = recentTranscripts.some(transcript => {
      const lower = transcript.toLowerCase();
      return complianceKeywords.some(keyword => lower.includes(keyword));
    });

    // Check if hands are visible (compliance indicator)
    const handsVisible = detectionResults?.detections?.hands?.detected &&
                         detectionResults.detections.hands.pattern !== 'hands_hidden';

    // Check if stance is non-threatening
    const nonThreateningStance = !detectionResults?.detections?.stance?.detected ||
                                  detectionResults.detections.stance.stanceType !== 'fighting_stance';

    const compliant = hasComplianceKeywords && handsVisible && nonThreateningStance;

    return {
      compliant,
      indicators: {
        complianceKeywords: hasComplianceKeywords,
        handsVisible,
        nonThreateningStance,
      },
      confidence: compliant ? 0.80 : 0,
    };
  }

  /**
   * Check officer control signals
   */
  checkOfficerControlSignals(audioTranscripts, detectionResults) {
    const recentTranscripts = audioTranscripts.slice(-10);
    
    // Officer control indicators
    const controlKeywords = [
      'under control', 'situation secure', 'all clear', 'suspect in custody',
      'compliant', 'cooperating', 'no threat', 'stand down',
    ];

    const hasControlKeywords = recentTranscripts.some(transcript => {
      const lower = transcript.toLowerCase();
      return controlKeywords.some(keyword => lower.includes(keyword));
    });

    // Check if no active threats detected
    const noActiveThreats = !detectionResults?.detections?.weapon?.detected &&
                           (!detectionResults?.detections?.stance?.detected ||
                            detectionResults.detections.stance.stanceType !== 'fighting_stance');

    const underControl = hasControlKeywords && noActiveThreats;

    return {
      underControl,
      indicators: {
        controlKeywords: hasControlKeywords,
        noActiveThreats,
      },
      confidence: underControl ? 0.85 : 0,
    };
  }

  /**
   * Check threat reduction
   */
  checkThreatReduction(detectionResults, telemetryState) {
    // Check if threats have decreased over time
    // Compare current detections to recent history
    
    const currentThreats = this.countThreats(detectionResults);
    
    // Get recent threat history (would be stored in telemetry state)
    const recentThreatHistory = telemetryState?.threatHistory || [];
    const avgRecentThreats = recentThreatHistory.length > 0
      ? recentThreatHistory.reduce((sum, t) => sum + t.count, 0) / recentThreatHistory.length
      : 0;

    // Threat reduced if current threats < average recent threats
    const reduced = currentThreats < avgRecentThreats && currentThreats === 0;

    // Check heart rate returning to baseline (threat reduction indicator)
    const baselineHR = telemetryState?.calibrationData?.heartRateBaseline;
    const currentHR = telemetryState?.currentHeartRate;
    const hrReturning = baselineHR && currentHR && 
                        Math.abs(currentHR - baselineHR) / baselineHR < 0.20; // Within 20% of baseline

    return {
      reduced: reduced || hrReturning,
      indicators: {
        threatCount: currentThreats,
        avgRecentThreats,
        hrReturning,
      },
      confidence: (reduced || hrReturning) ? 0.75 : 0,
    };
  }

  /**
   * Count current threats
   */
  countThreats(detectionResults) {
    let count = 0;
    
    if (detectionResults?.detections?.weapon?.detected) count++;
    if (detectionResults?.detections?.stance?.detected && 
        detectionResults.detections.stance.stanceType === 'fighting_stance') count++;
    if (detectionResults?.detections?.hands?.detected &&
        detectionResults.detections.hands.pattern === 'waistband_reach') count++;

    return count;
  }

  /**
   * Halt dispatch countdown
   */
  haltDispatchCountdown(officerName, stabilizationResult) {
    const countdown = this.activeDispatchCountdowns.get(officerName);
    
    if (countdown) {
      logger.info('Auto-dispatch countdown halted - situation stabilizing', {
        officerName,
        reason: 'De-escalation detected',
        stabilizationResult,
      });

      // Clear countdown
      this.activeDispatchCountdowns.delete(officerName);

      return {
        halted: true,
        reason: 'Situation stabilizing',
        stabilizationResult,
      };
    }

    return { halted: false, reason: 'No active countdown' };
  }

  /**
   * Register active dispatch countdown
   */
  registerDispatchCountdown(officerName, countdownInfo) {
    this.activeDispatchCountdowns.set(officerName, {
      ...countdownInfo,
      registeredAt: new Date().toISOString(),
    });
  }

  /**
   * Get stabilization statistics
   */
  getStats() {
    const totalChecks = this.stabilizationHistory.length;
    const stabilizingCount = this.stabilizationHistory.filter(s => s.stabilizing).length;

    return {
      totalChecks,
      stabilizingCount,
      stabilizationRate: totalChecks > 0 ? (stabilizingCount / totalChecks) * 100 : 0,
      activeCountdowns: this.activeDispatchCountdowns.size,
    };
  }
}

module.exports = new DeEscalationReferee();
