/**
 * Check Ollama Model Download Status
 * Monitors and reports on Ollama model download progress
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkOllamaStatus() {
  console.log('\n🔍 Checking Ollama Model Status...\n');

  // Check if Ollama is installed
  try {
    execSync('which ollama', { stdio: 'ignore' });
    console.log('✅ Ollama is installed');
  } catch (error) {
    console.log('❌ Ollama is not installed');
    console.log('   Install with: brew install ollama');
    return;
  }

  // Check if Ollama server is running
  try {
    const response = execSync('curl -s http://localhost:11434/api/tags', { encoding: 'utf8' });
    const data = JSON.parse(response);
    console.log('✅ Ollama server is running');
    
    if (data.models && data.models.length > 0) {
      console.log('\n📦 Installed Models:');
      data.models.forEach(model => {
        const sizeGB = (model.size / 1024 / 1024 / 1024).toFixed(2);
        console.log(`   - ${model.name} (${sizeGB} GB)`);
      });
      
      const hasLlava = data.models.some(m => m.name.includes('llava'));
      if (hasLlava) {
        console.log('\n✅ LLaVA model is installed and ready!');
        console.log('\n🚀 You can now process videos with:');
        console.log('   export LLM_VISION_PROVIDER=ollama');
        console.log('   export LLM_VISION_API_KEY=dummy');
        console.log('   export LLM_VISION_API_URL=http://localhost:11434/v1/chat/completions');
        console.log('   export LLM_VISION_MODEL=llava');
        console.log('   node process-detections-llm.js test-video-results.json\n');
      } else {
        console.log('\n⚠️  LLaVA model not found');
        console.log('   Download with: ollama pull llava');
        console.log('   (This will download ~4GB, takes a few minutes)\n');
      }
    } else {
      console.log('\n⚠️  No models installed');
      console.log('   Download LLaVA with: ollama pull llava\n');
    }
  } catch (error) {
    console.log('⚠️  Ollama server is not running');
    console.log('   Start with: ollama serve');
    console.log('   (Keep this running in a terminal)\n');
  }

  // Check model directory size
  const modelDir = path.join(process.env.HOME, '.ollama/models');
  if (fs.existsSync(modelDir)) {
    try {
      const files = fs.readdirSync(modelDir);
      if (files.length > 0) {
        console.log('📁 Model Directory:');
        files.forEach(file => {
          const filePath = path.join(modelDir, file);
          const stats = fs.statSync(filePath);
          const sizeGB = (stats.size / 1024 / 1024 / 1024).toFixed(2);
          console.log(`   ${file}: ${sizeGB} GB`);
        });
      }
    } catch (error) {
      // Ignore errors
    }
  }

  // Check if download is in progress
  try {
    const processes = execSync('ps aux | grep "ollama pull" | grep -v grep', { encoding: 'utf8' });
    if (processes) {
      console.log('\n⏳ Model download is in progress...');
      console.log('   Wait for it to complete\n');
    }
  } catch (error) {
    // No download process found
  }
}

// Run check
checkOllamaStatus();
