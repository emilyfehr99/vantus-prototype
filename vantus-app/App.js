import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { io } from 'socket.io-client';
import detectionService from './services/detectionService';

// Bridge server URL - update this to match your server
const BRIDGE_SERVER_URL = 'http://localhost:3001';

// Simulated GPS coordinates (Winnipeg)
const SIMULATED_GPS = { lat: 49.8951, lng: -97.1384 };

// Simulated officer name
const OFFICER_NAME = 'OFFICER_ALPHA';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [alertActive, setAlertActive] = useState(false);
  const [socket, setSocket] = useState(null);
  const cameraRef = useRef(null);
  const [detectionActive, setDetectionActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const detectionIntervalRef = useRef(null);

  useEffect(() => {
    // Request camera permission
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Initialize detection service
    const initDetection = async () => {
      try {
        setModelLoading(true);
        await detectionService.initialize();
        setModelReady(true);
        console.log('Detection model ready');
      } catch (error) {
        console.error('Failed to initialize detection model:', error);
        Alert.alert(
          'Model Loading Error',
          'Failed to load detection model. Simulated threat mode will still work.'
        );
      } finally {
        setModelLoading(false);
      }
    };

    initDetection();

    // Connect to bridge server
    const newSocket = io(BRIDGE_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to bridge server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from bridge server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Simulated threat detection (manual button press)
  const simulateThreat = () => {
    triggerThreatAlert();
  };

  // Real camera detection using TensorFlow.js
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

      console.log('Processing frame for detection...');
      
      // Run object detection
      const result = await detectionService.detectObjects(photo.uri);
      
      if (result.detected) {
        console.log('THREAT DETECTED! Cell phone found:', result.detections);
        triggerThreatAlert();
      } else {
        console.log('No threat detected. Objects found:', result.allDetections.length);
      }
      
    } catch (error) {
      console.error('Detection error:', error);
      // Don't show alert to user for detection errors, just log
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
  };

  const triggerThreatAlert = async () => {
    if (alertActive) return;

    setAlertActive(true);

    // Trigger loud vibration
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    // Repeat vibration for intensity
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 200);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 400);

    // Emit THREAT_DETECTED event to bridge server
    if (socket && socket.connected) {
      const threatData = {
        officerName: OFFICER_NAME,
        location: SIMULATED_GPS,
        timestamp: new Date().toISOString(),
      };

      socket.emit('THREAT_DETECTED', threatData);
      console.log('THREAT_DETECTED emitted:', threatData);
    } else {
      Alert.alert('Error', 'Not connected to bridge server');
    }
  };

  const clearAlert = () => {
    setAlertActive(false);
    
    if (socket && socket.connected) {
      socket.emit('ALERT_CLEARED');
      console.log('ALERT_CLEARED emitted');
    }
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

  return (
    <View style={styles.container}>
      {/* Camera feed in background */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => {
          console.log('Camera ready');
          // Optionally start detection automatically
          // startDetection();
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

