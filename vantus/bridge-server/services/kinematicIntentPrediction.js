/**
 * Kinematic Intent Prediction System
 * Analyzes velocity and weight distribution to predict imminent attacks
 * 500ms prediction window before attack begins
 */

const logger = require('../utils/logger');

class KinematicIntentPrediction {
  constructor() {
    this.predictionHistory = [];
    this.velocityHistory = new Map(); // officerName -> velocity history
    this.weightDistributionHistory = new Map(); // officerName -> weight distribution
  }

  /**
   * Predict imminent attack based on kinematic analysis
   * @param {string} officerName - Officer name
   * @param {Object} movementData - Current movement data
   * @param {Object} options - Analysis options
   * @returns {Object} Prediction result
   */
  predictIntent(officerName, movementData, options = {}) {
    if (!movementData || !movementData.movementHistory || movementData.movementHistory.length < 3) {
      return {
        predicted: false,
        confidence: 0,
        timeToEvent: null,
        intentType: null,
      };
    }

    try {
      // Analyze velocity patterns
      const velocityAnalysis = this.analyzeVelocity(movementData.movementHistory);
      
      // Analyze weight distribution (if available from pose estimation)
      const weightAnalysis = this.analyzeWeightDistribution(movementData, options);
      
      // Detect "load" signature (imminent attack)
      const loadSignature = this.detectLoadSignature(velocityAnalysis, weightAnalysis);
      
      // Predict foot pursuit
      const pursuitPrediction = this.predictFootPursuit(velocityAnalysis);
      
      // Combine predictions
      const prediction = this.combinePredictions(loadSignature, pursuitPrediction, options);

      // Store prediction history
      this.predictionHistory.push({
        officerName,
        timestamp: new Date().toISOString(),
        prediction,
        velocityAnalysis,
        weightAnalysis,
      });

      if (this.predictionHistory.length > 1000) {
        this.predictionHistory.shift();
      }

      return prediction;
    } catch (error) {
      logger.error('Kinematic intent prediction error', error);
      return {
        predicted: false,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Analyze velocity patterns
   */
  analyzeVelocity(movementHistory) {
    if (movementHistory.length < 3) {
      return { acceleration: 0, velocityChange: 0, pattern: 'stable' };
    }

    const recent = movementHistory.slice(-5); // Last 5 readings
    const velocities = recent.map(m => m.speed || 0);
    
    // Calculate acceleration
    const accelerations = [];
    for (let i = 1; i < velocities.length; i++) {
      const accel = velocities[i] - velocities[i - 1];
      accelerations.push(accel);
    }
    
    const avgAcceleration = accelerations.reduce((a, b) => a + b, 0) / accelerations.length;
    
    // Detect sudden acceleration (attack preparation)
    const suddenAcceleration = avgAcceleration > 2.0; // m/s² threshold
    
    // Detect sudden deceleration (preparing to strike)
    const suddenDeceleration = avgAcceleration < -2.0;
    
    // Velocity change rate
    const velocityChange = velocities[velocities.length - 1] - velocities[0];
    
    return {
      acceleration: avgAcceleration,
      velocityChange,
      suddenAcceleration,
      suddenDeceleration,
      pattern: suddenAcceleration ? 'accelerating' : 
               suddenDeceleration ? 'decelerating' : 'stable',
      currentVelocity: velocities[velocities.length - 1],
    };
  }

  /**
   * Analyze weight distribution (from pose estimation)
   */
  analyzeWeightDistribution(movementData, options) {
    // In production, this would use pose keypoints to determine
    // weight distribution (forward lean, backward lean, etc.)
    // For now, use simplified heuristics
    
    const poseData = options.poseData || movementData.poseData;
    
    if (!poseData || !poseData.keypoints) {
      return {
        forwardLean: false,
        backwardLean: false,
        weightShift: 'neutral',
        confidence: 0,
      };
    }

    // Simplified: check if keypoints indicate weight shift
    // Real implementation would analyze hip, knee, ankle positions
    const keypoints = poseData.keypoints;
    
    // Placeholder logic - would need actual pose keypoint analysis
    const forwardLean = false; // Would calculate from keypoints
    const backwardLean = false;
    
    return {
      forwardLean,
      backwardLean,
      weightShift: forwardLean ? 'forward' : backwardLean ? 'backward' : 'neutral',
      confidence: 0.5, // Placeholder
    };
  }

  /**
   * Detect "load" signature (imminent attack)
   * Load signature: weight shift + velocity change indicating attack preparation
   */
  detectLoadSignature(velocityAnalysis, weightAnalysis) {
    // Load signature indicators:
    // 1. Sudden deceleration (stopping to strike)
    // 2. Forward weight shift (leaning into attack)
    // 3. Rapid velocity change
    
    const hasLoadSignature = 
      (velocityAnalysis.suddenDeceleration && weightAnalysis.forwardLean) ||
      (Math.abs(velocityAnalysis.velocityChange) > 3.0 && weightAnalysis.weightShift !== 'neutral');

    const confidence = hasLoadSignature ? 0.75 : 0;

    return {
      detected: hasLoadSignature,
      confidence,
      indicators: {
        suddenDeceleration: velocityAnalysis.suddenDeceleration,
        forwardLean: weightAnalysis.forwardLean,
        velocityChange: velocityAnalysis.velocityChange,
      },
      timeToEvent: hasLoadSignature ? 500 : null, // 500ms prediction window
      intentType: hasLoadSignature ? 'imminent_attack' : null,
    };
  }

  /**
   * Predict foot pursuit
   */
  predictFootPursuit(velocityAnalysis) {
    // Foot pursuit indicators:
    // 1. Sudden acceleration
    // 2. Sustained high velocity
    // 3. Rapid velocity increase
    
    const isPursuit = 
      velocityAnalysis.suddenAcceleration &&
      velocityAnalysis.currentVelocity > 3.0; // Running speed threshold

    return {
      predicted: isPursuit,
      confidence: isPursuit ? 0.70 : 0,
      timeToEvent: isPursuit ? 500 : null,
      intentType: isPursuit ? 'foot_pursuit' : null,
      indicators: {
        suddenAcceleration: velocityAnalysis.suddenAcceleration,
        highVelocity: velocityAnalysis.currentVelocity > 3.0,
      },
    };
  }

  /**
   * Combine predictions
   */
  combinePredictions(loadSignature, pursuitPrediction, options) {
    // Prioritize load signature (imminent attack) over pursuit
    if (loadSignature.detected) {
      return {
        predicted: true,
        confidence: loadSignature.confidence,
        timeToEvent: loadSignature.timeToEvent,
        intentType: loadSignature.intentType,
        indicators: loadSignature.indicators,
        predictionWindow: 500, // 500ms
      };
    }

    if (pursuitPrediction.predicted) {
      return {
        predicted: true,
        confidence: pursuitPrediction.confidence,
        timeToEvent: pursuitPrediction.timeToEvent,
        intentType: pursuitPrediction.intentType,
        indicators: pursuitPrediction.indicators,
        predictionWindow: 500,
      };
    }

    return {
      predicted: false,
      confidence: 0,
      timeToEvent: null,
      intentType: null,
    };
  }

  /**
   * Get prediction statistics
   */
  getStats() {
    const totalPredictions = this.predictionHistory.length;
    const accuratePredictions = this.predictionHistory.filter(p => 
      p.prediction.predicted && p.prediction.confidence > 0.7
    ).length;

    return {
      totalPredictions,
      accuratePredictions,
      accuracyRate: totalPredictions > 0 ? (accuratePredictions / totalPredictions) * 100 : 0,
    };
  }
}

module.exports = new KinematicIntentPrediction();
