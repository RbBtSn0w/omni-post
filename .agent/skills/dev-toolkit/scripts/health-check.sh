#!/bin/bash
# Checks OmniPost environment health
set -e

echo "🔍 Checking OmniPost Environment..."

# 1. Check Node.js & NPM
echo -n "📦 Node.js: "
node -v || echo "❌ Missing"
echo -n "📦 NPM: "
npm -v || echo "❌ Missing"

# 2. Check Python
echo -n "🐍 Python: "
python3 --version || echo "❌ Missing"

# 3. Check Ports
echo "🔌 Port Availability:"
if lsof -i :5409 > /dev/null; then echo "   - Backend (5409): 🔴 Model Occupied"; else echo "   - Backend (5409): 🟢 Free"; fi
if lsof -i :5173 > /dev/null; then echo "   - Frontend (5173): 🔴 Model Occupied"; else echo "   - Frontend (5173): 🟢 Free"; fi

# 4. Check Database
DB_PATH="apps/backend/data/database.db"
echo -n "💾 Database ($DB_PATH): "
if [ -f "$DB_PATH" ]; then
    echo "✅ Exists"
     sqlite3 "$DB_PATH" "PRAGMA integrity_check;" || echo "❌ Corrupt"
else
    echo "❌ Missing (Run 'npm run db:init -w apps/backend')"
fi

echo "✅ Health Check Complete"
