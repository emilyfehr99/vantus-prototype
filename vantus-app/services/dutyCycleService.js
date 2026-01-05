// Battery-Aware Adaptive Duty Cycle Service
// Manages detection frequency based on battery level, device temperature, and stress indicators

import { Platform } from 'react-native';

// Duty cycle modes
const MODES = {
  STANDBY: 'STANDBY',      // Minimal power: wake-word only, accelerometer monitoring
  ACTIVE: 'ACTIVE',        // Normal detection: 2 FPS
  HIGH_STRESS: 'HIGH_STRESS' // Maximum detection: 5 FPS (when threat indicators present)
};

// Battery thresholds
const BATTERY_LOW = 20;      // Switch to standby below 20%
const BATTERY_CRITICAL = 10; // Emergency mode below 10%

// Detection intervals (milliseconds)
const INTERVALS = {
  STANDBY: null,           // No detection, only wake-word
  ACTIVE: 2000,            // 2 FPS (500ms per frame)
  HIGH_STRESS: 200         // 5 FPS (200ms per frame)
};

class DutyCycleService {
  constructor() {
    this.currentMode = MODES.STANDBY;
    this.batteryLevel = 100;
    this.isCharging = false;
    this.heartRate = 70;
    this.baselineHeartRate = 70;
    this.accelerometerData = { x: 0, y: 0, z: 0 };
    this.movementDetected = false;
    this.onModeChange = null;
  }

  /**
   * Initialize duty cycle service
   */
  async initialize() {
    try {
      // Monitor battery level
      if (Platform.OS === 'web') {
        // Web: Use Battery API if available
        if ('getBattery' in navigator) {
          const battery = await navigator.getBattery();
          this.batteryLevel = Math.round(battery.level * 100);
          this.isCharging = battery.charging;
          
          battery.addEventListener('levelchange', () => {
            this.batteryLevel = Math.round(battery.level * 100);
            this.updateMode();
          });
          
          battery.addEventListener('chargingchange', () => {
            this.isCharging = battery.charging;
            this.updateMode();
          });
        }
      } else {
        // Native: Use expo-battery
        try {
          const Battery = require('expo-battery').default;
          
          // Get initial battery state
          const batteryLevel = await Battery.getBatteryLevelAsync();
          this.batteryLevel = Math.round(batteryLevel * 100);
          this.isCharging = await Battery.isChargingAsync();
          
          // Monitor battery changes
          Battery.addBatteryLevelListener(({ batteryLevel }) => {
            this.batteryLevel = Math.round(batteryLevel * 100);
            this.updateMode();
          });
          
          Battery.addBatteryStateListener(({ batteryState }) => {
            this.isCharging = batteryState === Battery.BatteryState.CHARGING;
            this.updateMode();
          });
        } catch (error) {
          console.warn('expo-battery not available:', error);
        }
      }

      // Monitor accelerometer for movement detection
      await this.initializeAccelerometer();
      
      console.log('Duty cycle service initialized');
      this.updateMode();
    } catch (error) {
      console.error('Error initializing duty cycle service:', error);
    }
  }

  /**
   * Initialize accelerometer for movement detection
   */
  async initializeAccelerometer() {
    try {
      if (Platform.OS === 'web') {
        // Web: Use DeviceMotion API
        if ('DeviceMotionEvent' in window) {
          window.addEventListener('devicemotion', (event) => {
            const accel = event.accelerationIncludingGravity;
            if (accel) {
              this.accelerometerData = {
                x: accel.x || 0,
                y: accel.y || 0,
                z: accel.z || 0
              };
              this.detectMovement();
            }
          });
        }
      } else {
        // Native: Use expo-sensors
        try {
          const { Accelerometer } = require('expo-sensors');
          
          Accelerometer.setUpdateInterval(1000); // 1 second
          
          Accelerometer.addListener(({ x, y, z }) => {
            this.accelerometerData = { x, y, z };
            this.detectMovement();
          });
        } catch (error) {
          console.warn('expo-sensors not available:', error);
        }
      }
    } catch (error) {
      console.error('Error initializing accelerometer:', error);
    }
  }

  /**
   * Detect movement from accelerometer data
   */
  detectMovement() {
    const { x, y, z } = this.accelerometerData;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Threshold for movement detection (adjust based on testing)
    const MOVEMENT_THRESHOLD = 1.5; // g-force
    
    this.movementDetected = magnitude > MOVEMENT_THRESHOLD;
    this.updateMode();
  }

  /**
   * Update heart rate (called from App.js)
   */
  updateHeartRate(heartRate) {
    this.heartRate = heartRate;
    this.updateMode();
  }

  /**
   * Determine optimal mode based on current conditions
   */
  updateMode() {
    let newMode = MODES.STANDBY;
    
    // Battery-based decisions
    if (this.batteryLevel < BATTERY_CRITICAL) {
      newMode = MODES.STANDBY; // Force standby on critical battery
    } else if (this.batteryLevel < BATTERY_LOW && !this.isCharging) {
      newMode = MODES.STANDBY; // Standby on low battery (unless charging)
    } else {
      // Stress-based decisions
      const heartRateSpike = this.heartRate - this.baselineHeartRate;
      const highStress = heartRateSpike > 20 || this.movementDetected;
      
      if (highStress) {
        newMode = MODES.HIGH_STRESS;
      } else {
        newMode = MODES.ACTIVE;
      }
    }
    
    // Notify if mode changed
    if (newMode !== this.currentMode) {
      const oldMode = this.currentMode;
      this.currentMode = newMode;
      
      console.log(`Duty cycle mode changed: ${oldMode} -> ${newMode}`, {
        battery: this.batteryLevel,
        heartRate: this.heartRate,
        movement: this.movementDetected
      });
      
      if (this.onModeChange) {
        this.onModeChange(newMode, oldMode);
      }
    }
  }

  /**
   * Get current detection interval
   */
  getDetectionInterval() {
    return INTERVALS[this.currentMode];
  }

  /**
   * Check if detection should run
   */
  shouldRunDetection() {
    return this.currentMode !== MODES.STANDBY;
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.currentMode;
  }

  /**
   * Get battery status
   */
  getBatteryStatus() {
    return {
      level: this.batteryLevel,
      isCharging: this.isCharging,
      isLow: this.batteryLevel < BATTERY_LOW,
      isCritical: this.batteryLevel < BATTERY_CRITICAL
    };
  }

  /**
   * Set mode change callback
   */
  setModeChangeCallback(callback) {
    this.onModeChange = callback;
  }

  /**
   * Force mode (for manual override)
   */
  setMode(mode) {
    if (Object.values(MODES).includes(mode)) {
      const oldMode = this.currentMode;
      this.currentMode = mode;
      
      if (this.onModeChange) {
        this.onModeChange(mode, oldMode);
      }
    }
  }
}

export default new DutyCycleService();

