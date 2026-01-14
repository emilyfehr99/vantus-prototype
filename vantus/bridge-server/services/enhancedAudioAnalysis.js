/**
 * Enhanced Audio Analysis Service
 * Analyzes audio transcripts for multi-speaker, communication patterns, and background noise
 * All analysis is non-diagnostic and provides contextual indicators only
 */

const logger = require('../utils/logger');
const llmService = require('./llmService'); // If available, otherwise use local analysis

class EnhancedAudioAnalysis {
  constructor() {
    this.llmEnabled = false;
  }

  /**
   * Initialize with LLM service if available
   */
  initialize(llmServiceInstance = null) {
    if (llmServiceInstance && llmServiceInstance.isAvailable()) {
      this.llmService = llmServiceInstance;
      this.llmEnabled = true;
      logger.info('Enhanced Audio Analysis initialized with LLM service');
    } else {
      logger.info('Enhanced Audio Analysis initialized with local analysis only');
    }
  }

  /**
   * Detect multiple speakers in transcript
   * @param {string} transcript - Audio transcript
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Multi-speaker detection results
   */
  async detectMultiSpeaker(transcript, options = {}) {
    if (!transcript || transcript.trim().length === 0) {
      return {
        detected: false,
        category: 'multi_speaker',
        confidence: 0,
        speakerCount: 0,
        turnTaking: null,
        pattern: null,
        description: 'No transcript available',
        model: 'local',
        source: 'local',
      };
    }

    try {
      if (this.llmEnabled) {
        return await this.detectMultiSpeakerLLM(transcript, options);
      } else {
        return this.detectMultiSpeakerLocal(transcript, options);
      }
    } catch (error) {
      logger.error('Multi-speaker detection error', error);
      return this.fallbackMultiSpeaker();
    }
  }

  /**
   * Detect multiple speakers using LLM
   */
  async detectMultiSpeakerLLM(transcript, options) {
    const prompt = `Analyze this audio transcript and detect if there are multiple speakers. Return ONLY valid JSON.

Transcript: "${transcript}"

Return JSON format:
{
  "speakerCount": number (estimated count of distinct speakers),
  "turnTaking": "frequent" | "moderate" | "rare" | "none" | null,
  "pattern": "conversation" | "interview" | "command_response" | "monologue" | "unknown" | null,
  "confidence": 0.0-1.0,
  "description": "brief description of speaker patterns"
}

Important:
- Estimate speaker count (approximate is fine)
- Detect turn-taking patterns (back and forth conversation)
- Identify communication pattern type
- Be conservative with confidence scores
- Return valid JSON only, no markdown`;

    try {
      const response = await this.llmService.callLLM(prompt);
      const parsed = this.parseJSONResponse(response);
      
      return {
        detected: (parsed.speakerCount || 0) > 1,
        category: 'multi_speaker',
        confidence: parsed.confidence || 0,
        speakerCount: parsed.speakerCount || 0,
        turnTaking: parsed.turnTaking || null,
        pattern: parsed.pattern || null,
        description: parsed.description || '',
        model: 'llm',
        source: 'llm',
      };
    } catch (error) {
      logger.error('LLM multi-speaker detection error', error);
      return this.detectMultiSpeakerLocal(transcript, options);
    }
  }

  /**
   * Detect multiple speakers using local analysis
   */
  detectMultiSpeakerLocal(transcript, options) {
    // Simple heuristic: look for question marks, different sentence patterns
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const questions = transcript.match(/\?/g) || [];
    const questionCount = questions.length;
    
    // Estimate speakers based on question/answer patterns
    let estimatedSpeakers = 1;
    if (questionCount > 2 && sentences.length > 5) {
      estimatedSpeakers = Math.min(3, Math.ceil(questionCount / 2));
    }
    
    // Detect turn-taking (alternating patterns)
    const hasTurnTaking = questionCount > 0 && sentences.length > 3;
    
    return {
      detected: estimatedSpeakers > 1,
      category: 'multi_speaker',
      confidence: estimatedSpeakers > 1 ? Math.min(0.7, 0.3 + (questionCount * 0.1)) : 0.2,
      speakerCount: estimatedSpeakers,
      turnTaking: hasTurnTaking ? 'moderate' : null,
      pattern: hasTurnTaking ? 'conversation' : null,
      description: `Estimated ${estimatedSpeakers} speaker(s) based on conversation patterns`,
      model: 'local',
      source: 'local',
    };
  }

  /**
   * Analyze communication patterns
   * @param {string} transcript - Audio transcript
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Communication pattern results
   */
  async analyzeCommunicationPatterns(transcript, options = {}) {
    if (!transcript || transcript.trim().length === 0) {
      return {
        detected: false,
        category: 'communication_pattern',
        confidence: 0,
        pattern: null,
        interruptions: 0,
        flow: null,
        description: 'No transcript available',
        model: 'local',
        source: 'local',
      };
    }

    try {
      if (this.llmEnabled) {
        return await this.analyzeCommunicationPatternsLLM(transcript, options);
      } else {
        return this.analyzeCommunicationPatternsLocal(transcript, options);
      }
    } catch (error) {
      logger.error('Communication pattern analysis error', error);
      return this.fallbackCommunicationPattern();
    }
  }

  /**
   * Analyze communication patterns using LLM
   */
  async analyzeCommunicationPatternsLLM(transcript, options) {
    const prompt = `Analyze this audio transcript for communication patterns. Return ONLY valid JSON.

Transcript: "${transcript}"

Return JSON format:
{
  "pattern": "command_response" | "interview" | "interruption_heavy" | "one_way" | "two_way" | "normal" | null,
  "interruptions": number (count of apparent interruptions),
  "flow": "smooth" | "interrupted" | "one_way" | "two_way" | null,
  "confidence": 0.0-1.0,
  "description": "brief description of communication pattern"
}

Important:
- Detect command/response patterns
- Count interruptions (overlapping speech indicators)
- Identify communication flow
- Return valid JSON only, no markdown`;

    try {
      const response = await this.llmService.callLLM(prompt);
      const parsed = this.parseJSONResponse(response);
      
      return {
        detected: parsed.pattern !== null && parsed.pattern !== 'normal',
        category: 'communication_pattern',
        confidence: parsed.confidence || 0,
        pattern: parsed.pattern || null,
        interruptions: parsed.interruptions || 0,
        flow: parsed.flow || null,
        description: parsed.description || '',
        model: 'llm',
        source: 'llm',
      };
    } catch (error) {
      logger.error('LLM communication pattern analysis error', error);
      return this.analyzeCommunicationPatternsLocal(transcript, options);
    }
  }

  /**
   * Analyze communication patterns using local analysis
   */
  analyzeCommunicationPatternsLocal(transcript, options) {
    const words = transcript.toLowerCase().split(/\s+/);
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Detect command words
    const commandWords = ['stop', 'freeze', 'hands', 'down', 'back', 'away', 'drop'];
    const commandCount = words.filter(w => commandWords.some(cmd => w.includes(cmd))).length;
    
    // Detect questions (likely responses)
    const questionCount = (transcript.match(/\?/g) || []).length;
    
    // Estimate interruptions (incomplete sentences, abrupt changes)
    const incompleteSentences = sentences.filter(s => s.trim().length < 10).length;
    const estimatedInterruptions = Math.floor(incompleteSentences / 2);
    
    let pattern = null;
    let flow = null;
    
    if (commandCount > 2 && questionCount > 0) {
      pattern = 'command_response';
      flow = 'two_way';
    } else if (commandCount > 0) {
      pattern = 'one_way';
      flow = 'one_way';
    } else if (questionCount > 2) {
      pattern = 'interview';
      flow = 'two_way';
    } else if (estimatedInterruptions > 2) {
      pattern = 'interruption_heavy';
      flow = 'interrupted';
    }
    
    return {
      detected: pattern !== null,
      category: 'communication_pattern',
      confidence: pattern ? Math.min(0.7, 0.3 + (commandCount + questionCount) * 0.05) : 0.2,
      pattern,
      interruptions: estimatedInterruptions,
      flow,
      description: pattern ? `Detected ${pattern} pattern with ${estimatedInterruptions} interruptions` : 'Normal communication pattern',
      model: 'local',
      source: 'local',
    };
  }

  /**
   * Analyze background noise patterns
   * @param {string} transcript - Audio transcript (may include noise indicators)
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Background noise analysis results
   */
  async analyzeBackgroundNoise(transcript, options = {}) {
    if (!transcript || transcript.trim().length === 0) {
      return {
        detected: false,
        category: 'background_noise',
        confidence: 0,
        noiseType: null,
        level: null,
        description: 'No transcript available',
        model: 'local',
        source: 'local',
      };
    }

    try {
      if (this.llmEnabled) {
        return await this.analyzeBackgroundNoiseLLM(transcript, options);
      } else {
        return this.analyzeBackgroundNoiseLocal(transcript, options);
      }
    } catch (error) {
      logger.error('Background noise analysis error', error);
      return this.fallbackBackgroundNoise();
    }
  }

  /**
   * Analyze background noise using LLM
   */
  async analyzeBackgroundNoiseLLM(transcript, options) {
    const prompt = `Analyze this audio transcript for background noise patterns. Return ONLY valid JSON.

Transcript: "${transcript}"

Return JSON format:
{
  "noiseType": "traffic" | "crowd" | "machinery" | "weather" | "indoor" | "quiet" | "unknown" | null,
  "level": "low" | "medium" | "high" | null,
  "confidence": 0.0-1.0,
  "description": "brief description of background noise patterns"
}

Important:
- Infer noise type from transcript context
- Estimate noise level
- Return valid JSON only, no markdown`;

    try {
      const response = await this.llmService.callLLM(prompt);
      const parsed = this.parseJSONResponse(response);
      
      return {
        detected: parsed.noiseType !== null && parsed.noiseType !== 'quiet',
        category: 'background_noise',
        confidence: parsed.confidence || 0,
        noiseType: parsed.noiseType || null,
        level: parsed.level || null,
        description: parsed.description || '',
        model: 'llm',
        source: 'llm',
      };
    } catch (error) {
      logger.error('LLM background noise analysis error', error);
      return this.analyzeBackgroundNoiseLocal(transcript, options);
    }
  }

  /**
   * Analyze background noise using local analysis
   */
  analyzeBackgroundNoiseLocal(transcript, options) {
    const lowerTranscript = transcript.toLowerCase();
    
    // Noise type keywords
    const noiseKeywords = {
      traffic: ['car', 'vehicle', 'engine', 'horn', 'road', 'highway'],
      crowd: ['people', 'crowd', 'group', 'voices', 'talking'],
      machinery: ['machine', 'equipment', 'motor', 'engine'],
      weather: ['rain', 'wind', 'storm', 'weather'],
      indoor: ['room', 'building', 'inside', 'indoor'],
    };
    
    let detectedType = null;
    let maxMatches = 0;
    
    for (const [type, keywords] of Object.entries(noiseKeywords)) {
      const matches = keywords.filter(kw => lowerTranscript.includes(kw)).length;
      if (matches > maxMatches && matches > 0) {
        maxMatches = matches;
        detectedType = type;
      }
    }
    
    // Estimate noise level (very rough heuristic)
    const wordCount = transcript.split(/\s+/).length;
    const hasNoiseIndicators = maxMatches > 0;
    const level = hasNoiseIndicators ? (maxMatches > 2 ? 'high' : 'medium') : 'low';
    
    return {
      detected: detectedType !== null,
      category: 'background_noise',
      confidence: detectedType ? Math.min(0.6, 0.3 + maxMatches * 0.1) : 0.2,
      noiseType: detectedType,
      level: hasNoiseIndicators ? level : null,
      description: detectedType ? `Detected ${detectedType} background noise (${level} level)` : 'No significant background noise detected',
      model: 'local',
      source: 'local',
    };
  }

  /**
   * Parse JSON response from LLM (handles markdown code blocks)
   */
  parseJSONResponse(response) {
    try {
      let jsonText = response.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      return JSON.parse(jsonText);
    } catch (error) {
      logger.error('Failed to parse JSON response', error);
      return {};
    }
  }

  /**
   * Fallback responses
   */
  fallbackMultiSpeaker() {
    return {
      detected: false,
      category: 'multi_speaker',
      confidence: 0,
      speakerCount: 0,
      turnTaking: null,
      pattern: null,
      model: 'fallback',
      source: 'fallback',
    };
  }

  fallbackCommunicationPattern() {
    return {
      detected: false,
      category: 'communication_pattern',
      confidence: 0,
      pattern: null,
      interruptions: 0,
      flow: null,
      model: 'fallback',
      source: 'fallback',
    };
  }

  fallbackBackgroundNoise() {
    return {
      detected: false,
      category: 'background_noise',
      confidence: 0,
      noiseType: null,
      level: null,
      model: 'fallback',
      source: 'fallback',
    };
  }
}

module.exports = new EnhancedAudioAnalysis();
