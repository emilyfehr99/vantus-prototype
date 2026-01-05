// For web, use localStorage; for native, use AsyncStorage
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Web fallback
  AsyncStorage = {
    getItem: (key) => Promise.resolve(typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null),
    setItem: (key, value) => Promise.resolve(typeof window !== 'undefined' && window.localStorage ? window.localStorage.setItem(key, value) : null),
    removeItem: (key) => Promise.resolve(typeof window !== 'undefined' && window.localStorage ? window.localStorage.removeItem(key) : null)
  };
}

const BUFFER_KEY = '@vantus_alert_buffer';
const MAX_BUFFER_SIZE = 100; // Maximum alerts to buffer
const BUFFER_EXPIRY_MS = 60 * 1000; // 60 seconds

class OfflineBuffer {
  constructor() {
    this.buffer = [];
    this.isConnected = false;
  }

  /**
   * Initialize buffer from AsyncStorage
   */
  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(BUFFER_KEY);
      if (stored) {
        this.buffer = JSON.parse(stored);
        // Remove expired entries
        const now = Date.now();
        this.buffer = this.buffer.filter(entry => {
          const age = now - entry.timestamp;
          return age < BUFFER_EXPIRY_MS;
        });
        await this.save();
      }
    } catch (error) {
      console.error('Error initializing offline buffer:', error);
      this.buffer = [];
    }
  }

  /**
   * Save buffer to AsyncStorage
   */
  async save() {
    try {
      await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(this.buffer));
    } catch (error) {
      console.error('Error saving offline buffer:', error);
    }
  }

  /**
   * Add alert to buffer (when offline)
   * @param {Object} alertData - Alert data to buffer
   */
  async addAlert(alertData) {
    const entry = {
      ...alertData,
      timestamp: Date.now(),
      buffered: true
    };

    this.buffer.push(entry);

    // Limit buffer size
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.buffer.shift(); // Remove oldest entry
    }

    await this.save();
    console.log(`Alert buffered (${this.buffer.length} in buffer)`);
  }

  /**
   * Get all buffered alerts
   * @returns {Array} Array of buffered alerts
   */
  getBufferedAlerts() {
    return [...this.buffer];
  }

  /**
   * Clear all buffered alerts (after successful transmission)
   */
  async clear() {
    this.buffer = [];
    await AsyncStorage.removeItem(BUFFER_KEY);
    console.log('Offline buffer cleared');
  }

  /**
   * Dump all buffered alerts (send to server)
   * @param {Function} sendFunction - Function to send alert to server
   * @returns {Promise<number>} Number of alerts sent
   */
  async dumpAlerts(sendFunction) {
    if (this.buffer.length === 0) {
      return 0;
    }

    const alertsToSend = [...this.buffer];
    let sentCount = 0;

    for (const alert of alertsToSend) {
      try {
        await sendFunction(alert);
        sentCount++;
      } catch (error) {
        console.error('Error sending buffered alert:', error);
        // Keep failed alerts in buffer for retry
      }
    }

    // Clear successfully sent alerts
    if (sentCount === alertsToSend.length) {
      await this.clear();
    } else {
      // Remove only successfully sent alerts
      this.buffer = this.buffer.slice(sentCount);
      await this.save();
    }

    console.log(`Dumped ${sentCount} buffered alerts`);
    return sentCount;
  }

  /**
   * Set connection status
   * @param {boolean} connected - Whether device is connected
   */
  setConnectionStatus(connected) {
    this.isConnected = connected;
  }

  /**
   * Check if device is offline
   * @returns {boolean} True if offline
   */
  isOffline() {
    return !this.isConnected;
  }

  /**
   * Get buffer status
   * @returns {Object} Buffer status information
   */
  getStatus() {
    return {
      count: this.buffer.length,
      isConnected: this.isConnected,
      oldestTimestamp: this.buffer.length > 0 ? this.buffer[0].timestamp : null,
      newestTimestamp: this.buffer.length > 0 ? this.buffer[this.buffer.length - 1].timestamp : null
    };
  }
}

export default new OfflineBuffer();

