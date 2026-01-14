#!/bin/bash

# Process video via API endpoint using curl
# Usage: ./process-video-curl.sh <video_path> [server_url]

VIDEO_PATH="${1:-/Users/emilyfehr8/Desktop/6-2-20 Clip 0011 from Body Cam 0009_6-2-20.mp4}"
SERVER_URL="${2:-http://localhost:3001}"

echo ""
echo "🎥 Processing Video via API..."
echo ""
echo "Video: $VIDEO_PATH"
echo "Server: $SERVER_URL"
echo ""

# Check if video exists
if [ ! -f "$VIDEO_PATH" ]; then
    echo "❌ Error: Video file not found: $VIDEO_PATH"
    exit 1
fi

# Check if server is running
if ! curl -s "$SERVER_URL/health" > /dev/null; then
    echo "❌ Error: Bridge server is not running at $SERVER_URL"
    echo "   Start it with: cd vantus/bridge-server && npm start"
    exit 1
fi

echo "📤 Uploading video to server..."
echo ""

# Process video
RESPONSE=$(curl -X POST "$SERVER_URL/api/video/process" \
    -F "video=@$VIDEO_PATH" \
    -F "interval=1" \
    -F "officerName=OFFICER_TEST" \
    -w "\n%{http_code}" \
    -s)

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Error: Server returned HTTP $HTTP_CODE"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    exit 1
fi

# Parse and display results
echo "✅ Video Processing Complete!"
echo ""
echo "📊 Results:"
echo "$BODY" | jq -r '
  "  Total Frames: " + (.summary.totalFrames | tostring),
  "  Video Duration: " + (.metadata.duration | tostring | .[0:5]) + " seconds",
  "  Resolution: " + (.metadata.width | tostring) + "x" + (.metadata.height | tostring),
  "  Frame Interval: " + (.summary.interval | tostring) + " second(s)",
  "  Frames Extracted: " + (.frames | length | tostring)
' 2>/dev/null || echo "  (Install jq for formatted output: brew install jq)"

echo ""
echo "📸 Frame Count: $(echo "$BODY" | grep -o '"frames":\[' | wc -l | xargs) frames extracted"
echo ""

# Save results to file
OUTPUT_FILE="video-processing-results-$(date +%s).json"
echo "$BODY" > "$OUTPUT_FILE"
echo "💾 Full results saved to: $OUTPUT_FILE"
echo ""
