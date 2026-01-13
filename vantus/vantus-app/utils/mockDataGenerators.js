/**
 * MOCK DATA GENERATORS
 * Utility functions to generate realistic test data for development and testing
 */

import { getCurrentTimestamp } from './dateUtils';
import { getOfficerId } from './constants';

/**
 * Generate mock telemetry data point
 * @param {Object} options - Configuration options
 * @param {string} options.sessionId - Session ID
 * @param {number} options.lat - Latitude (optional, will be random if not provided)
 * @param {number} options.lng - Longitude (optional, will be random if not provided)
 * @param {number} options.speed - Speed in m/s (optional)
 * @returns {Object} Mock telemetry data point
 */
export function generateTelemetryPoint(options = {}) {
  const {
    sessionId = `session_${Date.now()}`,
    lat = null,
    lng = null,
    speed = null,
  } = options;

  // Generate random GPS coordinates around a center point if not provided
  const centerLat = lat || 49.8951;
  const centerLng = lng || -97.1384;
  const randomLat = lat || centerLat + (Math.random() - 0.5) * 0.01; // ~1km radius
  const randomLng = lng || centerLng + (Math.random() - 0.5) * 0.01;

  const randomSpeed = speed !== null ? speed : Math.random() * 5; // 0-5 m/s

  return {
    timestamp: getCurrentTimestamp(),
    sessionId,
    location: {
      lat: randomLat,
      lng: randomLng,
      accuracy: 5 + Math.random() * 10, // 5-15 meters
      altitude: 200 + Math.random() * 50,
      heading: Math.random() * 360,
    },
    movement: {
      speed: randomSpeed,
      acceleration: (Math.random() - 0.5) * 2, // -1 to 1 m/s²
      isMoving: randomSpeed > 0.5,
    },
    context: {
      inVehicle: randomSpeed > 2.0,
      onFoot: randomSpeed <= 2.0,
    },
  };
}

/**
 * Generate mock baseline data
 * @param {Object} options - Configuration options
 * @param {string} options.officerId - Officer ID
 * @param {string} options.context - Context ('on_foot' | 'in_vehicle')
 * @param {string} options.timeOfDay - Time of day ('day' | 'night')
 * @returns {Object} Mock baseline data
 */
export function generateBaseline(options = {}) {
  const {
    officerId = getOfficerId('12345'),
    context = 'on_foot',
    timeOfDay = 'day',
  } = options;

  const baseHeartRate = 70 + Math.floor(Math.random() * 10); // 70-80 BPM
  const baseSpeed = context === 'in_vehicle' ? 15 + Math.random() * 10 : 1 + Math.random() * 2;

  return {
    officerId,
    context,
    timeOfDay,
    timestamp: getCurrentTimestamp(),
    movement: {
      averageSpeed: baseSpeed,
      medianSpeed: baseSpeed * 0.9,
      stdDevSpeed: baseSpeed * 0.2,
      iqrSpeed: baseSpeed * 0.3,
      madSpeed: baseSpeed * 0.15,
      abruptStops: [],
      stationaryDurations: [5, 10, 15, 20], // seconds
      pacingPatterns: [],
    },
    biometric: {
      heartRateBaseline: baseHeartRate,
      heartRateStdDev: 5,
      heartRateIqr: 8,
    },
    audio: {
      averageSpeechRate: 150 + Math.random() * 50, // words per minute
      phraseRepetitionRate: 0.05 + Math.random() * 0.1, // 5-15%
    },
    routine: {
      durations: {
        traffic_stop: 300 + Math.floor(Math.random() * 300), // 5-10 minutes
        checkpoint: 600 + Math.floor(Math.random() * 600), // 10-20 minutes
        suspicious_activity: 180 + Math.floor(Math.random() * 180), // 3-6 minutes
      },
    },
  };
}

/**
 * Generate mock signal data
 * @param {Object} options - Configuration options
 * @param {string} options.signalType - Signal type ('movement' | 'biometric' | 'audio' | 'contextual')
 * @param {number} options.probability - Probability value (0-1)
 * @param {string} options.officerId - Officer ID
 * @returns {Object} Mock signal data
 */
export function generateSignal(options = {}) {
  const {
    signalType = 'movement',
    probability = 0.5 + Math.random() * 0.3, // 0.5-0.8
    officerId = getOfficerId('12345'),
  } = options;

  const signalId = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const baseSignal = {
    id: signalId,
    timestamp: getCurrentTimestamp(),
    officerId,
    signalType,
    probability: Math.min(0.95, Math.max(0.05, probability)), // Clamp to 0.05-0.95
    explainable: true,
  };

  // Add type-specific data
  switch (signalType) {
    case 'movement':
      return {
        ...baseSignal,
        anomaly: {
          type: 'abrupt_stop',
          value: 2.5, // m/s² deceleration
          baseline: 1.0,
          deviation: 1.5,
        },
        explanation: 'Abrupt stop detected: deceleration of 2.5 m/s² exceeds baseline of 1.0 m/s²',
      };

    case 'biometric':
      return {
        ...baseSignal,
        anomaly: {
          type: 'heart_rate_spike',
          value: 120, // BPM
          baseline: 75,
          deviation: 45,
          increasePercent: 60,
        },
        explanation: 'Heart rate spike: 120 BPM (60% above baseline of 75 BPM)',
      };

    case 'audio':
      return {
        ...baseSignal,
        anomaly: {
          type: 'speech_rate_increase',
          value: 200, // words per minute
          baseline: 150,
          deviation: 50,
        },
        explanation: 'Speech rate increase: 200 WPM (33% above baseline of 150 WPM)',
      };

    case 'contextual':
      return {
        ...baseSignal,
        anomaly: {
          type: 'routine_duration_deviation',
          value: 600, // seconds
          baseline: 300,
          deviation: 300,
        },
        explanation: 'Routine duration deviation: traffic stop lasting 600s (100% above baseline of 300s)',
      };

    default:
      return baseSignal;
  }
}

/**
 * Generate mock marker event
 * @param {Object} options - Configuration options
 * @param {string} options.eventType - Event type ('traffic_stop' | 'checkpoint' | 'suspicious_activity')
 * @param {string} options.sessionId - Session ID
 * @returns {Object} Mock marker event
 */
export function generateMarkerEvent(options = {}) {
  const {
    eventType = 'traffic_stop',
    sessionId = `session_${Date.now()}`,
  } = options;

  return {
    id: `marker_${Date.now()}`,
    timestamp: getCurrentTimestamp(),
    sessionId,
    eventType,
    description: `Mock ${eventType} event`,
    location: {
      lat: 49.8951 + (Math.random() - 0.5) * 0.01,
      lng: -97.1384 + (Math.random() - 0.5) * 0.01,
      accuracy: 5 + Math.random() * 10,
    },
    metadata: {
      manual: true,
      source: 'mock_generator',
    },
  };
}

/**
 * Generate mock audio transcript
 * @param {Object} options - Configuration options
 * @param {string} options.sessionId - Session ID
 * @param {string} options.transcript - Transcript text (optional, will be generated if not provided)
 * @returns {Object} Mock audio transcript
 */
export function generateAudioTranscript(options = {}) {
  const {
    sessionId = `session_${Date.now()}`,
    transcript = null,
  } = options;

  const mockTranscripts = [
    'License and registration please',
    'Step out of the vehicle',
    'Do you have any weapons in the vehicle?',
    'You have the right to remain silent',
    'Everything is under control',
  ];

  return {
    timestamp: getCurrentTimestamp(),
    sessionId,
    transcript: transcript || mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)],
    metadata: {
      confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95
      language: 'en',
      source: 'mock_generator',
    },
  };
}

/**
 * Generate mock session data
 * @param {Object} options - Configuration options
 * @param {string} options.officerId - Officer ID
 * @param {number} options.durationMinutes - Session duration in minutes
 * @returns {Object} Mock session data
 */
export function generateSessionData(options = {}) {
  const {
    officerId = getOfficerId('12345'),
    durationMinutes = 60,
  } = options;

  const sessionId = `session_${Date.now()}`;
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  // Generate telemetry points (one per minute)
  const telemetryData = [];
  for (let i = 0; i < durationMinutes; i++) {
    telemetryData.push(generateTelemetryPoint({ sessionId }));
  }

  // Generate marker events (2-5 events)
  const markerEvents = [];
  const eventTypes = ['traffic_stop', 'checkpoint', 'suspicious_activity'];
  const numEvents = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numEvents; i++) {
    markerEvents.push(generateMarkerEvent({
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      sessionId,
    }));
  }

  // Generate audio transcripts (5-10 transcripts)
  const audioTranscripts = [];
  const numTranscripts = 5 + Math.floor(Math.random() * 6);
  for (let i = 0; i < numTranscripts; i++) {
    audioTranscripts.push(generateAudioTranscript({ sessionId }));
  }

  return {
    sessionId,
    officerId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: durationMinutes * 60, // seconds
    telemetryData,
    markerEvents,
    audioTranscripts,
    baseline: generateBaseline({ officerId }),
  };
}

/**
 * Generate mock detection result
 * @param {Object} options - Configuration options
 * @param {string} options.category - Detection category ('weapon' | 'stance' | 'hands' | 'biometric' | 'audio')
 * @param {boolean} options.detected - Whether detection occurred
 * @returns {Object} Mock detection result
 */
export function generateDetectionResult(options = {}) {
  const {
    category = 'weapon',
    detected = Math.random() > 0.7, // 30% chance of detection
  } = options;

  const baseResult = {
    detected,
    category,
    timestamp: getCurrentTimestamp(),
    confidence: detected ? 0.7 + Math.random() * 0.2 : 0.3 + Math.random() * 0.2, // 0.7-0.9 if detected, 0.3-0.5 if not
  };

  switch (category) {
    case 'weapon':
      return {
        ...baseResult,
        detections: detected ? [{
          class: 'handgun',
          confidence: baseResult.confidence,
          bbox: [100, 100, 200, 200], // [x, y, width, height]
        }] : [],
      };

    case 'stance':
      return {
        ...baseResult,
        stanceType: detected ? 'fighting_stance' : 'neutral',
        keypoints: detected ? {
          leftShoulder: { x: 100, y: 100 },
          rightShoulder: { x: 200, y: 100 },
          leftHip: { x: 100, y: 200 },
          rightHip: { x: 200, y: 200 },
        } : null,
      };

    case 'hands':
      return {
        ...baseResult,
        pattern: detected ? 'waistband_reach' : 'visible',
        handPositions: {
          left: { x: 100, y: 150, visible: true },
          right: { x: 200, y: 150, visible: detected ? false : true },
        },
      };

    case 'biometric':
      return {
        ...baseResult,
        heartRate: detected ? 120 : 75,
        baseline: 75,
        increase: detected ? 0.6 : 0, // 60% increase if detected
      };

    case 'audio':
      return {
        ...baseResult,
        pattern: detected ? 'elevated_stress' : 'normal',
        speechRate: detected ? 200 : 150, // words per minute
      };

    default:
      return baseResult;
  }
}

/**
 * Generate multiple mock signals for testing
 * @param {number} count - Number of signals to generate
 * @param {Object} options - Configuration options
 * @returns {Array} Array of mock signals
 */
export function generateMultipleSignals(count = 10, options = {}) {
  const signalTypes = ['movement', 'biometric', 'audio', 'contextual'];
  const signals = [];

  for (let i = 0; i < count; i++) {
    const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)];
    signals.push(generateSignal({
      ...options,
      signalType,
      probability: 0.3 + Math.random() * 0.5, // 0.3-0.8
    }));
  }

  return signals;
}
