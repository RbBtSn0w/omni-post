/**
 * Migration script: WeChat Channels rename (Tencent -> WXChannels)
 * Audits tasks table and updates legacy nomenclature in publish_data.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants from SSOT (hardcoded here to avoid complex imports in a standalone script)
const PLATFORM_WX_CHANNELS = 2;

async function runMigration() {
    const dbPath = path.resolve(__dirname, '../data/database.db');
    
    if (!fs.existsSync(dbPath)) {
        console.error(`❌ Database not found at ${dbPath}`);
        process.exit(1);
    }

    console.log(`🔍 Auditing database at: ${dbPath}`);
    const db = new Database(dbPath);

    try {
        // 1. Audit user_info (nomenclature cleanup if any text fields contain 'tencent')
        // user_info mainly uses numeric 'type', so it's mostly safe, but check filePath
        const accounts = db.prepare('SELECT id, filePath FROM user_info WHERE type = ?').all(PLATFORM_WX_CHANNELS);
        console.log(`📊 Found ${accounts.length} WXChannels accounts.`);

        // 2. Audit tasks table publish_data
        const tasks = db.prepare('SELECT id, publish_data FROM tasks').all();
        let updatedTasksCount = 0;

        for (const task of tasks) {
            if (!task.publish_data) continue;

            let data;
            try {
                data = JSON.parse(task.publish_data);
            } catch (e) {
                continue;
            }

            let modified = false;

            // Example: some old versions might have used { platform_type: 'tencent' }
            if (data.platform === 'tencent') {
                data.platform = 'wx_channels';
                modified = true;
            }

            // check platform-specific options if any (though currently mostly generic)
            if (modified) {
                db.prepare('UPDATE tasks SET publish_data = ? WHERE id = ?')
                  .run(JSON.stringify(data), task.id);
                updatedTasksCount++;
            }
        }

        console.log(`✅ Migration complete. Updated ${updatedTasksCount} tasks.`);

    } catch (error) {
        console.error(`❌ Migration failed: ${error.message}`);
    } finally {
        db.close();
    }
}

runMigration();
