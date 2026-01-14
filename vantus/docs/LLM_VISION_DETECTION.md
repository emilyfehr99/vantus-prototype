# LLM Vision Detection Setup

**Purpose:** Use LLM with vision capabilities to detect weapons, hands, stance, etc. in video frames

**Status:** ✅ Ready - Requires API Key

---

## Overview

Instead of using dedicated detection models (YOLOv8, MoveNet, etc.), we can use LLM vision models to analyze video frames. This works well when you don't have trained models available.

---

## Supported Providers

### 1. OpenRouter (Recommended - Free Tier Available)
- **Model**: `openai/gpt-4o-mini` (supports vision)
- **Cost**: Free tier available
- **Setup**: Get API key from https://openrouter.ai

### 2. Together AI
- **Model**: `meta-llama/Llama-3.1-8B-Vision-Instruct-Turbo`
- **Cost**: Pay-per-use
- **Setup**: Get API key from https://together.ai

### 3. Self-Hosted (LocalAI, Ollama)
- **Model**: `llava` (vision model)
- **Cost**: Free (self-hosted)
- **Setup**: Install LocalAI or Ollama with vision model

---

## Setup Instructions

### Option 1: OpenRouter (Easiest)

1. **Get API Key:**
   - Sign up at https://openrouter.ai
   - Get your API key from dashboard

2. **Set Environment Variables:**
   ```bash
   export LLM_VISION_PROVIDER=openrouter
   export LLM_VISION_API_KEY=your-api-key-here
   export LLM_VISION_MODEL=openai/gpt-4o-mini  # Optional, uses default if not set
   ```

3. **Process Video:**
   ```bash
   cd vantus/bridge-server
   node process-detections-llm.js
   ```

### Option 2: Together AI

1. **Get API Key:**
   - Sign up at https://together.ai
   - Get your API key

2. **Set Environment Variables:**
   ```bash
   export LLM_VISION_PROVIDER=together
   export LLM_VISION_API_KEY=your-api-key-here
   export LLM_VISION_MODEL=meta-llama/Llama-3.1-8B-Vision-Instruct-Turbo
   ```

### Option 3: Self-Hosted (Ollama)

1. **Install Ollama:**
   ```bash
   # macOS
   brew install ollama
   
   # Or download from https://ollama.ai
   ```

2. **Pull Vision Model:**
   ```bash
   ollama pull llava
   ```

3. **Set Environment Variables:**
   ```bash
   export LLM_VISION_PROVIDER=ollama
   export LLM_VISION_API_KEY=dummy  # Not required for local
   export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions
   export LLM_VISION_MODEL=llava
   ```

---

## Usage

### Process Video with LLM Vision

```bash
cd vantus/bridge-server

# Set API key
export LLM_VISION_API_KEY=your-api-key

# Process video
node process-detections-llm.js video-processing-results-1768418037.json
```

### Via API Endpoint

The detection API endpoint (`/api/detections/process`) will automatically use LLM vision if configured:

```bash
# Start server with LLM vision configured
export LLM_VISION_PROVIDER=openrouter
export LLM_VISION_API_KEY=your-api-key
npm start

# Process frames via API
curl -X POST http://localhost:3001/api/detections/process \
  -H "Content-Type: application/json" \
  -d '{
    "frames": [...],
    "options": {}
  }'
```

---

## What Gets Detected

The LLM vision model analyzes each frame for:

1. **Weapons**
   - Handguns
   - Rifles
   - Knives
   - Blunt weapons

2. **Stance Patterns**
   - Bladed stance
   - Fighting stance
   - Defensive stance

3. **Hand Positions**
   - Hands hidden
   - Waistband reach
   - Hands up
   - Normal positions

---

## Detection Output Format

```json
{
  "weapon": {
    "detected": true,
    "confidence": 0.85,
    "type": "handgun",
    "description": "Person holding handgun in right hand"
  },
  "stance": {
    "detected": true,
    "confidence": 0.72,
    "type": "bladed_stance",
    "description": "Body positioned at angle, weight shifted"
  },
  "hands": {
    "detected": true,
    "confidence": 0.68,
    "pattern": "waistband_reach",
    "description": "Hand reaching toward waistband area"
  }
}
```

---

## Performance

- **Processing Speed**: ~2-5 seconds per frame (depends on provider)
- **Accuracy**: Good for general detection, may have false positives
- **Cost**: 
  - OpenRouter: Free tier available
  - Together AI: ~$0.001-0.01 per frame
  - Self-hosted: Free

---

## Tips

1. **Start with OpenRouter**: Easiest setup, free tier available
2. **Process in batches**: Don't process all frames at once to avoid rate limits
3. **Adjust confidence threshold**: LLM returns confidence scores, filter low-confidence detections
4. **Use self-hosted for privacy**: If processing sensitive footage, use Ollama/LocalAI

---

## Troubleshooting

### "LLM Vision Service not configured"
- Set `LLM_VISION_API_KEY` environment variable
- Check API key is valid

### "API error 401"
- Invalid API key
- Check key is correct

### "API error 429"
- Rate limit exceeded
- Add delays between requests
- Use smaller batches

### "No detections found"
- Normal if video has no weapons/stance/hands
- Check LLM is actually analyzing images (check logs)
- Try different frames

---

## Next Steps

1. **Get API Key**: Sign up for OpenRouter or Together AI
2. **Set Environment Variables**: Configure LLM vision service
3. **Process Video**: Run detection processing script
4. **Review Results**: Check detection timeline and confidence scores

---

## Summary

✅ **LLM Vision Detection Ready**
- Supports multiple providers (OpenRouter, Together AI, self-hosted)
- Detects weapons, stance, hands
- Easy setup with API key
- Works without trained models

Just set your API key and start processing!
