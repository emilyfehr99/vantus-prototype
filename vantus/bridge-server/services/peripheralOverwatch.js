/**
 * Peripheral Overwatch System
 * Scans entire frame including officer's "six" and periphery
 * Detects secondary suspects and threats outside officer's focus
 */

const logger = require('../utils/logger');
const llmVisionService = require('./llmVisionService');

class PeripheralOverwatch {
  constructor() {
    this.scanHistory = [];
    this.peripheralThreats = new Map(); // Track threats by location
  }

  /**
   * Scan entire frame for peripheral threats
   * @param {string} frameBase64 - Base64 encoded frame
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} Peripheral scan results
   */
  async scanPeriphery(frameBase64, options = {}) {
    if (!frameBase64) {
      return {
        threats: [],
        officerSix: null,
        secondarySuspects: [],
        peripheryClear: true,
      };
    }

    try {
      // Use LLM vision to analyze full frame
      const analysis = await llmVisionService.analyzeImage(frameBase64, {
        frameTime: options.frameTime,
        officerName: options.officerName,
        detectionTypes: ['weapon', 'stance', 'hands', 'crowd'],
        peripheralScan: true, // Flag for peripheral analysis
      });

      // Extract peripheral threats
      const peripheralThreats = this.extractPeripheralThreats(analysis, options);
      
      // Detect officer's "six" (behind officer)
      const officerSix = this.detectOfficerSix(analysis, options);
      
      // Detect secondary suspects
      const secondarySuspects = this.detectSecondarySuspects(analysis, options);

      const result = {
        threats: peripheralThreats,
        officerSix,
        secondarySuspects,
        peripheryClear: peripheralThreats.length === 0 && !officerSix.threat && secondarySuspects.length === 0,
        timestamp: new Date().toISOString(),
        frameTime: options.frameTime,
      };

      // Store scan history
      this.scanHistory.push(result);
      if (this.scanHistory.length > 100) {
        this.scanHistory.shift();
      }

      return result;
    } catch (error) {
      logger.error('Peripheral overwatch scan error', error);
      return {
        threats: [],
        officerSix: { threat: false, reason: 'Scan error' },
        secondarySuspects: [],
        peripheryClear: true,
        error: error.message,
      };
    }
  }

  /**
   * Extract peripheral threats from analysis
   */
  extractPeripheralThreats(analysis, options) {
    const threats = [];

    // Check for weapons in periphery
    if (analysis.weapon && analysis.weapon.detected) {
      // Check if weapon is in periphery (not center focus)
      const isPeripheral = this.isPeripheralLocation(analysis.weapon, options);
      if (isPeripheral) {
        threats.push({
          type: 'weapon',
          location: 'periphery',
          confidence: analysis.weapon.confidence,
          details: analysis.weapon,
        });
      }
    }

    // Check for fighting stances in periphery
    if (analysis.stance && analysis.stance.detected && analysis.stance.stanceType === 'fighting_stance') {
      const isPeripheral = this.isPeripheralLocation(analysis.stance, options);
      if (isPeripheral) {
        threats.push({
          type: 'fighting_stance',
          location: 'periphery',
          confidence: analysis.stance.confidence,
          details: analysis.stance,
        });
      }
    }

    // Check for crowd/group approaching
    if (analysis.crowd && analysis.crowd.detected && analysis.crowd.individualCount > 1) {
      threats.push({
        type: 'crowd',
        location: 'periphery',
        count: analysis.crowd.individualCount,
        density: analysis.crowd.density,
        confidence: analysis.crowd.confidence,
      });
    }

    return threats;
  }

  /**
   * Detect threats in officer's "six" (behind officer)
   */
  detectOfficerSix(analysis, options) {
    // In a real implementation, we'd use pose estimation to determine
    // officer's facing direction and identify what's behind them
    // For now, use heuristics based on detection positions

    const sixThreats = [];

    // Check for weapons behind officer (would need pose data)
    if (analysis.weapon && analysis.weapon.detected) {
      // Simplified: if weapon detected and officer is facing away, it's in six
      // In production, use pose estimation to determine officer facing
      const isBehind = this.isBehindOfficer(analysis.weapon, options);
      if (isBehind) {
        sixThreats.push({
          type: 'weapon',
          confidence: analysis.weapon.confidence,
        });
      }
    }

    // Check for approaching individuals behind officer
    if (analysis.crowd && analysis.crowd.detected) {
      const approachingBehind = this.isApproachingBehind(analysis.crowd, options);
      if (approachingBehind) {
        sixThreats.push({
          type: 'approaching_individual',
          count: analysis.crowd.individualCount,
        });
      }
    }

    return {
      threat: sixThreats.length > 0,
      threats: sixThreats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detect secondary suspects (multiple individuals)
   */
  detectSecondarySuspects(analysis, options) {
    const suspects = [];

    // If crowd detected with multiple individuals
    if (analysis.crowd && analysis.crowd.detected && analysis.crowd.individualCount > 1) {
      suspects.push({
        count: analysis.crowd.individualCount,
        density: analysis.crowd.density,
        location: 'periphery',
        confidence: analysis.crowd.confidence,
      });
    }

    // Check for multiple weapons (multiple suspects)
    if (analysis.weapon && analysis.weapon.detected && analysis.weapon.detections) {
      const weaponCount = analysis.weapon.detections.length;
      if (weaponCount > 1) {
        suspects.push({
          count: weaponCount,
          type: 'multiple_weapons',
          confidence: analysis.weapon.confidence,
        });
      }
    }

    return suspects;
  }

  /**
   * Check if detection is in peripheral area (not center focus)
   */
  isPeripheralLocation(detection, options) {
    // Simplified: assume detections without center coordinates are peripheral
    // In production, use bounding box coordinates to determine location
    if (detection.bbox) {
      const { x, y, width, height } = detection.bbox;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      // Define center focus area (middle 60% of frame)
      const frameWidth = options.frameWidth || 1920;
      const frameHeight = options.frameHeight || 1080;
      const centerMargin = 0.2; // 20% margin on each side
      
      const inCenterX = centerX > (frameWidth * centerMargin) && 
                        centerX < (frameWidth * (1 - centerMargin));
      const inCenterY = centerY > (frameHeight * centerMargin) && 
                        centerY < (frameHeight * (1 - centerMargin));
      
      // Peripheral if NOT in center
      return !(inCenterX && inCenterY);
    }
    
    // Default: assume peripheral if no location data
    return true;
  }

  /**
   * Check if threat is behind officer
   */
  isBehindOfficer(detection, options) {
    // In production, use pose estimation to determine officer facing direction
    // For now, use simplified heuristic
    // Would need: officer pose keypoints, detection bbox position
    
    // Simplified: if detection is in upper portion of frame and officer
    // is looking forward, it might be behind (depends on camera angle)
    // This is a placeholder - real implementation needs pose data
    
    return false; // Placeholder
  }

  /**
   * Check if crowd is approaching from behind
   */
  isApproachingBehind(crowd, options) {
    // Would need temporal analysis (multiple frames) to detect approach
    // For now, simplified check
    return crowd.density === 'high' || crowd.individualCount > 2;
  }

  /**
   * Get scan statistics
   */
  getStats() {
    const totalScans = this.scanHistory.length;
    const threatsDetected = this.scanHistory.filter(s => !s.peripheryClear).length;
    const sixThreats = this.scanHistory.filter(s => s.officerSix && s.officerSix.threat).length;

    return {
      totalScans,
      threatsDetected,
      threatRate: totalScans > 0 ? (threatsDetected / totalScans) * 100 : 0,
      sixThreats,
      sixThreatRate: totalScans > 0 ? (sixThreats / totalScans) * 100 : 0,
    };
  }
}

module.exports = new PeripheralOverwatch();
