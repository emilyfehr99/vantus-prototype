# Free LLM Vision Setup (Ollama)

**Problem**: OpenRouter requires credits (paid)
**Solution**: Use Ollama - completely free, self-hosted

---

## Quick Setup (5 minutes)

### Step 1: Install Ollama

```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

### Step 2: Start Ollama

```bash
ollama serve
```

Keep this terminal open - Ollama needs to be running.

### Step 3: Pull Vision Model

In a new terminal:

```bash
ollama pull llava
```

This downloads the vision model (about 4GB, one-time download).

### Step 4: Configure and Test

```bash
cd vantus/bridge-server

export LLM_VISION_PROVIDER=ollama
export LLM_VISION_API_KEY=dummy
export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions
export LLM_VISION_MODEL=llava

# Test it
node test-llm-vision.js
```

### Step 5: Process Video

```bash
# Process all frames (free!)
node process-detections-llm.js video-processing-results-1768418037.json
```

---

## Alternative: Add Credits to OpenRouter

If you prefer OpenRouter:

1. Go to https://openrouter.ai/settings/credits
2. Add credits (minimum $5)
3. Then use your existing API key

---

## Comparison

| Option | Cost | Setup | Speed |
|--------|------|-------|-------|
| **Ollama** | Free | 5 min | Fast (local) |
| OpenRouter | $5+ | Instant | Fast (cloud) |

---

## Recommended: Use Ollama

Ollama is:
- ✅ Completely free
- ✅ No API limits
- ✅ Works offline
- ✅ Privacy (runs locally)
- ✅ Fast (no network latency)

Just install and run - no credits needed!
