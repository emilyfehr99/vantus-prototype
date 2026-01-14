# LLM Audio Analysis Setup Guide - Vantus Customized

**Purpose:** Guide for setting up free/self-hosted LLM integration for Vantus audio transcript analysis

**Status:** Ready for integration - Supports multiple providers with Vantus-specific customization

---

## Overview

The Vantus system uses LLM APIs to analyze audio transcripts for **contextual pattern indicators only**. This is **NOT stress detection, medical diagnosis, or threat assessment**.

### Key Features:
- **Non-diagnostic pattern analysis** - Observable speech patterns only
- **Baseline-aware analysis** - Compares to officer's own baseline patterns
- **Operational context awareness** - Considers traffic stops, checkpoints, etc.
- **Privacy-first** - Only transcripts sent, no raw audio
- **Self-hosted options** - LocalAI, AnythingLLM, Ollama support
- **Automatic fallback** - Works even without LLM configured

---

## Supported LLM Providers

### Cloud Providers (Free Tier Available)

#### 1. OpenRouter (Recommended - Free Tier Available)

**Setup:**
1. Sign up at [OpenRouter.ai](https://openrouter.ai/)
2. Get your API key from the dashboard
3. Free tier includes access to several models

**Free Models Available:**
- `meta-llama/llama-3.2-3b-instruct:free` (Recommended)
- `google/gemma-2-2b-it:free`
- `mistralai/mistral-7b-instruct:free`

**Configuration:**
```javascript
llm: {
  provider: 'openrouter',
  apiKey: 'your-openrouter-api-key',
  model: 'meta-llama/llama-3.2-3b-instruct:free',
}
```

#### 2. Together AI

**Setup:**
1. Sign up at [Together.ai](https://together.ai/)
2. Get your API key
3. Free tier available with credits

**Free Models Available:**
- `meta-llama/Llama-3-8b-chat-hf`
- `mistralai/Mixtral-8x7B-Instruct-v0.1`

**Configuration:**
```javascript
llm: {
  provider: 'together',
  apiKey: 'your-together-api-key',
  model: 'meta-llama/Llama-3-8b-chat-hf',
}
```

#### 3. DeepSeek

**Setup:**
1. Sign up at [DeepSeek.com](https://www.deepseek.com/)
2. Get your API key
3. Free tier available

**Configuration:**
```javascript
llm: {
  provider: 'deepseek',
  apiKey: 'your-deepseek-api-key',
  model: 'deepseek-chat',
}
```

### Self-Hosted Providers (Recommended for Privacy)

#### 4. LocalAI (Recommended for Self-Hosting)

**What it is:** Drop-in replacement for OpenAI API, runs LLMs locally

**Setup:**
1. Install LocalAI: [GitHub - LocalAI](https://github.com/mudler/LocalAI)
2. Download a model (e.g., Llama 3)
3. Start LocalAI server
4. No API key required for local instances

**Configuration:**
```javascript
llm: {
  provider: 'localai',
  apiKey: null, // Not required for local
  model: 'llama3', // Your model name
  apiUrl: 'http://localhost:8080/v1/chat/completions', // Your LocalAI endpoint
}
```

**Environment Variables:**
```bash
LLM_PROVIDER=localai
LLM_MODEL=llama3
LLM_API_URL=http://localhost:8080/v1/chat/completions
```

#### 5. AnythingLLM

**What it is:** All-in-one AI application with built-in API, supports various LLMs

**Setup:**
1. Deploy AnythingLLM: [AnythingLLM Docs](https://docs.useanything.com/)
2. Configure with your preferred LLM
3. Get API endpoint URL
4. API key may be required depending on configuration

**Configuration:**
```javascript
llm: {
  provider: 'anythingllm',
  apiKey: 'your-api-key', // If required by your instance
  model: 'llama3', // Model configured in AnythingLLM
  apiUrl: 'http://your-anythingllm-instance:3001/api/v1/chat/completions',
}
```

**Environment Variables:**
```bash
LLM_PROVIDER=anythingllm
LLM_API_KEY=your-key-if-needed
LLM_MODEL=llama3
LLM_API_URL=http://your-instance:3001/api/v1/chat/completions
```

#### 6. Ollama

**What it is:** Run LLMs locally with simple API

**Setup:**
1. Install Ollama: [Ollama.ai](https://ollama.ai/)
2. Pull a model: `ollama pull llama3`
3. Start Ollama server
4. No API key required

**Configuration:**
```javascript
llm: {
  provider: 'ollama',
  apiKey: null, // Not required
  model: 'llama3', // Model you pulled
  apiUrl: 'http://localhost:11434/v1/chat/completions',
}
```

**Environment Variables:**
```bash
LLM_PROVIDER=ollama
LLM_MODEL=llama3
LLM_API_URL=http://localhost:11434/v1/chat/completions
```

#### 7. Golem

**What it is:** Custom/self-hosted LLM instance

**Configuration:**
```javascript
llm: {
  provider: 'golem',
  apiKey: 'your-golem-api-key',
  model: 'your-model-name',
  apiUrl: 'https://your-golem-instance.com/api/v1/chat/completions',
}
```

---

## Configuration Methods

### Method 1: Environment Variables (Recommended for Development)

```bash
# Cloud provider example
LLM_PROVIDER=openrouter
LLM_API_KEY=your-api-key-here
LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free

# Self-hosted example
LLM_PROVIDER=localai
LLM_MODEL=llama3
LLM_API_URL=http://localhost:8080/v1/chat/completions
```

### Method 2: Client Config File

Create `vantus-app/config/client-config.js`:

```javascript
export default {
  llm: {
    provider: 'localai', // or 'openrouter', 'ollama', etc.
    apiKey: null, // Not needed for self-hosted
    model: 'llama3',
    apiUrl: 'http://localhost:8080/v1/chat/completions',
  },
  // ... other config
};
```

### Method 3: Runtime Initialization

```javascript
import llmService from './services/llmService';

llmService.initialize(
  'localai',
  null, // No API key for self-hosted
  'llama3',
  'http://localhost:8080/v1/chat/completions'
);
```

---

## Vantus-Specific Features

### 1. Baseline-Aware Analysis

The LLM service automatically includes officer baseline data when available:
- Speech rate baselines (words per minute)
- Normal pattern ranges
- Context-specific baselines

**Example:**
```javascript
// Officer baseline is automatically included in analysis
const analysis = await llmService.analyzeAudioTranscript(
  transcript,
  recentTranscripts,
  {
    baseline: {
      mean_wpm: 120,
      std_wpm: 15,
    },
    operationalContext: 'traffic_stop',
    sessionDuration: 1800, // seconds
  }
);
```

### 2. Operational Context Awareness

The system considers operational context:
- Traffic stops
- Checkpoints
- Routine patrol
- Suspicious activity responses

This helps the LLM understand when certain patterns are expected vs. unusual.

### 3. Non-Diagnostic Prompts

All prompts are carefully crafted to:
- Avoid stress detection
- Avoid medical diagnosis
- Avoid threat assessment
- Focus only on observable speech patterns

### 4. Automatic Retry Logic

Self-hosted instances may be slower or temporarily unavailable:
- Automatic retry with exponential backoff
- Graceful fallback to pattern matching
- Configurable retry attempts and delays

---

## How It Works

1. **Audio Transcript Collection:**
   - System collects audio transcripts during officer sessions
   - Transcripts are privacy-first (no raw audio stored)

2. **Context Gathering:**
   - Officer baseline data retrieved
   - Operational context identified
   - Recent transcripts collected for context

3. **LLM Analysis:**
   - Transcript sent to LLM with Vantus-customized prompt
   - Prompt includes baseline and operational context
   - LLM analyzes for observable patterns only
   - Returns structured JSON with pattern type and confidence

4. **Signal Generation:**
   - If confidence >= threshold (default 70%), signal is generated
   - Signal includes pattern type, confidence, indicators, and strength
   - Signal is sent to supervisor dashboard

5. **Fallback:**
   - If LLM is not configured or fails, system uses pattern matching
   - Fallback analyzes keywords, repetition, and capitalization
   - Ensures system works even without LLM

---

## API Response Format

The LLM returns JSON in this format:

```json
{
  "pattern": "aggressive" | "screaming" | "repetitive" | "unusual_rate" | "normal",
  "confidence": 0.0-1.0,
  "indicators": ["specific", "observable", "indicators"],
  "speech_rate": "fast" | "normal" | "slow" | "unknown",
  "pattern_strength": "weak" | "moderate" | "strong" | "none"
}
```

---

## Privacy & Security

- **No Raw Audio:** Only transcripts are sent to LLM
- **No PII:** Transcripts are anonymized (no officer names in prompts)
- **Self-Hosted Options:** Can run completely locally with LocalAI/Ollama
- **Optional:** LLM can be disabled - system works with fallback
- **Local Processing:** All analysis can be done on-premises

---

## Testing

### Test with Sample Transcripts

```javascript
import llmService from './services/llmService';

// Initialize
llmService.initialize('localai', null, 'llama3', 'http://localhost:8080/v1/chat/completions');

// Test analysis with context
const result = await llmService.analyzeAudioTranscript(
  "STOP! PUT YOUR HANDS UP! BACKUP!",
  [],
  {
    baseline: { mean_wpm: 120, std_wpm: 15 },
    operationalContext: 'traffic_stop',
  }
);

console.log(result);
// {
//   pattern: 'aggressive',
//   confidence: 0.75,
//   indicators: ['aggressive_keywords', 'high_caps_ratio'],
//   speechRate: 'fast',
//   patternStrength: 'strong',
//   source: 'llm'
// }
```

---

## Troubleshooting

### LLM Not Responding

1. **Check API URL:** Verify endpoint is correct
2. **Check Network:** Ensure connectivity to self-hosted instance
3. **Check Model:** Verify model name is correct
4. **Check Logs:** Review error messages in logs
5. **Test Endpoint:** Use curl or Postman to test API directly
6. **System will automatically fallback** to pattern matching

### Low Confidence Results

1. **Try different model** (some models are better at pattern detection)
2. **Adjust confidence threshold** in config
3. **Check if transcripts are clear** and complete
4. **Review baseline data** - may need more calibration data

### Self-Hosted Instance Issues

1. **Check server is running:** `curl http://localhost:8080/health`
2. **Check model is loaded:** Verify model name matches
3. **Check resources:** Ensure enough RAM/CPU for model
4. **Increase timeout:** Self-hosted instances may be slower
5. **Check logs:** Review server logs for errors

### API Rate Limits

1. **OpenRouter free tier** has rate limits
2. **System caches results** to reduce API calls
3. **Consider self-hosting** for unlimited usage
4. **Upgrade to paid tier** for production

---

## Cost Considerations

### Free Tier Limits

- **OpenRouter:** Free tier includes several models, rate limited
- **Together AI:** Free credits available, pay-as-you-go after
- **DeepSeek:** Free tier available with limits

### Self-Hosted (No Cost)

- **LocalAI:** Free, runs on your hardware
- **Ollama:** Free, runs on your hardware
- **AnythingLLM:** Free, runs on your hardware
- **No API costs:** Unlimited usage
- **Privacy:** All data stays local

### Production Recommendations

- **Start with free tier** for testing
- **Monitor API usage** and costs
- **Consider self-hosting** for production (privacy + unlimited usage)
- **Implement caching** to reduce API calls
- **Use smaller models** for faster inference

---

## Recommended Setup for Production

### Option 1: Self-Hosted (Recommended for Privacy)

```bash
# Install LocalAI or Ollama
# Configure with Llama 3 or similar model
# Set environment variables:
LLM_PROVIDER=localai
LLM_MODEL=llama3
LLM_API_URL=http://localhost:8080/v1/chat/completions
```

**Benefits:**
- Complete privacy (no data leaves your network)
- Unlimited usage (no API costs)
- Full control over models and configuration
- No rate limits

### Option 2: Cloud Provider (Recommended for Ease)

```bash
# Use OpenRouter free tier
LLM_PROVIDER=openrouter
LLM_API_KEY=your-key
LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

**Benefits:**
- Easy setup (no server management)
- Free tier available
- Automatic updates
- No hardware requirements

---

## Next Steps

1. **Choose LLM provider** (recommend LocalAI/Ollama for privacy, OpenRouter for ease)
2. **Get API key or set up self-hosted instance**
3. **Configure in environment variables or client-config.js**
4. **Test with sample transcripts**
5. **Monitor API usage and costs** (if using cloud)
6. **Adjust confidence thresholds** as needed
7. **Review baseline data** for better context-aware analysis

---

## Notes

- LLM analysis is **optional** - system works without it
- Fallback pattern matching is always available
- LLM provides better accuracy for complex patterns
- Can be disabled at any time via configuration
- Self-hosted options provide complete privacy
- Baseline-aware analysis improves accuracy

---

## Resources

- [LocalAI GitHub](https://github.com/mudler/LocalAI)
- [Ollama.ai](https://ollama.ai/)
- [AnythingLLM Docs](https://docs.useanything.com/)
- [OpenRouter.ai](https://openrouter.ai/)
- [OpenApps.pro - Open Source AI Apps](https://openapps.pro/category/open-source-apps-for-ai)
