"""
数据库迁移脚本：添加账号组功能
运行方式：python -m src.db.migration_add_groups
"""
import sqlite3
import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.db.db_manager import db_manager

def migrate():
    """执行数据库迁移"""
    db_path = db_manager.get_db_path()
    print(f"📌 数据库路径: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. 创建账号组表
        print("🔄 创建 account_groups 表...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS account_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✅ account_groups 表创建成功")

        # 2. 检查 user_info 表是否已有 group_id 列
        cursor.execute("PRAGMA table_info(user_info)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'group_id' not in columns:
            print("🔄 添加 group_id 列到 user_info 表...")
            cursor.execute('ALTER TABLE user_info ADD COLUMN group_id INTEGER')
            print("✅ group_id 列添加成功")
        else:
            print("ℹ️ group_id 列已存在，跳过")

        # 3. 为现有账号创建默认组（基于 userName 分组）
        print("🔄 迁移现有数据...")

        # 获取所有唯一的 userName
        cursor.execute('SELECT DISTINCT userName FROM user_info')
        user_names = cursor.fetchall()

        for (user_name,) in user_names:
            if not user_name:
                continue

            # 检查是否已存在该组
            cursor.execute('SELECT id FROM account_groups WHERE name = ?', (user_name,))
            existing = cursor.fetchone()

            if existing:
                group_id = existing[0]
            else:
                # 创建新组
                cursor.execute('''
                    INSERT INTO account_groups (name, description)
                    VALUES (?, ?)
                ''', (user_name, f'由 {user_name} 自动迁移创建'))
                group_id = cursor.lastrowid
                print(f"  + 创建组: {user_name} (ID: {group_id})")

            # 更新账号的 group_id
            cursor.execute('''
                UPDATE user_info SET group_id = ? WHERE userName = ?
            ''', (group_id, user_name))

        conn.commit()
        print("✅ 数据迁移完成")

        # 4. 显示迁移结果
        cursor.execute('SELECT COUNT(*) FROM account_groups')
        group_count = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM user_info WHERE group_id IS NOT NULL')
        migrated_count = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM user_info')
        total_count = cursor.fetchone()[0]

        print(f"\n📊 迁移统计:")
        print(f"   账号组数量: {group_count}")
        print(f"   已关联账号: {migrated_count}/{total_count}")

    except Exception as e:
        conn.rollback()
        print(f"❌ 迁移失败: {e}")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
