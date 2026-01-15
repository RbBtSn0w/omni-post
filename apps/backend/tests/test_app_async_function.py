#!/usr/bin/env python3
"""测试 app.py 中的 run_async_function 异步包装函数"""
import pytest
from unittest.mock import patch, AsyncMock
from queue import Queue


class TestRunAsyncFunction:
    """测试 run_async_function 异步包装函数的所有分支"""

    @patch('src.services.login_service.DefaultLoginService')
    def test_run_async_function_type_1_xiaohongshu(self, MockService):
        """测试小红书登录分支 (type='1')"""
        from src.services.login_service import run_async_function
        mock_instance = MockService.return_value
        mock_instance.xiaohongshu_cookie_gen = AsyncMock()

        status_queue = Queue()
        run_async_function('1', 'test_id', status_queue, 'test_group')

        mock_instance.xiaohongshu_cookie_gen.assert_called_once_with(
            'test_id', status_queue, 'test_group'
        )

    @patch('src.services.login_service.DefaultLoginService')
    def test_run_async_function_type_2_tencent(self, MockService):
        """测试腾讯登录分支 (type='2')"""
        from src.services.login_service import run_async_function
        mock_instance = MockService.return_value
        mock_instance.get_tencent_cookie = AsyncMock()

        status_queue = Queue()
        run_async_function('2', 'test_id', status_queue)

        mock_instance.get_tencent_cookie.assert_called_once()

    @patch('src.services.login_service.DefaultLoginService')
    def test_run_async_function_type_3_douyin(self, MockService):
        """测试抖音登录分支 (type='3')"""
        from src.services.login_service import run_async_function
        mock_instance = MockService.return_value
        mock_instance.douyin_cookie_gen = AsyncMock()

        status_queue = Queue()
        run_async_function('3', 'test_id', status_queue, 'group_name')

        mock_instance.douyin_cookie_gen.assert_called_once()

    @patch('src.services.login_service.DefaultLoginService')
    def test_run_async_function_type_4_kuaishou(self, MockService):
        """测试快手登录分支 (type='4')"""
        from src.services.login_service import run_async_function
        mock_instance = MockService.return_value
        mock_instance.get_ks_cookie = AsyncMock()

        status_queue = Queue()
        run_async_function('4', 'test_id', status_queue)

        mock_instance.get_ks_cookie.assert_called_once()

    @patch('src.services.login_service.DefaultLoginService')
    def test_run_async_function_unknown_type(self, MockService):
        """测试未知类型不会调用任何登录方法"""
        from src.services.login_service import run_async_function
        mock_instance = MockService.return_value
        mock_instance.xiaohongshu_cookie_gen = AsyncMock()
        mock_instance.get_tencent_cookie = AsyncMock()
        mock_instance.douyin_cookie_gen = AsyncMock()
        mock_instance.get_ks_cookie = AsyncMock()

        status_queue = Queue()
        # 未知类型应该不触发任何调用
        run_async_function('99', 'test_id', status_queue)

        mock_instance.xiaohongshu_cookie_gen.assert_not_called()
        mock_instance.get_tencent_cookie.assert_not_called()
        mock_instance.douyin_cookie_gen.assert_not_called()
        mock_instance.get_ks_cookie.assert_not_called()
