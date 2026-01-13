/**
 * Telemetry Service - Passive logging of contextual telemetry
 * Privacy-first: Audio transcripts only, no raw audio storage
 */
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';

class TelemetryService {
  constructor() {
    this.sessionId = null;
    this.sessionStartTime = null;
    this.isSessionActive = false;
    this.telemetryData = [];
    this.lastLocation = null;
    this.movementHistory = [];
    this.audioTranscripts = [];
    this.markerEvents = [];
    this.locationSubscription = null;
    this.telemetryInterval = null;
    
    // Movement pattern tracking
    this.positionHistory = [];
    this.maxHistorySize = 100; // Keep last 100 positions for pattern analysis
    
    // Calibration data (from calibration screen)
    this.calibrationData = null;
  }

  /**
   * Start a new session
   */
  async startSession(officerName) {
    if (this.isSessionActive) {
      console.warn('Session already active');
      return;
    }

    this.sessionId = `session_${Date.now()}_${officerName}`;
    this.sessionStartTime = new Date().toISOString();
    this.isSessionActive = true;
    this.telemetryData = [];
    this.movementHistory = [];
    this.audioTranscripts = [];
    this.markerEvents = [];
    this.positionHistory = [];

    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission not granted');
    }

    // Start location tracking
    this.startLocationTracking();

    // Start periodic telemetry logging
    this.startTelemetryLogging();

    console.log(`Session started: ${this.sessionId}`);
    return this.sessionId;
  }

  /**
   * Stop the current session
   */
  stopSession() {
    if (!this.isSessionActive) {
      console.warn('No active session');
      return null;
    }

    // Stop location tracking
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    // Stop telemetry logging
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }

    const sessionData = {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      endTime: new Date().toISOString(),
      telemetryData: this.telemetryData,
      movementHistory: this.movementHistory,
      audioTranscripts: this.audioTranscripts,
      markerEvents: this.markerEvents,
    };

    // Reset state
    this.isSessionActive = false;
    this.sessionId = null;
    this.sessionStartTime = null;

    console.log(`Session stopped: ${sessionData.sessionId}`);
    return sessionData;
  }

  /**
   * Start location tracking
   */
  startLocationTracking() {
    this.locationSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        this.handleLocationUpdate(location);
      }
    );
  }

  /**
   * Handle location updates and track movement patterns
   */
  handleLocationUpdate(location) {
    const position = {
      timestamp: new Date().toISOString(),
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed || 0,
      heading: location.coords.heading || null,
    };

    // Add to position history
    this.positionHistory.push(position);
    if (this.positionHistory.length > this.maxHistorySize) {
      this.positionHistory.shift();
    }

    // Calculate movement metrics
    if (this.lastLocation) {
      const distance = this.calculateDistance(
        this.lastLocation.lat,
        this.lastLocation.lng,
        position.lat,
        position.lng
      );
      const timeDelta = (new Date(position.timestamp) - new Date(this.lastLocation.timestamp)) / 1000; // seconds
      const speed = distance / timeDelta; // m/s

      this.movementHistory.push({
        timestamp: position.timestamp,
        distance,
        speed,
        heading: position.heading,
      });
    }

    this.lastLocation = position;

    // Store telemetry entry
    this.telemetryData.push({
      type: 'location',
      ...position,
    });
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
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
   * Start periodic telemetry logging
   */
  startTelemetryLogging() {
    // Log contextual telemetry every 10 seconds
    this.telemetryInterval = setInterval(() => {
      this.logContextualTelemetry();
    }, 10000);
  }

  /**
   * Log contextual telemetry snapshot
   */
  logContextualTelemetry() {
    if (!this.isSessionActive) return;

    const telemetry = {
      type: 'contextual_snapshot',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      location: this.lastLocation
        ? {
            lat: this.lastLocation.lat,
            lng: this.lastLocation.lng,
            accuracy: this.lastLocation.accuracy,
          }
        : null,
      movementMetrics: this.getMovementMetrics(),
      sessionDuration: this.getSessionDuration(),
    };

    this.telemetryData.push(telemetry);
  }

  /**
   * Get movement metrics from recent history
   */
  getMovementMetrics() {
    if (this.movementHistory.length === 0) {
      return null;
    }

    const recent = this.movementHistory.slice(-10); // Last 10 movements
    const avgSpeed = recent.reduce((sum, m) => sum + m.speed, 0) / recent.length;
    const totalDistance = recent.reduce((sum, m) => sum + m.distance, 0);

    return {
      averageSpeed: avgSpeed,
      totalDistance: totalDistance,
      movementCount: recent.length,
    };
  }

  /**
   * Get session duration in seconds
   */
  getSessionDuration() {
    if (!this.sessionStartTime) return 0;
    return (new Date() - new Date(this.sessionStartTime)) / 1000;
  }

  /**
   * Add audio transcript (privacy-first: transcripts only)
   */
  addAudioTranscript(transcript, metadata = {}) {
    if (!this.isSessionActive) {
      console.warn('No active session');
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      transcript,
      metadata,
    };

    this.audioTranscripts.push(entry);
    this.telemetryData.push({
      type: 'audio_transcript',
      ...entry,
    });
  }

  /**
   * Add manual marker event (traffic stop, suspicious actions, etc.)
   */
  addMarkerEvent(eventType, description, metadata = {}) {
    if (!this.isSessionActive) {
      console.warn('No active session');
      return;
    }

    const marker = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      eventType, // e.g., 'traffic_stop', 'suspicious_activity', 'checkpoint', etc.
      description,
      location: this.lastLocation
        ? {
            lat: this.lastLocation.lat,
            lng: this.lastLocation.lng,
          }
        : null,
      metadata,
    };

    this.markerEvents.push(marker);
    this.telemetryData.push({
      type: 'marker_event',
      ...marker,
    });

    return marker;
  }

  /**
   * Set calibration data (from calibration screen)
   */
  setCalibrationData(calibrationData) {
    this.calibrationData = calibrationData;
  }

  /**
   * Get calibration data
   */
  getCalibrationData() {
    return this.calibrationData;
  }

  /**
   * Get current telemetry state
   */
  getTelemetryState() {
    return {
      sessionId: this.sessionId,
      isActive: this.isSessionActive,
      sessionStartTime: this.sessionStartTime,
      sessionDuration: this.getSessionDuration(),
      lastLocation: this.lastLocation,
      dataCount: this.telemetryData.length,
      movementHistoryCount: this.movementHistory.length,
      audioTranscriptCount: this.audioTranscripts.length,
      markerEventCount: this.markerEvents.length,
      calibrationData: this.calibrationData,
    };
  }

  /**
   * Get movement pattern data for edge processing
   */
  getMovementPatternData() {
    return {
      positionHistory: this.positionHistory.slice(-50), // Last 50 positions
      movementHistory: this.movementHistory.slice(-20), // Last 20 movements
      currentLocation: this.lastLocation,
    };
  }
}

// Export singleton instance
export default new TelemetryService();
