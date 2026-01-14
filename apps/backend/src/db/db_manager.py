#!/usr/bin/env python3
import os
import sys
from pathlib import Path

from src.conf import BASE_DIR

class DatabaseManager:
    """
    数据库文件路径管理类
    统一管理数据库文件的路径，确保所有数据库操作都使用正确的路径
    """

    def __init__(self):
        # 数据库目录路径
        self.data_dir = Path(BASE_DIR.parent / "data")
        # 数据库文件路径
        self.db_file = self.data_dir / "database.db"

        # 初始化检查
        self._initialize()

    def _initialize(self):
        """
        初始化数据库管理
        检查并创建必要的目录
        """
        # 确保data目录存在
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def get_db_path(self):
        """
        获取数据库文件的绝对路径

        Returns:
            Path: 数据库文件的绝对路径
        """
        return self.db_file

    def get_data_dir(self):
        """
        获取数据目录的绝对路径

        Returns:
            Path: 数据目录的绝对路径
        """
        return self.data_dir

    def validate_path(self):
        """
        验证数据库路径是否符合规范

        Returns:
            tuple: (bool, str) - 验证结果和错误信息
        """
        # 检查数据库文件是否位于data目录下
        if not str(self.db_file).startswith(str(self.data_dir)):
            return False, f"数据库文件路径不符合规范，应位于 {self.data_dir} 目录下"

        # 检查路径是否为绝对路径
        if not self.db_file.is_absolute():
            return False, "数据库文件路径必须是绝对路径"

        return True, "路径验证通过"

    def ensure_db_exists(self):
        """
        确保数据库文件存在
        如果不存在，会创建一个空的数据库文件

        Returns:
            bool: 是否成功确保数据库文件存在
        """
        try:
            # 只是创建连接，不做其他操作
            import sqlite3
            with sqlite3.connect(self.db_file):
                pass
            return True
        except Exception as e:
            print(f"创建数据库文件失败: {e}")
            return False

    def clean_old_db(self):
        """
        清理旧的数据库文件
        删除位于错误位置的数据库文件
        """
        # 旧的数据库文件路径
        old_db_paths = [
            Path(BASE_DIR / "db" / "database.db"),
            Path(BASE_DIR.parent / "src" / "db" / "database.db"),
            self.data_dir / "db.sqlite3"
        ]

        for old_db in old_db_paths:
            if old_db.exists() and old_db != self.db_file:
                try:
                    old_db.unlink()
                    print(f"✅ 已删除旧的数据库文件: {old_db}")
                except Exception as e:
                    print(f"⚠️ 删除旧数据库文件失败: {old_db}, 错误: {e}")

# 创建全局实例
db_manager = DatabaseManager()
