/**
 * LLM SERVICE
 * Service for analyzing audio transcripts using free LLM APIs
 * Supports multiple providers: OpenRouter, Together AI, DeepSeek, etc.
 */

import logger from '../utils/logger';
import configService from '../utils/config';

class LLMService {
  constructor() {
    this.provider = null; // 'openrouter' | 'together' | 'deepseek' | 'golem' | null
    this.apiKey = null;
    this.apiUrl = null;
    this.model = null;
    this.enabled = false;
  }

  /**
   * Initialize the LLM service
   * @param {string} provider - LLM provider ('openrouter', 'together', 'deepseek', 'golem')
   * @param {string} apiKey - API key for the provider
   * @param {string} model - Model name to use
   * @param {string} apiUrl - Custom API URL (optional, for providers like Golem)
   */
  initialize(provider, apiKey, model = null, apiUrl = null) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model || this.getDefaultModel(provider);
    this.apiUrl = this.getApiUrl(provider, apiUrl);
    this.enabled = !!apiKey;

    if (this.enabled) {
      logger.info('LLM Service initialized', { provider, model: this.model, apiUrl: this.apiUrl });
    } else {
      logger.warn('LLM Service not configured - audio analysis will use fallback methods');
    }
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
      golem: 'golem-default', // Will use provided model or default
    };
    return defaults[provider] || defaults.openrouter;
  }

  /**
   * Get API URL for provider
   * @param {string} provider - Provider name
   * @param {string} customUrl - Custom API URL (optional, for providers like Golem)
   * @returns {string} API URL
   */
  getApiUrl(provider, customUrl = null) {
    if (customUrl) return customUrl;
    
    const urls = {
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      together: 'https://api.together.xyz/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/v1/chat/completions',
      golem: process.env.GOLEM_API_URL || 'https://api.golem.ai/v1/chat/completions', // Default, should be configured
    };
    return urls[provider] || urls.openrouter;
  }

  /**
   * Analyze audio transcript for aggressive patterns, stress indicators, or unusual speech
   * @param {string} transcript - Audio transcript text
   * @param {Array<string>} recentTranscripts - Recent transcripts for context (optional)
   * @returns {Promise<Object>} Analysis result with pattern type and confidence
   */
  async analyzeAudioTranscript(transcript, recentTranscripts = []) {
    if (!this.enabled || !transcript || !transcript.trim()) {
      // Fallback to simple pattern matching
      return this.fallbackAnalysis(transcript, recentTranscripts);
    }

    try {
      const context = recentTranscripts.length > 0
        ? `Recent context: ${recentTranscripts.slice(-5).join('. ')}`
        : '';

      const prompt = this.buildAnalysisPrompt(transcript, context);

      const response = await this.callLLM(prompt);

      return this.parseLLMResponse(response);
    } catch (error) {
      logger.error('LLM audio analysis error', error);
      // Fallback to pattern matching
      return this.fallbackAnalysis(transcript, recentTranscripts);
    }
  }

  /**
   * Build prompt for LLM analysis
   * @param {string} transcript - Current transcript
   * @param {string} context - Context from recent transcripts
   * @returns {string} Formatted prompt
   */
  buildAnalysisPrompt(transcript, context) {
    return `You are analyzing police officer audio transcripts for contextual pattern indicators. This is NOT stress detection or medical diagnosis.

Analyze the following transcript and determine if it shows:
1. Aggressive vocal patterns (shouting, raised voice, aggressive language)
2. Screaming or high-intensity vocalizations
3. Repetitive speech patterns (repeating words/phrases)
4. Unusual speech rate (very fast or very slow)
5. Normal speech patterns

IMPORTANT:
- Return ONLY valid JSON
- Do NOT diagnose stress, emotions, or medical conditions
- Focus on observable speech patterns only
- Confidence should be 0.0 to 1.0

${context ? `Context: ${context}\n` : ''}Transcript: "${transcript}"

Return JSON format:
{
  "pattern": "aggressive" | "screaming" | "repetitive" | "unusual_rate" | "normal",
  "confidence": 0.0-1.0,
  "indicators": ["list", "of", "specific", "indicators"],
  "speech_rate": "fast" | "normal" | "slow" | "unknown"
}`;
  }

  /**
   * Call LLM API
   * @param {string} prompt - Prompt to send
   * @returns {Promise<string>} LLM response
   */
  async callLLM(prompt) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    // OpenRouter requires additional header
    if (this.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://vantus.ai';
      headers['X-Title'] = 'Vantus AI Partner';
    }
    
    // Golem may require different headers (adjust based on your Golem instance)
    if (this.provider === 'golem') {
      // Add any Golem-specific headers here if needed
      // Most OpenAI-compatible APIs use the same format
    }

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a pattern analysis assistant. Return only valid JSON, no explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 200,
      response_format: { type: 'json_object' }, // Request JSON response
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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

      return {
        pattern: parsed.pattern || 'normal',
        confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0)),
        indicators: parsed.indicators || [],
        speechRate: parsed.speech_rate || 'unknown',
        source: 'llm',
      };
    } catch (error) {
      logger.error('Failed to parse LLM response', error);
      return {
        pattern: 'normal',
        confidence: 0,
        indicators: [],
        speechRate: 'unknown',
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
        source: 'fallback',
      };
    }

    const lowerTranscript = transcript.toLowerCase();
    const indicators = [];

    // Check for aggressive patterns
    const aggressiveWords = ['stop', 'freeze', 'hands', 'weapon', 'gun', 'knife', 'backup'];
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
    
    let pattern = 'normal';
    let confidence = 0;

    if (allCapsRatio > 0.3) {
      pattern = 'screaming';
      confidence = Math.min(0.8, allCapsRatio);
      indicators.push('high_caps_ratio');
    } else if (aggressiveCount >= 2) {
      pattern = 'aggressive';
      confidence = Math.min(0.7, aggressiveCount * 0.2);
      indicators.push('aggressive_keywords');
    } else if (repeatedWords.length > 0) {
      pattern = 'repetitive';
      confidence = Math.min(0.6, repeatedWords.length * 0.15);
      indicators.push('word_repetition');
    }

    // Calculate speech rate (simple heuristic)
    const wordCount = words.length;
    const speechRate = wordCount > 20 ? 'fast' : wordCount < 5 ? 'slow' : 'normal';

    return {
      pattern,
      confidence,
      indicators,
      speechRate,
      source: 'fallback',
    };
  }

  /**
   * Check if LLM service is available
   * @returns {boolean} True if enabled and configured
   */
  isAvailable() {
    return this.enabled && !!this.apiKey && !!this.apiUrl;
  }
}

// Export singleton instance
export default new LLMService();
