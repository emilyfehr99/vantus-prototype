/**
 * Voice Advisory System
 * Provides audio feedback to officers based on detection results
 */

import * as Speech from 'expo-speech';

class VoiceAdvisory {
  constructor() {
    this.isEnabled = true;
    this.volume = 1.0;
    this.lastAdvisory = null;
    this.advisoryQueue = [];
    this.isSpeaking = false;
  }

  /**
   * Advisory messages (informational)
   */
  advisories = {
    check_six: "Check your six",
    stance_change: "Stance change detected",
    movement_behind: "Movement behind you",
  };

  /**
   * Warning messages (attention required)
   */
  warnings = {
    left_hand_not_visible: "Left hand not visible",
    right_hand_not_visible: "Right hand not visible",
    waistband_movement: "Waistband movement",
    subject_backing_away: "Subject backing away",
  };

  /**
   * Threat messages (critical)
   */
  threats = {
    weapon_right_hand: "Weapon detected, right hand",
    weapon_left_hand: "Weapon detected, left hand",
    knife_detected: "Knife detected",
    backup_dispatched: "Backup dispatched, hold position",
  };

  /**
   * System messages
   */
  system = {
    vantus_active: "Vantus active",
    connection_lost: "Connection lost, offline mode",
    connection_restored: "Connection restored",
    battery_critical: "Battery critical",
  };

  /**
   * Speak a message
   */
  async speak(message, priority = 'advisory') {
    if (!this.isEnabled) return;

    // Queue message if already speaking
    if (this.isSpeaking) {
      this.advisoryQueue.push({ message, priority });
      return;
    }

    this.isSpeaking = true;
    this.lastAdvisory = { message, priority, timestamp: new Date() };

    try {
      await Speech.speak(message, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9, // Slightly slower for clarity
        volume: this.volume,
        onDone: () => {
          this.isSpeaking = false;
          this.processQueue();
        },
        onStopped: () => {
          this.isSpeaking = false;
          this.processQueue();
        },
      });
    } catch (error) {
      console.error('Voice advisory error:', error);
      this.isSpeaking = false;
      this.processQueue();
    }
  }

  /**
   * Process queued messages
   */
  processQueue() {
    if (this.advisoryQueue.length > 0 && !this.isSpeaking) {
      const next = this.advisoryQueue.shift();
      this.speak(next.message, next.priority);
    }
  }

  /**
   * Advisory messages
   */
  checkSix() {
    return this.speak(this.advisories.check_six, 'advisory');
  }

  stanceChangeDetected() {
    return this.speak(this.advisories.stance_change, 'advisory');
  }

  movementBehind() {
    return this.speak(this.advisories.movement_behind, 'advisory');
  }

  /**
   * Warning messages
   */
  leftHandNotVisible() {
    return this.speak(this.warnings.left_hand_not_visible, 'warning');
  }

  rightHandNotVisible() {
    return this.speak(this.warnings.right_hand_not_visible, 'warning');
  }

  waistbandMovement() {
    return this.speak(this.warnings.waistband_movement, 'warning');
  }

  subjectBackingAway() {
    return this.speak(this.warnings.subject_backing_away, 'warning');
  }

  /**
   * Threat messages
   */
  weaponDetectedRightHand() {
    return this.speak(this.threats.weapon_right_hand, 'threat');
  }

  weaponDetectedLeftHand() {
    return this.speak(this.threats.weapon_left_hand, 'threat');
  }

  knifeDetected() {
    return this.speak(this.threats.knife_detected, 'threat');
  }

  backupDispatched() {
    return this.speak(this.threats.backup_dispatched, 'threat');
  }

  /**
   * System messages
   */
  vantusActive() {
    return this.speak(this.system.vantus_active, 'system');
  }

  connectionLost() {
    return this.speak(this.system.connection_lost, 'system');
  }

  connectionRestored() {
    return this.speak(this.system.connection_restored, 'system');
  }

  batteryCritical() {
    return this.speak(this.system.battery_critical, 'system');
  }

  /**
   * Process detection results and trigger appropriate advisories
   */
  processDetection(detectionResult) {
    if (!detectionResult || !detectionResult.detected) return;

    const { category, detections, pattern, stanceType } = detectionResult;

    switch (category) {
      case 'weapon':
        if (detections && detections.length > 0) {
          const weapon = detections[0];
          if (weapon.class === 'knife' || weapon.class === 'blade') {
            this.knifeDetected();
          } else {
            // Determine hand position from detection
            // For now, use generic weapon detection
            this.weaponDetectedRightHand(); // Would be determined from detection bbox
          }
        }
        break;

      case 'stance':
        if (stanceType) {
          this.stanceChangeDetected();
        }
        break;

      case 'hands':
        if (pattern === 'hands_hidden') {
          this.leftHandNotVisible(); // Would check which hand
          this.rightHandNotVisible();
        } else if (pattern === 'waistband_reach') {
          this.waistbandMovement();
        }
        break;

      default:
        break;
    }
  }

  /**
   * Stop current speech
   */
  stop() {
    Speech.stop();
    this.isSpeaking = false;
    this.advisoryQueue = [];
  }

  /**
   * Enable/disable voice advisories
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

// Export singleton instance
export default new VoiceAdvisory();
