/**
 * LLM SERVICE - CUSTOMIZED FOR VANTUS
 * Service for analyzing audio transcripts using free/self-hosted LLM APIs
 * Supports multiple providers with Vantus-specific pattern analysis
 * 
 * Key Features:
 * - Non-diagnostic pattern analysis only
 * - Baseline-aware analysis (per-officer context)
 * - Operational context awareness
 * - Privacy-first (transcripts only)
 * - Self-hosted options (LocalAI, AnythingLLM, Ollama)
 */

import logger from '../utils/logger';
import configService from '../utils/config';
import ragService from './ragService';

class LLMService {
  constructor() {
    this.provider = null; // 'openrouter' | 'together' | 'deepseek' | 'golem' | 'localai' | 'anythingllm' | 'ollama' | null
    this.apiKey = null;
    this.apiUrl = null;
    this.model = null;
    this.enabled = false;
    this.retryAttempts = 2; // Number of retry attempts for failed requests
    this.retryDelay = 1000; // Delay between retries (ms)
  }

  /**
   * Initialize the LLM service
   * @param {string} provider - LLM provider
   * @param {string} apiKey - API key for the provider (optional for self-hosted)
   * @param {string} model - Model name to use
   * @param {string} apiUrl - Custom API URL (required for self-hosted)
   */
  initialize(provider, apiKey, model = null, apiUrl = null) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model || this.getDefaultModel(provider);
    this.apiUrl = this.getApiUrl(provider, apiUrl);
    this.enabled = !!this.apiUrl && (this.isSelfHosted(provider) || !!apiKey);

    if (this.enabled) {
      logger.info('LLM Service initialized', { 
        provider, 
        model: this.model,
        apiUrl: this.apiUrl ? 'configured' : 'not set',
        selfHosted: this.isSelfHosted(provider)
      });
    } else {
      logger.warn('LLM Service not configured - audio analysis will use fallback methods');
    }
  }

  /**
   * Check if provider is self-hosted (doesn't require API key)
   * @param {string} provider - Provider name
   * @returns {boolean} True if self-hosted
   */
  isSelfHosted(provider) {
    return ['localai', 'anythingllm', 'ollama'].includes(provider);
  }

  /**
   * Get default model for provider
   * @param {string} provider - Provider name
   * @returns {string} Default model name
   */
  getDefaultModel(provider) {
    const defaults = {
      openrouter: 'meta-llama/llama-3.2-3b-instruct:free',
      together: 'meta-llama/Llama-3-8b-chat-hf',
      deepseek: 'deepseek-chat',
      golem: 'golem-default',
      localai: 'llama3', // Common LocalAI model name
      anythingllm: 'llama3', // AnythingLLM default
      ollama: 'llama3', // Ollama default
    };
    return defaults[provider] || defaults.openrouter;
  }

  /**
   * Get API URL for provider
   * @param {string} provider - Provider name
   * @param {string} customUrl - Custom API URL (optional)
   * @returns {string} API URL
   */
  getApiUrl(provider, customUrl = null) {
    if (customUrl) return customUrl;
    
    const urls = {
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      together: 'https://api.together.xyz/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/v1/chat/completions',
      golem: process.env.GOLEM_API_URL || 'https://api.golem.ai/v1/chat/completions',
      localai: process.env.LOCALAI_API_URL || 'http://localhost:8080/v1/chat/completions',
      anythingllm: process.env.ANYTHINGLLM_API_URL || 'http://localhost:3001/api/v1/chat/completions',
      ollama: process.env.OLLAMA_API_URL || 'http://localhost:11434/v1/chat/completions',
    };
    return urls[provider] || urls.openrouter;
  }

  /**
   * Analyze audio transcript with Vantus-specific context
   * Enhanced with RAG (Retrieval Augmented Generation) if available
   * @param {string} transcript - Audio transcript text
   * @param {Array<string>} recentTranscripts - Recent transcripts for context
   * @param {Object} officerContext - Officer-specific context (baseline, operational context, ragKnowledge)
   * @returns {Promise<Object>} Analysis result with pattern type and confidence
   */
  async analyzeAudioTranscript(transcript, recentTranscripts = [], officerContext = {}) {
    if (!this.enabled || !transcript || !transcript.trim()) {
      // Fallback to simple pattern matching
      return this.fallbackAnalysis(transcript, recentTranscripts);
    }

    try {
      const context = recentTranscripts.length > 0
        ? `Recent context: ${recentTranscripts.slice(-5).join('. ')}`
        : '';

      // Build Vantus-customized prompt with context awareness
      let prompt = this.buildVantusAnalysisPrompt(transcript, context, officerContext);

      // Enhance prompt with RAG if knowledge was retrieved
      if (ragService.isAvailable() && officerContext.ragKnowledge) {
        prompt = ragService.enhancePromptWithRAG(prompt, {
          retrieved: true,
          knowledge: officerContext.ragKnowledge,
        });
      }

      // Call LLM with retry logic
      const response = await this.callLLMWithRetry(prompt);

      const analysis = this.parseLLMResponse(response);
      
      // Add RAG metadata if used
      if (ragService.isAvailable() && officerContext.ragKnowledge) {
        analysis.ragEnhanced = true;
      }

      return analysis;
    } catch (error) {
      logger.error('LLM audio analysis error', error);
      // Fallback to pattern matching
      return this.fallbackAnalysis(transcript, recentTranscripts);
    }
  }

  /**
   * Build Vantus-customized prompt for pattern analysis
   * @param {string} transcript - Current transcript
   * @param {string} context - Context from recent transcripts
   * @param {Object} officerContext - Officer context (baseline, operational context)
   * @returns {string} Formatted prompt
   */
  buildVantusAnalysisPrompt(transcript, context, officerContext) {
    const { baseline = null, operationalContext = null, sessionDuration = null } = officerContext;
    
    // Build context-aware prompt
    let contextInfo = '';
    
    if (operationalContext) {
      contextInfo += `\nOperational Context: ${operationalContext} (e.g., traffic_stop, checkpoint, routine_patrol)`;
    }
    
    if (sessionDuration) {
      contextInfo += `\nSession Duration: ${Math.round(sessionDuration / 60)} minutes`;
    }
    
    if (baseline && baseline.mean_wpm) {
      contextInfo += `\nOfficer Baseline Speech Rate: ${baseline.mean_wpm.toFixed(1)} words/min (normal range: ${(baseline.mean_wpm - baseline.std_wpm || 0).toFixed(1)}-${(baseline.mean_wpm + baseline.std_wpm || 0).toFixed(1)})`;
    }

    return `You are analyzing police officer audio transcripts for VANTUS contextual pattern indicators. This is NOT stress detection, medical diagnosis, or threat assessment.

CRITICAL CONSTRAINTS:
- Return ONLY valid JSON
- Do NOT diagnose stress, emotions, psychological states, or medical conditions
- Do NOT assess threat levels or risk
- Focus ONLY on observable speech pattern characteristics
- Confidence scores (0.0-1.0) represent pattern detection confidence, NOT risk or threat level

ANALYSIS TASK:
Analyze the following transcript and identify observable speech patterns:

1. Aggressive vocal patterns
   - Shouting or raised voice (volume indicators in transcript)
   - Aggressive language (commands, warnings)
   - Intensity indicators

2. Screaming or high-intensity vocalizations
   - Extreme volume indicators
   - High-intensity language patterns

3. Repetitive speech patterns
   - Repeated words or phrases
   - Repetition frequency

4. Unusual speech rate
   - Very fast speech (high word density)
   - Very slow speech (low word density)
   - Compare to baseline if provided

5. Normal speech patterns
   - Standard conversational patterns
   - Routine communication

${contextInfo}

${context ? `Recent Context: ${context}\n` : ''}Transcript to Analyze: "${transcript}"

Return JSON format (NO other text):
{
  "pattern": "aggressive" | "screaming" | "repetitive" | "unusual_rate" | "normal",
  "confidence": 0.0-1.0,
  "indicators": ["specific", "observable", "indicators", "found"],
  "speech_rate": "fast" | "normal" | "slow" | "unknown",
  "pattern_strength": "weak" | "moderate" | "strong" | "none"
}`;
  }

  /**
   * Call LLM API with retry logic
   * @param {string} prompt - Prompt to send
   * @returns {Promise<string>} LLM response
   */
  async callLLMWithRetry(prompt) {
    let lastError = null;
    
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.callLLM(prompt);
      } catch (error) {
        lastError = error;
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * (attempt + 1); // Exponential backoff
          logger.warn(`LLM API call failed, retrying in ${delay}ms`, { attempt: attempt + 1, error: error.message });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Call LLM API
   * @param {string} prompt - Prompt to send
   * @returns {Promise<string>} LLM response
   */
  async callLLM(prompt) {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if API key is provided
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // OpenRouter requires additional headers
    if (this.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://vantus.ai';
      headers['X-Title'] = 'Vantus AI Partner';
    }
    
    // Ollama may not require authorization
    if (this.provider === 'ollama' && !this.apiKey) {
      // Ollama typically doesn't require auth for local instances
      delete headers['Authorization'];
    }

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a pattern analysis assistant for Vantus. Return only valid JSON, no explanations. Focus on observable speech patterns only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 300, // Increased for more detailed analysis
    };

    // Some providers support JSON response format
    if (['openrouter', 'together', 'deepseek'].includes(this.provider)) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      // Add timeout for self-hosted instances that might be slower
      signal: AbortSignal.timeout(this.isSelfHosted(this.provider) ? 30000 : 10000), // 30s for self-hosted, 10s for cloud
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse LLM response into structured format
   * @param {string} response - LLM response text
   * @returns {Object} Parsed analysis result
   */
  parseLLMResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : response;
      const parsed = JSON.parse(jsonText);

      // Validate and sanitize response
      const pattern = ['aggressive', 'screaming', 'repetitive', 'unusual_rate', 'normal'].includes(parsed.pattern)
        ? parsed.pattern
        : 'normal';
      
      const confidence = Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0));
      const speechRate = ['fast', 'normal', 'slow', 'unknown'].includes(parsed.speech_rate)
        ? parsed.speech_rate
        : 'unknown';
      
      const patternStrength = ['weak', 'moderate', 'strong', 'none'].includes(parsed.pattern_strength)
        ? parsed.pattern_strength
        : 'none';

      return {
        pattern,
        confidence,
        indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
        speechRate,
        patternStrength,
        source: 'llm',
      };
    } catch (error) {
      logger.error('Failed to parse LLM response', error);
      return {
        pattern: 'normal',
        confidence: 0,
        indicators: [],
        speechRate: 'unknown',
        patternStrength: 'none',
        source: 'fallback',
      };
    }
  }

  /**
   * Fallback analysis using simple pattern matching
   * Used when LLM is not available
   * @param {string} transcript - Transcript text
   * @param {Array<string>} recentTranscripts - Recent transcripts
   * @returns {Object} Analysis result
   */
  fallbackAnalysis(transcript, recentTranscripts) {
    if (!transcript) {
      return {
        pattern: 'normal',
        confidence: 0,
        indicators: [],
        speechRate: 'unknown',
        patternStrength: 'none',
        source: 'fallback',
      };
    }

    const lowerTranscript = transcript.toLowerCase();
    const indicators = [];

    // Check for aggressive patterns
    const aggressiveWords = ['stop', 'freeze', 'hands', 'weapon', 'gun', 'knife', 'backup', 'down', 'ground'];
    const aggressiveCount = aggressiveWords.filter(word => lowerTranscript.includes(word)).length;
    
    // Check for repetition
    const words = transcript.split(/\s+/);
    const wordCounts = {};
    words.forEach(word => {
      const lower = word.toLowerCase();
      wordCounts[lower] = (wordCounts[lower] || 0) + 1;
    });
    const repeatedWords = Object.entries(wordCounts).filter(([_, count]) => count > 2);
    
    // Check for all caps (shouting indicator)
    const allCapsRatio = (transcript.match(/[A-Z]/g) || []).length / transcript.length;
    
    // Check for exclamation marks (intensity indicator)
    const exclamationCount = (transcript.match(/!/g) || []).length;
    const exclamationRatio = exclamationCount / words.length;
    
    let pattern = 'normal';
    let confidence = 0;
    let patternStrength = 'none';

    if (allCapsRatio > 0.3 || exclamationRatio > 0.1) {
      pattern = 'screaming';
      confidence = Math.min(0.8, Math.max(allCapsRatio, exclamationRatio * 2));
      indicators.push('high_caps_ratio', 'exclamation_marks');
      patternStrength = confidence > 0.6 ? 'strong' : 'moderate';
    } else if (aggressiveCount >= 2) {
      pattern = 'aggressive';
      confidence = Math.min(0.7, aggressiveCount * 0.2);
      indicators.push('aggressive_keywords');
      patternStrength = aggressiveCount >= 3 ? 'strong' : 'moderate';
    } else if (repeatedWords.length > 0) {
      pattern = 'repetitive';
      confidence = Math.min(0.6, repeatedWords.length * 0.15);
      indicators.push('word_repetition');
      patternStrength = repeatedWords.length > 2 ? 'moderate' : 'weak';
    }

    // Calculate speech rate (simple heuristic)
    const wordCount = words.length;
    const speechRate = wordCount > 20 ? 'fast' : wordCount < 5 ? 'slow' : 'normal';

    return {
      pattern,
      confidence,
      indicators,
      speechRate,
      patternStrength,
      source: 'fallback',
    };
  }

  /**
   * Check if LLM service is available
   * @returns {boolean} True if enabled and configured
   */
  isAvailable() {
    return this.enabled && !!this.apiUrl && (this.isSelfHosted(this.provider) || !!this.apiKey);
  }
}

// Export singleton instance
export default new LLMService();
