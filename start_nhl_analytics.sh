#!/bin/bash
# NHL Analytics - Startup Script
# This script ensures both frontend and backend servers are always running

PROJECT_DIR="/Users/emilyfehr8/CascadeProjects"
FRONTEND_DIR="$PROJECT_DIR/automated-post-game-reports/nhl-analytics"

echo "🏒 Starting NHL Analytics..."
echo "================================"

# Function to check if a process is running
is_running() {
    pgrep -f "$1" > /dev/null 2>&1
}

# Function to start backend
start_backend() {
    if is_running "api_server.py"; then
        echo "✅ Backend already running"
    else
        echo "🚀 Starting backend server..."
        cd "$PROJECT_DIR"
        nohup python3 api_server.py > backend.log 2>&1 &
        sleep 3
        if is_running "api_server.py"; then
            echo "✅ Backend started successfully"
        else
            echo "❌ Backend failed to start. Check backend.log"
            exit 1
        fi
    fi
}

# Function to start frontend
start_frontend() {
    if is_running "vite"; then
        echo "✅ Frontend already running"
    else
        echo "🚀 Starting frontend server..."
        cd "$FRONTEND_DIR"
        nohup npm run dev > frontend.log 2>&1 &
        sleep 5
        if is_running "vite"; then
            echo "✅ Frontend started successfully"
        else
            echo "❌ Frontend failed to start. Check frontend.log"
            exit 1
        fi
    fi
}

# Function to check server health
check_health() {
    echo ""
    echo "🔍 Checking server health..."
    
    # Check backend
    if curl -s http://localhost:5002/api/health > /dev/null 2>&1; then
        echo "✅ Backend API: http://localhost:5002 (healthy)"
    else
        echo "❌ Backend API: http://localhost:5002 (not responding)"
    fi
    
    # Check frontend
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend: http://localhost:5173 (healthy)"
    else
        echo "❌ Frontend: http://localhost:5173 (not responding)"
    fi
}

# Main execution
start_backend
start_frontend
check_health

echo ""
echo "================================"
echo "🎉 NHL Analytics is ready!"
echo "📊 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:5002"
echo ""
echo "To stop servers:"
echo "  pkill -f api_server.py"
echo "  pkill -f vite"
echo "================================"
