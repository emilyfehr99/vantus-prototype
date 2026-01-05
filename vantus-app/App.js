import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { io } from 'socket.io-client';
import detectionService from './services/detectionService';
import poseService from './services/poseService';
import offlineBuffer from './services/offlineBuffer';
import videoBuffer from './services/videoBuffer';

// Bridge server URL - update this to match your server
const BRIDGE_SERVER_URL = 'http://localhost:3001';

// Simulated GPS coordinates (Winnipeg)
const SIMULATED_GPS = { lat: 49.8951, lng: -97.1384 };

// Simulated officer name
const OFFICER_NAME = 'OFFICER_ALPHA';

// Simulated baseline heart rate (in production, use actual sensor)
const BASELINE_HEART_RATE = 70;

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [alertActive, setAlertActive] = useState(false);
  const [socket, setSocket] = useState(null);
  const cameraRef = useRef(null);
  const [detectionActive, setDetectionActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [poseReady, setPoseReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [heartRate, setHeartRate] = useState(BASELINE_HEART_RATE);
  const detectionIntervalRef = useRef(null);
  const heartRateIntervalRef = useRef(null);

  useEffect(() => {
    // Request camera permission
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Initialize services
    const initServices = async () => {
      try {
        setModelLoading(true);
        
        // Initialize detection service
        await detectionService.initialize();
        setModelReady(true);
        console.log('Detection model ready');
        
        // Initialize pose service
        await poseService.initialize();
        setPoseReady(true);
        console.log('Pose estimation service ready');
        
        // Initialize offline buffer
        await offlineBuffer.initialize();
        console.log('Offline buffer initialized');
        
        // Initialize video buffer
        await videoBuffer.initialize();
        console.log('Video buffer initialized');
        
      } catch (error) {
        console.error('Failed to initialize services:', error);
        Alert.alert(
          'Initialization Error',
          'Some services failed to initialize. Basic functionality may be limited.'
        );
      } finally {
        setModelLoading(false);
      }
    };

    initServices();

    // Connect to bridge server
    const newSocket = io(BRIDGE_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    newSocket.on('connect', async () => {
      console.log('Connected to bridge server');
      setIsConnected(true);
      offlineBuffer.setConnectionStatus(true);
      
      // Dump any buffered alerts
      const sentCount = await offlineBuffer.dumpAlerts((alert) => {
        return new Promise((resolve, reject) => {
          newSocket.emit('THREAT_DETECTED', alert, (ack) => {
            if (ack) resolve();
            else reject(new Error('Server rejected alert'));
          });
        });
      });
      
      if (sentCount > 0) {
        console.log(`Sent ${sentCount} buffered alerts`);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from bridge server');
      setIsConnected(false);
      offlineBuffer.setConnectionStatus(false);
    });

    // Listen for backup confirmation (TTS)
    newSocket.on('BACKUP_CONFIRMED', (data) => {
      console.log('BACKUP_CONFIRMED received:', data);
      const message = data.message || `Officer ${OFFICER_NAME}, Priority ${data.priority || 1} Backup is en route. ETA ${data.eta || 'unknown'} minutes.`;
      Speech.speak(message, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    });

    setSocket(newSocket);

    // Simulate heart rate monitoring (in production, use actual sensor)
    heartRateIntervalRef.current = setInterval(() => {
      // Simulate heart rate fluctuations
      const baseRate = alertActive ? BASELINE_HEART_RATE + 30 : BASELINE_HEART_RATE;
      const variation = Math.random() * 10 - 5;
      setHeartRate(Math.max(60, Math.min(120, baseRate + variation)));
    }, 2000);

    return () => {
      newSocket.close();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (heartRateIntervalRef.current) {
        clearInterval(heartRateIntervalRef.current);
      }
    };
  }, []);

  // Simulated threat detection (manual button press)
  const simulateThreat = () => {
    triggerThreatAlert({ simulated: true });
  };

  // Real camera detection with pose analysis
  const detectThreatFromCamera = async () => {
    if (!cameraRef.current || alertActive || !modelReady) {
      if (!modelReady) {
        console.log('Model not ready yet');
      }
      return;
    }

    try {
      // Take a picture from the camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: false,
      });

      if (!photo || !photo.uri) {
        console.log('No photo data available');
        return;
      }

      // Add frame to rolling buffer (Privacy-by-Design)
      await videoBuffer.addFrame(photo.uri, {
        timestamp: Date.now(),
        detectionActive: true
      });

      console.log('Processing frame for detection...');
      
      // Run object detection
      const objectResult = await detectionService.detectObjects(photo.uri);
      
      // Run pose analysis (if pose service is ready)
      let poseResult = null;
      let threatAssessment = null;
      
      if (poseReady) {
        poseResult = await poseService.analyzePose(photo.uri);
        threatAssessment = poseService.assessThreatLevel(poseResult, heartRate, BASELINE_HEART_RATE);
      }
      
      // Check for threats
      const objectThreat = objectResult.detected;
      const behavioralThreat = threatAssessment && threatAssessment.threatLevel === 'HIGH';
      
      if (objectThreat || behavioralThreat) {
        console.log('THREAT DETECTED!', {
          object: objectThreat,
          behavioral: behavioralThreat,
          threatAssessment
        });
        
        // Save video buffer (last 30 seconds)
        const alertId = `alert_${Date.now()}`;
        const bufferPath = await videoBuffer.saveBuffer(alertId);
        
        triggerThreatAlert({
          objectDetection: objectResult,
          poseAnalysis: poseResult,
          threatAssessment,
          videoBuffer: bufferPath,
          heartRate,
          alertId
        });
      } else {
        console.log('No threat detected. Objects:', objectResult.allDetections.length, 'Pose:', poseResult?.bladedStance ? 'Bladed' : 'Normal');
      }
      
    } catch (error) {
      console.error('Detection error:', error);
    }
  };

  // Start continuous detection loop
  const startDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    setDetectionActive(true);
    // Run detection every 2 seconds
    detectionIntervalRef.current = setInterval(() => {
      detectThreatFromCamera();
    }, 2000);
  };

  // Stop detection loop
  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setDetectionActive(false);
    // Clear video buffer when stopping (privacy)
    videoBuffer.clear();
  };

  const triggerThreatAlert = async (additionalData = {}) => {
    if (alertActive) return;

    setAlertActive(true);

    // Trigger loud vibration
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 200);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 400);

    // Prepare threat data
    const threatData = {
      officerName: OFFICER_NAME,
      location: SIMULATED_GPS,
      timestamp: new Date().toISOString(),
      heartRate,
      ...additionalData
    };

    // Send alert (with offline buffering)
    if (socket && socket.connected && isConnected) {
      try {
        socket.emit('THREAT_DETECTED', threatData);
        console.log('THREAT_DETECTED emitted:', threatData);
      } catch (error) {
        console.error('Error sending alert:', error);
        // Buffer for retry
        await offlineBuffer.addAlert(threatData);
      }
    } else {
      // Offline - buffer the alert
      console.log('Offline - buffering alert');
      await offlineBuffer.addAlert(threatData);
      Alert.alert('Offline', 'Alert buffered. Will send when connection restored.');
    }
  };

  const clearAlert = () => {
    setAlertActive(false);
    
    if (socket && socket.connected) {
      socket.emit('ALERT_CLEARED');
      console.log('ALERT_CLEARED emitted');
    }
    
    // Clear video buffer (privacy)
    videoBuffer.clear();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bufferStatus = offlineBuffer.getStatus();

  return (
    <View style={styles.container}>
      {/* Camera feed in background */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => {
          console.log('Camera ready');
        }}
      />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {alertActive ? (
          <View style={styles.alertContainer}>
            <Text style={styles.alertText}>THREAT DETECTED</Text>
            <Text style={styles.alertSubtext}>Alert sent to dashboard</Text>
          </View>
        ) : (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>PRIVACY MODE ACTIVE</Text>
            <Text style={styles.statusSubtext}>
              {detectionActive ? 'Detection Active...' : 'Monitoring...'}
            </Text>
            {modelLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingText}>Loading detection model...</Text>
              </View>
            )}
            {!modelReady && !modelLoading && (
              <Text style={styles.warningText}>Detection model not available</Text>
            )}
            {!isConnected && (
              <Text style={styles.warningText}>
                Offline ({bufferStatus.count} alerts buffered)
              </Text>
            )}
            <Text style={styles.heartRateText}>HR: {Math.round(heartRate)} BPM</Text>
          </View>
        )}

        {/* Simulated Threat button */}
        <TouchableOpacity
          style={[styles.button, styles.simulateButton]}
          onPress={simulateThreat}
        >
          <Text style={styles.buttonText}>SIMULATED THREAT</Text>
        </TouchableOpacity>

        {/* Start/Stop Detection button */}
        <TouchableOpacity
          style={[styles.button, detectionActive ? styles.stopDetectionButton : styles.startDetectionButton]}
          onPress={detectionActive ? stopDetection : startDetection}
          disabled={!modelReady}
        >
          <Text style={[styles.buttonText, !modelReady && styles.buttonTextDisabled]}>
            {detectionActive ? 'STOP DETECTION' : 'START DETECTION'}
          </Text>
        </TouchableOpacity>

        {/* Stop/Clear button */}
        {alertActive && (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={clearAlert}
          >
            <Text style={styles.buttonText}>STOP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusText: {
    color: '#00FF00',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusSubtext: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  heartRateText: {
    color: '#FFAA00',
    fontSize: 14,
    marginTop: 10,
  },
  alertContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  alertText: {
    color: '#FF0000',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertSubtext: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  simulateButton: {
    backgroundColor: '#333333',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  startDetectionButton: {
    backgroundColor: '#0066FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stopDetectionButton: {
    backgroundColor: '#FF6600',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stopButton: {
    backgroundColor: '#FF0000',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
  },
  warningText: {
    color: '#FFAA00',
    fontSize: 14,
    marginTop: 10,
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
});
