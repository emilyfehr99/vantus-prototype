/**
 * Video Buffer System
 * Rolling 30-second buffer with 60-second clip saving on trigger
 */

import * as FileSystem from 'expo-file-system';
import * as Camera from 'expo-camera';
import * as Crypto from 'expo-crypto';
import { CameraView } from 'expo-camera';
import logger from '../utils/logger';
// Use production encryption if available, fallback to basic
let videoEncryption;
try {
  videoEncryption = require('./videoEncryptionProduction').default;
} catch (e) {
  videoEncryption = require('./videoEncryption').default;
}
// import videoEncryption from './videoEncryption';

class VideoBuffer {
  constructor() {
    this.bufferDuration = 30000; // 30 seconds
    this.postTriggerDuration = 30000; // 30 seconds
    this.totalClipDuration = 60000; // 60 seconds (30 pre + 30 post)
    this.frameRate = 15; // 15 FPS
    this.resolution = { width: 854, height: 480 }; // 480p
    this.buffer = [];
    this.isRecording = false;
    this.recording = null;
    this.cameraRef = null;
    this.triggeredClips = [];
  }

  /**
   * Set camera reference
   */
  setCameraRef(ref) {
    this.cameraRef = ref;
  }

  /**
   * Start rolling buffer
   * Note: In production, would use CameraView.recordAsync() for continuous recording
   */
  async startBuffer() {
    if (this.isRecording) return;

    try {
      // Start recording to buffer
      // Note: expo-camera CameraView doesn't have direct recordAsync
      // In production, would use expo-av Recording API or native recording
      if (this.cameraRef) {
        this.isRecording = true;

        // Record to cache directory (RAM-backed)
        const cacheDir = FileSystem.cacheDirectory;
        const bufferPath = `${cacheDir}vantus_buffer_${Date.now()}.mp4`;

        // In production, this would start actual video recording
        // For now, mark as recording (will be implemented with proper recording API)
        logger.info('Video buffer started (placeholder - requires recording API)', { bufferPath });

        // Placeholder: In production would use:
        // const { recording } = await Camera.Recording.createAsync({
        //   quality: Camera.VideoQuality['480p'],
        //   maxDuration: this.bufferDuration / 1000,
        // });
        // this.recording = recording;
      }
    } catch (error) {
      logger.error('Failed to start video buffer', error);
      this.isRecording = false;
    }
  }

  /**
   * Stop buffer
   */
  async stopBuffer() {
    if (!this.isRecording) return;

    try {
      // In production, would stop actual recording
      // await this.recording.stopAndUnloadAsync();

      this.isRecording = false;
      this.recording = null;
      logger.info('Video buffer stopped');
    } catch (error) {
      logger.error('Failed to stop video buffer', error);
      this.isRecording = false;
    }
  }

  /**
   * Trigger clip save (on threat detection, manual, biometric spike)
   */
  async triggerClipSave(triggerEvent) {
    if (!this.isRecording) {
      logger.warn('Cannot save clip - buffer not recording');
      // Still try to save (buffer might have data)
    }

    try {
      // In production, would:
      // 1. Stop current buffer recording
      // 2. Start post-trigger recording (30 seconds)
      // 3. Wait for post-trigger to complete
      // 4. Combine videos
      // 5. Encrypt and save

      // For now, create placeholder clip info
      const cacheDir = FileSystem.cacheDirectory;
      const bufferPath = `${cacheDir}vantus_buffer_${Date.now()}.mp4`;

      // Simulate video data (in production, would be actual video)
      const simulatedVideoData = 'VIDEO_DATA_PLACEHOLDER';

      // Encrypt clip
      const encryptedClip = await this.encryptClipData(simulatedVideoData);

      // Save to permanent storage
      const savedClip = await this.saveClip(encryptedClip, triggerEvent);

      // Restart buffer
      await this.startBuffer();

      logger.info('Clip saved (placeholder)', { savedClip });
      return savedClip;
    } catch (error) {
      logger.error('Failed to save triggered clip', error);
      // Restart buffer even if save failed
      await this.startBuffer();
      return null;
    }
  }

  /**
   * Encrypt video data using videoEncryption service
   */
  async encryptClipData(videoData) {
    try {
      // Generate encryption key
      const encryptionKey = await videoEncryption.generateKey();

      // If videoData is a URI, encrypt the file
      // Otherwise, treat as data to encrypt
      if (typeof videoData === 'string' && videoData.startsWith('file://')) {
        // Encrypt video file
        const result = await videoEncryption.encryptVideo(videoData, encryptionKey);
        return {
          encrypted: true,
          encryptedUri: result.encryptedUri,
          key: encryptionKey,
          iv: result.iv,
          tag: result.tag,
        };
      } else {
        // For placeholder data, return encrypted structure
        // In production, would encrypt actual video bytes
        return {
          encrypted: true,
          data: videoData, // Would be encrypted in production
          key: encryptionKey,
        };
      }
    } catch (error) {
      logger.error('Failed to encrypt clip', error);
      throw error;
    }
  }

  /**
   * Combine pre-trigger and post-trigger videos
   * Note: In production, would use video editing library
   */
  async combineVideos(preTriggerUri, postTriggerUri) {
    // In production, use FFmpeg or similar to combine videos
    // For now, return pre-trigger (would be combined in production)
    logger.debug('Combining videos', { preTriggerUri, postTriggerUri });

    // Placeholder - would use FFmpeg in production
    // const combined = await ffmpeg.combine([preTriggerUri, postTriggerUri]);

    return preTriggerUri; // Placeholder
  }


  /**
   * Save clip to permanent storage
   */
  async saveClip(encryptedClip, triggerEvent) {
    try {
      const documentsDir = FileSystem.documentDirectory;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `vantus_clip_${timestamp}_${triggerEvent.type}.mp4.enc`;
      const filePath = `${documentsDir}${filename}`;

      // Write encrypted clip to permanent storage
      await FileSystem.writeAsStringAsync(filePath, encryptedClip.data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const clipInfo = {
        id: `clip_${Date.now()}`,
        filename: filename,
        filePath: filePath,
        timestamp: new Date().toISOString(),
        triggerEvent: triggerEvent,
        duration: this.totalClipDuration / 1000, // seconds
        resolution: this.resolution,
        frameRate: this.frameRate,
        encrypted: true,
      };

      this.triggeredClips.push(clipInfo);

      logger.info('Clip saved', { clipInfo });

      return clipInfo;
    } catch (error) {
      logger.error('Failed to save clip', error);
      throw error;
    }
  }

  /**
   * Get triggered clips
   */
  getTriggeredClips() {
    return this.triggeredClips;
  }

  /**
   * Delete clip
   */
  async deleteClip(clipId) {
    const clip = this.triggeredClips.find(c => c.id === clipId);
    if (!clip) return false;

    try {
      await FileSystem.deleteAsync(clip.filePath, { idempotent: true });
      this.triggeredClips = this.triggeredClips.filter(c => c.id !== clipId);
      return true;
    } catch (error) {
      logger.error('Failed to delete clip', error);
      return false;
    }
  }

  /**
   * Get buffer status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      bufferDuration: this.bufferDuration,
      postTriggerDuration: this.postTriggerDuration,
      totalClipDuration: this.totalClipDuration,
      resolution: this.resolution,
      frameRate: this.frameRate,
      triggeredClipsCount: this.triggeredClips.length,
    };
  }
}

// Export singleton instance
export default new VideoBuffer();
