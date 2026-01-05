// Image Processing Service for Low-Light Enhancement
// Applies histogram equalization and software gain for night vision

import * as tf from '@tensorflow/tfjs';

class ImageProcessingService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize image processing service
   */
  async initialize() {
    try {
      await tf.ready();
      this.isInitialized = true;
      console.log('Image processing service initialized');
    } catch (error) {
      console.error('Error initializing image processing:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Enhance image for low-light conditions
   * @param {string} imageUri - URI of the image to enhance
   * @param {Object} options - Processing options
   * @returns {string} Enhanced image URI
   */
  async enhanceLowLight(imageUri, options = {}) {
    if (!this.isInitialized) {
      return imageUri; // Return original if not initialized
    }

    const {
      gain = 1.5,              // Software gain multiplier
      histogramEqualization = true, // Apply histogram equalization
      contrast = 1.2,          // Contrast adjustment
      brightness = 0.1         // Brightness adjustment
    } = options;

    try {
      // Load image
      let imageTensor;
      
      if (typeof imageUri === 'string' && imageUri.startsWith('data:')) {
        // Data URL
        const img = new Image();
        img.src = imageUri;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        imageTensor = tf.browser.fromPixels(img);
      } else {
        // File URI (for native)
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUri;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        imageTensor = tf.browser.fromPixels(img);
      }

      // Convert to float32 for processing
      let processed = imageTensor.toFloat().div(255.0);

      // Apply brightness adjustment
      processed = processed.add(brightness);

      // Apply contrast
      processed = processed.sub(0.5).mul(contrast).add(0.5);

      // Apply software gain
      processed = processed.mul(gain);

      // Histogram equalization
      if (histogramEqualization) {
        processed = this.applyHistogramEqualization(processed);
      }

      // Clamp values to [0, 1]
      processed = processed.clipByValue(0, 1);

      // Convert back to uint8
      const enhanced = processed.mul(255).cast('int32');

      // Convert to image
      const canvas = document.createElement('canvas');
      canvas.width = imageTensor.shape[1];
      canvas.height = imageTensor.shape[0];
      const ctx = canvas.getContext('2d');
      
      await tf.browser.toPixels(enhanced, canvas);
      
      // Cleanup
      imageTensor.dispose();
      processed.dispose();
      enhanced.dispose();

      // Return data URL
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      console.error('Error enhancing image:', error);
      return imageUri; // Return original on error
    }
  }

  /**
   * Apply histogram equalization to image tensor
   */
  applyHistogramEqualization(imageTensor) {
    // Convert to grayscale for histogram calculation
    const gray = tf.tidy(() => {
      const [r, g, b] = tf.split(imageTensor, 3, 2);
      return r.mul(0.299).add(g.mul(0.587)).add(b.mul(0.114));
    });

    // Calculate histogram
    const histogram = tf.tidy(() => {
      const flat = gray.flatten();
      const bins = tf.range(0, 256, 1, 'int32');
      const hist = tf.histogram(flat, bins, 256, 0, 255);
      return hist;
    });

    // Calculate cumulative distribution function (CDF)
    const cdf = tf.tidy(() => {
      return histogram.cumsum();
    });

    // Normalize CDF
    const normalizedCdf = tf.tidy(() => {
      const total = cdf.max();
      return cdf.div(total);
    });

    // Apply equalization to each channel
    const equalized = tf.tidy(() => {
      const [r, g, b] = tf.split(imageTensor, 3, 2);
      
      const equalizeChannel = (channel) => {
        const flat = channel.flatten();
        const indices = flat.mul(255).cast('int32');
        const mapped = tf.gather(normalizedCdf, indices);
        return mapped.reshape(channel.shape);
      };

      const rEq = equalizeChannel(r);
      const gEq = equalizeChannel(g);
      const bEq = equalizeChannel(b);

      return tf.stack([rEq, gEq, bEq], 2).squeeze();
    });

    // Cleanup
    gray.dispose();
    histogram.dispose();
    cdf.dispose();
    normalizedCdf.dispose();

    return equalized;
  }

  /**
   * Detect if image is low-light
   */
  async isLowLight(imageUri) {
    try {
      const img = new Image();
      img.src = imageUri;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imageTensor = tf.browser.fromPixels(img);
      
      // Calculate average brightness
      const mean = imageTensor.mean();
      const brightness = await mean.data();
      
      imageTensor.dispose();
      mean.dispose();

      // Threshold for low-light detection (adjust based on testing)
      return brightness[0] < 0.3; // 30% of max brightness
    } catch (error) {
      console.error('Error detecting low-light:', error);
      return false;
    }
  }

  isReady() {
    return this.isInitialized;
  }
}

export default new ImageProcessingService();

