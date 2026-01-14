#!/bin/bash

# Notify When Ollama Model is Ready
# Continuously checks and notifies when LLaVA model is downloaded

echo "🔍 Monitoring Ollama Model Download..."
echo "   Checking every 10 seconds..."
echo "   Press Ctrl+C to stop"
echo ""

CHECK_COUNT=0
LAST_SIZE=0

while true; do
  CHECK_COUNT=$((CHECK_COUNT + 1))
  
  # Check current size
  CURRENT_SIZE=$(du -sm ~/.ollama/models/blobs 2>/dev/null | cut -f1 || echo "0")
  
  # Check if model is ready
  if ollama list 2>/dev/null | grep -q "llava"; then
    echo ""
    echo "🎉 LLaVA MODEL IS READY!"
    echo ""
    echo "📊 Model Info:"
    ollama list | grep llava
    echo ""
    echo "✅ You can now process videos with LLM vision detection!"
    echo ""
    echo "🚀 Next Steps:"
    echo "   cd vantus/bridge-server"
    echo "   export LLM_VISION_PROVIDER=ollama"
    echo "   export LLM_VISION_API_KEY=dummy"
    echo "   export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions"
    echo "   export LLM_VISION_MODEL=llava"
    echo "   node process-detections-llm.js test-video-results.json"
    echo ""
    
    # Send notification (macOS)
    osascript -e 'display notification "LLaVA model is ready! You can now process videos." with title "Ollama Ready" sound name "Glass"' 2>/dev/null || true
    
    break
  fi
  
  # Show progress
  if [ "$CURRENT_SIZE" != "$LAST_SIZE" ]; then
    SIZE_GB=$(echo "scale=2; $CURRENT_SIZE / 1024" | bc 2>/dev/null || echo "calculating...")
    echo "[Check $CHECK_COUNT] Downloading... Current size: ${SIZE_GB} GB (target: ~4 GB)"
    LAST_SIZE=$CURRENT_SIZE
  else
    echo "[Check $CHECK_COUNT] Waiting... (${CURRENT_SIZE} MB downloaded)"
  fi
  
  # Check if download process is running
  if ! ps aux | grep -q "[o]llama pull"; then
    if [ "$CURRENT_SIZE" -lt 3500 ]; then
      echo "  ⚠️  Download process not found, starting..."
      ollama pull llava > /dev/null 2>&1 &
    fi
  fi
  
  sleep 10
done
