import * as FileSystem from 'expo-file-system';

const BUFFER_DIR = `${FileSystem.documentDirectory}vantus_buffer/`;
const BUFFER_DURATION_MS = 30 * 1000; // 30 seconds
const MAX_FRAMES = 30; // ~1 frame per second for 30 seconds

class VideoBuffer {
  constructor() {
    this.frames = [];
    this.isRecording = false;
    this.startTime = null;
  }

  /**
   * Initialize buffer directory
   */
  async initialize() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(BUFFER_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(BUFFER_DIR, { intermediates: true });
      }
      // Clean old frames
      await this.cleanOldFrames();
    } catch (error) {
      console.error('Error initializing video buffer:', error);
    }
  }

  /**
   * Add frame to rolling buffer
   * @param {string} imageUri - URI of the captured frame
   * @param {Object} metadata - Additional metadata (timestamp, detection results, etc.)
   */
  async addFrame(imageUri, metadata = {}) {
    const frame = {
      uri: imageUri,
      timestamp: Date.now(),
      ...metadata
    };

    this.frames.push(frame);

    // Maintain buffer size (remove oldest if over limit)
    if (this.frames.length > MAX_FRAMES) {
      const oldestFrame = this.frames.shift();
      // Optionally delete old frame file
      try {
        await FileSystem.deleteAsync(oldestFrame.uri, { idempotent: true });
      } catch (error) {
        console.error('Error deleting old frame:', error);
      }
    }

    // Remove frames older than buffer duration
    const now = Date.now();
    this.frames = this.frames.filter(f => (now - f.timestamp) < BUFFER_DURATION_MS);
  }

  /**
   * Get all frames in buffer (last 30 seconds)
   * @returns {Array} Array of frame objects
   */
  getFrames() {
    const now = Date.now();
    return this.frames.filter(f => (now - f.timestamp) < BUFFER_DURATION_MS);
  }

  /**
   * Save buffer to permanent storage (when threat detected)
   * @param {string} alertId - Unique ID for this alert
   * @returns {Promise<string>} Path to saved buffer directory
   */
  async saveBuffer(alertId) {
    const frames = this.getFrames();
    const saveDir = `${BUFFER_DIR}alert_${alertId}/`;
    
    try {
      await FileSystem.makeDirectoryAsync(saveDir, { intermediates: true });
      
      // Copy frames to permanent storage
      const savedFrames = [];
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const newPath = `${saveDir}frame_${i}_${frame.timestamp}.jpg`;
        await FileSystem.copyAsync({
          from: frame.uri,
          to: newPath
        });
        savedFrames.push({
          ...frame,
          savedPath: newPath
        });
      }

      // Save metadata
      const metadata = {
        alertId,
        savedAt: new Date().toISOString(),
        frameCount: savedFrames.length,
        duration: frames.length > 0 ? frames[frames.length - 1].timestamp - frames[0].timestamp : 0,
        frames: savedFrames
      };

      await FileSystem.writeAsStringAsync(
        `${saveDir}metadata.json`,
        JSON.stringify(metadata, null, 2)
      );

      console.log(`Saved ${savedFrames.length} frames for alert ${alertId}`);
      return saveDir;
    } catch (error) {
      console.error('Error saving video buffer:', error);
      throw error;
    }
  }

  /**
   * Clear buffer (discard frames)
   */
  async clear() {
    const framesToDelete = [...this.frames];
    this.frames = [];
    
    // Optionally delete frame files
    for (const frame of framesToDelete) {
      try {
        await FileSystem.deleteAsync(frame.uri, { idempotent: true });
      } catch (error) {
        // Ignore deletion errors
      }
    }
  }

  /**
   * Clean old frames from disk
   */
  async cleanOldFrames() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(BUFFER_DIR);
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(BUFFER_DIR);
        const now = Date.now();
        
        for (const file of files) {
          const filePath = `${BUFFER_DIR}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          // Delete files older than 1 hour
          if (fileInfo.exists && (now - fileInfo.modificationTime * 1000) > 3600000) {
            await FileSystem.deleteAsync(filePath, { idempotent: true });
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning old frames:', error);
    }
  }

  /**
   * Generate cryptographic hash of buffer (for forensic integrity)
   * @param {Array} frames - Frames to hash
   * @returns {Promise<string>} SHA-256 hash
   */
  async generateHash(frames) {
    // In production, use crypto library for SHA-256
    // For now, return a placeholder
    const frameData = frames.map(f => `${f.timestamp}:${f.uri}`).join('|');
    // TODO: Implement actual SHA-256 hashing
    return `hash_${Date.now()}_${frameData.length}`;
  }

  /**
   * Get buffer status
   * @returns {Object} Buffer status information
   */
  getStatus() {
    return {
      frameCount: this.frames.length,
      duration: this.frames.length > 0 
        ? this.frames[this.frames.length - 1].timestamp - this.frames[0].timestamp 
        : 0,
      oldestTimestamp: this.frames.length > 0 ? this.frames[0].timestamp : null,
      newestTimestamp: this.frames.length > 0 ? this.frames[this.frames.length - 1].timestamp : null
    };
  }
}

export default new VideoBuffer();

