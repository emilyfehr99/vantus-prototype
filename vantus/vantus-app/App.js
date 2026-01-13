import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { io } from 'socket.io-client';
import detectionService from './services/detectionService';
import telemetryService from './services/telemetryService';
import edgeIntelligence from './services/edgeIntelligence';
import baselineRelativeSignals from './services/baselineRelativeSignals';
import baselineCalibration from './services/baselineCalibration';
import AuthenticationScreen from './components/AuthenticationScreen';
import CalibrationScreen from './components/CalibrationScreen';
import WelfareCheckPrompt from './components/WelfareCheckPrompt';
import multiModelDetection from './services/multiModelDetection';
import modelLoader from './services/modelLoader';
import modelRegistry from './services/modelRegistry';
import voiceAdvisory from './services/voiceAdvisory';
import autoDispatch from './services/autoDispatch';
import videoBuffer from './services/videoBuffer';
import welfareCheck from './services/welfareCheck';
import configService from './utils/config';
import { getOfficerId, getServerUrl } from './utils/constants';

// Bridge server URL - now from config
const BRIDGE_SERVER_URL = configService.getServerUrl('bridge') || 'http://localhost:3001';

// GPS coordinates - now from config
const SIMULATED_GPS = configService.getMapCenter();

export default function App() {
  // Authentication & Calibration State
  const [authenticated, setAuthenticated] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [badgeNumber, setBadgeNumber] = useState(null);
  const [calibrationData, setCalibrationData] = useState(null);
  const [appMode, setAppMode] = useState('auth'); // 'auth' | 'calibration' | 'standby' | 'active'

  // Camera & Detection State
  const [hasPermission, setHasPermission] = useState(null);
  const [alertActive, setAlertActive] = useState(false);
  const [socket, setSocket] = useState(null);
  const cameraRef = useRef(null);
  const [detectionActive, setDetectionActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const detectionIntervalRef = useRef(null);
  
  // Session & Telemetry State
  const [sessionActive, setSessionActive] = useState(false);
  const [telemetryState, setTelemetryState] = useState(null);
  const [contextualSignals, setContextualSignals] = useState([]);
  const signalAnalysisIntervalRef = useRef(null);

  // Handle authentication
  const handleAuthenticated = (badge) => {
    setBadgeNumber(badge);
    setAuthenticated(true);
    setAppMode('calibration');
  };

  // Handle calibration complete
  const handleCalibrationComplete = (data) => {
    setCalibrationData(data);
    setCalibrated(true);
    setAppMode('standby');
    
    // Store calibration data in telemetry service for detection use
    telemetryService.setCalibrationData(data);
    
    // Show completion message
    Alert.alert(
      'Calibration Complete',
      'Vantus Active. Stay safe.',
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  useEffect(() => {
    // Only request camera permission after calibration
    if (calibrated) {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    }

    // Initialize detection service (legacy COCO-SSD)
    const initDetection = async () => {
      try {
        setModelLoading(true);
        await detectionService.initialize();
        setModelReady(true);
        console.log('Legacy detection model ready');
      } catch (error) {
        console.error('Failed to initialize detection model:', error);
        // Don't show alert - models may not be available yet
      } finally {
        setModelLoading(false);
      }
    };

    // Initialize multi-model detection system
    const initMultiModelDetection = async () => {
      try {
        // Load models when paths are available
        // In production, these paths would come from config or API
        const modelPaths = {
          // weapon: 'path/to/yolov8-nano/model.json',
          // stance: 'path/to/movenet/model.json',
          // hands: 'path/to/movenet/model.json', // Can share with stance
          // audio: 'path/to/audio-classifier/model.json',
        };
        
        // Only load if paths are provided
        if (Object.keys(modelPaths).length > 0) {
          await modelLoader.loadAllModels(modelPaths);
          console.log('Multi-model detection system initialized');
        } else {
          console.log('Model paths not configured - models will load when available');
        }
      } catch (error) {
        console.error('Failed to initialize multi-model detection:', error);
        // Models will remain in 'pending' status
      }
    };

    initDetection();
    initMultiModelDetection();

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
      voiceAdvisory.connectionLost();
    });

    newSocket.on('connect', () => {
      if (sessionActive) {
        voiceAdvisory.connectionRestored();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (signalAnalysisIntervalRef.current) {
        clearInterval(signalAnalysisIntervalRef.current);
      }
      // Stop session if active
      if (sessionActive) {
        telemetryService.stopSession();
      }
    };
  }, [sessionActive]);

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

  // Start session (manual session start)
  const startSession = async () => {
    try {
      // Use badge number as officer identifier
      const officerName = getOfficerId(badgeNumber);
      const sessionId = await telemetryService.startSession(officerName);
      setSessionActive(true);
      setAppMode('active');
      
      // Initialize systems
      // 1. Voice advisory
      voiceAdvisory.vantusActive();
      
      // 2. Video buffer
      videoBuffer.setCameraRef(cameraRef.current);
      await videoBuffer.startBuffer();
      
      // 3. Start periodic welfare checks (after 10 minutes)
      setTimeout(() => {
        const officerInfo = {
          badgeNumber: badgeNumber,
          name: null, // Would come from roster
          unit: null, // Would come from roster
        };
        welfareCheck.startPeriodicChecks(telemetryService.getTelemetryState(), officerInfo, 10);
      }, 10 * 60 * 1000); // 10 minutes
      
      // Start signal analysis loop (every 30 seconds)
      // Signals are baseline-relative (per-officer, per-context)
      signalAnalysisIntervalRef.current = setInterval(() => {
        analyzeAndSendSignals();
      }, 30000);
      
      // Start auto-dispatch monitoring (every 5 seconds)
      const dispatchCheckInterval = setInterval(() => {
        checkAutoDispatch();
      }, 5000);
      
      // Store interval for cleanup
      if (!window.dispatchInterval) {
        window.dispatchInterval = dispatchCheckInterval;
      }
      
      // Send initial session start to bridge
      if (socket && socket.connected) {
        socket.emit('SESSION_STARTED', {
          officerName: officerName,
          badgeNumber: badgeNumber,
          sessionId,
          timestamp: new Date().toISOString(),
          calibrationData: calibrationData, // Include calibration data
        });
      }
      
      console.log('Session started:', sessionId);
    } catch (error) {
      console.error('Failed to start session:', error);
      Alert.alert('Error', 'Failed to start session');
    }
  };

  // Check auto-dispatch conditions
  const checkAutoDispatch = async () => {
    if (!sessionActive) return;

    try {
      const state = telemetryService.getTelemetryState();
      const officerInfo = {
        badgeNumber: badgeNumber,
        name: null, // Would come from roster
        unit: null, // Would come from roster
      };

      // Run multi-model detections
      const detectionResults = await multiModelDetection.runAllDetections(
        null, // imageUri - would be from camera
        null, // audioData
        null, // heartRate - would be from wearable
        getOfficerId(badgeNumber),
        null, // context
        calibrationData
      );

      // Check auto-dispatch conditions
      const dispatched = await autoDispatch.checkAutoDispatchConditions(
        detectionResults,
        state,
        officerInfo
      );

      if (dispatched) {
        // Trigger video clip save
        await videoBuffer.triggerClipSave({
          type: 'AUTO_DISPATCH',
          timestamp: new Date().toISOString(),
        });

        // Voice advisory
        voiceAdvisory.backupDispatched();
      }
    } catch (error) {
      console.error('Auto-dispatch check error:', error);
    }
  };

  // Manual dispatch button handler
  const handleManualDispatch = async () => {
    if (!sessionActive) {
      Alert.alert('Session Required', 'Please start a session first');
      return;
    }

    const confirmed = await new Promise((resolve) => {
      Alert.alert(
        'Dispatch Backup',
        'Are you sure you want to request emergency backup?',
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Dispatch', onPress: () => resolve(true), style: 'destructive' },
        ]
      );
    });

    if (!confirmed) return;

    try {
      const state = telemetryService.getTelemetryState();
      const officerInfo = {
        badgeNumber: badgeNumber,
        name: null,
        unit: null,
      };

      const dispatchPayload = await autoDispatch.manualDispatch(
        null,
        state,
        officerInfo
      );

      // Trigger video clip save
      await videoBuffer.triggerClipSave({
        type: 'MANUAL_DISPATCH',
        timestamp: new Date().toISOString(),
      });

      // Voice advisory
      voiceAdvisory.backupDispatched();

      // Send to bridge server
      if (socket && socket.connected) {
        socket.emit('EMERGENCY_DISPATCH', dispatchPayload);
      }

      Alert.alert('Backup Dispatched', 'Emergency backup has been requested');
    } catch (error) {
      console.error('Manual dispatch error:', error);
      Alert.alert('Error', 'Failed to dispatch backup');
    }
  };

  // Handle welfare check response
  const handleWelfareResponse = (responseType) => {
    const state = telemetryService.getTelemetryState();
    const officerInfo = {
      badgeNumber: badgeNumber,
      name: null,
      unit: null,
    };

    const result = welfareCheck.handleResponse(responseType, state, officerInfo);
    
    if (result.action === 'dispatched') {
      Alert.alert('Backup Dispatched', 'Emergency backup has been requested');
    }
    
    return result;
  };

  // Stop session (manual session stop)
  const stopSession = async () => {
    if (!sessionActive) return;
    
    const sessionData = telemetryService.stopSession();
    setSessionActive(false);
    setAppMode('standby');
    
    // Stop systems
    await videoBuffer.stopBuffer();
    welfareCheck.clearPeriodicChecks();
    welfareCheck.clearWelfareTimer();
    
    if (signalAnalysisIntervalRef.current) {
      clearInterval(signalAnalysisIntervalRef.current);
      signalAnalysisIntervalRef.current = null;
    }
    
    if (window.dispatchInterval) {
      clearInterval(window.dispatchInterval);
      window.dispatchInterval = null;
    }
    
    // Update baseline calibration at session end
    try {
      const officerName = getOfficerId(badgeNumber);
      baselineCalibration.accumulateSessionData(
        sessionData.sessionId,
        sessionData.telemetryData,
        sessionData.movementHistory,
        sessionData.audioTranscripts,
        sessionData.markerEvents
      );
      baselineCalibration.updateBaseline(officerName, sessionData.sessionId);
      console.log('Baseline updated for session:', sessionData.sessionId);
    } catch (error) {
      console.error('Failed to update baseline:', error);
    }
    
    // Send session end to bridge
    if (socket && socket.connected) {
      socket.emit('SESSION_ENDED', {
        officerName: `OFFICER_${badgeNumber}`,
        badgeNumber: badgeNumber,
        sessionId: sessionData.sessionId,
        timestamp: new Date().toISOString(),
        summary: {
          duration: sessionData.endTime - sessionData.startTime,
          telemetryCount: sessionData.telemetryData.length,
          markerCount: sessionData.markerEvents.length,
        },
      });
    }
    
    console.log('Session stopped:', sessionData.sessionId);
  };

  // Analyze and send contextual signals (baseline-relative)
  const analyzeAndSendSignals = () => {
    if (!sessionActive) return;
    
    const state = telemetryService.getTelemetryState();
    const movementData = telemetryService.getMovementPatternData();
    const audioTranscripts = telemetryService.audioTranscripts;
    const markerEvents = telemetryService.markerEvents;
    const calData = telemetryService.getCalibrationData(); // Get calibration data
    
    // Generate baseline-relative signals
    // This uses per-officer baselines, not global thresholds
    const officerName = `OFFICER_${badgeNumber}`;
    const signals = baselineRelativeSignals.generateAllSignals(
      state,
      movementData,
      audioTranscripts,
      markerEvents,
      officerName
    );
    
    // Run multi-model detections (weapon, stance, hands, biometric, audio)
    // Note: Models may not be loaded yet, but system is ready
    (async () => {
      try {
        // Get current heart rate if available (from wearable)
        const currentHeartRate = calData?.heartRateBaseline || null; // In production, get from wearable
        
        // Add heart rate to auto-dispatch monitoring
        if (currentHeartRate) {
          autoDispatch.addHeartRateReading(currentHeartRate);
        }
        
        // Add movement data to auto-dispatch monitoring
        if (movementData.movementHistory && movementData.movementHistory.length > 0) {
          const latestMovement = movementData.movementHistory[movementData.movementHistory.length - 1];
          autoDispatch.addMovementReading(latestMovement);
        }
        
        // Run all detections
        const detectionResults = await multiModelDetection.runAllDetections(
          null, // imageUri - would be from camera frame
          null, // audioData - would be from audio capture
          currentHeartRate, // heartRate - from wearable
          officerName,
          null, // context
          calData // calibrationData for biometric baseline
        );
        
        // Process voice advisories based on detections
        if (detectionResults && detectionResults.detections) {
          Object.values(detectionResults.detections).forEach(detection => {
            if (detection.detected) {
              voiceAdvisory.processDetection(detection);
              
              // Trigger video clip save on threat detection
              if (detection.category === 'weapon' && detection.confidence >= 0.70) {
                videoBuffer.triggerClipSave({
                  type: 'WEAPON_DETECTED',
                  timestamp: new Date().toISOString(),
                  confidence: detection.confidence,
                });
              }
            }
          });
        }
        
        console.log('Multi-model detection results:', detectionResults);
      } catch (error) {
        console.error('Multi-model detection error:', error);
        // Continue even if detection fails
      }
    })();
    
    // Fallback to old edge intelligence if baseline not available yet
    // (for first few sessions before baseline is established)
    let finalSignals = signals;
    if (signals.length === 0) {
      const fallbackSignals = edgeIntelligence.generateContextualSignals(
        state,
        movementData,
        audioTranscripts,
        markerEvents
      );
      finalSignals = fallbackSignals;
    }
    
    if (finalSignals.length > 0) {
      setContextualSignals(prev => [...prev, ...finalSignals].slice(-20)); // Keep last 20
      
      // Send signals to bridge server (for supervisors only)
      if (socket && socket.connected) {
        socket.emit('CONTEXTUAL_SIGNALS', {
          officerName: getOfficerId(badgeNumber),
          badgeNumber: badgeNumber,
          sessionId: state.sessionId,
          signals: finalSignals,
          timestamp: new Date().toISOString(),
        });
      }
    }
    
    // Update telemetry state display
    setTelemetryState(state);
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

  // Add manual marker event
  const addMarkerEvent = (eventType) => {
    if (!sessionActive) {
      Alert.alert('Session Required', 'Please start a session first');
      return;
    }
    
    const marker = telemetryService.addMarkerEvent(
      eventType,
      `Manual marker: ${eventType}`,
      { manual: true }
    );
    
    // Send marker to bridge
    if (socket && socket.connected) {
      socket.emit('MARKER_EVENT', {
        officerName: `OFFICER_${badgeNumber}`,
        badgeNumber: badgeNumber,
        marker,
      });
    }
    
    Alert.alert('Marker Added', `Event: ${eventType}`);
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
      const location = telemetryState?.lastLocation || SIMULATED_GPS;
      const threatData = {
        officerName: badgeNumber ? getOfficerId(badgeNumber) : 'UNKNOWN',
        badgeNumber: badgeNumber,
        location: location,
        timestamp: new Date().toISOString(),
      };

      socket.emit('THREAT_DETECTED', threatData);
      console.log('THREAT_DETECTED emitted:', threatData);
      
      // Trigger video clip save
      videoBuffer.triggerClipSave({
        type: 'THREAT_DETECTED',
        timestamp: new Date().toISOString(),
      });
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

  // Show authentication screen
  if (appMode === 'auth' || !authenticated) {
    return <AuthenticationScreen onAuthenticated={handleAuthenticated} />;
  }

  // Show calibration screen
  if (appMode === 'calibration' || !calibrated) {
    return (
      <CalibrationScreen
        badgeNumber={badgeNumber}
        onCalibrationComplete={handleCalibrationComplete}
      />
    );
  }

  // Standby mode - show ready screen
  if (appMode === 'standby' && !sessionActive) {
    return (
      <View style={styles.container}>
        <View style={styles.standbyContainer}>
          <Text style={styles.standbyTitle}>VANTUS ACTIVE</Text>
          <Text style={styles.standbySubtitle}>Officer {badgeNumber}</Text>
          <Text style={styles.standbyMessage}>Stay safe.</Text>
          <Text style={styles.standbyStatus}>Standby Mode</Text>
          <TouchableOpacity
            style={styles.startSessionButton}
            onPress={startSession}
          >
            <Text style={styles.startSessionButtonText}>START SESSION</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera permission checks (only after calibration)
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
      <ScrollView style={styles.overlay} contentContainerStyle={styles.overlayContent}>
        {alertActive ? (
          <View style={styles.alertContainer}>
            <Text style={styles.alertText}>THREAT DETECTED</Text>
            <Text style={styles.alertSubtext}>Alert sent to dashboard</Text>
          </View>
        ) : (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {sessionActive ? 'SESSION ACTIVE' : 'PRIVACY MODE ACTIVE'}
            </Text>
            <Text style={styles.statusSubtext}>
              {sessionActive 
                ? `Session: ${telemetryState?.sessionId?.substring(0, 15)}...`
                : detectionActive 
                  ? 'Detection Active...' 
                  : 'Monitoring...'}
            </Text>
            {telemetryState && (
              <Text style={styles.telemetryInfo}>
                Data Points: {telemetryState.dataCount} | 
                Markers: {telemetryState.markerEventCount}
              </Text>
            )}
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

        {/* Session Controls */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, sessionActive ? styles.stopSessionButton : styles.startSessionButton]}
            onPress={sessionActive ? stopSession : startSession}
          >
            <Text style={styles.buttonText}>
              {sessionActive ? 'STOP SESSION' : 'START SESSION'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Marker Event Buttons */}
        {sessionActive && (
          <View style={styles.buttonGroup}>
            <Text style={styles.sectionLabel}>MARKER EVENTS</Text>
            <TouchableOpacity
              style={[styles.button, styles.markerButton]}
              onPress={() => addMarkerEvent('traffic_stop')}
            >
              <Text style={styles.buttonText}>TRAFFIC STOP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.markerButton]}
              onPress={() => addMarkerEvent('suspicious_activity')}
            >
              <Text style={styles.buttonText}>SUSPICIOUS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.markerButton]}
              onPress={() => addMarkerEvent('checkpoint')}
            >
              <Text style={styles.buttonText}>CHECKPOINT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Detection Controls */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, detectionActive ? styles.stopDetectionButton : styles.startDetectionButton]}
            onPress={detectionActive ? stopDetection : startDetection}
            disabled={!modelReady}
          >
            <Text style={[styles.buttonText, !modelReady && styles.buttonTextDisabled]}>
              {detectionActive ? 'STOP DETECTION' : 'START DETECTION'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Dispatch Button */}
        {sessionActive && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.emergencyButton]}
              onPress={handleManualDispatch}
            >
              <Text style={styles.buttonText}>EMERGENCY BACKUP</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Welfare Check Response (if active) */}
        {welfareCheck.getStatus().promptActive && (
          <View style={styles.buttonGroup}>
            <Text style={styles.welfarePrompt}>Status check: Are you okay?</Text>
            <View style={styles.welfareButtons}>
              <TouchableOpacity
                style={[styles.button, styles.welfareOkButton]}
                onPress={() => handleWelfareResponse('ok')}
              >
                <Text style={styles.buttonText}>I'M OK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.welfareBackupButton]}
                onPress={() => handleWelfareResponse('need_backup')}
              >
                <Text style={styles.buttonText}>NEED BACKUP</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Simulated Threat button */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.simulateButton]}
            onPress={simulateThreat}
          >
            <Text style={styles.buttonText}>SIMULATED THREAT</Text>
          </TouchableOpacity>
        </View>

        {/* Stop/Clear button */}
        {alertActive && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={clearAlert}
            >
              <Text style={styles.buttonText}>STOP</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Welfare Check Prompt Modal */}
      <WelfareCheckPrompt
        visible={welfareCheck.getStatus().promptActive}
        onResponse={handleWelfareResponse}
      />
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
  },
  overlayContent: {
    padding: 20,
    alignItems: 'center',
  },
  buttonGroup: {
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  telemetryInfo: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 5,
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
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 5,
    minWidth: 200,
    alignItems: 'center',
  },
  startSessionButton: {
    backgroundColor: '#00AA00',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stopSessionButton: {
    backgroundColor: '#AA0000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markerButton: {
    backgroundColor: '#666666',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    minWidth: 150,
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
  standbyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  standbyTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00FF41',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  standbySubtitle: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 20,
    fontWeight: '700',
  },
  standbyMessage: {
    fontSize: 18,
    color: '#00FF41',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  standbyStatus: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  startSessionButton: {
    backgroundColor: '#00FF41',
    padding: 20,
    borderRadius: 10,
    minWidth: 250,
    alignItems: 'center',
  },
  startSessionButtonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  emergencyButton: {
    backgroundColor: '#FF0000',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  welfarePrompt: {
    color: '#FFAA00',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  welfareButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  welfareOkButton: {
    flex: 1,
    backgroundColor: '#00AA00',
  },
  welfareBackupButton: {
    flex: 1,
    backgroundColor: '#FFAA00',
  },
});

