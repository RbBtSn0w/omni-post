#!/bin/bash
# Analyze backend logs for errors
LOG_FILE="apps/backend/data/logs/app.log"
LINES=${1:-100}

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    exit 1
fi

echo "🔍 Analyzing last $LINES lines of $LOG_FILE..."

echo "--- 🚨 Errors ---"
grep "ERROR" "$LOG_FILE" | tail -n "$LINES" || echo "No recent errors found."

echo "--- ⚠️ Warnings ---"
grep "WARNING" "$LOG_FILE" | tail -n "$LINES" || echo "No recent warnings found."

echo "--- 📝 Latest Activity ---"
tail -n 10 "$LOG_FILE"
