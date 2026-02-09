#!/bin/bash
# Quick database inspection
DB_PATH="apps/backend/data/database.db"

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at $DB_PATH"
    exit 1
fi

echo "📊 Database Stats:"
echo "--- Tasks by Status ---"
sqlite3 "$DB_PATH" "SELECT status, COUNT(*) FROM tasks GROUP BY status;"

echo "--- Recent Failed Tasks ---"
sqlite3 "$DB_PATH" "SELECT id, title, error_msg FROM tasks WHERE status='failed' ORDER BY created_at DESC LIMIT 5;"
