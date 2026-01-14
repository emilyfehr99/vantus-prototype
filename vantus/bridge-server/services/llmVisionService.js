/**
 * LLM Vision Service
 * Uses LLM with vision capabilities to analyze images for detection
 * Supports multiple providers with vision models (GPT-4 Vision, Claude, etc.)
 */

const logger = require('../utils/logger');

class LLMVisionService {
  constructor() {
    this.provider = null;
    this.apiKey = null;
    this.apiUrl = null;
    this.model = null;
    this.enabled = false;
  }

  /**
   * Initialize the LLM vision service
   * @param {string} provider - LLM provider
   * @param {string} apiKey - API key
   * @param {string} model - Vision model name
   * @param {string} apiUrl - Custom API URL
   */
  initialize(provider, apiKey, model = null, apiUrl = null) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model || this.getDefaultVisionModel(provider);
    this.apiUrl = this.getApiUrl(provider, apiUrl);
    this.enabled = !!this.apiUrl && !!apiKey;

    if (this.enabled) {
      logger.info('LLM Vision Service initialized', {
        provider,
        model: this.model,
        apiUrl: this.apiUrl ? 'configured' : 'not set',
      });
    } else {
      logger.warn('LLM Vision Service not configured - using fallback detection');
    }
  }

  /**
   * Get default vision model for provider
   */
  getDefaultVisionModel(provider) {
    const defaults = {
      openrouter: 'openai/gpt-4o-mini', // GPT-4o-mini supports vision
      together: 'meta-llama/Llama-3.1-8B-Vision-Instruct-Turbo',
      deepseek: 'deepseek-chat', // May support vision
      localai: 'llava', // Common vision model for LocalAI
      ollama: 'llava', // Ollama vision model
      anythingllm: 'llava', // AnythingLLM vision support
    };
    return defaults[provider] || defaults.openrouter;
  }

  /**
   * Get API URL for provider
   */
  getApiUrl(provider, customUrl = null) {
    if (customUrl) return customUrl;

    const urls = {
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      together: 'https://api.together.xyz/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/v1/chat/completions',
      localai: process.env.LOCALAI_API_URL || 'http://localhost:8080/v1/chat/completions',
      ollama: process.env.OLLAMA_API_URL || 'http://localhost:11434/v1/chat/completions',
      anythingllm: process.env.ANYTHINGLLM_API_URL || 'http://localhost:3001/api/v1/chat/completions',
    };
    return urls[provider] || urls.openrouter;
  }

  /**
   * Analyze image for detections using LLM vision
   * @param {string} base64Image - Base64 encoded image (with data URL prefix)
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Detection results
   */
  async analyzeImage(base64Image, options = {}) {
    if (!this.enabled) {
      return this.fallbackDetection();
    }

    try {
      const prompt = this.buildDetectionPrompt(options);
      const response = await this.callVisionAPI(base64Image, prompt);
      return this.parseDetectionResponse(response);
    } catch (error) {
      logger.error('LLM vision analysis error', error);
      return this.fallbackDetection();
    }
  }

  /**
   * Build detection prompt for LLM
   */
  buildDetectionPrompt(options = {}) {
    const { frameTime = null, officerName = null } = options;

    return `Analyze this bodycam video frame and detect the following patterns. Return ONLY valid JSON, no explanations.

Detection Categories:
1. WEAPONS: Detect any visible weapons (handguns, rifles, knives, blunt weapons, etc.)
2. STANCE: Detect body posture patterns (bladed stance, fighting stance, defensive stance)
3. HANDS: Detect hand positions (hands hidden, waistband reach, hands up, etc.)

Return JSON in this exact format:
{
  "weapon": {
    "detected": true/false,
    "confidence": 0.0-1.0,
    "type": "handgun" | "knife" | "rifle" | "blunt_weapon" | null,
    "description": "brief description"
  },
  "stance": {
    "detected": true/false,
    "confidence": 0.0-1.0,
    "type": "bladed_stance" | "fighting_stance" | "defensive_stance" | null,
    "description": "brief description"
  },
  "hands": {
    "detected": true/false,
    "confidence": 0.0-1.0,
    "pattern": "hands_hidden" | "waistband_reach" | "hands_up" | "normal" | null,
    "description": "brief description"
  }
}

Important:
- Only detect if you are confident (confidence >= 0.6)
- Be conservative - false positives are worse than false negatives
- Focus on observable patterns only
- Return valid JSON only, no markdown, no explanations`;
  }

  /**
   * Call vision API with image
   */
  async callVisionAPI(base64Image, prompt) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    if (this.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://vantus.ai';
      headers['X-Title'] = 'Vantus AI Partner';
    }

    // Remove data URL prefix if present
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const body = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a pattern detection assistant for police bodycam footage. Return only valid JSON, no explanations.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`,
              },
            },
          ],
        },
      ],
      temperature: 0.2, // Low temperature for consistent detection
      max_tokens: 500,
    };

    // Some providers support JSON response format
    if (['openrouter', 'together', 'deepseek'].includes(this.provider)) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse LLM response into detection format
   */
  parseDetectionResponse(response) {
    try {
      // Try to extract JSON from response (may have markdown code blocks)
      let jsonText = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(jsonText);

      return {
        weapon: {
          detected: parsed.weapon?.detected || false,
          category: 'weapon',
          confidence: parsed.weapon?.confidence || 0,
          detections: parsed.weapon?.detected ? [{
            class: parsed.weapon.type || 'unknown',
            confidence: parsed.weapon.confidence || 0,
            description: parsed.weapon.description || '',
          }] : [],
          model: 'llm-vision',
          source: 'llm',
        },
        stance: {
          detected: parsed.stance?.detected || false,
          category: 'stance',
          confidence: parsed.stance?.confidence || 0,
          type: parsed.stance?.type || null,
          description: parsed.stance?.description || '',
          model: 'llm-vision',
          source: 'llm',
        },
        hands: {
          detected: parsed.hands?.detected || false,
          category: 'hands',
          confidence: parsed.hands?.confidence || 0,
          pattern: parsed.hands?.pattern || null,
          description: parsed.hands?.description || '',
          model: 'llm-vision',
          source: 'llm',
        },
      };
    } catch (error) {
      logger.error('Failed to parse LLM vision response', error);
      logger.debug('Response text', response);
      return this.fallbackDetection();
    }
  }

  /**
   * Fallback detection (when LLM not available)
   */
  fallbackDetection() {
    return {
      weapon: {
        detected: false,
        category: 'weapon',
        confidence: 0,
        detections: [],
        model: 'fallback',
        source: 'fallback',
      },
      stance: {
        detected: false,
        category: 'stance',
        confidence: 0,
        type: null,
        model: 'fallback',
        source: 'fallback',
      },
      hands: {
        detected: false,
        category: 'hands',
        confidence: 0,
        pattern: null,
        model: 'fallback',
        source: 'fallback',
      },
    };
  }

  /**
   * Check if vision service is available
   */
  isAvailable() {
    return this.enabled && !!this.apiUrl && !!this.apiKey;
  }
}

module.exports = new LLMVisionService();
