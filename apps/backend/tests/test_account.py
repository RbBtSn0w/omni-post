#!/usr/bin/env python3
import os
import sys
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from flask import Flask

from src.routes.account import bp as account_bp
from src.db.db_manager import db_manager

class TestAccount:
    """测试账号相关功能"""

    def setup_method(self):
        """测试方法设置，创建Flask测试应用并注册蓝图"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        # 注册account蓝图
        self.app.register_blueprint(account_bp)

    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_getAccounts_success(self, mock_sqlite_connect, mock_db_manager):
        """测试成功获取所有账号信息"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟查询结果
        mock_rows = [
            (1, 1, 'xhs_cookie.json', '小红书账号1', 1),
            (2, 2, 'tencent_cookie.json', '视频号账号1', 1)
        ]
        mock_cursor.fetchall.return_value = mock_rows

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getAccounts')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200
            assert data['msg'] is None
            assert len(data['data']) >= 0

        # 验证数据库操作
        mock_cursor.execute.assert_called_once_with('''
            SELECT * FROM user_info''')

    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_getAccounts_failure(self, mock_sqlite_connect, mock_db_manager):
        """测试获取账号信息失败的情况"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接异常
        mock_sqlite_connect.side_effect = Exception('Database connection error')

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getAccounts')

            # 断言结果
            assert response.status_code == 500
            data = response.get_json()
            assert data['code'] == 500
            assert '获取账号列表失败' in data['msg']
            assert data['data'] is None

    @patch('src.services.cookie_service.DefaultCookieService.check_cookie', new_callable=AsyncMock)
    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_getValidAccounts_all(self, mock_sqlite_connect, mock_db_manager, mock_check_cookie):
        """测试获取所有有效账号"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟查询结果 - 现在 SELECT 返回 8 列: id, type, filePath, userName, status, group_id, created_at, last_validated_at
        mock_rows = [
            (1, 1, 'xhs_cookie.json', '小红书账号1', 0, None, '2026-01-12 00:00:00', None),
            (2, 2, 'tencent_cookie.json', '视频号账号1', 1, None, '2026-01-12 00:00:00', None)
        ]
        mock_cursor.fetchall.return_value = mock_rows

        # 模拟check_cookie返回值（两个账号都有效）
        mock_check_cookie.return_value = True

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getValidAccounts')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200
            assert data['msg'] is None
            assert len(data['data']) >= 0

    @patch('src.services.cookie_service.DefaultCookieService.check_cookie', new_callable=AsyncMock)
    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_getValidAccounts_single(self, mock_sqlite_connect, mock_db_manager, mock_check_cookie):
        """测试获取单个有效账号"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟查询结果 - 现在 SELECT 返回 8 列
        mock_rows = [(1, 1, 'xhs_cookie.json', '小红书账号1', 0, None, '2026-01-12 00:00:00', None)]
        mock_cursor.fetchall.return_value = mock_rows

        # 模拟check_cookie返回值（账号有效）
        mock_check_cookie.return_value = True

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getValidAccounts?id=1')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200
            assert len(data['data']) >= 0

    @patch('src.services.cookie_service.DefaultCookieService.check_cookie', new_callable=AsyncMock)
    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_getAccountStatus_success(self, mock_sqlite_connect, mock_db_manager, mock_check_cookie):
        """测试成功获取单个账号状态"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟查询结果
        mock_row = (1, 1, 'xhs_cookie.json', '小红书账号1', 0)
        mock_cursor.fetchone.return_value = mock_row

        # 模拟check_cookie返回值（账号有效）
        mock_check_cookie.return_value = True

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getAccountStatus?id=1')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200

    @patch('src.services.cookie_service.DefaultCookieService.check_cookie', new_callable=AsyncMock)
    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_getAccountStatus_invalid(self, mock_sqlite_connect, mock_db_manager, mock_check_cookie):
        """测试获取无效账号状态"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟查询结果
        mock_row = (1, 1, 'xhs_cookie.json', '小红书账号1', 1)
        mock_cursor.fetchone.return_value = mock_row

        # 模拟check_cookie返回值（账号无效）
        mock_check_cookie.return_value = False

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getAccountStatus?id=1')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200

    def test_getAccountStatus_missing_id(self):
        """测试获取账号状态时缺少id参数"""
        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getAccountStatus')

            # 断言结果
            assert response.status_code == 400
            data = response.get_json()
            assert data['code'] == 400
            assert data['msg'] == '缺少账号ID参数'

    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_getAccountStatus_not_found(self, mock_sqlite_connect, mock_db_manager):
        """测试获取不存在的账号状态"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟查询结果（账号不存在）
        mock_cursor.fetchone.return_value = None

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getAccountStatus?id=999')

            # 断言结果
            assert response.status_code == 404
            data = response.get_json()
            assert data['code'] == 404
            assert data['msg'] == '账号不存在'

    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_delete_account_success(self, mock_sqlite_connect, mock_db_manager):
        """测试成功删除账号"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟查询结果（账号存在）
        mock_record = MagicMock()
        mock_cursor.fetchone.return_value = mock_record

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/deleteAccount?id=1')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200
            assert data['msg'] == 'account deleted successfully'

    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_delete_account_not_found(self, mock_sqlite_connect, mock_db_manager):
        """测试删除不存在的账号"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟查询结果（账号不存在）
        mock_cursor.fetchone.return_value = None

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/deleteAccount?id=999')

            # 断言结果
            assert response.status_code == 404
            data = response.get_json()
            assert data['code'] == 404
            assert data['msg'] == 'account not found'

    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_updateUserinfo_success(self, mock_sqlite_connect, mock_db_manager):
        """测试成功更新账号信息"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.post('/updateUserinfo', json={
                'id': 1,
                'type': 'xhs',
                'userName': '更新后的小红书账号'
            })

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200
            assert data['msg'] == 'account update successfully'

    @patch('src.db.db_manager')
    @patch('sqlite3.connect')
    def test_updateUserinfo_failure(self, mock_sqlite_connect, mock_db_manager):
        """测试更新账号信息失败"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和查询
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟数据库操作失败
        mock_cursor.execute.side_effect = Exception('Database error')

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.post('/updateUserinfo', json={
                'id': 1,
                'type': 'xhs',
                'userName': '更新后的小红书账号'
            })

            # 断言结果
            assert response.status_code == 500
            data = response.get_json()
            assert data['code'] == 500
            assert data['msg'] == 'update failed!'
