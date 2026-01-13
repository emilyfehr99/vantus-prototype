import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// COCO-SSD class IDs
// Class 67 = 'cell phone'
const CELL_PHONE_CLASS_ID = 67;
const MIN_CONFIDENCE = 0.5;

class DetectionService {
  constructor() {
    this.model = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing TensorFlow.js...');
      
      // Initialize TensorFlow.js backend
      await tf.ready();
      logger.info('TensorFlow.js ready');

      // Load COCO-SSD model
      // Using MobileNet v2 for better mobile performance
      logger.info('Loading COCO-SSD model...');
      this.model = await cocoSsd.load({
        base: 'mobilenet_v2',
      });
      
      logger.info('COCO-SSD model loaded successfully');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Error initializing detection service', error);
      // Don't throw - allow app to work with simulated mode
      this.isInitialized = false;
    }
  }

  async detectObjects(imageUri) {
    if (!this.isInitialized || !this.model) {
      throw new Error('Detection service not initialized');
    }

    try {
      // For React Native, we need to handle image loading differently
      // Read the image file and convert to a format TensorFlow can use
      
      if (Platform.OS === 'web') {
        // Web platform: use Image element
        return await this.detectObjectsWeb(imageUri);
      } else {
        // Native platform: use file system and base64
        return await this.detectObjectsNative(imageUri);
      }
    } catch (error) {
      logger.error('Error detecting objects', error);
      return {
        detected: false,
        detections: [],
        allDetections: [],
        error: error.message,
      };
    }
  }

  async detectObjectsWeb(imageUri) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        try {
          const imageTensor = tf.browser.fromPixels(img);
          const predictions = await this.model.detect(imageTensor);
          imageTensor.dispose();
          
          const cellPhoneDetections = predictions.filter(
            (prediction) =>
              prediction.class === 'cell phone' &&
              prediction.score >= MIN_CONFIDENCE
          );
          
          resolve({
            detected: cellPhoneDetections.length > 0,
            detections: cellPhoneDetections,
            allDetections: predictions,
          });
        } catch (error) {
          logger.error('Error in detection', error);
          resolve({
            detected: false,
            detections: [],
            allDetections: [],
            error: error.message,
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          detected: false,
          detections: [],
          allDetections: [],
          error: 'Failed to load image',
        });
      };
      
      img.src = imageUri;
    });
  }

  async detectObjectsNative(imageUri) {
    try {
      // For native, we'll use a fetch-based approach
      // This works by loading the image as a data URL
      const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Create a data URL
      const dataUrl = `data:image/jpeg;base64,${imageBase64}`;
      
      // Use the web method with data URL (works in React Native context)
      return await this.detectObjectsWeb(dataUrl);
    } catch (error) {
      logger.error('Error in native detection', error);
      return {
        detected: false,
        detections: [],
        allDetections: [],
        error: error.message,
      };
    }
  }

  isReady() {
    return this.isInitialized && this.model !== null;
  }
}

// Export singleton instance
export default new DetectionService();
