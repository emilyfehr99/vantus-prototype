import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import rosterService from '../services/rosterService';
import { DEMO_BADGES } from '../utils/constants';
import { isValidBadgeNumber, isValidPIN } from '../utils/validationUtils';
import logger from '../utils/logger';

export default function AuthenticationScreen({ onAuthenticated }) {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [pin, setPin] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  React.useEffect(() => {
    // Check if biometric authentication is available
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    })();
  }, []);

  const handleBiometricAuth = async () => {
    try {
      setAuthenticating(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Vantus',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Biometric successful, still need badge number for roster lookup
        if (badgeNumber.trim()) {
          await verifyIdentity(badgeNumber, null, true);
        } else {
          Alert.alert('Badge Number Required', 'Please enter your badge number');
          setAuthenticating(false);
        }
      } else {
        setAuthenticating(false);
      }
    } catch (error) {
      logger.error('Biometric authentication error', error);
      Alert.alert('Authentication Error', 'Biometric authentication failed');
      setAuthenticating(false);
    }
  };

  const verifyIdentity = async (badge, pinCode, biometricUsed = false) => {
    try {
      // Use roster service (will use API if configured, otherwise demo validation)
      let isValid = false;
      let officerData = null;
      
      try {
        const result = await rosterService.verifyOfficer(badge, pinCode);
        if (result && result.valid) {
          isValid = true;
          officerData = result.officer;
        }
      } catch (error) {
        // Fallback to demo validation if roster service fails
        logger.warn('Roster service error, using demo validation', error);
        isValid = DEMO_BADGES.includes(badge);
      }
      
      if (!isValid) {
        Alert.alert('Authentication Failed', 'Badge number not found in department roster');
        setAuthenticating(false);
        return;
      }

      // If using PIN (not biometric), verify PIN
      if (!biometricUsed && pinCode) {
        // Validate PIN format
        if (!isValidPIN(pinCode, 4)) {
          Alert.alert('Invalid PIN', 'PIN must be at least 4 digits');
          setAuthenticating(false);
          return;
        }
      }

      // Identity confirmed - proceed to calibration
      setAuthenticating(false);
      onAuthenticated(badge);
    } catch (error) {
      logger.error('Identity verification error', error);
      Alert.alert('Verification Error', 'Failed to verify identity with department roster');
      setAuthenticating(false);
    }
  };

  const handleLogin = async () => {
    // Validate badge number format
    if (!badgeNumber.trim() || !isValidBadgeNumber(badgeNumber)) {
      Alert.alert('Invalid Badge Number', 'Please enter a valid badge number');
      return;
    }
    
    // Validate PIN if provided
    if (pin && !isValidPIN(pin, 4)) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits');
      return;
    }

    if (!useBiometric && !pin.trim()) {
      Alert.alert('PIN Required', 'Please enter your PIN or use biometric authentication');
      return;
    }

    setAuthenticating(true);

    if (useBiometric) {
      await handleBiometricAuth();
    } else {
      await verifyIdentity(badgeNumber, pin, false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>VANTUS</Text>
        <Text style={styles.subtitle}>Officer Authentication</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Badge Number</Text>
          <TextInput
            style={styles.input}
            value={badgeNumber}
            onChangeText={setBadgeNumber}
            placeholder="Enter badge number"
            keyboardType="numeric"
            autoCapitalize="none"
            editable={!authenticating}
          />
        </View>

        {!useBiometric && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PIN</Text>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              placeholder="Enter PIN"
              keyboardType="numeric"
              secureTextEntry
              editable={!authenticating}
            />
          </View>
        )}

        {biometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={() => setUseBiometric(!useBiometric)}
            disabled={authenticating}
          >
            <Text style={styles.biometricText}>
              {useBiometric ? '✓' : '○'} Use Biometric Authentication
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.loginButton, authenticating && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={authenticating}
        >
          {authenticating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>AUTHENTICATE</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Demo Mode: Use badge numbers 12345, 67890, 11111, or 22222
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
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
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#00FF41',
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.1,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#00FF41',
    borderRadius: 8,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  biometricButton: {
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00FF41',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 65, 0.05)',
  },
  biometricText: {
    color: '#00FF41',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#00FF41',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
  },
});
