/**
 * Model Registry - Configuration and management for all detection models
 * Ready to integrate model data when available
 */

class ModelRegistry {
  constructor() {
    this.models = {
      weapon: {
        category: 'Weapon',
        detects: ['Handgun', 'Rifle', 'Knife', 'Blunt weapon'],
        modelType: 'Custom YOLOv8-nano',
        confidenceThreshold: 0.70,
        status: 'pending', // 'pending' | 'loading' | 'ready' | 'error'
        modelPath: null, // Will be set when model is loaded
        classes: ['handgun', 'rifle', 'shotgun', 'knife', 'blade', 'blunt_weapon'],
        trainingData: {
          handgun: { required: 5000, sources: ['Open Images', 'custom collection'] },
          rifle_shotgun: { required: 2000, sources: ['Open Images', 'custom collection'] },
          knife_blade: { required: 3000, sources: ['Open Images', 'custom collection'] },
          blunt: { required: 1000, sources: ['custom collection'] },
          negative: { required: 10000, sources: ['COCO', 'custom collection'] },
        },
      },
      stance: {
        category: 'Stance',
        detects: ['Bladed stance', 'Fighting stance'],
        modelType: 'MoveNet + custom logic',
        confidenceThreshold: 0.65,
        status: 'pending',
        modelPath: null,
        keypoints: 17, // MoveNet keypoints
        logic: 'custom_stance_detection',
      },
      hands: {
        category: 'Hands',
        detects: ['Hands hidden', 'Waistband reach'],
        modelType: 'MoveNet + custom logic',
        confidenceThreshold: 0.60,
        status: 'pending',
        modelPath: null,
        keypoints: 17, // MoveNet keypoints
        logic: 'custom_hands_detection',
      },
      biometric: {
        category: 'Biometric',
        detects: ['HR spike >40% above baseline'],
        modelType: 'Wearable data',
        confidenceThreshold: null, // N/A - uses percentage threshold
        status: 'pending',
        threshold: 0.40, // 40% above baseline
        baselineRequired: true,
      },
      audio: {
        category: 'Audio',
        detects: ['Aggressive vocal patterns', 'Screaming'],
        modelType: 'Custom audio classifier',
        confidenceThreshold: 0.70,
        status: 'pending',
        modelPath: null,
        classes: ['aggressive', 'screaming', 'normal'],
      },
    };

    this.loadedModels = new Map();
  }

  /**
   * Get model configuration
   */
  getModel(category) {
    return this.models[category] || null;
  }

  /**
   * Get all model configurations
   */
  getAllModels() {
    return this.models;
  }

  /**
   * Update model status
   */
  setModelStatus(category, status) {
    if (this.models[category]) {
      this.models[category].status = status;
    }
  }

  /**
   * Set model path (when model is loaded)
   */
  setModelPath(category, path) {
    if (this.models[category]) {
      this.models[category].modelPath = path;
    }
  }

  /**
   * Check if model is ready
   */
  isModelReady(category) {
    const model = this.models[category];
    return model && model.status === 'ready';
  }

  /**
   * Get confidence threshold for model
   */
  getConfidenceThreshold(category) {
    const model = this.models[category];
    if (!model) return null;
    
    // Biometric uses percentage threshold, not confidence
    if (category === 'biometric') {
      return model.threshold; // 0.40 = 40%
    }
    
    return model.confidenceThreshold;
  }

  /**
   * Register loaded model instance
   */
  registerModel(category, modelInstance) {
    this.loadedModels.set(category, modelInstance);
    this.setModelStatus(category, 'ready');
  }

  /**
   * Get loaded model instance
   */
  getLoadedModel(category) {
    return this.loadedModels.get(category);
  }

  /**
   * Get model summary for status display
   */
  getModelSummary() {
    const summary = {};
    Object.keys(this.models).forEach(category => {
      const model = this.models[category];
      summary[category] = {
        category: model.category,
        status: model.status,
        ready: model.status === 'ready',
        threshold: this.getConfidenceThreshold(category),
      };
    });
    return summary;
  }
}

// Export singleton instance
export default new ModelRegistry();
