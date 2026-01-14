"""
数据库迁移脚本：添加 Cookie 时间管理字段
运行方式：python -m src.db.migration_add_cookie_time
"""
import sqlite3
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.db.db_manager import db_manager


def migrate():
    """执行数据库迁移：添加 Cookie 时间管理字段"""
    db_path = db_manager.get_db_path()
    print(f"📌 数据库路径: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 检查 user_info 表当前列
        cursor.execute("PRAGMA table_info(user_info)")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"ℹ️ 当前 user_info 表列: {columns}")

        # 1. 添加 created_at 列
        if 'created_at' not in columns:
            print("🔄 添加 created_at 列...")
            # SQLite 不支持在 ALTER TABLE 中使用非常量默认值
            # 所以先添加列，再更新值
            cursor.execute('''
                ALTER TABLE user_info
                ADD COLUMN created_at DATETIME
            ''')
            # 为现有记录设置创建时间为当前时间
            cursor.execute('''
                UPDATE user_info SET created_at = CURRENT_TIMESTAMP
                WHERE created_at IS NULL
            ''')
            print("✅ created_at 列添加成功")
        else:
            print("ℹ️ created_at 列已存在，跳过")

        # 2. 添加 last_validated_at 列
        if 'last_validated_at' not in columns:
            print("🔄 添加 last_validated_at 列...")
            cursor.execute('''
                ALTER TABLE user_info
                ADD COLUMN last_validated_at DATETIME
            ''')
            # 为状态正常的账号设置最后验证时间为当前时间
            cursor.execute('''
                UPDATE user_info SET last_validated_at = CURRENT_TIMESTAMP
                WHERE status = 1
            ''')
            print("✅ last_validated_at 列添加成功")
        else:
            print("ℹ️ last_validated_at 列已存在，跳过")

        conn.commit()
        print("✅ 数据迁移完成")

        # 3. 显示迁移结果
        cursor.execute("PRAGMA table_info(user_info)")
        new_columns = [col[1] for col in cursor.fetchall()]
        print(f"\n📊 迁移后 user_info 表列: {new_columns}")

        cursor.execute('SELECT COUNT(*) FROM user_info WHERE created_at IS NOT NULL')
        created_count = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM user_info WHERE last_validated_at IS NOT NULL')
        validated_count = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM user_info')
        total_count = cursor.fetchone()[0]

        print(f"\n📊 迁移统计:")
        print(f"   已设置 created_at: {created_count}/{total_count}")
        print(f"   已设置 last_validated_at: {validated_count}/{total_count}")

    except Exception as e:
        conn.rollback()
        print(f"❌ 迁移失败: {e}")
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    migrate()
