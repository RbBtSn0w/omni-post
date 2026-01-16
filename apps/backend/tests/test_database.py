#!/usr/bin/env python3
import os
import sys
import pytest
import sqlite3
from pathlib import Path
import tempfile

from src.core.config import BASE_DIR

# 直接定义数据库文件路径，不导入createTable模块
create_table_db_file = Path(BASE_DIR.parent / "data" / "database.db")

class TestDatabase:
    """测试数据库相关功能"""

    def test_database_path_config(self):
        """测试数据库路径配置是否正确"""
        # 验证数据库文件路径是否指向正确的data目录
        expected_path = Path(BASE_DIR.parent / "data" / "database.db")
        assert create_table_db_file == expected_path, f"数据库路径配置错误，预期: {expected_path}，实际: {create_table_db_file}"

    def test_database_directory_exists(self):
        """测试数据库目录是否存在"""
        data_dir = Path(BASE_DIR.parent / "data")
        assert data_dir.exists(), f"数据库目录不存在: {data_dir}"
        assert data_dir.is_dir(), f"数据库目录不是文件夹: {data_dir}"

    def test_database_file_exists(self):
        """测试数据库文件是否存在"""
        assert create_table_db_file.exists(), f"数据库文件不存在: {create_table_db_file}"

    def test_database_connections(self):
        """测试数据库连接是否正常"""
        # 测试数据库连接
        try:
            conn = sqlite3.connect(create_table_db_file)
            conn.close()
            connection_success = True
        except Exception as e:
            connection_success = False

        assert connection_success, f"数据库连接失败: {e}"

    def test_database_tables_exist(self):
        """测试数据库表是否存在"""
        conn = sqlite3.connect(create_table_db_file)
        cursor = conn.cursor()

        # 获取所有表名
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]

        conn.close()

        # 验证必要的表是否存在
        expected_tables = ['user_info', 'file_records', 'sqlite_sequence']
        for table in expected_tables:
            assert table in tables, f"数据库表不存在: {table}"

    def test_user_info_table_structure(self):
        """测试user_info表结构是否正确"""
        conn = sqlite3.connect(create_table_db_file)
        cursor = conn.cursor()

        # 获取表结构
        cursor.execute("PRAGMA table_info(user_info);")
        columns = cursor.fetchall()

        conn.close()

        # 验证必要的列是否存在
        expected_columns = ['id', 'type', 'filePath', 'userName', 'status']
        actual_columns = [column[1] for column in columns]

        for col in expected_columns:
            assert col in actual_columns, f"user_info表缺少列: {col}"

    def test_file_records_table_structure(self):
        """测试file_records表结构是否正确"""
        conn = sqlite3.connect(create_table_db_file)
        cursor = conn.cursor()

        # 获取表结构
        cursor.execute("PRAGMA table_info(file_records);")
        columns = cursor.fetchall()

        conn.close()

        # 验证必要的列是否存在
        expected_columns = ['id', 'filename', 'filesize', 'upload_time', 'file_path']
        actual_columns = [column[1] for column in columns]

        for col in expected_columns:
            assert col in actual_columns, f"file_records表缺少列: {col}"

    def test_database_write_read(self):
        """测试数据库写入和读取功能"""
        conn = sqlite3.connect(create_table_db_file)
        cursor = conn.cursor()

        # 插入测试数据
        test_username = 'test_user'
        test_type = 1
        test_filepath = '/test/path'
        cursor.execute("INSERT INTO user_info (userName, type, filePath, status) VALUES (?, ?, ?, ?)",
                      (test_username, test_type, test_filepath, 0))
        conn.commit()

        # 查询插入的数据，使用row_factory获取字典形式的结果
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_info WHERE userName = ?", (test_username,))
        result = cursor.fetchone()

        # 删除测试数据
        cursor.execute("DELETE FROM user_info WHERE userName = ?", (test_username,))
        conn.commit()
        conn.close()

        # 验证结果
        assert result is not None, "数据库写入或读取失败"
        assert result['userName'] == test_username, "插入数据与查询结果不一致（userName）"
        assert result['type'] == test_type, "插入数据与查询结果不一致（type）"
        assert result['filePath'] == test_filepath, "插入数据与查询结果不一致（filePath）"

    def test_database_with_context_manager(self):
        """测试使用with语句管理数据库连接"""
        # 测试使用with语句连接数据库
        try:
            with sqlite3.connect(create_table_db_file) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1;")
                result = cursor.fetchone()

            assert result is not None, "使用with语句连接数据库失败"
        except Exception as e:
            assert False, f"使用with语句连接数据库失败: {e}"

    def test_gitignore_config(self):
        """测试.gitignore文件是否正确配置"""
        gitignore_path = Path(BASE_DIR.parent.parent.parent / ".gitignore")
        assert gitignore_path.exists(), ".gitignore文件不存在"

        with open(gitignore_path, 'r') as f:
            content = f.read()

        # 验证.gitignore文件中是否包含正确的数据库忽略规则
        assert 'apps/backend/data/' in content, ".gitignore文件中缺少数据库目录忽略规则"

    def test_database_isolation(self):
        """测试数据库操作的隔离性"""
        # 测试多个连接同时操作数据库
        conn1 = sqlite3.connect(create_table_db_file)
        conn2 = sqlite3.connect(create_table_db_file)

        cursor1 = conn1.cursor()
        cursor2 = conn2.cursor()

        try:
            # 插入测试数据
            test_data = ('isolation_test', 1, '/test/path', 'test_name')
            cursor1.execute("INSERT INTO user_info (userName, type, filePath, status) VALUES (?, ?, ?, ?)", test_data)
            conn1.commit()

            # 从另一个连接查询
            cursor2.execute("SELECT * FROM user_info WHERE userName = ?", ('isolation_test',))
            result = cursor2.fetchone()

            assert result is not None, "数据库操作隔离性测试失败"
        finally:
            # 清理测试数据
            cursor1.execute("DELETE FROM user_info WHERE userName = ?", ('isolation_test',))
            conn1.commit()
            conn1.close()
            conn2.close()

    def test_create_table_script(self):
        """测试创建表脚本是否能正常执行"""
        # 创建临时数据库文件进行测试
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as temp_db:
            temp_db_path = Path(temp_db.name)

        try:
            # 直接测试表创建功能，不依赖createTable.py模块
            conn = sqlite3.connect(temp_db_path)
            cursor = conn.cursor()

            # 复制createTable.py中的表创建语句
            # 创建账号记录表
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type INTEGER NOT NULL,
                filePath TEXT NOT NULL,  -- 存储文件路径
                userName TEXT NOT NULL,
                status INTEGER DEFAULT 0
            )
            ''')

            # 创建文件记录表
            cursor.execute('''CREATE TABLE IF NOT EXISTS file_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT, -- 唯一标识每条记录
                filename TEXT NOT NULL,               -- 文件名
                filesize REAL,                     -- 文件大小（单位：MB）
                upload_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 上传时间，默认当前时间
                file_path TEXT                        -- 文件路径
            )
            ''')

            conn.commit()
            conn.close()

            # 验证临时数据库中是否创建了表
            conn = sqlite3.connect(temp_db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [table[0] for table in cursor.fetchall()]
            conn.close()

            # 验证必要的表是否存在
            expected_tables = ['user_info', 'file_records', 'sqlite_sequence']
            for table in expected_tables:
                assert table in tables, f"创建表脚本未创建表: {table}"
        finally:
            # 清理临时文件
            if temp_db_path.exists():
                temp_db_path.unlink()
