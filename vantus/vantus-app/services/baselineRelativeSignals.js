/**
 * BASELINE-RELATIVE SIGNAL GENERATION
 * All signals computed as deviations from officer's own baseline
 * Implements algorithms from VANTUS BASELINE CALIBRATION specification
 */

import baselineCalibration from './baselineCalibration';

class BaselineRelativeSignals {
  constructor() {
    this.signalHistory = [];
  }

  /**
   * Clamp value between min and max
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Sigmoid function
   */
  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Generate abrupt stop deviation signal
   */
  generateAbruptStopSignal(movementHistory, baseline, officerName) {
    if (!baseline.avg_deceleration || !baseline.deceleration_std || movementHistory.length < 2) {
      return null;
    }

    // Calculate current deceleration
    const recent = movementHistory.slice(-2);
    if (recent.length < 2) return null;

    const deltaSpeed = recent[0].speed - recent[1].speed;
    const deltaTime = 5; // 5 second intervals
    const currentDeceleration = deltaSpeed > 0 ? deltaSpeed / deltaTime : 0;

    if (currentDeceleration <= 0) return null;

    // Calculate z-score
    const z = (currentDeceleration - baseline.avg_deceleration) / (baseline.deceleration_std || 1);

    // Trigger condition: z > 1.5
    if (z <= 1.5) return null;

    // Calculate probability
    const probability = this.clamp(this.sigmoid(z / 2), 0.05, 0.95);

    return {
      signalType: 'contextual_deviation',
      signalCategory: 'abrupt_stop',
      probability,
      timestamp: new Date().toISOString(),
      baselineContext: {
        window: '14_days',
        metric: 'deceleration',
        baselineMean: baseline.avg_deceleration,
        baselineStd: baseline.deceleration_std || 1,
        comparisonValue: currentDeceleration,
      },
      explanation: {
        summary: `Deceleration event (${currentDeceleration.toFixed(2)} m/s²) exceeded officer's typical range (${baseline.avg_deceleration.toFixed(2)} ± ${(baseline.deceleration_std || 1).toFixed(2)} m/s²) for this context.`,
        method: 'Z-score deviation from baseline deceleration',
        limitations: [
          'Does not indicate threat or intent',
          'Dependent on GPS accuracy and movement data quality',
          'Baseline requires sufficient historical data',
        ],
      },
      traceability: {
        dataSources: ['GPS', 'Movement History'],
        calculationVersion: 'baseline_v1.0',
        zScore: z.toFixed(2),
        algorithm: 'abrupt_stop_deviation',
      },
    };
  }

  /**
   * Generate stationary duration deviation signal
   */
  generateStationaryDurationSignal(positionHistory, baseline, officerName) {
    if (!baseline.stop_duration_median || !baseline.stop_duration_IQR || positionHistory.length < 10) {
      return null;
    }

    // Calculate current stationary duration
    const recent = positionHistory.slice(-20);
    const stationaryThreshold = 0.00001; // ~1 meter in degrees
    let stationaryDuration = 0;
    let lastMovementIndex = recent.length - 1;

    for (let i = recent.length - 1; i > 0; i--) {
      const distance = this.calculateDistance(
        recent[i].lat,
        recent[i].lng,
        recent[i - 1].lat,
        recent[i - 1].lng
      );

      if (distance > stationaryThreshold) {
        lastMovementIndex = i;
        break;
      }
    }

    stationaryDuration = (recent.length - 1 - lastMovementIndex) * 5; // seconds

    // Calculate deviation score
    const score = (stationaryDuration - baseline.stop_duration_median) / (baseline.stop_duration_IQR || 1);

    // Trigger condition: current_duration > median + 1.5 * IQR
    const threshold = baseline.stop_duration_median + 1.5 * baseline.stop_duration_IQR;
    if (stationaryDuration <= threshold) return null;

    // Calculate probability
    const probability = this.clamp(score / 4, 0.1, 0.9);

    return {
      signalType: 'contextual_deviation',
      signalCategory: 'stationary_duration',
      probability,
      timestamp: new Date().toISOString(),
      baselineContext: {
        window: '14_days',
        metric: 'stop_duration',
        baselineMedian: baseline.stop_duration_median,
        baselineIQR: baseline.stop_duration_IQR,
        comparisonValue: stationaryDuration,
      },
      explanation: {
        summary: `Stationary duration (${stationaryDuration.toFixed(0)}s) exceeded officer's typical range (median: ${baseline.stop_duration_median.toFixed(1)}s, IQR: ${baseline.stop_duration_IQR.toFixed(1)}s) for this context.`,
        method: 'IQR-based deviation from baseline stop duration',
        limitations: [
          'Does not indicate threat or intent',
          'May be affected by GPS accuracy and environmental factors',
          'Context-dependent (on foot vs in vehicle)',
        ],
      },
      traceability: {
        dataSources: ['GPS', 'Position History'],
        calculationVersion: 'baseline_v1.0',
        deviationScore: score.toFixed(2),
        algorithm: 'stationary_duration_deviation',
      },
    };
  }

  /**
   * Generate pacing pattern deviation signal
   */
  generatePacingPatternSignal(positionHistory, baseline, officerName) {
    if (!baseline.pace_reversal_avg || !baseline.pace_reversal_std || positionHistory.length < 15) {
      return null;
    }

    // Calculate current reversals within 10m radius over 5 minutes
    const radius = 10; // meters
    const window = 5 * 60 / 5; // 5 minutes worth of 5-second intervals
    const recent = positionHistory.slice(-window);

    if (recent.length < window) return null;

    // Count direction reversals
    let reversalCount = 0;
    for (let i = 1; i < recent.length; i++) {
      const dx = recent[i].lng - recent[i - 1].lng;
      const dy = recent[i].lat - recent[i - 1].lat;
      const heading = Math.atan2(dy, dx) * (180 / Math.PI);

      if (i > 1) {
        const prevDx = recent[i - 1].lng - recent[i - 2].lng;
        const prevDy = recent[i - 1].lat - recent[i - 2].lat;
        const prevHeading = Math.atan2(prevDy, prevDx) * (180 / Math.PI);

        const headingDiff = Math.abs(heading - prevHeading);
        const normalizedDiff = headingDiff > 180 ? 360 - headingDiff : headingDiff;

        if (normalizedDiff > 120) {
          reversalCount++;
        }
      }
    }

    // Calculate z-score
    const z = (reversalCount - baseline.pace_reversal_avg) / (baseline.pace_reversal_std || 1);

    // Trigger condition: z > 1.3
    if (z <= 1.3) return null;

    // Calculate probability
    const probability = this.clamp(this.sigmoid(z), 0.1, 0.9);

    return {
      signalType: 'contextual_deviation',
      signalCategory: 'pacing_pattern',
      probability,
      timestamp: new Date().toISOString(),
      baselineContext: {
        window: '14_days',
        metric: 'pace_reversals',
        baselineAvg: baseline.pace_reversal_avg,
        baselineStd: baseline.pace_reversal_std,
        comparisonValue: reversalCount,
      },
      explanation: {
        summary: `Pacing pattern (${reversalCount} reversals) exceeded officer's typical range (${baseline.pace_reversal_avg.toFixed(1)} ± ${baseline.pace_reversal_std.toFixed(1)}) for this context.`,
        method: 'Z-score deviation from baseline pacing pattern',
        limitations: [
          'Does not indicate threat or intent',
          'Pattern detection within 10m radius over 5-minute window',
          'May be affected by GPS accuracy',
        ],
      },
      traceability: {
        dataSources: ['GPS', 'Position History'],
        calculationVersion: 'baseline_v1.0',
        zScore: z.toFixed(2),
        algorithm: 'pacing_pattern_deviation',
      },
    };
  }

  /**
   * Generate speech rate deviation signal
   */
  generateSpeechRateDeviationSignal(audioTranscripts, baseline, officerName) {
    if (!baseline.mean_WPM || !baseline.std_WPM || audioTranscripts.length < 3) {
      return null;
    }

    // Calculate current WPM
    const recent = audioTranscripts.slice(-10);
    const timeSpan = (new Date(recent[recent.length - 1].timestamp) - new Date(recent[0].timestamp)) / 1000 / 60; // minutes
    if (timeSpan < 0.1) return null; // Need minimum time span

    const totalWords = recent.reduce((sum, t) => sum + (t.transcript || '').split(/\s+/).length, 0);
    const currentWPM = (totalWords / timeSpan);

    if (currentWPM <= 0 || currentWPM > 500) return null; // Sanity check

    // Calculate z-score
    const z = (currentWPM - baseline.mean_WPM) / (baseline.std_WPM || 1);

    // Trigger condition: |z| > 1.2
    if (Math.abs(z) <= 1.2) return null;

    // Calculate probability
    const probability = this.clamp(this.sigmoid(Math.abs(z)), 0.05, 0.95);

    return {
      signalType: 'contextual_deviation',
      signalCategory: 'speech_rate_deviation',
      probability,
      timestamp: new Date().toISOString(),
      baselineContext: {
        window: '14_days',
        metric: 'words_per_minute',
        baselineMean: baseline.mean_WPM,
        baselineStd: baseline.std_WPM,
        comparisonValue: currentWPM,
      },
      explanation: {
        summary: `Speech rate (${currentWPM.toFixed(0)} WPM) deviated from officer's typical range (${baseline.mean_WPM.toFixed(0)} ± ${baseline.std_WPM.toFixed(0)} WPM) for this context. This is a speech pattern indicator, not stress detection.`,
        method: 'Z-score deviation from baseline speech rate',
        limitations: [
          'Does not indicate stress, emotion, or psychological state',
          'Speech pattern indicator only, not diagnostic',
          'Dependent on transcript accuracy and audio quality',
        ],
      },
      traceability: {
        dataSources: ['Audio Transcripts'],
        calculationVersion: 'baseline_v1.0',
        zScore: z.toFixed(2),
        algorithm: 'speech_rate_deviation',
      },
    };
  }

  /**
   * Generate phrase repetition deviation signal
   */
  generateRepetitionDeviationSignal(audioTranscripts, baseline, officerName) {
    if (!baseline.repetition_rate_median || !baseline.repetition_rate_MAD || audioTranscripts.length < 5) {
      return null;
    }

    // Calculate current repetition rate
    const recent = audioTranscripts.slice(-10);
    const allWords = recent
      .map(t => (t.transcript || '').toLowerCase().split(/\s+/))
      .flat();

    const wordFreq = {};
    allWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    const repeatedWords = Object.values(wordFreq).filter(count => count >= 3);
    const currentRepetitionRate = repeatedWords.length / recent.length;

    // Calculate deviation score (MAD-based)
    const score = (currentRepetitionRate - baseline.repetition_rate_median) / (baseline.repetition_rate_MAD || 0.1);

    // Trigger condition: score > 1.5
    if (score <= 1.5) return null;

    // Calculate probability
    const probability = this.clamp(score / 4, 0.1, 0.9);

    return {
      signalType: 'contextual_deviation',
      signalCategory: 'phrase_repetition_deviation',
      probability,
      timestamp: new Date().toISOString(),
      baselineContext: {
        window: '14_days',
        metric: 'repetition_rate',
        baselineMedian: baseline.repetition_rate_median,
        baselineMAD: baseline.repetition_rate_MAD,
        comparisonValue: currentRepetitionRate,
      },
      explanation: {
        summary: `Phrase repetition rate (${currentRepetitionRate.toFixed(2)}) exceeded officer's typical range (median: ${baseline.repetition_rate_median.toFixed(2)}, MAD: ${baseline.repetition_rate_MAD.toFixed(2)}) for this context. This is a speech pattern indicator, not stress detection.`,
        method: 'MAD-based deviation from baseline repetition rate',
        limitations: [
          'Does not indicate stress, emotion, or psychological state',
          'Speech pattern indicator only, not diagnostic',
          'Dependent on transcript accuracy',
        ],
      },
      traceability: {
        dataSources: ['Audio Transcripts'],
        calculationVersion: 'baseline_v1.0',
        deviationScore: score.toFixed(2),
        algorithm: 'phrase_repetition_deviation',
      },
    };
  }

  /**
   * Generate routine duration drift signal
   */
  generateRoutineDurationDriftSignal(markerEvents, baseline, officerName) {
    if (!baseline.routine_duration_median || !baseline.routine_duration_IQR || markerEvents.length === 0) {
      return null;
    }

    // Find active routine marker
    const activeMarkers = markerEvents.filter(m => {
      const markerTime = new Date(m.timestamp);
      const now = new Date();
      const elapsed = (now - markerTime) / 1000; // seconds
      return elapsed < 3600 && (m.eventType === 'traffic_stop' || m.eventType === 'checkpoint');
    });

    if (activeMarkers.length === 0) return null;

    const latestMarker = activeMarkers[activeMarkers.length - 1];
    const elapsedTime = (new Date() - new Date(latestMarker.timestamp)) / 1000; // seconds

    // Calculate drift
    const drift = (elapsedTime - baseline.routine_duration_median) / (baseline.routine_duration_IQR || 1);

    // Trigger condition: drift > 1.5
    if (drift <= 1.5) return null;

    // Calculate probability
    const probability = this.clamp(drift / 5, 0.1, 0.9);

    return {
      signalType: 'contextual_deviation',
      signalCategory: 'routine_duration_drift',
      probability,
      timestamp: new Date().toISOString(),
      baselineContext: {
        window: '14_days',
        metric: 'routine_duration',
        baselineMedian: baseline.routine_duration_median,
        baselineIQR: baseline.routine_duration_IQR,
        comparisonValue: elapsedTime,
      },
      explanation: {
        summary: `Routine operation duration (${(elapsedTime / 60).toFixed(1)} min) exceeded officer's typical range (median: ${(baseline.routine_duration_median / 60).toFixed(1)} min, IQR: ${(baseline.routine_duration_IQR / 60).toFixed(1)} min) for this context.`,
        method: 'IQR-based deviation from baseline routine duration',
        limitations: [
          'Does not indicate threat or intent',
          'Dependent on accurate marker event timing',
          'Context-specific (traffic stop vs checkpoint)',
        ],
      },
      traceability: {
        dataSources: ['Marker Events', 'Timestamps'],
        calculationVersion: 'baseline_v1.0',
        driftScore: drift.toFixed(2),
        algorithm: 'routine_duration_drift',
      },
    };
  }

  /**
   * Calculate distance between coordinates
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Generate all baseline-relative signals
   */
  generateAllSignals(telemetryState, movementData, audioTranscripts, markerEvents, officerName) {
    const baseline = baselineCalibration.getCurrentBaseline(
      officerName,
      telemetryState,
      markerEvents
    );

    const signals = [];

    // Movement signals
    if (movementData.movementHistory && movementData.movementHistory.length > 0) {
      const abruptStop = this.generateAbruptStopSignal(movementData.movementHistory, baseline, officerName);
      if (abruptStop) signals.push(abruptStop);

      const stationary = this.generateStationaryDurationSignal(movementData.positionHistory, baseline, officerName);
      if (stationary) signals.push(stationary);

      const pacing = this.generatePacingPatternSignal(movementData.positionHistory, baseline, officerName);
      if (pacing) signals.push(pacing);
    }

    // Speech signals
    if (audioTranscripts && audioTranscripts.length > 0) {
      const speechRate = this.generateSpeechRateDeviationSignal(audioTranscripts, baseline, officerName);
      if (speechRate) signals.push(speechRate);

      const repetition = this.generateRepetitionDeviationSignal(audioTranscripts, baseline, officerName);
      if (repetition) signals.push(repetition);
    }

    // Routine signals
    if (markerEvents && markerEvents.length > 0) {
      const routineDrift = this.generateRoutineDurationDriftSignal(markerEvents, baseline, officerName);
      if (routineDrift) signals.push(routineDrift);
    }

    // Store in history
    this.signalHistory.push(...signals);

    return signals;
  }
}

// Export singleton instance
export default new BaselineRelativeSignals();
