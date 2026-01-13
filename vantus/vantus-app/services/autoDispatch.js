/**
 * Auto-Dispatch System
 * Handles automatic backup dispatch based on critical conditions
 */

// Note: Using require for configService to avoid circular dependencies
// In production, consider refactoring to use ES6 imports with proper dependency management

class AutoDispatch {
  constructor() {
    this.dispatchHistory = [];
    this.heartRateHistory = [];
    this.movementHistory = [];
    this.welfareCheckActive = false;
  }

  /**
   * Check if auto-dispatch conditions are met
   */
  async checkAutoDispatchConditions(detectionResults, telemetryState, officerInfo) {
    const conditions = [];

    // 1. Threat level = Critical
    if (this.isThreatLevelCritical(detectionResults)) {
      conditions.push({
        type: 'THREAT_CRITICAL',
        trigger: 'Threat level critical',
        autoDispatch: true,
      });
    }

    // 2. HR >160 BPM for >10 seconds
    if (await this.isHeartRateElevated(telemetryState)) {
      conditions.push({
        type: 'HEART_RATE_ELEVATED',
        trigger: 'HR >160 BPM for >10 seconds',
        autoDispatch: true,
      });
    }

    // 3. "Officer down" voice command
    // (Handled separately via voice command recognition)

    // 4. No movement + elevated HR for 30 seconds
    if (await this.isNoMovementElevatedHR(telemetryState)) {
      conditions.push({
        type: 'NO_MOVEMENT_ELEVATED_HR',
        trigger: 'No movement + elevated HR for 30 seconds',
        autoDispatch: true,
      });
    }

    // 5. Manual button press
    // (Handled via UI button)

    // If any condition met, dispatch
    if (conditions.length > 0) {
      const primaryCondition = conditions[0];
      await this.dispatchBackup(primaryCondition, detectionResults, telemetryState, officerInfo);
      return true;
    }

    return false;
  }

  /**
   * Check if threat level is critical
   */
  isThreatLevelCritical(detectionResults) {
    if (!detectionResults || !detectionResults.detections) return false;

    const { weapon, stance, hands } = detectionResults.detections;

    // Critical if weapon detected with high confidence
    if (weapon && weapon.detected && weapon.confidence >= 0.85) {
      return true;
    }

    // Critical if multiple threat indicators
    const threatCount = [
      weapon?.detected,
      stance?.detected && stance.stanceType === 'fighting_stance',
      hands?.detected && hands.pattern === 'waistband_reach',
    ].filter(Boolean).length;

    return threatCount >= 2;
  }

  /**
   * Check if heart rate is elevated (>160 BPM for >10 seconds)
   */
  async isHeartRateElevated(telemetryState) {
    if (!telemetryState || !telemetryState.calibrationData) return false;

    const baselineHR = telemetryState.calibrationData.heartRateBaseline;
    if (!baselineHR) return false;

    // Get recent heart rate readings (would come from wearable)
    // Get thresholds from config
    const dispatchConfig = require('../utils/config').default.getAutoDispatchConfig();
    const elevatedThreshold = dispatchConfig.elevatedHeartRate; // BPM
    const durationThreshold = dispatchConfig.elevatedHeartRateDuration * 1000; // Convert to milliseconds

    // Check if HR has been >160 for >10 seconds
    const recentElevated = this.heartRateHistory.filter(
      hr => hr.value > elevatedThreshold && 
      (Date.now() - hr.timestamp) < durationThreshold
    );

    return recentElevated.length >= 2; // At least 2 readings >10 seconds apart
  }

  /**
   * Check if no movement + elevated HR for 30 seconds
   */
  async isNoMovementElevatedHR(telemetryState) {
    if (!telemetryState) return false;

    const baselineHR = telemetryState.calibrationData?.heartRateBaseline;
    if (!baselineHR) return false;

    // Check movement history (last 30 seconds)
    // Get threshold from config
    const dispatchConfig = require('../utils/config').default.getAutoDispatchConfig();
    const thirtySecondsAgo = Date.now() - (dispatchConfig.noMovementElevatedHRDuration * 1000);
    const recentMovement = this.movementHistory.filter(
      m => m.timestamp > thirtySecondsAgo && m.speed > 0.5 // Moving > 0.5 m/s
    );

    // No significant movement
    if (recentMovement.length === 0) {
      // Check if HR is elevated (threshold from config)
      const configService = require('../utils/config').default;
      const threshold = configService.getModelThreshold('biometric') || 0.40; // Default 40% above baseline
      const elevatedHR = baselineHR * (1 + threshold); // Threshold% above baseline
      const recentHR = this.heartRateHistory.filter(
        hr => hr.value > elevatedHR && hr.timestamp > thirtySecondsAgo
      );

      return recentHR.length >= 3; // Elevated for 30 seconds
    }

    return false;
  }

  /**
   * Add heart rate reading
   */
  addHeartRateReading(heartRate) {
    this.heartRateHistory.push({
      value: heartRate,
      timestamp: Date.now(),
    });

    // Keep last 60 seconds of history
    const oneMinuteAgo = Date.now() - 60000;
    this.heartRateHistory = this.heartRateHistory.filter(hr => hr.timestamp > oneMinuteAgo);
  }

  /**
   * Add movement reading
   */
  addMovementReading(movementData) {
    this.movementHistory.push({
      ...movementData,
      timestamp: Date.now(),
    });

    // Keep last 60 seconds of history
    const oneMinuteAgo = Date.now() - 60000;
    this.movementHistory = this.movementHistory.filter(m => m.timestamp > oneMinuteAgo);
  }

  /**
   * Dispatch backup (auto-dispatch)
   */
  async dispatchBackup(condition, detectionResults, telemetryState, officerInfo) {
    const dispatchPayload = this.createDispatchPayload(
      condition,
      detectionResults,
      telemetryState,
      officerInfo
    );

    // Log dispatch
    this.dispatchHistory.push({
      ...dispatchPayload,
      dispatchedAt: new Date().toISOString(),
    });

    // Send to bridge server
    // In production, this would also send to CAD system
    console.log('AUTO-DISPATCH TRIGGERED:', dispatchPayload);

    // Return payload for sending
    return dispatchPayload;
  }

  /**
   * Create dispatch payload
   */
  createDispatchPayload(condition, detectionResults, telemetryState, officerInfo) {
    const location = telemetryState?.lastLocation || { lat: 0, lng: 0, accuracy: 0 };
    
    // Determine threat type
    let threatType = 'UNKNOWN';
    let confidence = 0;
    
    if (detectionResults?.detections?.weapon?.detected) {
      threatType = 'WEAPON_DETECTED';
      confidence = detectionResults.detections.weapon.confidence || 0;
    } else if (condition.type === 'HEART_RATE_ELEVATED') {
      threatType = 'BIOMETRIC_ANOMALY';
      confidence = 0.8;
    } else if (condition.type === 'NO_MOVEMENT_ELEVATED_HR') {
      threatType = 'OFFICER_DOWN_POSSIBLE';
      confidence = 0.75;
    }

    // Get biometric state
    const currentHR = this.heartRateHistory[this.heartRateHistory.length - 1]?.value || null;
    const baselineHR = telemetryState?.calibrationData?.heartRateBaseline || null;
    let biometricState = 'NORMAL';
    
    if (currentHR && baselineHR) {
      const configService = require('../utils/config').default;
      const threshold = configService.getModelThreshold('biometric') || 0.40; // Default 40%
      const dispatchConfig = configService.getAutoDispatchConfig();
      const increase = (currentHR - baselineHR) / baselineHR;
      if (increase > threshold) {
        biometricState = 'ELEVATED';
      } else if (currentHR > dispatchConfig.elevatedHeartRate) {
        biometricState = 'CRITICAL';
      }
    }

    // Get context from marker events
    const activeMarkers = telemetryState?.markerEvents?.filter(m => {
      const markerTime = new Date(m.timestamp);
      const now = new Date();
      return (now - markerTime) / 1000 < 3600; // Active within last hour
    }) || [];

    const callType = activeMarkers.length > 0 
      ? activeMarkers[activeMarkers.length - 1].eventType.toUpperCase()
      : 'ROUTINE';

    const timeOnScene = activeMarkers.length > 0
      ? Math.floor((Date.now() - new Date(activeMarkers[0].timestamp).getTime()) / 1000)
      : 0;

    return {
      type: 'EMERGENCY_BACKUP',
      timestamp: new Date().toISOString(),
      officer: {
        id: officerInfo?.badgeNumber || officerInfo?.id || 'UNKNOWN',
        name: officerInfo?.name || 'Unknown Officer',
        unit: officerInfo?.unit || 'Unknown Unit',
      },
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || 0,
        address: null, // Would be reverse geocoded in production
      },
      situation: {
        threat_type: threatType,
        confidence: confidence,
        biometric_state: biometricState,
        heart_rate: currentHR,
        duration_seconds: this.calculateDuration(condition),
      },
      context: {
        call_type: callType,
        original_cad_id: null, // Would come from CAD integration
        time_on_scene: timeOnScene,
      },
      trigger: {
        condition_type: condition.type,
        trigger_message: condition.trigger,
        auto_dispatch: true,
      },
    };
  }

  /**
   * Calculate duration of condition
   */
  calculateDuration(condition) {
    // Calculate how long condition has been active
    // For HR elevated, check history
    if (condition.type === 'HEART_RATE_ELEVATED') {
      const elevatedReadings = this.heartRateHistory.filter(hr => hr.value > 160);
      if (elevatedReadings.length > 0) {
        const first = elevatedReadings[0].timestamp;
        const last = elevatedReadings[elevatedReadings.length - 1].timestamp;
        return Math.floor((last - first) / 1000);
      }
    }
    
    return 0;
  }

  /**
   * Manual dispatch trigger
   */
  async manualDispatch(detectionResults, telemetryState, officerInfo) {
    const condition = {
      type: 'MANUAL_TRIGGER',
      trigger: 'Manual button press',
      autoDispatch: true,
    };

    return await this.dispatchBackup(condition, detectionResults, telemetryState, officerInfo);
  }

  /**
   * Get dispatch history
   */
  getDispatchHistory() {
    return this.dispatchHistory;
  }
}

// Export singleton instance
export default new AutoDispatch();
