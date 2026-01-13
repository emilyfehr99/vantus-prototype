/**
 * VANTUS BASELINE CALIBRATION ALGORITHM
 * Per-officer, per-context behavioral baselines
 * All signals expressed as relative deviations from officer's own historical norms
 */

import configService from '../utils/config';

class BaselineCalibration {
  constructor() {
    // In-memory storage (in production, this would be persistent storage)
    this.baselines = new Map(); // officerName -> context -> baseline data
    this.sessionData = new Map(); // sessionId -> accumulated session data
  }

  /**
   * Get or create baseline for officer and context
   */
  getBaseline(officerName, context) {
    if (!this.baselines.has(officerName)) {
      this.baselines.set(officerName, new Map());
    }
    
    const officerBaselines = this.baselines.get(officerName);
    
    if (!officerBaselines.has(context)) {
      // Initialize empty baseline
      officerBaselines.set(context, this.createEmptyBaseline());
    }
    
    return officerBaselines.get(context);
  }

  /**
   * Create empty baseline structure
   */
  createEmptyBaseline() {
    return {
      // Movement metrics
      avg_speed: null,
      speed_std: null,
      avg_acceleration: null,
      avg_deceleration: null,
      deceleration_std: null, // Standard deviation for deceleration
      stop_duration_median: null,
      stop_duration_IQR: null,
      heading_variance_avg: null,
      pace_reversal_avg: null,
      pace_reversal_std: null,
      
      // Speech metrics
      mean_WPM: null,
      std_WPM: null,
      median_WPM: null,
      repetition_rate_median: null,
      repetition_rate_MAD: null,
      
      // Routine metrics
      routine_duration_median: null,
      routine_duration_IQR: null,
      
      // Metadata
      lastUpdated: null,
      dataPoints: 0,
      shortTermData: [], // Current session
      midTermData: [], // Last 14 days
      longTermData: [], // Last 60-90 days
    };
  }

  /**
   * Determine context from telemetry and markers
   */
  determineContext(telemetryState, markerEvents) {
    const context = {
      movement: 'unknown', // 'on_foot' | 'in_vehicle'
      timeOfDay: this.getTimeOfDay(),
      operationalContext: 'routine', // 'traffic_stop' | 'checkpoint' | 'routine'
    };

    // Determine movement type from speed patterns
    if (telemetryState.lastLocation && telemetryState.movementHistory) {
      const recentSpeeds = telemetryState.movementHistory
        .slice(-10)
        .map(m => m.speed);
      const avgSpeed = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length;
      
      // If average speed > threshold, likely in vehicle
      const vehicleThreshold = configService.getBaselineConfig().vehicleSpeedThreshold;
      context.movement = avgSpeed > vehicleThreshold ? 'in_vehicle' : 'on_foot';
    }

    // Check for active operational context from markers
    const activeMarkers = markerEvents.filter(m => {
      const markerTime = new Date(m.timestamp);
      const now = new Date();
      const elapsed = (now - markerTime) / 1000; // seconds
      return elapsed < 3600; // Active if within last hour
    });

    if (activeMarkers.length > 0) {
      const latestMarker = activeMarkers[activeMarkers.length - 1];
      context.operationalContext = latestMarker.eventType || 'routine';
    }

    // Create context key
    return `${context.movement}_${context.timeOfDay}_${context.operationalContext}`;
  }

  /**
   * Get time of day context
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    const baselineConfig = configService.getBaselineConfig();
    return (hour >= baselineConfig.dayTimeStart && hour < baselineConfig.dayTimeEnd) ? 'day' : 'night';
  }

  /**
   * Calculate baseline statistics from data array
   */
  calculateStats(values) {
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];
    
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    
    // Median Absolute Deviation (MAD)
    const deviations = values.map(v => Math.abs(v - median));
    const mad = this.calculateMedian(deviations);
    
    return { mean, std, median, iqr, mad };
  }

  /**
   * Calculate median
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    return n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];
  }

  /**
   * Accumulate session data for baseline update
   */
  accumulateSessionData(sessionId, telemetryData, movementHistory, audioTranscripts, markerEvents) {
    if (!this.sessionData.has(sessionId)) {
      this.sessionData.set(sessionId, {
        telemetryData: [],
        movementHistory: [],
        audioTranscripts: [],
        markerEvents: [],
        startTime: new Date(),
      });
    }
    
    const session = this.sessionData.get(sessionId);
    session.telemetryData.push(...telemetryData);
    session.movementHistory.push(...movementHistory);
    session.audioTranscripts.push(...audioTranscripts);
    session.markerEvents.push(...markerEvents);
  }

  /**
   * Update baseline at session end
   * Uses exponential moving average with 10% cap per update
   */
  updateBaseline(officerName, sessionId) {
    const session = this.sessionData.get(sessionId);
    if (!session) return;

    const sessionDuration = (new Date() - session.startTime) / 1000; // seconds
    const context = this.determineContext(
      { movementHistory: session.movementHistory },
      session.markerEvents
    );

    const baseline = this.getBaseline(officerName, context);
    const newMetrics = this.extractMetricsFromSession(session);

    // Update baseline using EMA with 10% cap
    this.updateBaselineMetrics(baseline, newMetrics);

    // Update data windows
    this.updateDataWindows(baseline, session, sessionDuration);

    // Clean up session data
    this.sessionData.delete(sessionId);
  }

  /**
   * Extract metrics from session data
   */
  extractMetricsFromSession(session) {
    const metrics = {};

    // Movement metrics
    if (session.movementHistory && session.movementHistory.length > 0) {
      const speeds = session.movementHistory.map(m => m.speed).filter(s => s !== null && s !== undefined);
      const accelerations = this.calculateAccelerations(session.movementHistory);
      const decelerations = this.calculateDecelerations(session.movementHistory);
      const stopDurations = this.calculateStopDurations(session.movementHistory);
      const headingVariances = this.calculateHeadingVariances(session.movementHistory);
      const paceReversals = this.calculatePaceReversals(session.movementHistory);

      if (speeds.length > 0) {
        const speedStats = this.calculateStats(speeds);
        metrics.avg_speed = speedStats.mean;
        metrics.speed_std = speedStats.std;
      }

      if (accelerations.length > 0) {
        metrics.avg_acceleration = this.calculateStats(accelerations).mean;
      }

      if (decelerations.length > 0) {
        const decelStats = this.calculateStats(decelerations);
        metrics.avg_deceleration = decelStats.mean;
        metrics.deceleration_std = decelStats.std;
      }

      if (stopDurations.length > 0) {
        const stopStats = this.calculateStats(stopDurations);
        metrics.stop_duration_median = stopStats.median;
        metrics.stop_duration_IQR = stopStats.iqr;
      }

      if (headingVariances.length > 0) {
        metrics.heading_variance_avg = this.calculateStats(headingVariances).mean;
      }

      if (paceReversals.length > 0) {
        const paceStats = this.calculateStats(paceReversals);
        metrics.pace_reversal_avg = paceStats.mean;
        metrics.pace_reversal_std = paceStats.std;
      }
    }

    // Speech metrics
    if (session.audioTranscripts && session.audioTranscripts.length > 0) {
      const wpmValues = this.calculateWPM(session.audioTranscripts);
      const repetitionRates = this.calculateRepetitionRates(session.audioTranscripts);

      if (wpmValues.length > 0) {
        const wpmStats = this.calculateStats(wpmValues);
        metrics.mean_WPM = wpmStats.mean;
        metrics.std_WPM = wpmStats.std;
        metrics.median_WPM = wpmStats.median;
      }

      if (repetitionRates.length > 0) {
        const repStats = this.calculateStats(repetitionRates);
        metrics.repetition_rate_median = repStats.median;
        metrics.repetition_rate_MAD = repStats.mad;
      }
    }

    // Routine metrics (from markers)
    if (session.markerEvents && session.markerEvents.length > 0) {
      const routineDurations = this.calculateRoutineDurations(session.markerEvents);
      if (routineDurations.length > 0) {
        const routineStats = this.calculateStats(routineDurations);
        metrics.routine_duration_median = routineStats.median;
        metrics.routine_duration_IQR = routineStats.iqr;
      }
    }

    return metrics;
  }

  /**
   * Calculate accelerations from movement history
   */
  calculateAccelerations(movementHistory) {
    const accelerations = [];
    for (let i = 1; i < movementHistory.length; i++) {
      const deltaSpeed = movementHistory[i].speed - movementHistory[i - 1].speed;
      const deltaTime = 5; // Assume 5 second intervals
      if (deltaTime > 0) {
        accelerations.push(deltaSpeed / deltaTime);
      }
    }
    return accelerations.filter(a => a > 0); // Only positive accelerations
  }

  /**
   * Calculate decelerations from movement history
   */
  calculateDecelerations(movementHistory) {
    const decelerations = [];
    for (let i = 1; i < movementHistory.length; i++) {
      const deltaSpeed = movementHistory[i - 1].speed - movementHistory[i].speed;
      const deltaTime = 5; // Assume 5 second intervals
      if (deltaTime > 0 && deltaSpeed > 0) {
        decelerations.push(deltaSpeed / deltaTime);
      }
    }
    return decelerations;
  }

  /**
   * Calculate stop durations
   */
  calculateStopDurations(movementHistory) {
    const durations = [];
    let stopStart = null;
    
    for (let i = 0; i < movementHistory.length; i++) {
      const isStopped = movementHistory[i].speed < 0.5; // < 0.5 m/s considered stopped
      
      if (isStopped && stopStart === null) {
        stopStart = i;
      } else if (!isStopped && stopStart !== null) {
        durations.push((i - stopStart) * 5); // Convert to seconds
        stopStart = null;
      }
    }
    
    return durations;
  }

  /**
   * Calculate heading variances
   */
  calculateHeadingVariances(movementHistory) {
    const variances = [];
    const windowSize = 5;
    
    for (let i = windowSize; i < movementHistory.length; i++) {
      const window = movementHistory.slice(i - windowSize, i);
      const headings = window.map(m => m.heading).filter(h => h !== null && h !== undefined);
      
      if (headings.length > 1) {
        // Calculate circular variance
        const meanHeading = this.calculateCircularMean(headings);
        const variance = headings.reduce((sum, h) => {
          const diff = Math.abs(h - meanHeading);
          const circularDiff = Math.min(diff, 360 - diff);
          return sum + circularDiff * circularDiff;
        }, 0) / headings.length;
        variances.push(variance);
      }
    }
    
    return variances;
  }

  /**
   * Calculate circular mean for headings
   */
  calculateCircularMean(headings) {
    const radians = headings.map(h => (h * Math.PI) / 180);
    const sinSum = radians.reduce((sum, r) => sum + Math.sin(r), 0);
    const cosSum = radians.reduce((sum, r) => sum + Math.cos(r), 0);
    const meanRad = Math.atan2(sinSum / headings.length, cosSum / headings.length);
    return (meanRad * 180) / Math.PI;
  }

  /**
   * Calculate pace reversals (direction changes within radius)
   */
  calculatePaceReversals(movementHistory) {
    const radius = 10; // meters
    const window = 5 * 60 / 5; // 5 minutes worth of 5-second intervals
    
    const reversals = [];
    
    for (let i = window; i < movementHistory.length; i++) {
      const windowData = movementHistory.slice(i - window, i);
      let reversalCount = 0;
      
      for (let j = 1; j < windowData.length; j++) {
        const prevHeading = windowData[j - 1].heading;
        const currHeading = windowData[j].heading;
        
        if (prevHeading !== null && currHeading !== null) {
          const headingDiff = Math.abs(currHeading - prevHeading);
          const normalizedDiff = headingDiff > 180 ? 360 - headingDiff : headingDiff;
          
          if (normalizedDiff > 120) {
            reversalCount++;
          }
        }
      }
      
      reversals.push(reversalCount);
    }
    
    return reversals;
  }

  /**
   * Calculate words per minute from transcripts
   */
  calculateWPM(transcripts) {
    const wpmValues = [];
    
    for (let i = 1; i < transcripts.length; i++) {
      const timeSpan = (new Date(transcripts[i].timestamp) - new Date(transcripts[i - 1].timestamp)) / 1000 / 60; // minutes
      if (timeSpan > 0) {
        const words = (transcripts[i].transcript || '').split(/\s+/).length;
        const wpm = words / timeSpan;
        if (wpm > 0 && wpm < 500) { // Sanity check
          wpmValues.push(wpm);
        }
      }
    }
    
    return wpmValues;
  }

  /**
   * Calculate repetition rates from transcripts
   */
  calculateRepetitionRates(transcripts) {
    const rates = [];
    const window = 5; // 5 transcripts
    
    for (let i = window; i < transcripts.length; i++) {
      const windowTranscripts = transcripts.slice(i - window, i);
      const allWords = windowTranscripts
        .map(t => (t.transcript || '').toLowerCase().split(/\s+/))
        .flat();
      
      const wordFreq = {};
      allWords.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
      
      const repeatedWords = Object.values(wordFreq).filter(count => count >= 3);
      rates.push(repeatedWords.length / windowTranscripts.length);
    }
    
    return rates;
  }

  /**
   * Calculate routine durations from markers
   */
  calculateRoutineDurations(markerEvents) {
    const durations = [];
    const activeMarkers = new Map();
    
    markerEvents.forEach(marker => {
      if (marker.eventType === 'traffic_stop' || marker.eventType === 'checkpoint') {
        activeMarkers.set(marker.timestamp, marker);
      }
    });
    
    // For simplicity, assume markers have end times or calculate from next marker
    // In production, this would track marker start/end more precisely
    activeMarkers.forEach((marker, startTime) => {
      // Estimate duration (in production, would use actual end time)
      // Calculate actual duration from marker start/end times
      // For now, use default from config if marker doesn't have end time
      const defaultDuration = configService.getOperationalContexts().routineDurations[marker.eventType] || 300;
      durations.push(defaultDuration);
    });
    
    return durations;
  }

  /**
   * Update baseline metrics using EMA with 10% cap
   */
  updateBaselineMetrics(baseline, newMetrics) {
    const alpha = 0.1; // EMA smoothing factor (10% weight for new data)
    
    Object.keys(newMetrics).forEach(key => {
      if (newMetrics[key] !== null && newMetrics[key] !== undefined) {
        const currentValue = baseline[key];
        
        if (currentValue === null || currentValue === undefined) {
          // First time, use new value directly
          baseline[key] = newMetrics[key];
        } else {
          // EMA update with 10% cap
          const delta = newMetrics[key] - currentValue;
          const maxDelta = Math.abs(currentValue * 0.1); // 10% cap
          const cappedDelta = Math.sign(delta) * Math.min(Math.abs(delta), maxDelta);
          baseline[key] = currentValue + (cappedDelta * alpha);
        }
      }
    });
    
    baseline.lastUpdated = new Date().toISOString();
    baseline.dataPoints++;
  }

  /**
   * Update data windows (short, mid, long term)
   */
  updateDataWindows(baseline, session, sessionDuration) {
    const now = new Date();
    const sessionData = {
      timestamp: now.toISOString(),
      metrics: this.extractMetricsFromSession(session),
      duration: sessionDuration,
    };
    
    // Add to short term (current session)
    baseline.shortTermData.push(sessionData);
    
    // Add to mid term (last 14 days)
    baseline.midTermData.push(sessionData);
    baseline.midTermData = baseline.midTermData.filter(d => {
      const dataTime = new Date(d.timestamp);
      const daysAgo = (now - dataTime) / (1000 * 60 * 60 * 24);
      return daysAgo <= 14;
    });
    
    // Add to long term (last 90 days)
    baseline.longTermData.push(sessionData);
    baseline.longTermData = baseline.longTermData.filter(d => {
      const dataTime = new Date(d.timestamp);
      const daysAgo = (now - dataTime) / (1000 * 60 * 60 * 24);
      return daysAgo <= 90;
    });
  }

  /**
   * Get baseline for current context
   */
  getCurrentBaseline(officerName, telemetryState, markerEvents) {
    const context = this.determineContext(telemetryState, markerEvents);
    return this.getBaseline(officerName, context);
  }
}

// Export singleton instance
export default new BaselineCalibration();
