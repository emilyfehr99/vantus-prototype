/**
 * RAG (RETRIEVAL AUGMENTED GENERATION) SERVICE
 * Enhances LLM analysis by retrieving relevant knowledge from knowledge base
 * Improves accuracy by providing historical patterns, context guides, and pattern knowledge
 * 
 * Based on: https://alexander-uspenskiy.medium.com/how-to-create-your-own-rag-with-free-llm-models-and-a-knowledge-base-cea9185ff96d
 */

import logger from '../utils/logger';
import knowledgeBase from './knowledgeBase';

class RAGService {
  constructor() {
    this.enabled = false;
    this.retrievalCache = new Map(); // Cache retrieved knowledge
    this.cacheExpiry = 1800000; // 30 minutes
  }

  /**
   * Initialize RAG service
   * @param {boolean} enabled - Whether RAG is enabled
   */
  initialize(enabled = true) {
    this.enabled = enabled && knowledgeBase.isAvailable();
    
    if (this.enabled) {
      logger.info('RAG service initialized - knowledge retrieval enabled');
    } else {
      logger.info('RAG service not enabled - using direct LLM analysis');
    }
  }

  /**
   * Retrieve relevant knowledge for transcript analysis
   * @param {string} transcript - Audio transcript
   * @param {string} patternType - Pattern type (if known)
   * @param {Object} context - Operational context
   * @returns {Promise<Object>} Retrieved knowledge context
   */
  async retrieveRelevantKnowledge(transcript, patternType = null, context = {}) {
    if (!this.enabled) {
      return { retrieved: false, knowledge: null };
    }

    try {
      const knowledge = {
        patternKnowledge: null,
        historicalInsights: [],
        contextGuide: null,
        falsePositivePatterns: [],
      };

      // 1. Retrieve pattern knowledge if pattern type is known
      if (patternType) {
        const category = this.inferCategory(patternType);
        knowledge.patternKnowledge = await knowledgeBase.getPatternKnowledge(
          patternType,
          category,
          context
        );
      }

      // 2. Retrieve operational context guide
      if (context.operationalContext) {
        knowledge.contextGuide = await knowledgeBase.getOperationalContextGuide(
          context.operationalContext
        );
      }

      // 3. Search for relevant historical insights
      const searchQuery = this.buildSearchQuery(transcript, context);
      const insights = await knowledgeBase.searchKnowledge(searchQuery, {
        type: 'historical_insight',
        limit: 5, // Top 5 most relevant
      });
      knowledge.historicalInsights = insights || [];

      // 4. Search for false positive patterns
      const falsePositives = await knowledgeBase.searchKnowledge(
        `false positive ${patternType || 'pattern'}`,
        {
          type: 'false_positive',
          limit: 3, // Top 3 most relevant
        }
      );
      knowledge.falsePositivePatterns = falsePositives || [];

      return {
        retrieved: true,
        knowledge,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('RAG knowledge retrieval error', error);
      return { retrieved: false, knowledge: null, error: error.message };
    }
  }

  /**
   * Enhance LLM prompt with retrieved knowledge
   * @param {string} basePrompt - Base LLM prompt
   * @param {Object} retrievedKnowledge - Retrieved knowledge from RAG
   * @returns {string} Enhanced prompt with retrieved context
   */
  enhancePromptWithRAG(basePrompt, retrievedKnowledge) {
    if (!retrievedKnowledge || !retrievedKnowledge.retrieved || !retrievedKnowledge.knowledge) {
      return basePrompt;
    }

    const { knowledge } = retrievedKnowledge;
    let enhancedContext = '\n\n=== RETRIEVED KNOWLEDGE CONTEXT ===\n';

    // Add pattern knowledge
    if (knowledge.patternKnowledge) {
      enhancedContext += `\nPattern Knowledge:\n`;
      enhancedContext += `- Description: ${knowledge.patternKnowledge.description || 'N/A'}\n`;
      enhancedContext += `- Interpretation: ${knowledge.patternKnowledge.interpretation || 'N/A'}\n`;
      if (knowledge.patternKnowledge.commonContexts) {
        enhancedContext += `- Common Contexts: ${knowledge.patternKnowledge.commonContexts.join(', ')}\n`;
      }
      if (knowledge.patternKnowledge.falsePositiveIndicators) {
        enhancedContext += `- False Positive Indicators: ${knowledge.patternKnowledge.falsePositiveIndicators.join(', ')}\n`;
      }
    }

    // Add context guide
    if (knowledge.contextGuide) {
      enhancedContext += `\nOperational Context Guide:\n`;
      enhancedContext += `- Expected Patterns: ${knowledge.contextGuide.expectedPatterns?.join(', ') || 'N/A'}\n`;
      enhancedContext += `- Typical Duration: ${knowledge.contextGuide.typicalDuration || 'N/A'}\n`;
      if (knowledge.contextGuide.commonSignals) {
        enhancedContext += `- Common Signals: ${knowledge.contextGuide.commonSignals.join('; ')}\n`;
      }
    }

    // Add historical insights
    if (knowledge.historicalInsights && knowledge.historicalInsights.length > 0) {
      enhancedContext += `\nHistorical Insights (${knowledge.historicalInsights.length} found):\n`;
      knowledge.historicalInsights.slice(0, 3).forEach((insight, idx) => {
        enhancedContext += `${idx + 1}. ${insight.insight || insight.summary || 'N/A'}\n`;
        if (insight.context) {
          enhancedContext += `   Context: ${JSON.stringify(insight.context)}\n`;
        }
      });
    }

    // Add false positive patterns (to avoid)
    if (knowledge.falsePositivePatterns && knowledge.falsePositivePatterns.length > 0) {
      enhancedContext += `\nKnown False Positive Patterns (avoid these):\n`;
      knowledge.falsePositivePatterns.slice(0, 2).forEach((fp, idx) => {
        enhancedContext += `${idx + 1}. Pattern: ${fp.pattern?.confidence || 'N/A'} confidence, Reason: ${fp.reason || 'N/A'}\n`;
      });
    }

    enhancedContext += '\n=== END RETRIEVED KNOWLEDGE ===\n';
    enhancedContext += '\nUse this retrieved knowledge to improve your analysis accuracy.';

    // Insert enhanced context before the transcript in the prompt
    const transcriptMarker = 'Transcript to Analyze:';
    const transcriptIndex = basePrompt.indexOf(transcriptMarker);
    
    if (transcriptIndex > -1) {
      return basePrompt.slice(0, transcriptIndex) + enhancedContext + basePrompt.slice(transcriptIndex);
    }

    // If transcript marker not found, append at the end
    return basePrompt + enhancedContext;
  }

  /**
   * Infer category from pattern type
   * @param {string} patternType - Pattern type
   * @returns {string} Category
   */
  inferCategory(patternType) {
    if (!patternType) return 'contextual';
    
    const lower = patternType.toLowerCase();
    if (lower.includes('movement') || lower.includes('stop') || lower.includes('pacing') || lower.includes('speed')) {
      return 'movement';
    }
    if (lower.includes('audio') || lower.includes('speech') || lower.includes('vocal')) {
      return 'audio';
    }
    if (lower.includes('biometric') || lower.includes('heart')) {
      return 'biometric';
    }
    if (lower.includes('weapon') || lower.includes('stance') || lower.includes('hands')) {
      return 'visual';
    }
    return 'contextual';
  }

  /**
   * Build search query from transcript and context
   * @param {string} transcript - Audio transcript
   * @param {Object} context - Operational context
   * @returns {string} Search query
   */
  buildSearchQuery(transcript, context) {
    const keywords = [];
    
    // Extract keywords from transcript (simple approach)
    const words = transcript.toLowerCase().split(/\s+/);
    const importantWords = words.filter(w => 
      w.length > 4 && 
      !['that', 'this', 'with', 'from', 'have', 'been', 'were', 'what', 'when', 'where'].includes(w)
    );
    
    keywords.push(...importantWords.slice(0, 5)); // Top 5 keywords
    
    // Add context keywords
    if (context.operationalContext) {
      keywords.push(context.operationalContext);
    }
    
    return keywords.join(' ');
  }

  /**
   * Analyze transcript with RAG-enhanced LLM
   * @param {string} transcript - Audio transcript
   * @param {Object} officerContext - Officer context
   * @param {Function} llmAnalyzeFunction - LLM analysis function to enhance
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeWithRAG(transcript, officerContext, llmAnalyzeFunction) {
    if (!this.enabled) {
      // Fallback to direct LLM analysis
      return await llmAnalyzeFunction(transcript, [], officerContext);
    }

    try {
      // 1. Retrieve relevant knowledge
      const retrievedKnowledge = await this.retrieveRelevantKnowledge(
        transcript,
        null, // Pattern type unknown initially
        officerContext
      );

      // 2. Enhance LLM analysis with retrieved knowledge
      // The LLM service will use enhanced prompts internally
      const analysis = await llmAnalyzeFunction(
        transcript,
        [],
        {
          ...officerContext,
          ragKnowledge: retrievedKnowledge.knowledge, // Pass retrieved knowledge
        }
      );

      // 3. Add RAG metadata to analysis
      return {
        ...analysis,
        ragEnhanced: true,
        knowledgeRetrieved: retrievedKnowledge.retrieved,
        knowledgeSources: retrievedKnowledge.knowledge ? {
          patternKnowledge: !!retrievedKnowledge.knowledge.patternKnowledge,
          contextGuide: !!retrievedKnowledge.knowledge.contextGuide,
          historicalInsights: retrievedKnowledge.knowledge.historicalInsights?.length || 0,
          falsePositivePatterns: retrievedKnowledge.knowledge.falsePositivePatterns?.length || 0,
        } : null,
      };
    } catch (error) {
      logger.error('RAG-enhanced analysis error', error);
      // Fallback to direct LLM analysis
      return await llmAnalyzeFunction(transcript, [], officerContext);
    }
  }

  /**
   * Check if RAG is available
   * @returns {boolean} True if enabled and knowledge base is available
   */
  isAvailable() {
    return this.enabled && knowledgeBase.isAvailable();
  }

  /**
   * Clear retrieval cache
   */
  clearCache() {
    this.retrievalCache.clear();
    logger.info('RAG retrieval cache cleared');
  }
}

// Export singleton instance
export default new RAGService();
