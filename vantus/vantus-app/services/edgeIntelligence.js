/**
 * Edge Intelligence Layer - Explainable signal generation
 * All signals are probabilistic, not deterministic
 * Every signal is traceable to origin data
 */

class EdgeIntelligence {
  constructor() {
    this.signalHistory = [];
  }

  /**
   * Analyze movement patterns and detect anomalies
   * Returns probabilistic signals with explainability
   */
  analyzeMovementPatterns(movementData) {
    const signals = [];
    const { positionHistory, movementHistory, currentLocation } = movementData;

    if (!positionHistory || positionHistory.length < 5) {
      return signals; // Need minimum data points
    }

    // 1. Abrupt Stop Detection
    const abruptStopSignal = this.detectAbruptStops(movementHistory);
    if (abruptStopSignal) {
      signals.push(abruptStopSignal);
    }

    // 2. Pacing Pattern Detection
    const pacingSignal = this.detectPacingPatterns(positionHistory);
    if (pacingSignal) {
      signals.push(pacingSignal);
    }

    // 3. Unusual Movement Speed
    const speedAnomalySignal = this.detectSpeedAnomalies(movementHistory);
    if (speedAnomalySignal) {
      signals.push(speedAnomalySignal);
    }

    // 4. Stationary Duration Anomaly
    const stationarySignal = this.detectStationaryAnomaly(positionHistory);
    if (stationarySignal) {
      signals.push(stationarySignal);
    }

    return signals;
  }

  /**
   * Detect abrupt stops (sudden velocity drop)
   */
  detectAbruptStops(movementHistory) {
    if (movementHistory.length < 3) return null;

    const recent = movementHistory.slice(-5);
    const speeds = recent.map((m) => m.speed);

    // Check for sudden drop in speed
    for (let i = 1; i < speeds.length; i++) {
      const speedDrop = speeds[i - 1] - speeds[i];
      const dropPercentage = speeds[i - 1] > 0 ? (speedDrop / speeds[i - 1]) * 100 : 0;

      if (speedDrop > 5 && dropPercentage > 70) {
        // Abrupt stop detected
        const probability = Math.min(0.85, 0.5 + dropPercentage / 200);
        
        return {
          signalType: 'movement_pattern_anomaly',
          signalCategory: 'abrupt_stop',
          probability,
          timestamp: new Date().toISOString(),
          explanation: {
            description: 'Abrupt stop detected in movement pattern',
            originData: {
              previousSpeed: speeds[i - 1],
              currentSpeed: speeds[i],
              speedDrop,
              dropPercentage: dropPercentage.toFixed(2) + '%',
            },
            traceability: {
              dataPoints: recent.length,
              timeWindow: `${recent.length * 5} seconds`,
              algorithm: 'velocity_drop_analysis',
            },
          },
        };
      }
    }

    return null;
  }

  /**
   * Detect pacing patterns (back and forth movement)
   */
  detectPacingPatterns(positionHistory) {
    if (positionHistory.length < 10) return null;

    const recent = positionHistory.slice(-15);
    const positions = recent.map((p) => ({ lat: p.lat, lng: p.lng }));

    // Calculate direction changes
    let directionChanges = 0;
    let previousHeading = null;

    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i].lng - positions[i - 1].lng;
      const dy = positions[i].lat - positions[i - 1].lat;
      const heading = Math.atan2(dy, dx) * (180 / Math.PI);

      if (previousHeading !== null) {
        const headingDiff = Math.abs(heading - previousHeading);
        const normalizedDiff = headingDiff > 180 ? 360 - headingDiff : headingDiff;

        if (normalizedDiff > 120) {
          // Significant direction change
          directionChanges++;
        }
      }

      previousHeading = heading;
    }

    // If many direction changes in short time, could be pacing
    if (directionChanges >= 4) {
      const probability = Math.min(0.75, 0.4 + (directionChanges / 20));

      return {
        signalType: 'movement_pattern_anomaly',
        signalCategory: 'pacing_pattern',
        probability,
        timestamp: new Date().toISOString(),
        explanation: {
          description: 'Pacing pattern detected (repeated back-and-forth movement)',
          originData: {
            directionChanges,
            positionCount: positions.length,
            timeWindow: `${positions.length * 5} seconds`,
          },
          traceability: {
            dataPoints: positions.length,
            algorithm: 'heading_change_analysis',
            threshold: '4+ direction changes >120°',
          },
        },
      };
    }

    return null;
  }

  /**
   * Detect speed anomalies (unusually fast or slow)
   */
  detectSpeedAnomalies(movementHistory) {
    if (movementHistory.length < 5) return null;

    const recent = movementHistory.slice(-10);
    const speeds = recent.map((m) => m.speed);

    // Calculate baseline (median speed)
    const sortedSpeeds = [...speeds].sort((a, b) => a - b);
    const medianSpeed = sortedSpeeds[Math.floor(sortedSpeeds.length / 2)];

    // Check for unusually high speed
    const currentSpeed = speeds[speeds.length - 1];
    if (currentSpeed > medianSpeed * 2.5 && currentSpeed > 15) {
      // Unusually fast (e.g., >15 m/s = ~54 km/h)
      const probability = Math.min(0.7, 0.3 + (currentSpeed / 50));

      return {
        signalType: 'movement_pattern_anomaly',
        signalCategory: 'high_speed',
        probability,
        timestamp: new Date().toISOString(),
        explanation: {
          description: 'Unusually high movement speed detected',
          originData: {
            currentSpeed: currentSpeed.toFixed(2) + ' m/s',
            medianSpeed: medianSpeed.toFixed(2) + ' m/s',
            speedRatio: (currentSpeed / medianSpeed).toFixed(2),
          },
          traceability: {
            dataPoints: speeds.length,
            algorithm: 'speed_deviation_analysis',
            baseline: 'median_speed',
          },
        },
      };
    }

    return null;
  }

  /**
   * Detect stationary duration anomalies
   */
  detectStationaryAnomaly(positionHistory) {
    if (positionHistory.length < 10) return null;

    const recent = positionHistory.slice(-20);
    const stationaryThreshold = 0.00001; // ~1 meter in degrees

    // Check how long unit has been stationary
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

    // Flag if stationary for >2 minutes in an unusual location
    if (stationaryDuration > 120) {
      const probability = Math.min(0.65, 0.2 + (stationaryDuration / 600));

      return {
        signalType: 'contextual_drift_indicator',
        signalCategory: 'extended_stationary',
        probability,
        timestamp: new Date().toISOString(),
        explanation: {
          description: 'Extended stationary duration detected',
          originData: {
            stationaryDuration: stationaryDuration + ' seconds',
            location: {
              lat: recent[recent.length - 1].lat,
              lng: recent[recent.length - 1].lng,
            },
          },
          traceability: {
            dataPoints: recent.length,
            algorithm: 'position_variance_analysis',
            threshold: '120 seconds',
          },
        },
      };
    }

    return null;
  }

  /**
   * Analyze vocal stress proxy (simple speech pattern indicators)
   * Note: This is NOT stress detection, just pattern indicators
   */
  analyzeVocalPatterns(audioTranscripts) {
    const signals = [];

    if (!audioTranscripts || audioTranscripts.length < 3) {
      return signals;
    }

    const recent = audioTranscripts.slice(-10);

    // 1. Speech Rate Analysis
    const speechRateSignal = this.analyzeSpeechRate(recent);
    if (speechRateSignal) {
      signals.push(speechRateSignal);
    }

    // 2. Repetition Pattern Detection
    const repetitionSignal = this.detectRepetitionPatterns(recent);
    if (repetitionSignal) {
      signals.push(repetitionSignal);
    }

    return signals;
  }

  /**
   * Analyze speech rate (words per minute proxy)
   */
  analyzeSpeechRate(transcripts) {
    // Simple heuristic: transcript length vs time
    const timeSpan =
      (new Date(transcripts[transcripts.length - 1].timestamp) -
        new Date(transcripts[0].timestamp)) /
      1000; // seconds

    if (timeSpan < 10) return null; // Need minimum time span

    const totalWords = transcripts.reduce(
      (sum, t) => sum + (t.transcript || '').split(/\s+/).length,
      0
    );
    const wordsPerMinute = (totalWords / timeSpan) * 60;

    // Unusually fast speech (>200 WPM) or unusually slow (<50 WPM)
    if (wordsPerMinute > 200 || wordsPerMinute < 50) {
      const probability = wordsPerMinute > 200
        ? Math.min(0.6, 0.2 + (wordsPerMinute - 200) / 200)
        : Math.min(0.55, 0.2 + (50 - wordsPerMinute) / 100);

      return {
        signalType: 'vocal_stress_proxy',
        signalCategory: wordsPerMinute > 200 ? 'high_speech_rate' : 'low_speech_rate',
        probability,
        timestamp: new Date().toISOString(),
        explanation: {
          description: `Unusual speech rate detected: ${wordsPerMinute.toFixed(0)} WPM`,
          originData: {
            wordsPerMinute: wordsPerMinute.toFixed(0),
            transcriptCount: transcripts.length,
            timeSpan: timeSpan.toFixed(0) + ' seconds',
          },
          traceability: {
            dataPoints: transcripts.length,
            algorithm: 'word_count_time_ratio',
            note: 'This is a proxy indicator, not stress detection',
          },
        },
      };
    }

    return null;
  }

  /**
   * Detect repetition patterns in speech
   */
  detectRepetitionPatterns(transcripts) {
    const allWords = transcripts
      .map((t) => (t.transcript || '').toLowerCase().split(/\s+/))
      .flat();

    // Count word frequencies
    const wordFreq = {};
    allWords.forEach((word) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Find highly repeated words (>5 occurrences in short span)
    const repeatedWords = Object.entries(wordFreq).filter(([word, count]) => count >= 5);

    if (repeatedWords.length > 0) {
      const probability = Math.min(0.5, 0.2 + repeatedWords.length * 0.1);

      return {
        signalType: 'vocal_stress_proxy',
        signalCategory: 'repetition_pattern',
        probability,
        timestamp: new Date().toISOString(),
        explanation: {
          description: 'Repetition pattern detected in speech transcripts',
          originData: {
            repeatedWords: repeatedWords.map(([word]) => word).slice(0, 5),
            repetitionCount: repeatedWords.length,
            totalWords: allWords.length,
          },
          traceability: {
            dataPoints: transcripts.length,
            algorithm: 'word_frequency_analysis',
            note: 'This is a pattern indicator, not stress detection',
          },
        },
      };
    }

    return null;
  }

  /**
   * Analyze contextual drift (time duration anomalies for routine sequences)
   */
  analyzeContextualDrift(markerEvents, sessionDuration) {
    const signals = [];

    // Check for routine sequence duration anomalies
    // Example: Traffic stop taking unusually long
    const trafficStops = markerEvents.filter((m) => m.eventType === 'traffic_stop');

    if (trafficStops.length > 0) {
      const lastStop = trafficStops[trafficStops.length - 1];
      const stopDuration = (new Date() - new Date(lastStop.timestamp)) / 1000; // seconds

      // Flag if traffic stop >15 minutes (unusual duration)
      if (stopDuration > 900) {
        signals.push({
          signalType: 'contextual_drift_indicator',
          signalCategory: 'extended_routine_sequence',
          probability: Math.min(0.7, 0.3 + (stopDuration - 900) / 1800),
          timestamp: new Date().toISOString(),
          explanation: {
            description: 'Extended duration for routine sequence (traffic stop)',
            originData: {
              eventType: lastStop.eventType,
              duration: stopDuration.toFixed(0) + ' seconds',
              startTime: lastStop.timestamp,
            },
            traceability: {
              markerEventId: lastStop.timestamp,
              algorithm: 'temporal_sequence_analysis',
              threshold: '900 seconds',
            },
          },
        });
      }
    }

    return signals;
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
   * Generate all contextual signals from current state
   */
  generateContextualSignals(telemetryState, movementData, audioTranscripts, markerEvents) {
    const allSignals = [];

    // Movement pattern signals
    const movementSignals = this.analyzeMovementPatterns(movementData);
    allSignals.push(...movementSignals);

    // Vocal pattern signals
    const vocalSignals = this.analyzeVocalPatterns(audioTranscripts);
    allSignals.push(...vocalSignals);

    // Contextual drift signals
    const driftSignals = this.analyzeContextualDrift(
      markerEvents,
      telemetryState.sessionDuration
    );
    allSignals.push(...driftSignals);

    // Store in history
    this.signalHistory.push(...allSignals);

    return allSignals;
  }
}

// Export singleton instance
export default new EdgeIntelligence();
