#!/bin/bash

# Monitor Ollama Model Download Progress
# Checks every 10 seconds until model is ready

echo "🔍 Monitoring Ollama Model Download..."
echo ""

MODEL_READY=false
CHECK_COUNT=0

while [ "$MODEL_READY" = false ]; do
  CHECK_COUNT=$((CHECK_COUNT + 1))
  
  # Check if model is installed
  if ollama list 2>/dev/null | grep -q "llava"; then
    echo "✅ LLaVA model is ready!"
    echo ""
    echo "📊 Model Info:"
    ollama list | grep llava
    echo ""
    echo "🚀 Ready to process videos!"
    echo ""
    echo "Next steps:"
    echo "  cd vantus/bridge-server"
    echo "  export LLM_VISION_PROVIDER=ollama"
    echo "  export LLM_VISION_API_KEY=dummy"
    echo "  export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions"
    echo "  export LLM_VISION_MODEL=llava"
    echo "  node process-detections-llm.js test-video-results.json"
    echo ""
    MODEL_READY=true
  else
    echo "[Check $CHECK_COUNT] Model not ready yet..."
    
    # Check if download is in progress
    if ps aux | grep -q "[o]llama pull"; then
      echo "  ⏳ Download in progress..."
    else
      echo "  ⚠️  No download process found"
      echo "  Starting download..."
      ollama pull llava > /dev/null 2>&1 &
    fi
    
    # Check model directory size
    if [ -d ~/.ollama/models ]; then
      SIZE=$(du -sh ~/.ollama/models 2>/dev/null | cut -f1)
      echo "  📦 Current size: $SIZE"
    fi
    
    echo "  Waiting 10 seconds..."
    sleep 10
    echo ""
  fi
done
