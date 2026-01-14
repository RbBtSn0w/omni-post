import sqlite3
import json
from pathlib import Path
from src.db.db_manager import db_manager

def migrate():
    print("开始执行 Tasks 表迁移...")

    # 获取数据库路径
    db_file = db_manager.get_db_path()

    # 连接数据库
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    try:
        # 创建 tasks 表
        # 使用 TEXT 作为 ID (UUID)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT,
            status TEXT DEFAULT 'waiting',
            progress REAL DEFAULT 0,
            priority INTEGER DEFAULT 1,
            platforms TEXT,           -- JSON list of platform keys
            file_list TEXT,           -- JSON list of file paths
            account_list TEXT,        -- JSON list of account IDs/names
            schedule_data TEXT,       -- JSON: {enableTimer, videosPerDay, dailyTimes, startDays}
            error_msg TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        print("✅ Tasks 表创建成功")
        conn.commit()

    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
