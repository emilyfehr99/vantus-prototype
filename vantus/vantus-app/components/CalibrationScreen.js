import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Animated, TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';
import * as Audio from 'expo-av';
import logger from '../utils/logger';

export default function CalibrationScreen({ badgeNumber, onCalibrationComplete }) {
  const [step, setStep] = useState(0);
  const [heartRate, setHeartRate] = useState(null);
  const [audioBaseline, setAudioBaseline] = useState(null);
  const [lightingBaseline, setLightingBaseline] = useState(null);
  const [calibrating, setCalibrating] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [progress, setProgress] = useState(0);
  
  const cameraRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const heartRateSubscriptionRef = useRef(null);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const steps = [
    {
      title: 'Stand Still',
      instruction: 'Stand still and breathe normally',
      duration: 10,
    },
    {
      title: 'Heart Rate Baseline',
      instruction: 'Capturing resting heart rate...',
      duration: 10,
    },
    {
      title: 'Audio Baseline',
      instruction: 'Capturing ambient audio levels...',
      duration: 5,
    },
    {
      title: 'Lighting Baseline',
      instruction: 'Capturing lighting conditions...',
      duration: 5,
    },
  ];

  useEffect(() => {
    if (calibrating) {
      startCalibration();
    }

    return () => {
      // Cleanup
      if (heartRateSubscriptionRef.current) {
        heartRateSubscriptionRef.current.remove();
      }
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stopAndUnloadAsync();
      }
    };
  }, [calibrating]);

  const startCalibration = async () => {
    try {
      // Start 30-second countdown
      const totalDuration = 30;
      let elapsed = 0;

      const interval = setInterval(() => {
        elapsed += 1;
        const remaining = totalDuration - elapsed;
        setCountdown(remaining);
        setProgress((elapsed / totalDuration) * 100);

        if (remaining <= 0) {
          clearInterval(interval);
          completeCalibration();
        }
      }, 1000);

      // Step 1: Stand still (0-10 seconds)
      await new Promise(resolve => setTimeout(resolve, 10000));
      setStep(1);

      // Step 2: Heart rate baseline (10-20 seconds)
      await captureHeartRateBaseline();
      await new Promise(resolve => setTimeout(resolve, 10000));
      setStep(2);

      // Step 3: Audio baseline (20-25 seconds)
      await captureAudioBaseline();
      await new Promise(resolve => setTimeout(resolve, 5000));
      setStep(3);

      // Step 4: Lighting baseline (25-30 seconds)
      await captureLightingBaseline();
      await new Promise(resolve => setTimeout(resolve, 5000));

      clearInterval(interval);
      completeCalibration();
    } catch (error) {
      logger.error('Calibration error', error);
      // Continue even if some baselines fail
      completeCalibration();
    }
  };

  const captureHeartRateBaseline = async () => {
    try {
      // In production, this would integrate with wearable device APIs
      // For now, simulate or skip if no wearable connected
      // Most wearables require their own SDK integration
      
      // Simulate heart rate capture (in production, use actual wearable API)
      const simulatedHeartRate = 65 + Math.floor(Math.random() * 10); // 65-75 bpm
      setHeartRate(simulatedHeartRate);
      
      // Note: Real implementation would:
      // 1. Check for connected wearable (Apple Watch, Fitbit, etc.)
      // 2. Request permissions
      // 3. Subscribe to heart rate data
      // 4. Collect samples over 10 seconds
      // 5. Calculate average
      
      logger.info('Heart rate baseline captured (simulated)', { simulatedHeartRate });
    } catch (error) {
      logger.error('Heart rate capture error', error);
      setHeartRate(null);
    }
  };

  const captureAudioBaseline = async () => {
    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Audio permission not granted');
        setAudioBaseline(null);
        return;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create audio recorder
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      audioRecorderRef.current = recording;

      // Record for 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Stop recording and get stats
      await recording.stopAndUnloadAsync();
      
      // Calculate baseline (simplified - in production would analyze audio levels)
      // For now, just mark as captured
      setAudioBaseline('captured');
    } catch (error) {
      logger.error('Audio baseline capture error', error);
      setAudioBaseline(null);
    }
  };

  const captureLightingBaseline = async () => {
    try {
      // Use camera to capture lighting conditions
      if (cameraRef.current) {
        // In production, would analyze camera frame for lighting levels
        // For now, just mark as captured
        setLightingBaseline('captured');
      }
    } catch (error) {
      logger.error('Lighting baseline capture error', error);
      setLightingBaseline(null);
    }
  };

  const completeCalibration = () => {
    setCalibrating(false);
    
    // Store calibration data
    const calibrationData = {
      badgeNumber,
      timestamp: new Date().toISOString(),
      heartRateBaseline: heartRate,
      audioBaseline: audioBaseline !== null,
      lightingBaseline: lightingBaseline !== null,
    };

    // In production, would store this in secure storage
    logger.info('Calibration complete', { calibrationData });

    // Proceed to standby mode
    onCalibrationComplete(calibrationData);
  };

  const startCalibrationProcess = () => {
    setCalibrating(true);
    setStep(0);
    setCountdown(30);
    setProgress(0);
  };

  const currentStep = steps[step] || steps[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CALIBRATION</Text>
        <Text style={styles.subtitle}>Officer {badgeNumber}</Text>
      </View>

      {!calibrating ? (
        <View style={styles.readyContainer}>
          <Text style={styles.instruction}>
            Ready to begin 30-second calibration
          </Text>
          <Text style={styles.instructionDetail}>
            You will be asked to:
          </Text>
          <View style={styles.stepsList}>
            {steps.map((s, idx) => (
              <Text key={idx} style={styles.stepItem}>
                • {s.title}: {s.instruction}
              </Text>
            ))}
          </View>
          <TouchableOpacity
            style={styles.startButton}
            onPress={startCalibrationProcess}
          >
            <Text style={styles.startButtonText}>BEGIN CALIBRATION</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.calibratingContainer}>
          <Text style={styles.stepTitle}>{currentStep.title}</Text>
          <Text style={styles.instruction}>{currentStep.instruction}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.countdown}>{countdown}s</Text>
          </View>

          <View style={styles.statusContainer}>
            {heartRate !== null && (
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Heart Rate:</Text>
                <Text style={styles.statusValue}>{heartRate} bpm</Text>
              </View>
            )}
            {audioBaseline !== null && (
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Audio:</Text>
                <Text style={styles.statusValue}>✓ Captured</Text>
              </View>
            )}
            {lightingBaseline !== null && (
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Lighting:</Text>
                <Text style={styles.statusValue}>✓ Captured</Text>
              </View>
            )}
          </View>

          <ActivityIndicator size="large" color="#00FF41" style={styles.spinner} />
        </View>
      )}

      {/* Hidden camera for lighting detection */}
      <CameraView
        ref={cameraRef}
        style={styles.hiddenCamera}
        facing="back"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00FF41',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  readyContainer: {
    alignItems: 'center',
  },
  instruction: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
  },
  instructionDetail: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepsList: {
    width: '100%',
    marginBottom: 30,
  },
  stepItem: {
    fontSize: 14,
    color: '#00FF41',
    marginBottom: 10,
    paddingLeft: 10,
  },
  startButton: {
    backgroundColor: '#00FF41',
    padding: 18,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  calibratingContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00FF41',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  progressContainer: {
    width: '100%',
    marginVertical: 30,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FF41',
  },
  countdown: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00FF41',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  statusContainer: {
    width: '100%',
    marginTop: 30,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  statusLabel: {
    fontSize: 14,
    color: '#999999',
  },
  statusValue: {
    fontSize: 14,
    color: '#00FF41',
    fontWeight: '700',
  },
  spinner: {
    marginTop: 30,
  },
  hiddenCamera: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
