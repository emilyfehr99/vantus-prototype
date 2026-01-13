/**
 * Welfare Check System
 * Detects officer incapacitation and triggers emergency response
 */

import autoDispatch from './autoDispatch';
import logger from '../utils/logger';

class WelfareCheck {
  constructor() {
    this.welfareTimer = null;
    this.welfarePromptActive = false;
    this.responseReceived = false;
    this.checkInterval = null;
    this.lastCheckTime = null;
  }

  /**
   * Start welfare check timer
   * Called after CRITICAL alert resolves or ACTIVE mode >10 min
   */
  startWelfareTimer(telemetryState, officerInfo) {
    // Clear any existing timer
    this.clearWelfareTimer();

    // Show prompt after 5 seconds
    setTimeout(() => {
      this.showWelfarePrompt(telemetryState, officerInfo);
    }, 5000);

    // Start 30-second response timer (25 seconds after 5s delay)
    this.welfareTimer = setTimeout(() => {
      if (!this.responseReceived) {
        this.triggerWelfareEmergency(telemetryState, officerInfo);
      }
    }, 35000); // 35 seconds total (5s delay + 30s response window)
  }

  /**
   * Show welfare check prompt
   */
  showWelfarePrompt(telemetryState, officerInfo) {
    this.welfarePromptActive = true;
    this.responseReceived = false;

    // Log the prompt
    logger.info('WELFARE CHECK: Status check - Are you okay?');
    
    // Trigger voice prompt (if voice advisory is available)
    // Note: Voice advisory would need a welfare check prompt method
    // For now, use system message
    try {
      const voiceAdvisory = require('./voiceAdvisory').default;
      voiceAdvisory.speak("Status check: Are you okay?", 'system');
    } catch (error) {
      // Voice advisory not available
    }

    // Return prompt info for UI display
    return {
      message: "Status check: Are you okay?",
      timestamp: new Date().toISOString(),
      responseWindow: 30, // seconds
    };
  }

  /**
   * Handle welfare check response
   */
  handleResponse(responseType, telemetryState, officerInfo) {
    this.responseReceived = true;
    this.welfarePromptActive = false;
    this.clearWelfareTimer();

    switch (responseType) {
      case 'ok':
        // Officer is okay
        logger.info('Welfare check: Officer confirmed OK');
        return { status: 'ok', action: 'cleared' };

      case 'need_backup':
        // Officer needs backup (non-emergency)
        logger.info('Welfare check: Officer requested backup');
        autoDispatch.manualDispatch(null, telemetryState, officerInfo);
        return { status: 'backup_requested', action: 'dispatched' };

      case 'emergency':
        // Officer in emergency
        this.triggerWelfareEmergency(telemetryState, officerInfo);
        return { status: 'emergency', action: 'dispatched' };

      default:
        return { status: 'unknown', action: 'none' };
    }
  }

  /**
   * Handle voice response
   */
  handleVoiceResponse(transcript, telemetryState, officerInfo) {
    const lowerTranscript = transcript.toLowerCase();

    // Check for "I'm okay" variations
    if (
      lowerTranscript.includes("i'm okay") ||
      lowerTranscript.includes("im okay") ||
      lowerTranscript.includes("i'm ok") ||
      lowerTranscript.includes("im ok") ||
      lowerTranscript.includes("vantus") && lowerTranscript.includes("okay")
    ) {
      return this.handleResponse('ok', telemetryState, officerInfo);
    }

    // Check for "need backup" variations
    if (
      lowerTranscript.includes("need backup") ||
      lowerTranscript.includes("backup") ||
      lowerTranscript.includes("assistance")
    ) {
      return this.handleResponse('need_backup', telemetryState, officerInfo);
    }

    // Check for "officer down" or emergency
    if (
      lowerTranscript.includes("officer down") ||
      lowerTranscript.includes("help") ||
      lowerTranscript.includes("emergency")
    ) {
      return this.handleResponse('emergency', telemetryState, officerInfo);
    }

    return null;
  }

  /**
   * Trigger welfare emergency (officer down protocol)
   */
  async triggerWelfareEmergency(telemetryState, officerInfo) {
    this.welfarePromptActive = false;
    this.clearWelfareTimer();

    logger.error('WELFARE EMERGENCY: Officer did not respond - triggering OFFICER DOWN protocol');

    // Get last known vitals and location
    const lastKnownVitals = this.getLastBiometrics(telemetryState);
    const lastKnownLocation = this.getCurrentLocation(telemetryState);

    // Create emergency dispatch payload
    const emergencyPayload = {
      type: 'OFFICER_DOWN',
      priority: 'CRITICAL',
      auto_dispatch: true,
      timestamp: new Date().toISOString(),
      officer: {
        id: officerInfo?.badgeNumber || officerInfo?.id || 'UNKNOWN',
        name: officerInfo?.name || 'Unknown Officer',
        unit: officerInfo?.unit || 'Unknown Unit',
      },
      last_known_vitals: lastKnownVitals,
      last_known_location: lastKnownLocation,
      situation: {
        trigger: 'WELFARE_CHECK_NO_RESPONSE',
        response_timeout: 30, // seconds
        biometric_state: lastKnownVitals.heartRate > 160 ? 'ELEVATED' : 'UNKNOWN',
        heart_rate: lastKnownVitals.heartRate,
      },
    };

    // Dispatch via auto-dispatch system
    await autoDispatch.dispatchBackup(
      {
        type: 'WELFARE_CHECK_FAILED',
        trigger: 'No response to welfare check',
        autoDispatch: true,
      },
      null, // No detection results
      telemetryState,
      officerInfo
    );

    return emergencyPayload;
  }

  /**
   * Get last known biometrics
   */
  getLastBiometrics(telemetryState) {
    const calibrationData = telemetryState?.calibrationData || {};
    
    return {
      heartRate: calibrationData.heartRateBaseline || null,
      heartRateBaseline: calibrationData.heartRateBaseline || null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current location
   */
  getCurrentLocation(telemetryState) {
    const location = telemetryState?.lastLocation || null;
    
    if (!location) {
      return {
        lat: null,
        lng: null,
        accuracy: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy || 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear welfare timer
   */
  clearWelfareTimer() {
    if (this.welfareTimer) {
      clearTimeout(this.welfareTimer);
      this.welfareTimer = null;
    }
    this.welfarePromptActive = false;
  }

  /**
   * Start periodic welfare checks
   * After ACTIVE mode >10 minutes
   */
  startPeriodicChecks(telemetryState, officerInfo, intervalMinutes = 10) {
    this.clearPeriodicChecks();

    // Check every intervalMinutes
    this.checkInterval = setInterval(() => {
      this.lastCheckTime = new Date();
      this.startWelfareTimer(telemetryState, officerInfo);
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Clear periodic checks
   */
  clearPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Get welfare check status
   */
  getStatus() {
    return {
      promptActive: this.welfarePromptActive,
      responseReceived: this.responseReceived,
      lastCheckTime: this.lastCheckTime,
      periodicChecksActive: this.checkInterval !== null,
    };
  }
}

// Export singleton instance
export default new WelfareCheck();
