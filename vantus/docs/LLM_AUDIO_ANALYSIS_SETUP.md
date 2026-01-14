# LLM Audio Analysis Setup Guide

**Purpose:** Guide for setting up free LLM integration for audio transcript analysis

**Status:** Ready for integration - Supports multiple free LLM providers

---

## Overview

The Vantus system can use free LLM APIs to analyze audio transcripts for:
- Aggressive vocal patterns
- Screaming or high-intensity vocalizations
- Repetitive speech patterns
- Unusual speech rates
- Other contextual speech indicators

**Important:** This is NOT stress detection or medical diagnosis. The LLM analyzes observable speech patterns only.

---

## Supported LLM Providers

### 1. OpenRouter (Recommended - Free Tier Available)

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
// In client-config.js or environment variables
llm: {
  provider: 'openrouter',
  apiKey: 'your-openrouter-api-key',
  model: 'meta-llama/llama-3.2-3b-instruct:free',
}
```

### 2. Together AI

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

### 3. DeepSeek

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

### 4. Golem

**Setup:**
1. Access Golem via [openapps.pro/apps/golem](https://openapps.pro/apps/golem)
2. Get your API key and endpoint URL
3. Configure with custom API URL

**Configuration:**
```javascript
llm: {
  provider: 'golem',
  apiKey: 'your-golem-api-key',
  model: 'your-model-name', // Model name as provided by Golem
  apiUrl: 'https://your-golem-instance.com/api/v1/chat/completions', // Golem API endpoint
}
```

**Environment Variables:**
```bash
LLM_PROVIDER=golem
LLM_API_KEY=your-golem-api-key
LLM_MODEL=your-model-name
LLM_API_URL=https://your-golem-instance.com/api/v1/chat/completions
```

**Note:** Golem requires a custom API URL since it may be self-hosted or have different endpoints. Make sure to use the correct endpoint URL provided by your Golem instance.

---

## Configuration Methods

### Method 1: Environment Variables (Recommended for Development)

```bash
# .env file or environment variables
LLM_PROVIDER=openrouter
LLM_API_KEY=your-api-key-here
LLM_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

### Method 2: Client Config File

Create `vantus-app/config/client-config.js`:

```javascript
export default {
  llm: {
    provider: 'openrouter',
    apiKey: 'your-api-key-here',
    model: 'meta-llama/llama-3.2-3b-instruct:free',
  },
  // ... other config
};
```

### Method 3: Runtime Initialization

```javascript
import llmService from './services/llmService';

llmService.initialize(
  'openrouter',
  'your-api-key',
  'meta-llama/llama-3.2-3b-instruct:free'
);
```

---

## How It Works

1. **Audio Transcript Collection:**
   - System collects audio transcripts during officer sessions
   - Transcripts are privacy-first (no raw audio stored)

2. **LLM Analysis:**
   - When audio detection is triggered, transcript is sent to LLM
   - LLM analyzes for aggressive patterns, screaming, repetition, etc.
   - Returns structured JSON with pattern type and confidence

3. **Signal Generation:**
   - If confidence >= threshold (default 70%), signal is generated
   - Signal includes pattern type, confidence, and indicators
   - Signal is sent to supervisor dashboard

4. **Fallback:**
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
  "indicators": ["specific", "indicators", "found"],
  "speech_rate": "fast" | "normal" | "slow" | "unknown"
}
```

---

## Privacy & Security

- **No Raw Audio:** Only transcripts are sent to LLM
- **No PII:** Transcripts are anonymized (no officer names)
- **Optional:** LLM can be disabled - system works with fallback
- **Local Processing:** Can be self-hosted with AnythingLLM if needed

---

## Testing

### Test with Sample Transcripts

```javascript
import llmService from './services/llmService';

// Initialize
llmService.initialize('openrouter', 'your-key', 'meta-llama/llama-3.2-3b-instruct:free');

// Test analysis
const result = await llmService.analyzeAudioTranscript(
  "STOP! PUT YOUR HANDS UP! BACKUP!",
  []
);

console.log(result);
// {
//   pattern: 'aggressive',
//   confidence: 0.75,
//   indicators: ['aggressive_keywords', 'high_caps_ratio'],
//   speechRate: 'fast',
//   source: 'llm'
// }
```

---

## Troubleshooting

### LLM Not Responding

1. Check API key is valid
2. Verify provider URL is correct
3. Check network connectivity
4. Review API rate limits
5. System will automatically fallback to pattern matching

### Low Confidence Results

1. Try different model (some models are better at pattern detection)
2. Adjust confidence threshold in config
3. Check if transcripts are clear and complete

### API Rate Limits

1. OpenRouter free tier has rate limits
2. System caches results to reduce API calls
3. Consider upgrading to paid tier for production

---

## Cost Considerations

### Free Tier Limits

- **OpenRouter:** Free tier includes several models, rate limited
- **Together AI:** Free credits available, pay-as-you-go after
- **DeepSeek:** Free tier available with limits

### Production Recommendations

- Start with free tier for testing
- Monitor API usage
- Consider self-hosting AnythingLLM for unlimited usage
- Implement caching to reduce API calls

---

## Integration with AnythingLLM

If you want to self-host:

1. **Deploy AnythingLLM:**
   - Follow [AnythingLLM setup guide](https://docs.useanything.com/)
   - Configure with free LLM model (Llama, Mistral, etc.)

2. **Update API URL:**
   ```javascript
   // In llmService.js, add:
   anythingllm: 'http://your-anythingllm-instance/api/v1/chat/completions'
   ```

3. **Use AnythingLLM API:**
   - AnythingLLM provides OpenAI-compatible API
   - Use same integration code

---

## Next Steps

1. Choose LLM provider (recommend OpenRouter for free tier)
2. Get API key
3. Configure in environment variables or client-config.js
4. Test with sample transcripts
5. Monitor API usage and costs
6. Adjust confidence thresholds as needed

---

## Notes

- LLM analysis is **optional** - system works without it
- Fallback pattern matching is always available
- LLM provides better accuracy for complex patterns
- Can be disabled at any time via configuration
