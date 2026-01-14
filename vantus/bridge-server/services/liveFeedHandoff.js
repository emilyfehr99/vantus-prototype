/**
 * Live-Feed Hand-off System
 * Instantly pushes BWC live stream and "Tactical Intent" metadata
 * to Lieutenant's dashboard during a crisis
 * Removes permission lag typical of legacy systems
 */

const logger = require('../utils/logger');

class LiveFeedHandoff {
  constructor() {
    this.activeStreams = new Map(); // officerName -> stream data
    this.streamHistory = [];
  }

  /**
   * Initiate live feed hand-off
   * @param {string} officerName - Officer name
   * @param {Object} crisisData - Crisis detection data
   * @param {Object} tacticalIntent - Tactical intent metadata
   * @param {string} streamUrl - BWC live stream URL
   * @returns {Object} Hand-off initiation result
   */
  initiateHandoff(officerName, crisisData, tacticalIntent, streamUrl = null) {
    // Check if stream already active
    if (this.activeStreams.has(officerName)) {
      const existing = this.activeStreams.get(officerName);
      logger.debug('Live feed already active', { officerName, streamId: existing.id });
      return {
        initiated: false,
        reason: 'Stream already active',
        stream: existing,
      };
    }

    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stream = {
      id: streamId,
      officerName,
      streamUrl: streamUrl || this.generateStreamUrl(officerName),
      crisisData,
      tacticalIntent,
      startedAt: new Date().toISOString(),
      status: 'active',
      viewers: [], // Supervisor IDs viewing the stream
    };

    this.activeStreams.set(officerName, stream);

    // Store in history
    this.streamHistory.push({
      ...stream,
      endedAt: null,
    });

    if (this.streamHistory.length > 100) {
      this.streamHistory.shift();
    }

    logger.info('Live feed hand-off initiated', {
      officerName,
      streamId,
      tacticalIntent,
    });

    return {
      initiated: true,
      streamId,
      stream,
      message: 'Live feed hand-off initiated - stream available to supervisors',
    };
  }

  /**
   * Generate stream URL (in production, would use actual streaming service)
   */
  generateStreamUrl(officerName) {
    // In production, this would generate a real streaming URL
    // For now, return a placeholder
    return `rtsp://stream.vantus.local/${officerName}/live`;
  }

  /**
   * Add viewer to stream
   */
  addViewer(officerName, supervisorId) {
    const stream = this.activeStreams.get(officerName);
    
    if (!stream) {
      return {
        added: false,
        reason: 'Stream not active',
      };
    }

    if (!stream.viewers.includes(supervisorId)) {
      stream.viewers.push(supervisorId);
    }

    return {
      added: true,
      stream,
      viewerCount: stream.viewers.length,
    };
  }

  /**
   * Remove viewer from stream
   */
  removeViewer(officerName, supervisorId) {
    const stream = this.activeStreams.get(officerName);
    
    if (!stream) {
      return {
        removed: false,
        reason: 'Stream not active',
      };
    }

    stream.viewers = stream.viewers.filter(id => id !== supervisorId);

    return {
      removed: true,
      stream,
      viewerCount: stream.viewers.length,
    };
  }

  /**
   * End live feed hand-off
   */
  endHandoff(officerName, reason = 'Crisis resolved') {
    const stream = this.activeStreams.get(officerName);
    
    if (!stream) {
      return {
        ended: false,
        reason: 'Stream not active',
      };
    }

    stream.status = 'ended';
    stream.endedAt = new Date().toISOString();
    stream.endReason = reason;

    // Update history
    const historyEntry = this.streamHistory.find(s => s.id === stream.id);
    if (historyEntry) {
      historyEntry.endedAt = stream.endedAt;
      historyEntry.endReason = reason;
    }

    this.activeStreams.delete(officerName);

    logger.info('Live feed hand-off ended', {
      officerName,
      streamId: stream.id,
      reason,
      duration: new Date(stream.endedAt) - new Date(stream.startedAt),
    });

    return {
      ended: true,
      stream,
    };
  }

  /**
   * Get active streams
   */
  getActiveStreams() {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Get stream for officer
   */
  getStream(officerName) {
    return this.activeStreams.get(officerName) || null;
  }

  /**
   * Update tactical intent metadata
   */
  updateTacticalIntent(officerName, tacticalIntent) {
    const stream = this.activeStreams.get(officerName);
    
    if (!stream) {
      return {
        updated: false,
        reason: 'Stream not active',
      };
    }

    stream.tacticalIntent = {
      ...stream.tacticalIntent,
      ...tacticalIntent,
      lastUpdated: new Date().toISOString(),
    };

    return {
      updated: true,
      stream,
    };
  }

  /**
   * Get stream history
   */
  getStreamHistory(officerName = null) {
    if (officerName) {
      return this.streamHistory.filter(s => s.officerName === officerName);
    }
    return this.streamHistory;
  }
}

module.exports = new LiveFeedHandoff();
