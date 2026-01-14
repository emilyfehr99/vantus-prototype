# LLM Vision Troubleshooting Guide

**Issue**: OpenRouter (Option 1) didn't work

---

## Common Issues & Solutions

### 1. API Key Not Set

**Error**: `LLM Vision API key not configured`

**Solution**:
```bash
# Set the API key
export LLM_VISION_API_KEY=your-actual-api-key-here

# Verify it's set
echo $LLM_VISION_API_KEY

# Then run the script
node process-detections-llm.js
```

---

### 2. Invalid API Key

**Error**: `401 Unauthorized` or `Invalid API key`

**Solution**:
1. Go to https://openrouter.ai/keys
2. Create a new API key
3. Copy the full key (starts with `sk-or-v1-...`)
4. Set it: `export LLM_VISION_API_KEY=sk-or-v1-your-key`
5. Test: `node test-llm-vision.js`

---

### 3. Rate Limit Exceeded

**Error**: `429 Too Many Requests`

**Solution**:
- Wait a few minutes
- Use free tier limits (check OpenRouter dashboard)
- Process fewer frames at once
- Add delays between requests

---

### 4. Model Not Available

**Error**: `Model not found` or `Invalid model`

**Solution**:
```bash
# Try a different model
export LLM_VISION_MODEL=openai/gpt-4o-mini

# Or use a free model
export LLM_VISION_MODEL=google/gemini-flash-1.5
```

---

### 5. Image Format Error

**Error**: `Invalid image format` or `Bad request`

**Solution**:
- Check that frames have base64 data
- Verify image format is JPEG
- Check file size (some APIs have limits)

---

## Alternative Solutions

### Option A: Use Free Alternative (Google Gemini)

Google Gemini has a free tier and supports vision:

```bash
# Use Google Gemini (free tier available)
export LLM_VISION_PROVIDER=openrouter
export LLM_VISION_API_KEY=your-openrouter-key
export LLM_VISION_MODEL=google/gemini-flash-1.5
```

### Option B: Use Simple Detection (No API Key)

If you just want to see the structure without actual detection:

```bash
node process-detections-simple.js
```

This processes frames and creates the detection structure without calling any API.

### Option C: Use Self-Hosted (Ollama - Completely Free)

1. **Install Ollama:**
   ```bash
   brew install ollama
   ```

2. **Start Ollama:**
   ```bash
   ollama serve
   ```

3. **Pull Vision Model:**
   ```bash
   ollama pull llava
   ```

4. **Configure:**
   ```bash
   export LLM_VISION_PROVIDER=ollama
   export LLM_VISION_API_KEY=dummy
   export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions
   export LLM_VISION_MODEL=llava
   ```

5. **Test:**
   ```bash
   node test-llm-vision.js
   ```

---

## Testing Your Setup

### Step 1: Test API Key

```bash
# Set your key
export LLM_VISION_API_KEY=your-key

# Test with a single frame
node test-llm-vision.js
```

### Step 2: Check API Response

If test fails, check the error:
- **401**: Invalid API key
- **429**: Rate limit
- **400**: Bad request format
- **500**: Server error

### Step 3: Verify Model

```bash
# List available models on OpenRouter
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $LLM_VISION_API_KEY"
```

---

## Quick Fix Checklist

- [ ] API key is set: `echo $LLM_VISION_API_KEY`
- [ ] API key is valid (starts with `sk-or-v1-`)
- [ ] Model is correct: `openai/gpt-4o-mini` or `google/gemini-flash-1.5`
- [ ] Test script works: `node test-llm-vision.js`
- [ ] No rate limits (check OpenRouter dashboard)
- [ ] Internet connection is working

---

## Still Not Working?

### Try This Step-by-Step:

1. **Get a fresh API key:**
   - Go to https://openrouter.ai
   - Sign up/login
   - Go to Keys section
   - Create new key
   - Copy it

2. **Set it in terminal:**
   ```bash
   export LLM_VISION_API_KEY=sk-or-v1-your-new-key-here
   ```

3. **Test it:**
   ```bash
   cd vantus/bridge-server
   node test-llm-vision.js
   ```

4. **If test works, process video:**
   ```bash
   node process-detections-llm.js
   ```

---

## Alternative: Use Simple Detection

If LLM vision isn't working, you can still process the video structure:

```bash
node process-detections-simple.js
```

This will:
- Process all frames
- Create detection structure
- Save results
- Show what would be detected (when LLM is configured)

---

## Need Help?

Share the error message you're getting and I can help troubleshoot!

Common errors to check:
- `API key not configured` → Set `LLM_VISION_API_KEY`
- `401 Unauthorized` → Invalid API key
- `429 Rate limit` → Wait or use different provider
- `Model not found` → Check model name
- `Timeout` → Check internet connection
