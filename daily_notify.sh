#!/bin/bash

# Daily NHL Prediction Notifier
# Sends predictions to Discord every day at 9 AM

echo "🏒 Running Daily NHL Prediction Notifier"
echo "=========================================="
echo "Time: $(date)"
echo ""

# Navigate to project directory
cd /Users/emilyfehr8/CascadeProjects

# Run the Discord notifier
python3 discord_notifier.py

echo ""
echo "=========================================="
echo "✅ Daily notification complete"
