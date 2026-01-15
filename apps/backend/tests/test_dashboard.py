#!/usr/bin/env python3
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime
from flask import Flask

from src.routes.dashboard import bp as dashboard_bp

class TestDashboard:
    """测试仪表盘相关功能"""

    def setup_method(self):
        """测试方法设置，创建Flask测试应用并注册蓝图"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        # 注册dashboard蓝图
        self.app.register_blueprint(dashboard_bp)

    @patch('sqlite3.connect')
    @patch('src.db.db_manager')
    def test_get_dashboard_stats_normal(self, mock_db_manager, mock_sqlite_connect):
        """测试正常情况下获取仪表盘统计数据 - 使用缓存状态，不触发cookie验证"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和游标
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 创建模拟的Row对象（支持字典式访问）
        def create_mock_row(data, keys):
            row = MagicMock()
            row.__iter__ = lambda self: iter(data)
            row.__getitem__ = lambda self, key: dict(zip(keys, data))[key] if isinstance(key, str) else data[key]
            return row

        # 模拟user_info表数据（使用Row-like对象）
        user_keys = ['id', 'type', 'filePath', 'userName', 'status', 'group_id', 'created_at', 'last_validated_at']
        mock_user_rows = [
            create_mock_row((1, 1, 'xhs_cookie.json', '小红书账号1', 1, None, None, None), user_keys),
            create_mock_row((2, 2, 'tencent_cookie.json', '视频号账号1', 1, None, None, None), user_keys),
            create_mock_row((3, 3, 'douyin_cookie.json', '抖音账号1', 0, None, None, None), user_keys),  # 数据库中已标记为异常
            create_mock_row((4, 4, 'ks_cookie.json', '快手账号1', 1, None, None, None), user_keys),
        ]

        # 模拟平台统计数据
        platform_keys = ['type', 'count']
        mock_platform_rows = [
            create_mock_row((1, 1), platform_keys),
            create_mock_row((2, 1), platform_keys),
            create_mock_row((3, 1), platform_keys),
            create_mock_row((4, 1), platform_keys),
        ]

        # 模拟任务统计数据（空）
        mock_task_rows = []

        # 模拟文件统计
        mock_file_count = MagicMock()
        mock_file_count.__getitem__ = lambda self, key: 0

        # 模拟趋势数据（空）
        mock_trend_rows = []

        # 模拟最近任务（空）
        mock_recent_tasks = []

        # 模拟fetchall和fetchone返回值
        mock_cursor.fetchall.side_effect = [
            mock_user_rows,       # SELECT * FROM user_info
            mock_platform_rows,   # SELECT type, COUNT(*) ... GROUP BY type
            mock_task_rows,       # SELECT status, COUNT(*) FROM tasks GROUP BY status
            mock_trend_rows,      # SELECT date(created_at) ... FROM tasks ...
            mock_recent_tasks,    # SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5
        ]
        mock_cursor.fetchone.return_value = mock_file_count

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getDashboardStats')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200
            assert data['msg'] == '获取数据成功'

            # 验证数据库操作（不应该有UPDATE操作，因为我们不再验证cookie）
            mock_sqlite_connect.assert_called_once()
            mock_cursor.execute.assert_any_call('SELECT * FROM user_info')
            mock_cursor.execute.assert_any_call('SELECT type, COUNT(*) as count FROM user_info GROUP BY type')

            # 验证不再调用UPDATE语句（因为不验证cookie了）
            update_calls = [call for call in mock_cursor.execute.call_args_list if 'UPDATE' in str(call)]
            assert len(update_calls) == 0, "Dashboard should not update account status anymore"

            # 验证返回数据结构
            dashboard_data = data['data']
            assert 'accountStats' in dashboard_data
            assert 'platformStats' in dashboard_data
            assert 'taskStats' in dashboard_data
            assert 'contentStats' in dashboard_data
            assert 'taskTrend' in dashboard_data
            assert 'contentStatsData' in dashboard_data
            assert 'recentTasks' in dashboard_data

            # 验证账号统计数据（使用数据库缓存状态）
            assert dashboard_data['accountStats']['total'] == 4
            assert dashboard_data['accountStats']['normal'] == 3  # 数据库中status=1的账号
            assert dashboard_data['accountStats']['abnormal'] == 1  # 数据库中status=0的账号

            # 验证平台统计数据
            assert dashboard_data['platformStats']['xiaohongshu'] == 1
            assert dashboard_data['platformStats']['channels'] == 1
            assert dashboard_data['platformStats']['douyin'] == 1
            assert dashboard_data['platformStats']['kuaishou'] == 1

    @patch('sqlite3.connect')
    @patch('src.db.db_manager')
    def test_get_dashboard_stats_db_error(self, mock_db_manager, mock_sqlite_connect):
        """测试数据库连接失败的情况"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接失败
        mock_sqlite_connect.side_effect = Exception('Database connection error')

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getDashboardStats')

            # 断言结果
            assert response.status_code == 500
            data = response.get_json()
            assert data['code'] == 500
            assert '获取数据失败' in data['msg']
            assert data['data'] is None

    @patch('sqlite3.connect')
    @patch('src.db.db_manager')
    def test_get_dashboard_stats_no_accounts(self, mock_db_manager, mock_sqlite_connect):
        """测试没有账号的情况"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和游标
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟没有账号数据
        mock_cursor.fetchall.side_effect = [
            [],  # SELECT * FROM user_info (空)
            [],  # SELECT type, COUNT(*) ... GROUP BY type (空)
            [],  # SELECT status, COUNT(*) FROM tasks GROUP BY status (空)
            [],  # SELECT date(created_at) ... FROM tasks ... (空)
            [],  # SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5 (空)
        ]
        mock_file_count = MagicMock()
        mock_file_count.__getitem__ = lambda self, key: 0
        mock_cursor.fetchone.return_value = mock_file_count

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getDashboardStats')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200

            # 验证账号统计数据
            dashboard_data = data['data']
            assert dashboard_data['accountStats']['total'] == 0
            assert dashboard_data['accountStats']['normal'] == 0
            assert dashboard_data['accountStats']['abnormal'] == 0

            # 验证平台统计数据（应该都是0）
            assert all(stat == 0 for stat in dashboard_data['platformStats'].values())

            # 验证任务统计数据（应该都是0）
            assert dashboard_data['taskStats']['total'] == 0
            assert dashboard_data['taskStats']['completed'] == 0
            assert dashboard_data['taskStats']['inProgress'] == 0
            assert dashboard_data['taskStats']['failed'] == 0

            # 验证内容统计数据（应该都是0）
            assert dashboard_data['contentStats']['total'] == 0
            assert dashboard_data['contentStats']['published'] == 0
            assert dashboard_data['contentStats']['draft'] == 0

            # 验证最近任务列表（应该为空）
            assert len(dashboard_data['recentTasks']) == 0

    @patch('sqlite3.connect')
    @patch('src.db.db_manager')
    def test_get_dashboard_stats_all_abnormal(self, mock_db_manager, mock_sqlite_connect):
        """测试所有账号都异常的情况（使用数据库缓存状态）"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和游标
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 创建模拟的Row对象
        def create_mock_row(data, keys):
            row = MagicMock()
            row.__iter__ = lambda self: iter(data)
            row.__getitem__ = lambda self, key: dict(zip(keys, data))[key] if isinstance(key, str) else data[key]
            return row

        # 模拟user_info表数据（2个账号，数据库中都标记为异常）
        user_keys = ['id', 'type', 'filePath', 'userName', 'status', 'group_id', 'created_at', 'last_validated_at']
        mock_user_rows = [
            create_mock_row((1, 1, 'xhs_cookie.json', '小红书账号1', 0, None, None, None), user_keys),
            create_mock_row((2, 2, 'tencent_cookie.json', '视频号账号1', 0, None, None, None), user_keys),
        ]

        platform_keys = ['type', 'count']
        mock_platform_rows = [
            create_mock_row((1, 1), platform_keys),
            create_mock_row((2, 1), platform_keys),
        ]

        mock_cursor.fetchall.side_effect = [
            mock_user_rows,
            mock_platform_rows,
            [],  # tasks
            [],  # trend
            [],  # recent tasks
        ]
        mock_file_count = MagicMock()
        mock_file_count.__getitem__ = lambda self, key: 0
        mock_cursor.fetchone.return_value = mock_file_count

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getDashboardStats')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200

            # 验证账号统计数据（基于数据库缓存状态，不触发验证）
            dashboard_data = data['data']
            assert dashboard_data['accountStats']['total'] == 2
            assert dashboard_data['accountStats']['normal'] == 0
            assert dashboard_data['accountStats']['abnormal'] == 2

            # 验证不再进行UPDATE操作
            update_calls = [call for call in mock_cursor.execute.call_args_list if 'UPDATE' in str(call)]
            assert len(update_calls) == 0

