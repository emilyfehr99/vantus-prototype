import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import rosterService from '../services/rosterService';
import { DEMO_BADGES } from '../utils/constants';
import { isDemoMode, getDemoBadges } from '../utils/client-config';
import { isValidBadgeNumber, isValidPIN } from '../utils/validationUtils';
import { validatePinFormat } from '../utils/securityConfig';
import rateLimiter from '../utils/rateLimiter';
import sessionManager from '../services/sessionManager';
import logger from '../utils/logger';

export default function AuthenticationScreen({ onAuthenticated }) {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [pin, setPin] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [lockoutMessage, setLockoutMessage] = useState(null);

  useEffect(() => {
    // Check if biometric authentication is available
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    })();
  }, []);

  // Check rate limit status when badge number changes
  useEffect(() => {
    if (badgeNumber.trim().length >= 4) {
      checkRateLimitStatus();
    } else {
      setLockoutMessage(null);
      setRemainingAttempts(5);
    }
  }, [badgeNumber]);

  const checkRateLimitStatus = async () => {
    if (!badgeNumber.trim()) return;

    const lockoutStatus = await rateLimiter.isLockedOut(badgeNumber);
    if (lockoutStatus.locked) {
      setLockoutMessage(lockoutStatus.reason);
    } else {
      setLockoutMessage(null);
      const remaining = await rateLimiter.getRemainingAttempts(badgeNumber);
      setRemainingAttempts(remaining);
    }
  };

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
      // Check rate limit first
      const lockoutStatus = await rateLimiter.isLockedOut(badge);
      if (lockoutStatus.locked) {
        setLockoutMessage(lockoutStatus.reason);
        Alert.alert('Account Locked', lockoutStatus.reason);
        setAuthenticating(false);
        return;
      }

      // Use roster service (will use API if configured, otherwise demo validation)
      let isValid = false;
      let officerData = null;
      let officerRole = 'officer';

      try {
        const result = await rosterService.verifyOfficer(badge, pinCode);
        if (result && result.valid) {
          isValid = true;
          officerData = result.officer;
          officerRole = result.officer?.role || 'officer';
        }
      } catch (error) {
        // In production, fail if roster service is unavailable
        // Demo mode fallback removed for security
        logger.error('Roster service error - authentication failed', error);
        isValid = false;
      }

      if (!isValid) {
        // Record failed attempt
        const failResult = await rateLimiter.recordFailedAttempt(badge);
        setRemainingAttempts(failResult.remainingAttempts);

        if (failResult.locked) {
          const lockoutMinutes = Math.ceil(failResult.lockoutDuration / (1000 * 60));
          setLockoutMessage(`Account locked for ${lockoutMinutes} minutes`);
          Alert.alert(
            'Account Locked',
            `Too many failed attempts. Account locked for ${lockoutMinutes} minutes.`
          );
        } else {
          Alert.alert(
            'Authentication Failed',
            `Badge number not found in department roster. ${failResult.remainingAttempts} attempts remaining.`
          );
        }
        setAuthenticating(false);
        return;
      }

      // If using PIN (not biometric), verify PIN format
      if (!biometricUsed && pinCode) {
        const pinValidation = validatePinFormat(pinCode);
        if (!pinValidation.valid) {
          Alert.alert('Invalid PIN', pinValidation.error);
          setAuthenticating(false);
          return;
        }
      }

      // Authentication successful - record success and create session
      await rateLimiter.recordSuccessfulLogin(badge);

      // Create secure session
      const sessionResult = await sessionManager.createSession(badge, officerRole, {
        platform: Platform.OS,
        biometricUsed,
        officerName: officerData?.name || null,
        unit: officerData?.unit || null,
      });

      if (!sessionResult.success) {
        logger.error('Failed to create session', sessionResult.error);
        Alert.alert('Session Error', 'Failed to create secure session. Please try again.');
        setAuthenticating(false);
        return;
      }

      logger.info('Authentication successful', {
        badge,
        biometricUsed,
        sessionCreated: true,
      });

      // Identity confirmed - proceed to calibration
      setAuthenticating(false);
      onAuthenticated(badge, officerData);
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

      {isDemoMode() && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Demo Mode: Use badge numbers {getDemoBadges().join(', ')}
          </Text>
        </View>
      )}
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
