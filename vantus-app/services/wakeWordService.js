// Tactical Wake-Word Service
// Uses react-native-voice for voice recognition
// In production, consider Picovoice Porcupine for edge-based wake-word detection

import { Platform } from 'react-native';

// Wake-word phrases
const WAKE_WORDS = [
  'vantus overwatch',
  'vantus activate',
  'vantus start',
  'vantus stop',
  'vantus secure'
];

class WakeWordService {
  constructor() {
    this.isListening = false;
    this.onWakeWordDetected = null;
    this.voiceRecognition = null;
    this.isInitialized = false;
  }

  /**
   * Initialize wake-word service
   */
  async initialize() {
    try {
      // For web, use Web Speech API
      if (Platform.OS === 'web') {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          this.voiceRecognition = new SpeechRecognition();
          this.voiceRecognition.continuous = true;
          this.voiceRecognition.interimResults = false;
          this.voiceRecognition.lang = 'en-US';
          
          this.voiceRecognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            this.checkWakeWord(transcript);
          };
          
          this.voiceRecognition.onerror = (error) => {
            console.error('Wake-word recognition error:', error);
          };
          
          this.isInitialized = true;
          console.log('Wake-word service initialized (Web Speech API)');
        } else {
          console.warn('Web Speech API not available');
          this.isInitialized = false;
        }
      } else {
        // For native, use react-native-voice (will be imported at runtime)
        try {
          const Voice = require('@react-native-voice/voice').default;
          
          Voice.onSpeechStart = () => {
            console.log('Wake-word listening started');
          };
          
          Voice.onSpeechEnd = () => {
            console.log('Wake-word listening ended');
          };
          
          Voice.onSpeechResults = (event) => {
            const transcript = event.value[0]?.toLowerCase() || '';
            this.checkWakeWord(transcript);
          };
          
          Voice.onSpeechError = (error) => {
            console.error('Wake-word recognition error:', error);
          };
          
          this.voiceRecognition = Voice;
          this.isInitialized = true;
          console.log('Wake-word service initialized (react-native-voice)');
        } catch (error) {
          console.warn('react-native-voice not available, using fallback');
          this.isInitialized = false;
        }
      }
    } catch (error) {
      console.error('Error initializing wake-word service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if transcript contains wake-word
   */
  checkWakeWord(transcript) {
    const detected = WAKE_WORDS.some(phrase => {
      return transcript.includes(phrase);
    });
    
    if (detected) {
      const command = this.parseCommand(transcript);
      console.log('Wake-word detected:', command);
      
      if (this.onWakeWordDetected) {
        this.onWakeWordDetected(command);
      }
    }
  }

  /**
   * Parse command from transcript
   */
  parseCommand(transcript) {
    if (transcript.includes('start') || transcript.includes('activate') || transcript.includes('overwatch')) {
      return 'START';
    } else if (transcript.includes('stop') || transcript.includes('secure')) {
      return 'STOP';
    }
    return 'UNKNOWN';
  }

  /**
   * Start listening for wake-word
   */
  async startListening(callback) {
    if (!this.isInitialized) {
      console.warn('Wake-word service not initialized');
      return false;
    }

    this.onWakeWordDetected = callback;
    
    try {
      if (Platform.OS === 'web') {
        if (this.voiceRecognition) {
          this.voiceRecognition.start();
          this.isListening = true;
          console.log('Wake-word listening started (web)');
        }
      } else {
        // Native: react-native-voice
        if (this.voiceRecognition) {
          await this.voiceRecognition.start('en-US');
          this.isListening = true;
          console.log('Wake-word listening started (native)');
        }
      }
      return true;
    } catch (error) {
      console.error('Error starting wake-word listening:', error);
      return false;
    }
  }

  /**
   * Stop listening for wake-word
   */
  async stopListening() {
    if (!this.isListening) {
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (this.voiceRecognition) {
          this.voiceRecognition.stop();
        }
      } else {
        // Native: react-native-voice
        if (this.voiceRecognition) {
          await this.voiceRecognition.stop();
        }
      }
      
      this.isListening = false;
      this.onWakeWordDetected = null;
      console.log('Wake-word listening stopped');
    } catch (error) {
      console.error('Error stopping wake-word listening:', error);
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get current listening status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      isInitialized: this.isInitialized,
      wakeWords: WAKE_WORDS
    };
  }
}

export default new WakeWordService();

