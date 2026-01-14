#!/bin/bash

# Quick Ollama Setup Script
# Sets up Ollama for free LLM vision detection

echo "🚀 Setting up Ollama for Free LLM Vision Detection"
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📦 Installing Ollama..."
    
    # Check for Homebrew
    if command -v brew &> /dev/null; then
        echo "  Using Homebrew to install Ollama..."
        brew install ollama
    else
        echo "  ⚠️  Homebrew not found. Please install Ollama manually:"
        echo "     Visit: https://ollama.ai/download"
        echo "     Or install Homebrew: https://brew.sh"
        exit 1
    fi
else
    echo "✅ Ollama is already installed"
fi

echo ""
echo "🔄 Starting Ollama server..."
echo "  (This will run in the background)"

# Start Ollama in background
ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!

# Wait for Ollama to start
sleep 3

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama server is running"
else
    echo "⚠️  Ollama server may not be running. Starting manually..."
    echo "   Run: ollama serve"
    echo "   Then in another terminal, run: ollama pull llava"
    exit 1
fi

echo ""
echo "📥 Downloading LLaVA vision model..."
echo "  (This may take a few minutes, ~4GB download)"
ollama pull llava

if [ $? -eq 0 ]; then
    echo "✅ LLaVA model downloaded"
else
    echo "❌ Failed to download model"
    exit 1
fi

echo ""
echo "⚙️  Setting up environment variables..."
echo ""
echo "Add these to your shell profile (~/.zshrc or ~/.bash_profile):"
echo ""
echo "export LLM_VISION_PROVIDER=ollama"
echo "export LLM_VISION_API_KEY=dummy"
echo "export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions"
echo "export LLM_VISION_MODEL=llava"
echo ""

# Set for current session
export LLM_VISION_PROVIDER=ollama
export LLM_VISION_API_KEY=dummy
export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions
export LLM_VISION_MODEL=llava

echo "✅ Environment variables set for this session"
echo ""
echo "🧪 Testing setup..."
echo ""

cd "$(dirname "$0")"
if node test-llm-vision.js 2>&1 | grep -q "Test successful"; then
    echo "✅ Setup complete! Ollama is working."
    echo ""
    echo "📝 Next steps:"
    echo "   1. Keep 'ollama serve' running (or it's running in background)"
    echo "   2. Process video: node process-detections-llm.js"
    echo ""
else
    echo "⚠️  Test had issues, but Ollama is installed"
    echo "   Try manually: node test-llm-vision.js"
fi

echo ""
echo "💡 To make environment variables permanent:"
echo "   echo 'export LLM_VISION_PROVIDER=ollama' >> ~/.zshrc"
echo "   echo 'export LLM_VISION_API_KEY=dummy' >> ~/.zshrc"
echo "   echo 'export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions' >> ~/.zshrc"
echo "   echo 'export LLM_VISION_MODEL=llava' >> ~/.zshrc"
echo "   source ~/.zshrc"
