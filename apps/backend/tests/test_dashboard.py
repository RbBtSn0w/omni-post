#!/usr/bin/env python3
import pytest
from unittest.mock import patch, MagicMock, call, AsyncMock
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
    @patch('src.services.cookie_service.DefaultCookieService.check_cookie', new_callable=AsyncMock)
    @patch('src.db.db_manager')
    def test_get_dashboard_stats_normal(self, mock_db_manager, mock_check_cookie, mock_sqlite_connect):
        """测试正常情况下获取仪表盘统计数据"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和游标
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟user_info表数据
        mock_user_rows = [
            # id, type, file_path, name, status
            (1, 1, 'xhs_cookie.json', '小红书账号1', 1),
            (2, 2, 'tencent_cookie.json', '视频号账号1', 1),
            (3, 3, 'douyin_cookie.json', '抖音账号1', 1),  # 初始状态1（正常），但check_cookie返回异常，所以会被更新为0
            (4, 4, 'ks_cookie.json', '快手账号1', 1)
        ]

        # 模拟fetchall返回值
        mock_cursor.fetchall.side_effect = [
            mock_user_rows,  # 第一次调用获取user_info表数据
            [{'type': 1, 'count': 1}, {'type': 2, 'count': 1}, {'type': 3, 'count': 1}, {'type': 4, 'count': 1}]  # 第二次调用获取平台统计
        ]

        # 模拟check_cookie返回值（第1、2、4个账号正常，第3个异常）
        mock_check_cookie.side_effect = [True, True, False, True]

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getDashboardStats')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200
            assert data['msg'] == '获取数据成功'

            # 验证数据库操作
            mock_sqlite_connect.assert_called_once()
            mock_cursor.execute.assert_any_call('SELECT * FROM user_info')
            mock_cursor.execute.assert_any_call('SELECT type, COUNT(*) as count FROM user_info GROUP BY type')

            # 验证账号状态更新
            expected_updates = [
                call('UPDATE user_info SET status = ? WHERE id = ?', (0, 3))  # 第3个账号状态需要从1更新为0
            ]

            # 过滤出UPDATE语句的调用
            update_calls = [call for call in mock_cursor.execute.call_args_list if call[0][0].startswith('UPDATE')]
            assert len(update_calls) == 1
            assert update_calls[0] in expected_updates

            # 验证check_cookie调用
            assert mock_check_cookie.call_count == 4

            # 验证返回数据结构
            dashboard_data = data['data']
            assert 'accountStats' in dashboard_data
            assert 'platformStats' in dashboard_data
            assert 'taskStats' in dashboard_data
            assert 'contentStats' in dashboard_data
            assert 'taskTrend' in dashboard_data
            assert 'contentStatsData' in dashboard_data
            assert 'recentTasks' in dashboard_data

            # 验证账号统计数据
            assert dashboard_data['accountStats']['total'] == 4
            assert dashboard_data['accountStats']['normal'] == 3
            assert dashboard_data['accountStats']['abnormal'] == 1

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
    @patch('src.services.cookie_service.DefaultCookieService.check_cookie', new_callable=AsyncMock)
    @patch('src.db.db_manager')
    def test_get_dashboard_stats_no_accounts(self, mock_db_manager, mock_check_cookie, mock_sqlite_connect):
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
            [],  # 第一次调用获取user_info表数据（空）
            []   # 第二次调用获取平台统计（空）
        ]

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

            # 验证最近任务列表（应该有一个示例任务）
            assert len(dashboard_data['recentTasks']) == 1
            assert dashboard_data['recentTasks'][0]['title'] == '示例任务'

    @patch('sqlite3.connect')
    @patch('src.services.cookie_service.DefaultCookieService.check_cookie', new_callable=AsyncMock)
    @patch('src.db.db_manager')
    def test_get_dashboard_stats_all_abnormal(self, mock_db_manager, mock_check_cookie, mock_sqlite_connect):
        """测试所有账号都异常的情况"""
        # 配置模拟返回值
        mock_db_manager.get_db_path.return_value = 'mock_db_path'

        # 模拟数据库连接和游标
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_sqlite_connect.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # 模拟user_info表数据（2个账号，初始状态都是正常）
        mock_user_rows = [
            (1, 1, 'xhs_cookie.json', '小红书账号1', 1),
            (2, 2, 'tencent_cookie.json', '视频号账号1', 1)
        ]

        # 模拟fetchall返回值
        mock_cursor.fetchall.side_effect = [
            mock_user_rows,
            [{'type': 1, 'count': 1}, {'type': 2, 'count': 1}]
        ]

        # 模拟check_cookie返回值（所有账号都异常）
        mock_check_cookie.return_value = False

        # 使用Flask测试客户端执行测试
        with self.app.test_client() as client:
            response = client.get('/getDashboardStats')

            # 断言结果
            assert response.status_code == 200
            data = response.get_json()
            assert data['code'] == 200

            # 验证账号统计数据
            dashboard_data = data['data']
            assert dashboard_data['accountStats']['total'] == 2
            assert dashboard_data['accountStats']['normal'] == 0
            assert dashboard_data['accountStats']['abnormal'] == 2

            # 验证账号状态更新（应该有2次UPDATE操作）
            update_calls = [call for call in mock_cursor.execute.call_args_list if call[0][0].startswith('UPDATE')]
            assert len(update_calls) == 2
