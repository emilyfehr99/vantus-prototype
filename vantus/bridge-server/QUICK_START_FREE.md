# Quick Start: Free LLM Vision Detection

**Get free LLM vision detection in 3 steps!**

---

## Step 1: Install Ollama (if not already installed)

```bash
brew install ollama
```

---

## Step 2: Start Ollama and Download Model

**Terminal 1 - Start Ollama:**
```bash
ollama serve
```
Keep this running.

**Terminal 2 - Download Model:**
```bash
ollama pull llava
```
This downloads ~4GB (takes a few minutes, one-time only).

---

## Step 3: Configure and Process

```bash
cd vantus/bridge-server

# Set environment variables
export LLM_VISION_PROVIDER=ollama
export LLM_VISION_API_KEY=dummy
export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions
export LLM_VISION_MODEL=llava

# Test it works
node test-llm-vision.js

# Process your video
node process-detections-llm.js video-processing-results-1768418037.json
```

---

## That's It!

✅ **Completely free** - no API keys, no credits, no payments
✅ **No limits** - process as many frames as you want
✅ **Works offline** - runs on your computer
✅ **Private** - all processing happens locally

---

## Make It Permanent

Add to `~/.zshrc`:
```bash
echo 'export LLM_VISION_PROVIDER=ollama' >> ~/.zshrc
echo 'export LLM_VISION_API_KEY=dummy' >> ~/.zshrc
echo 'export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions' >> ~/.zshrc
echo 'export LLM_VISION_MODEL=llava' >> ~/.zshrc
source ~/.zshrc
```

---

## Troubleshooting

**Ollama not starting?**
```bash
# Check if running
ps aux | grep ollama

# Start it
ollama serve
```

**Model not found?**
```bash
# Check installed models
ollama list

# Download model
ollama pull llava
```

**Connection refused?**
- Make sure `ollama serve` is running
- Check: `curl http://localhost:11434/api/tags`

---

## Next Steps

Once Ollama is set up:
1. Keep `ollama serve` running
2. Process video: `node process-detections-llm.js`
3. Review detection results

**All free, all local, no limits!**
