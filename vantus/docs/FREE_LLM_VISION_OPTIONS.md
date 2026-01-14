# Free LLM Vision Options for Detection

**All options are completely free - no credits or payments required**

---

## Option 1: Ollama (Recommended - Best Free Option)

### ✅ Pros
- Completely free
- No API limits
- Works offline
- Privacy (runs locally)
- Fast (no network latency)
- No signup required

### Setup (5 minutes)

1. **Install Ollama:**
   ```bash
   # macOS
   brew install ollama
   
   # Or download from https://ollama.ai/download
   ```

2. **Start Ollama:**
   ```bash
   ollama serve
   ```
   Keep this terminal open.

3. **Pull Vision Model:**
   In a new terminal:
   ```bash
   ollama pull llava
   ```
   This downloads ~4GB (one-time, takes a few minutes).

4. **Configure:**
   ```bash
   export LLM_VISION_PROVIDER=ollama
   export LLM_VISION_API_KEY=dummy
   export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions
   export LLM_VISION_MODEL=llava
   ```

5. **Test:**
   ```bash
   cd vantus/bridge-server
   node test-llm-vision.js
   ```

6. **Process Video:**
   ```bash
   node process-detections-llm.js video-processing-results-1768418037.json
   ```

---

## Option 2: Google Gemini (Free Tier)

### ✅ Pros
- Free tier available
- Good quality
- Easy setup
- Cloud-based

### Setup

1. **Get API Key:**
   - Go to https://aistudio.google.com/app/apikey
   - Sign in with Google account
   - Create API key (free)

2. **Configure:**
   ```bash
   export LLM_VISION_PROVIDER=openrouter
   export LLM_VISION_API_KEY=your-google-api-key
   export LLM_VISION_MODEL=google/gemini-flash-1.5
   ```

3. **Test:**
   ```bash
   node test-llm-vision.js
   ```

**Note**: May have rate limits on free tier.

---

## Option 3: Hugging Face Inference API (Free)

### ✅ Pros
- Free tier
- Multiple models
- Good for experimentation

### Setup

1. **Get API Key:**
   - Sign up at https://huggingface.co
   - Go to Settings > Access Tokens
   - Create token

2. **Use with OpenRouter:**
   ```bash
   export LLM_VISION_PROVIDER=openrouter
   export LLM_VISION_API_KEY=your-hf-token
   export LLM_VISION_MODEL=huggingface/llava-1.5-7b
   ```

---

## Option 4: LocalAI (Self-Hosted)

### ✅ Pros
- Free
- Multiple models
- API compatible

### Setup

1. **Install LocalAI:**
   ```bash
   # Using Docker
   docker run -p 8080:8080 localai/localai:latest
   ```

2. **Configure:**
   ```bash
   export LLM_VISION_PROVIDER=localai
   export LLM_VISION_API_KEY=dummy
   export LLM_VISION_API_URL=http://localhost:8080/v1/chat/completions
   export LLM_VISION_MODEL=llava
   ```

---

## Quick Comparison

| Option | Cost | Setup Time | Quality | Speed |
|--------|------|------------|---------|-------|
| **Ollama** | Free | 5 min | Good | Fast |
| Gemini | Free | 2 min | Excellent | Fast |
| Hugging Face | Free | 3 min | Good | Medium |
| LocalAI | Free | 10 min | Good | Fast |

---

## Recommended: Start with Ollama

**Why Ollama?**
- ✅ Easiest free setup
- ✅ No signup required
- ✅ No API limits
- ✅ Works offline
- ✅ Best for privacy

**Quick Start:**
```bash
# 1. Install
brew install ollama

# 2. Start
ollama serve

# 3. Download model (in new terminal)
ollama pull llava

# 4. Configure
export LLM_VISION_PROVIDER=ollama
export LLM_VISION_API_KEY=dummy
export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions
export LLM_VISION_MODEL=llava

# 5. Test
cd vantus/bridge-server
node test-llm-vision.js
```

---

## Troubleshooting

### Ollama not starting?
```bash
# Check if running
ps aux | grep ollama

# Restart
killall ollama
ollama serve
```

### Model not found?
```bash
# List available models
ollama list

# Pull model again
ollama pull llava
```

### Connection refused?
- Make sure `ollama serve` is running
- Check port 11434 is not blocked
- Try: `curl http://localhost:11434/api/tags`

---

## Next Steps

1. **Choose an option** (recommend Ollama)
2. **Follow setup steps**
3. **Test with:** `node test-llm-vision.js`
4. **Process video:** `node process-detections-llm.js`

All options are free - no credit cards or payments needed!
