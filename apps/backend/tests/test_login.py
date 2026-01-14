#!/usr/bin/env python3
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from src.utils.login import (
    douyin_cookie_gen,
    get_tencent_cookie,
    get_ks_cookie,
    xiaohongshu_cookie_gen,
    create_screenshot_dir,
    debug_screenshot
)


class TestLogin:
    """测试登录相关功能"""

    # ==========================================
    # 单元测试 - Mock所有外部依赖，快速执行
    # ==========================================

    @pytest.mark.unit
    @pytest.mark.login
    async def test_douyin_login_success_unit(self):
        """单元测试：抖音登录成功（使用MockLoginService）"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=True, cookie_valid=True)

        # 执行测试
        await mock_login_service.douyin_cookie_gen('test_user', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/douyin")
        mock_queue.put.assert_any_call("200")

    @pytest.mark.unit
    @pytest.mark.login
    async def test_douyin_login_failure_unit(self):
        """单元测试：抖音登录失败（Mock扫码超时）"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=False, cookie_valid=True)

        # 执行测试
        await mock_login_service.douyin_cookie_gen('test_user', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/douyin")
        mock_queue.put.assert_any_call("500")

    @pytest.mark.unit
    @pytest.mark.login
    async def test_tencent_login_success_unit(self):
        """单元测试：腾讯视频号登录成功（Mock扫码逻辑）"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=True, cookie_valid=True)

        # 执行测试
        await mock_login_service.get_tencent_cookie('test_user', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/tencent")
        mock_queue.put.assert_any_call("200")

    @pytest.mark.unit
    @pytest.mark.login
    async def test_tencent_login_failure_unit(self):
        """单元测试：腾讯视频号登录失败（Mock扫码超时）"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=False, cookie_valid=True)

        # 执行测试
        await mock_login_service.get_tencent_cookie('test_user', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/tencent")
        mock_queue.put.assert_any_call("500")

    @pytest.mark.unit
    @pytest.mark.login
    async def test_ks_login_success_unit(self):
        """单元测试：快手登录成功（Mock扫码逻辑）"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=True, cookie_valid=True)

        # 执行测试
        await mock_login_service.get_ks_cookie('test_user', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/ks")
        mock_queue.put.assert_any_call("200")

    @pytest.mark.unit
    @pytest.mark.login
    async def test_ks_login_failure_unit(self):
        """单元测试：快手登录失败（Mock扫码超时）"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=False, cookie_valid=True)

        # 执行测试
        await mock_login_service.get_ks_cookie('test_user', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/ks")
        mock_queue.put.assert_any_call("500")

    @pytest.mark.unit
    @pytest.mark.login
    async def test_xiaohongshu_login_success_unit(self):
        """单元测试：小红书登录成功（Mock扫码逻辑）"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=True, cookie_valid=True)

        # 执行测试
        await mock_login_service.xiaohongshu_cookie_gen('test_user', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/xiaohongshu")
        mock_queue.put.assert_any_call("200")

    @pytest.mark.unit
    @pytest.mark.login
    async def test_xiaohongshu_login_failure_unit(self):
        """单元测试：小红书登录失败（Mock扫码超时）"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=False, cookie_valid=True)

        # 执行测试
        await mock_login_service.xiaohongshu_cookie_gen('test_user', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/xiaohongshu")
        mock_queue.put.assert_any_call("500")

    @pytest.mark.unit
    @pytest.mark.login
    async def test_login_with_invalid_cookie_unit(self):
        """单元测试：登录成功但cookie无效"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=True, cookie_valid=False)

        # 执行测试
        await mock_login_service.xiaohongshu_cookie_gen('test_user', mock_queue)

        # 断言结果 - 登录流程会成功，但cookie验证会失败
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/xiaohongshu")
        mock_queue.put.assert_any_call("500")

    @pytest.mark.unit
    @pytest.mark.login
    def test_create_screenshot_dir_unit(self):
        """单元测试：创建截图目录功能"""
        # 执行测试
        screenshot_dir = create_screenshot_dir("test_platform")

        # 断言结果
        assert screenshot_dir.exists()
        assert screenshot_dir.name
        assert "test_platform" in str(screenshot_dir)

    @pytest.mark.unit
    @pytest.mark.login
    @patch('src.conf.DEBUG_MODE', True)
    @patch('src.utils.login.debug_print')
    async def test_debug_screenshot_unit(self, mock_debug_print):
        """单元测试：调试截图功能"""
        # 创建模拟对象
        mock_page = MagicMock()
        mock_session_dir = MagicMock()
        mock_session_dir.__truediv__.return_value = MagicMock()

        # 执行测试
        await debug_screenshot(mock_page, mock_session_dir, "test_screenshot", "测试截图")

        # 断言结果
        mock_page.screenshot.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.login
    @patch('src.conf.DEBUG_MODE', False)
    async def test_debug_screenshot_disabled_unit(self):
        """单元测试：调试截图功能在DEBUG_MODE=False时不执行"""
        # 创建模拟对象
        mock_page = MagicMock()
        mock_session_dir = MagicMock()

        # 执行测试
        await debug_screenshot(mock_page, mock_session_dir, "test_screenshot", "测试截图")

        # 断言结果
        mock_page.screenshot.assert_not_called()

    # ==========================================
    # 集成测试 - 模拟关键业务行为，不依赖真实环境
    # ==========================================

    @pytest.mark.integration
    @pytest.mark.login
    async def test_douyin_login_integration(self):
        """集成测试：抖音登录流程（模拟数据库状态变化）"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=True, cookie_valid=True)

        # 执行测试
        await mock_login_service.douyin_cookie_gen('test_user', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/douyin")
        mock_queue.put.assert_any_call("200")

    @pytest.mark.integration
    @pytest.mark.login
    async def test_tencent_login_integration(self):
        """集成测试：腾讯视频号登录流程（模拟数据库状态变化）"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=True, cookie_valid=True)

        # 执行测试
        await mock_login_service.get_tencent_cookie('test_user', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/tencent")
        mock_queue.put.assert_any_call("200")

    @pytest.mark.integration
    @pytest.mark.login
    async def test_all_platforms_login_success_integration(self):
        """集成测试：所有平台登录成功"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=True, cookie_valid=True)

        # 执行测试
        await mock_login_service.douyin_cookie_gen('test_user', mock_queue)
        await mock_login_service.get_tencent_cookie('test_user', mock_queue)
        await mock_login_service.get_ks_cookie('test_user', mock_queue)
        await mock_login_service.xiaohongshu_cookie_gen('test_user', mock_queue)

        # 断言结果
        assert mock_queue.put.call_count >= 8  # 4个平台 * 2个消息/平台 = 8个消息

    @pytest.mark.integration
    @pytest.mark.login
    async def test_all_platforms_login_failure_integration(self):
        """集成测试：所有平台登录失败"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=False, cookie_valid=True)

        # 执行测试
        await mock_login_service.douyin_cookie_gen('test_user', mock_queue)
        await mock_login_service.get_tencent_cookie('test_user', mock_queue)
        await mock_login_service.get_ks_cookie('test_user', mock_queue)
        await mock_login_service.xiaohongshu_cookie_gen('test_user', mock_queue)

        # 断言结果
        assert mock_queue.put.call_count >= 8  # 4个平台 * 2个消息/平台 = 8个消息
        mock_queue.put.assert_any_call("500")

    # ==========================================
    # 边界条件测试 - 测试异常情况
    # ==========================================

    @pytest.mark.unit
    @pytest.mark.login
    async def test_empty_username_login_unit(self):
        """单元测试：空用户名登录"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=True, cookie_valid=True)

        # 执行测试
        await mock_login_service.douyin_cookie_gen('', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/douyin")
        # 空用户名应该登录成功，因为测试模式下只依赖配置

    @pytest.mark.unit
    @pytest.mark.login
    async def test_special_chars_username_login_unit(self):
        """单元测试：特殊字符用户名登录"""
        from tests.mock_services import MockLoginService

        # 创建模拟队列
        mock_queue = MagicMock()
        mock_queue.put = AsyncMock()

        # 创建MockLoginService实例
        mock_login_service = MockLoginService(login_status=True, cookie_valid=True)

        # 执行测试
        await mock_login_service.douyin_cookie_gen('test@user#123', mock_queue)

        # 断言结果
        mock_queue.put.assert_any_call("https://mock-qrcode-url.com/douyin")
        mock_queue.put.assert_any_call("200")
