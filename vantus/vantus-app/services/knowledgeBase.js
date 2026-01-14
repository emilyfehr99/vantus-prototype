/**
 * KNOWLEDGE BASE SERVICE
 * Integrates with self-hosted knowledge management systems
 * Stores and retrieves pattern knowledge, historical insights, and operational context
 * Supports: Wiki.js, BookStack, Logseq, Joplin, and other knowledge bases
 */

import logger from '../utils/logger';
import configService from '../utils/config';

class KnowledgeBase {
  constructor() {
    this.provider = null; // 'wikijs' | 'bookstack' | 'logseq' | 'joplin' | 'api'
    this.apiUrl = null;
    this.apiKey = null;
    this.enabled = false;
    this.cache = new Map(); // Local cache for frequently accessed knowledge
    this.cacheExpiry = 3600000; // 1 hour cache expiry
  }

  /**
   * Initialize knowledge base service
   * @param {string} provider - Knowledge base provider
   * @param {string} apiUrl - API endpoint URL
   * @param {string} apiKey - API key (if required)
   */
  initialize(provider, apiUrl, apiKey = null) {
    this.provider = provider;
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.enabled = !!apiUrl;

    if (this.enabled) {
      logger.info('Knowledge Base service initialized', { provider, apiUrl: apiUrl ? 'configured' : 'not set' });
    } else {
      logger.info('Knowledge Base service not configured - using local knowledge only');
    }
  }

  /**
   * Store pattern knowledge
   * @param {Object} knowledge - Knowledge object to store
   * @returns {Promise<boolean>} Success status
   */
  async storePatternKnowledge(knowledge) {
    if (!this.enabled) {
      logger.debug('Knowledge Base not enabled, skipping storage');
      return false;
    }

    try {
      const result = await this.callKnowledgeBaseAPI('store', knowledge);
      
      // Update cache
      const cacheKey = `pattern_${knowledge.patternType}_${knowledge.category}`;
      this.cache.set(cacheKey, {
        data: knowledge,
        timestamp: Date.now(),
      });

      return result.success || false;
    } catch (error) {
      logger.error('Failed to store pattern knowledge', error);
      return false;
    }
  }

  /**
   * Retrieve pattern knowledge
   * @param {string} patternType - Type of pattern (e.g., 'abrupt_stop', 'speech_rate')
   * @param {string} category - Pattern category (e.g., 'movement', 'audio')
   * @param {Object} context - Operational context
   * @returns {Promise<Object|null>} Pattern knowledge or null
   */
  async getPatternKnowledge(patternType, category, context = {}) {
    // Check cache first
    const cacheKey = `pattern_${patternType}_${category}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      logger.debug('Returning cached pattern knowledge', { patternType, category });
      return cached.data;
    }

    if (!this.enabled) {
      return this.getLocalPatternKnowledge(patternType, category);
    }

    try {
      const knowledge = await this.callKnowledgeBaseAPI('retrieve', {
        patternType,
        category,
        context,
      });

      if (knowledge) {
        // Update cache
        this.cache.set(cacheKey, {
          data: knowledge,
          timestamp: Date.now(),
        });
      }

      return knowledge || this.getLocalPatternKnowledge(patternType, category);
    } catch (error) {
      logger.error('Failed to retrieve pattern knowledge', error);
      return this.getLocalPatternKnowledge(patternType, category);
    }
  }

  /**
   * Store false positive pattern
   * @param {Object} signal - Signal that was false positive
   * @param {string} reason - Reason it was false positive
   * @param {Object} context - Operational context
   * @returns {Promise<boolean>} Success status
   */
  async storeFalsePositivePattern(signal, reason, context = {}) {
    if (!this.enabled) {
      return false;
    }

    try {
      const pattern = {
        type: 'false_positive',
        signalCategory: signal.signalCategory || signal.category,
        pattern: {
          confidence: signal.probability || signal.confidence,
          indicators: signal.indicators || [],
          context: signal.context || {},
        },
        reason,
        context,
        timestamp: new Date().toISOString(),
        officerId: signal.officerName || null,
      };

      return await this.storePatternKnowledge(pattern);
    } catch (error) {
      logger.error('Failed to store false positive pattern', error);
      return false;
    }
  }

  /**
   * Store historical pattern insight
   * @param {Object} insight - Pattern insight
   * @returns {Promise<boolean>} Success status
   */
  async storeHistoricalInsight(insight) {
    if (!this.enabled) {
      return false;
    }

    try {
      const knowledge = {
        type: 'historical_insight',
        patternType: insight.patternType,
        category: insight.category,
        insight: insight.insight,
        context: insight.context,
        timestamp: new Date().toISOString(),
        metadata: insight.metadata || {},
      };

      return await this.storePatternKnowledge(knowledge);
    } catch (error) {
      logger.error('Failed to store historical insight', error);
      return false;
    }
  }

  /**
   * Search knowledge base
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @returns {Promise<Array<Object>>} Search results
   */
  async searchKnowledge(query, filters = {}) {
    if (!this.enabled) {
      return [];
    }

    try {
      const results = await this.callKnowledgeBaseAPI('search', {
        query,
        filters,
      });

      return results || [];
    } catch (error) {
      logger.error('Failed to search knowledge base', error);
      return [];
    }
  }

  /**
   * Get operational context guide
   * @param {string} contextType - Type of operational context (e.g., 'traffic_stop', 'checkpoint')
   * @returns {Promise<Object|null>} Context guide or null
   */
  async getOperationalContextGuide(contextType) {
    const cacheKey = `context_${contextType}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    if (!this.enabled) {
      return this.getLocalContextGuide(contextType);
    }

    try {
      const guide = await this.callKnowledgeBaseAPI('context_guide', { contextType });

      if (guide) {
        this.cache.set(cacheKey, {
          data: guide,
          timestamp: Date.now(),
        });
      }

      return guide || this.getLocalContextGuide(contextType);
    } catch (error) {
      logger.error('Failed to retrieve context guide', error);
      return this.getLocalContextGuide(contextType);
    }
  }

  /**
   * Call knowledge base API
   * @param {string} action - API action
   * @param {Object} data - Data to send
   * @returns {Promise<Object>} API response
   */
  async callKnowledgeBaseAPI(action, data) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Provider-specific headers
    if (this.provider === 'wikijs') {
      headers['X-API-Key'] = this.apiKey;
    } else if (this.provider === 'bookstack') {
      headers['Authorization'] = `Token ${this.apiKey}`;
    }

    const url = this.getAPIEndpoint(action);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Knowledge Base API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Get API endpoint for action
   * @param {string} action - API action
   * @returns {string} API endpoint URL
   */
  getAPIEndpoint(action) {
    const endpoints = {
      wikijs: {
        store: `${this.apiUrl}/api/v1/pages`,
        retrieve: `${this.apiUrl}/api/v1/pages/search`,
        search: `${this.apiUrl}/api/v1/pages/search`,
        context_guide: `${this.apiUrl}/api/v1/pages/search`,
      },
      bookstack: {
        store: `${this.apiUrl}/api/pages`,
        retrieve: `${this.apiUrl}/api/pages`,
        search: `${this.apiUrl}/api/search`,
        context_guide: `${this.apiUrl}/api/pages`,
      },
      api: {
        store: `${this.apiUrl}/knowledge/store`,
        retrieve: `${this.apiUrl}/knowledge/retrieve`,
        search: `${this.apiUrl}/knowledge/search`,
        context_guide: `${this.apiUrl}/knowledge/context`,
      },
    };

    const providerEndpoints = endpoints[this.provider] || endpoints.api;
    return providerEndpoints[action] || `${this.apiUrl}/api/${action}`;
  }

  /**
   * Get local pattern knowledge (fallback)
   * @param {string} patternType - Pattern type
   * @param {string} category - Pattern category
   * @returns {Object|null} Local knowledge
   */
  getLocalPatternKnowledge(patternType, category) {
    // Local knowledge base - can be expanded
    const localKnowledge = {
      abrupt_stop: {
        description: 'Sudden deceleration detected in officer movement',
        interpretation: 'May indicate officer responding to situation or stopping for interaction',
        commonContexts: ['traffic_stop', 'checkpoint', 'routine_patrol'],
        falsePositiveIndicators: ['GPS signal loss', 'vehicle stop', 'scheduled break'],
      },
      speech_rate_deviation: {
        description: 'Speech rate deviates from officer baseline',
        interpretation: 'Pattern indicator only - not stress detection',
        commonContexts: ['traffic_stop', 'checkpoint', 'routine_patrol'],
        falsePositiveIndicators: ['radio communication', 'background noise', 'transcript errors'],
      },
    };

    return localKnowledge[patternType] || null;
  }

  /**
   * Get local context guide (fallback)
   * @param {string} contextType - Context type
   * @returns {Object|null} Context guide
   */
  getLocalContextGuide(contextType) {
    const guides = {
      traffic_stop: {
        expectedPatterns: ['stationary_duration', 'routine_duration_drift'],
        typicalDuration: '5-15 minutes',
        commonSignals: ['Extended stationary duration is normal'],
      },
      checkpoint: {
        expectedPatterns: ['stationary_duration', 'routine_duration_drift'],
        typicalDuration: '10-30 minutes',
        commonSignals: ['Extended stationary duration is normal'],
      },
      routine: {
        expectedPatterns: ['abrupt_stop', 'pacing_pattern'],
        typicalDuration: 'Variable',
        commonSignals: ['Movement patterns vary by location and time'],
      },
    };

    return guides[contextType] || null;
  }

  /**
   * Check if knowledge base is available
   * @returns {boolean} True if enabled and configured
   */
  isAvailable() {
    return this.enabled && !!this.apiUrl;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Knowledge Base cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export default new KnowledgeBase();
