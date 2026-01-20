import json
import os
import sqlite3
import sys
from pathlib import Path

# 导入数据库管理器
from .db_manager import db_manager

# 从数据库管理器获取数据库文件路径
db_file = db_manager.get_db_path()

# 连接到SQLite数据库（如果文件不存在则会自动创建）
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# 创建账号组表
cursor.execute("""
CREATE TABLE IF NOT EXISTS account_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,        -- 组名称（唯一）
    description TEXT,                  -- 组描述
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

# 创建账号记录表
cursor.execute("""
CREATE TABLE IF NOT EXISTS user_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type INTEGER NOT NULL,
    filePath TEXT NOT NULL,  -- 存储文件路径
    userName TEXT NOT NULL,
    status INTEGER DEFAULT 0,
    group_id INTEGER,        -- 关联账号组
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_validated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, userName),  -- 确保每个平台每个用户名只有一条记录
    FOREIGN KEY (group_id) REFERENCES account_groups(id)
)
""")

# 创建文件记录表
cursor.execute("""CREATE TABLE IF NOT EXISTS file_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- 唯一标识每条记录
    filename TEXT NOT NULL,               -- 文件名
    filesize REAL,                     -- 文件大小（单位：MB）
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 上传时间，默认当前时间
    file_path TEXT                        -- 文件路径
)""")

# 创建 tasks 表（原迁移逻辑合并进来）
cursor.execute("""
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
""")

# 提交更改
conn.commit()
print("✅ 表创建成功")
# 关闭连接
conn.close()
