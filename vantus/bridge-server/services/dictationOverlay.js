/**
 * Dictation Overlay System
 * Allows officer to "talk" to partner during scene
 * Natural language processing for voice commands
 */

const logger = require('../utils/logger');
const factAnchoring = require('./factAnchoring');

class DictationOverlay {
  constructor() {
    this.commandHistory = [];
    this.commandPatterns = {
      mark: {
        patterns: [
          /mark (?:that|the) (.+) as (.+)/i,
          /mark (.+) as (.+)/i,
          /note (.+) as (.+)/i,
        ],
        handler: 'handleMarkCommand',
      },
      log: {
        patterns: [
          /log (.+)/i,
          /record (.+)/i,
          /note (.+)/i,
        ],
        handler: 'handleLogCommand',
      },
      fact: {
        patterns: [
          /fact (.+)/i,
          /remember (.+)/i,
        ],
        handler: 'handleFactCommand',
      },
    };
  }

  /**
   * Process voice command
   * @param {string} officerName - Officer name
   * @param {string} transcript - Voice transcript
   * @param {Object} context - Context
   * @returns {Object} Command processing result
   */
  async processCommand(officerName, transcript, context = {}) {
    if (!transcript || transcript.trim().length === 0) {
      return {
        recognized: false,
        command: null,
      };
    }

    try {
      // Check if transcript starts with "Vantus" (wake word)
      const lowerTranscript = transcript.toLowerCase().trim();
      const hasWakeWord = lowerTranscript.startsWith('vantus');
      
      if (!hasWakeWord) {
        return {
          recognized: false,
          command: null,
          reason: 'No wake word detected',
        };
      }

      // Extract command after wake word
      const commandText = transcript.substring(transcript.toLowerCase().indexOf('vantus') + 6).trim();

      // Try to match command patterns
      const command = this.matchCommand(commandText);

      if (!command) {
        return {
          recognized: false,
          command: null,
          reason: 'Command not recognized',
          transcript,
        };
      }

      // Execute command
      const result = await this.executeCommand(officerName, command, context);

      // Store command history
      this.commandHistory.push({
        officerName,
        timestamp: new Date().toISOString(),
        transcript,
        command,
        result,
      });

      if (this.commandHistory.length > 1000) {
        this.commandHistory.shift();
      }

      return {
        recognized: true,
        command: command.type,
        result,
        transcript,
      };
    } catch (error) {
      logger.error('Dictation overlay command processing error', error);
      return {
        recognized: false,
        command: null,
        error: error.message,
      };
    }
  }

  /**
   * Match command text to command patterns
   */
  matchCommand(commandText) {
    for (const [type, config] of Object.entries(this.commandPatterns)) {
      for (const pattern of config.patterns) {
        const match = commandText.match(pattern);
        if (match) {
          return {
            type,
            handler: config.handler,
            match,
            groups: match.slice(1), // Capture groups
            fullMatch: match[0],
          };
        }
      }
    }

    return null;
  }

  /**
   * Execute command
   */
  async executeCommand(officerName, command, context) {
    const handler = this[command.handler];
    
    if (!handler || typeof handler !== 'function') {
      return {
        success: false,
        error: 'Handler not found',
      };
    }

    return await handler.call(this, officerName, command, context);
  }

  /**
   * Handle mark command
   * Example: "Vantus, mark that blue Toyota as a witness vehicle"
   */
  async handleMarkCommand(officerName, command, context) {
    const [item, category] = command.groups;
    
    // Anchor fact
    const fact = factAnchoring.anchorFact(
      officerName,
      `${item} marked as ${category}`,
      {
        type: 'mark',
        item,
        category,
        context,
      }
    );

    logger.info('Mark command executed', {
      officerName,
      item,
      category,
      factId: fact.id,
    });

    return {
      success: true,
      message: `Marked ${item} as ${category}`,
      fact,
    };
  }

  /**
   * Handle log command
   * Example: "Vantus, log suspect fled on foot"
   */
  async handleLogCommand(officerName, command, context) {
    const [event] = command.groups;
    
    // Anchor fact
    const fact = factAnchoring.anchorFact(
      officerName,
      event,
      {
        type: 'log',
        event,
        context,
      }
    );

    logger.info('Log command executed', {
      officerName,
      event,
      factId: fact.id,
    });

    return {
      success: true,
      message: `Logged: ${event}`,
      fact,
    };
  }

  /**
   * Handle fact command
   * Example: "Vantus, fact suspect was wearing red shirt"
   */
  async handleFactCommand(officerName, command, context) {
    const [factText] = command.groups;
    
    // Anchor fact
    const fact = factAnchoring.anchorFact(
      officerName,
      factText,
      {
        type: 'fact',
        context,
      }
    );

    logger.info('Fact command executed', {
      officerName,
      fact: factText,
      factId: fact.id,
    });

    return {
      success: true,
      message: `Fact recorded: ${factText}`,
      fact,
    };
  }

  /**
   * Get command history
   */
  getCommandHistory(officerName, options = {}) {
    let history = this.commandHistory;
    
    if (officerName) {
      history = history.filter(c => c.officerName === officerName);
    }
    
    const { limit } = options;
    if (limit) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalCommands = this.commandHistory.length;
    const recognizedCommands = this.commandHistory.filter(c => c.recognized).length;

    return {
      totalCommands,
      recognizedCommands,
      recognitionRate: totalCommands > 0 ? (recognizedCommands / totalCommands) * 100 : 0,
    };
  }
}

module.exports = new DictationOverlay();
