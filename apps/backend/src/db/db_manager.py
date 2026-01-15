#!/usr/bin/env python3
import os
import sys
from pathlib import Path

from src.core.config import DATA_DIR

class DatabaseManager:
    """
    数据库文件路径管理类
    统一管理数据库文件的路径，确保所有数据库操作都使用正确的路径
    """

    def __init__(self):
        # 数据库目录路径
        self.data_dir = DATA_DIR
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

# 创建全局实例
db_manager = DatabaseManager()
