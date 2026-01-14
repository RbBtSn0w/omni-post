#!/usr/bin/env python3
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from src.utils.auth import (
    check_cookie,
    cookie_auth_douyin,
    cookie_auth_tencent,
    cookie_auth_ks,
    cookie_auth_xhs
)

class TestAuth:
    """测试认证相关功能"""

    # ==========================================
    # 单元测试 - Mock所有外部依赖，快速执行
    # ==========================================

    @pytest.mark.unit
    @pytest.mark.auth
    async def test_check_cookie_xhs_test_mode_unit(self):
        """单元测试：小红书cookie验证（使用MockAuthService）"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=True)

        # 执行测试
        result = await mock_auth_service.check_cookie(1, 'test_cookie.json')

        # 断言结果
        assert result is True

    @pytest.mark.unit
    @pytest.mark.auth
    async def test_check_cookie_tencent_test_mode_unit(self):
        """单元测试：腾讯cookie验证（使用MockAuthService）"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=True)

        # 执行测试
        result = await mock_auth_service.check_cookie(2, 'test_cookie.json')

        # 断言结果
        assert result is True

    @pytest.mark.unit
    @pytest.mark.auth
    async def test_check_cookie_douyin_test_mode_unit(self):
        """单元测试：抖音cookie验证（使用MockAuthService）"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=True)

        # 执行测试
        result = await mock_auth_service.check_cookie(3, 'test_cookie.json')

        # 断言结果
        assert result is True

    @pytest.mark.unit
    @pytest.mark.auth
    async def test_check_cookie_ks_test_mode_unit(self):
        """单元测试：快手cookie验证（使用MockAuthService）"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=True)

        # 执行测试
        result = await mock_auth_service.check_cookie(4, 'test_cookie.json')

        # 断言结果
        assert result is True

    @pytest.mark.unit
    @pytest.mark.auth
    async def test_check_cookie_invalid_test_mode_unit(self):
        """单元测试：无效cookie验证（使用MockAuthService）"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=False)

        # 执行测试
        result = await mock_auth_service.check_cookie(1, 'test_cookie.json')

        # 断言结果
        assert result is False

    @pytest.mark.unit
    @pytest.mark.auth
    async def test_check_cookie_invalid_platform_test_mode_unit(self):
        """单元测试：无效平台的cookie验证（使用MockAuthService）"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=True)

        # 执行测试，使用无效平台
        result = await mock_auth_service.check_cookie(999, 'test_cookie.json')

        # 断言结果 - check_cookie函数返回False而不是抛出异常
        assert result is False

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.cookie_auth_xhs')
    async def test_check_cookie_production_success_unit(self, mock_cookie_auth_xhs):
        """单元测试：生产模式下cookie验证成功"""
        # 配置模拟返回值
        mock_cookie_auth_xhs.return_value = True

        # 执行测试
        result = await check_cookie(1, 'test_cookie.json')

        # 断言结果
        assert result is True
        mock_cookie_auth_xhs.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.cookie_auth_xhs')
    async def test_check_cookie_production_failure_unit(self, mock_cookie_auth_xhs):
        """单元测试：生产模式下cookie验证失败"""
        # 配置模拟返回值为False
        mock_cookie_auth_xhs.return_value = False

        # 执行测试
        result = await check_cookie(1, 'test_cookie.json')

        # 断言结果
        assert result is False
        mock_cookie_auth_xhs.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.cookie_auth_douyin')
    async def test_check_cookie_douyin_production_unit(self, mock_cookie_auth_douyin):
        """单元测试：生产模式下抖音cookie验证"""
        # 配置模拟返回值
        mock_cookie_auth_douyin.return_value = True

        # 执行测试
        result = await check_cookie(3, 'test_cookie.json')

        # 断言结果
        assert result is True
        mock_cookie_auth_douyin.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.cookie_auth_tencent')
    async def test_check_cookie_tencent_production_unit(self, mock_cookie_auth_tencent):
        """单元测试：生产模式下腾讯cookie验证"""
        # 配置模拟返回值
        mock_cookie_auth_tencent.return_value = True

        # 执行测试
        result = await check_cookie(2, 'test_cookie.json')

        # 断言结果
        assert result is True
        mock_cookie_auth_tencent.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.cookie_auth_ks')
    async def test_check_cookie_ks_production_unit(self, mock_cookie_auth_ks):
        """单元测试：生产模式下快手cookie验证"""
        # 配置模拟返回值
        mock_cookie_auth_ks.return_value = True

        # 执行测试
        result = await check_cookie(4, 'test_cookie.json')

        # 断言结果
        assert result is True
        mock_cookie_auth_ks.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.auth
    async def test_cookie_auth_douyin_test_mode_unit(self):
        """单元测试：抖音cookie认证（使用MockAuthService）"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=True)

        # 执行测试
        result = await mock_auth_service.cookie_auth_douyin('test_cookie.json')

        # 断言结果
        assert result is True

    @pytest.mark.unit
    @pytest.mark.auth
    async def test_cookie_auth_tencent_invalid_test_mode_unit(self):
        """单元测试：腾讯cookie认证无效（使用MockAuthService）"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=False)

        # 执行测试
        result = await mock_auth_service.cookie_auth_tencent('test_cookie.json')

        # 断言结果
        assert result is False

    # ==========================================
    # 生产模式测试 - Mock外部依赖，测试真实认证逻辑
    # ==========================================

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.asyncio')
    @patch('src.utils.auth.async_playwright')
    @patch('src.utils.auth.launch_browser')
    @patch('src.utils.auth.set_init_script')
    async def test_cookie_auth_douyin_production_success_unit(self, mock_set_init_script, mock_launch_browser, mock_async_playwright, mock_asyncio):
        """单元测试：抖音cookie认证生产模式成功"""
        # 配置模拟返回值
        mock_browser = MagicMock()
        mock_context = MagicMock()
        mock_page = MagicMock()

        # 异步方法必须返回可等待对象
        mock_launch_browser.return_value = mock_browser
        mock_browser.new_context = AsyncMock(return_value=mock_context)
        mock_browser.close = AsyncMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)
        mock_context.close = AsyncMock()
        mock_set_init_script.return_value = mock_context

        # 模拟page操作
        mock_page.goto = AsyncMock()
        mock_page.wait_for_url = AsyncMock()
        mock_page.close = AsyncMock()
        # 模拟get_by_text.wait_for抛出异常，模拟cookie有效
        mock_page.get_by_text.return_value.wait_for = AsyncMock(side_effect=Exception("Element not found"))

        # 执行测试
        result = await cookie_auth_douyin('test_cookie.json')

        # 断言结果
        assert result is True
        mock_launch_browser.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.asyncio')
    @patch('src.utils.auth.async_playwright')
    @patch('src.utils.auth.launch_browser')
    @patch('src.utils.auth.set_init_script')
    async def test_cookie_auth_douyin_production_failure_unit(self, mock_set_init_script, mock_launch_browser, mock_async_playwright, mock_asyncio):
        """单元测试：抖音cookie认证生产模式失败"""
        # 配置模拟返回值
        mock_browser = MagicMock()
        mock_context = MagicMock()
        mock_page = MagicMock()

        # 异步方法必须返回可等待对象
        mock_launch_browser.return_value = mock_browser
        mock_browser.new_context = AsyncMock(return_value=mock_context)
        mock_browser.close = AsyncMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)
        mock_context.close = AsyncMock()
        mock_set_init_script.return_value = mock_context

        # 模拟page操作
        mock_page.goto = AsyncMock()
        mock_page.wait_for_url = AsyncMock()
        mock_page.close = AsyncMock()
        # 模拟get_by_text.wait_for成功，模拟cookie无效
        mock_page.get_by_text.return_value.wait_for = AsyncMock()

        # 执行测试
        result = await cookie_auth_douyin('test_cookie.json')

        # 断言结果
        assert result is False
        mock_launch_browser.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.asyncio')
    @patch('src.utils.auth.async_playwright')
    @patch('src.utils.auth.launch_browser')
    @patch('src.utils.auth.set_init_script')
    async def test_cookie_auth_tencent_production_success_unit(self, mock_set_init_script, mock_launch_browser, mock_async_playwright, mock_asyncio):
        """单元测试：腾讯cookie认证生产模式成功"""
        # 配置模拟返回值
        mock_browser = MagicMock()
        mock_context = MagicMock()
        mock_page = MagicMock()

        # 异步方法必须返回可等待对象
        mock_launch_browser.return_value = mock_browser
        mock_browser.new_context = AsyncMock(return_value=mock_context)
        mock_browser.close = AsyncMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)
        mock_context.close = AsyncMock()
        mock_set_init_script.return_value = mock_context

        # 模拟page操作
        mock_page.goto = AsyncMock()
        mock_page.close = AsyncMock()
        # 模拟wait_for_selector抛出异常，模拟cookie有效
        mock_page.wait_for_selector = AsyncMock(side_effect=Exception("Selector not found"))

        # 执行测试
        result = await cookie_auth_tencent('test_cookie.json')

        # 断言结果
        assert result is True
        mock_launch_browser.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.asyncio')
    @patch('src.utils.auth.async_playwright')
    @patch('src.utils.auth.launch_browser')
    @patch('src.utils.auth.set_init_script')
    async def test_cookie_auth_ks_production_success_unit(self, mock_set_init_script, mock_launch_browser, mock_async_playwright, mock_asyncio):
        """单元测试：快手cookie认证生产模式成功"""
        # 配置模拟返回值
        mock_browser = MagicMock()
        mock_context = MagicMock()
        mock_page = MagicMock()

        # 异步方法必须返回可等待对象
        mock_launch_browser.return_value = mock_browser
        mock_browser.new_context = AsyncMock(return_value=mock_context)
        mock_browser.close = AsyncMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)
        mock_context.close = AsyncMock()
        mock_set_init_script.return_value = mock_context

        # 模拟page操作
        mock_page.goto = AsyncMock()
        mock_page.close = AsyncMock()
        # 模拟wait_for_selector抛出异常，模拟cookie有效
        mock_page.wait_for_selector = AsyncMock(side_effect=Exception("Selector not found"))

        # 执行测试
        result = await cookie_auth_ks('test_cookie.json')

        # 断言结果
        assert result is True
        mock_launch_browser.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.asyncio')
    @patch('src.utils.auth.async_playwright')
    @patch('src.utils.auth.launch_browser')
    @patch('src.utils.auth.set_init_script')
    async def test_cookie_auth_xhs_production_success_unit(self, mock_set_init_script, mock_launch_browser, mock_async_playwright, mock_asyncio):
        """单元测试：小红书cookie认证生产模式成功"""
        # 配置模拟返回值
        mock_browser = MagicMock()
        mock_context = MagicMock()
        mock_page = MagicMock()

        # 异步方法必须返回可等待对象
        mock_launch_browser.return_value = mock_browser
        mock_browser.new_context = AsyncMock(return_value=mock_context)
        mock_browser.close = AsyncMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)
        mock_context.close = AsyncMock()
        mock_set_init_script.return_value = mock_context

        # 模拟page操作
        mock_page.goto = AsyncMock()
        mock_page.wait_for_url = AsyncMock()
        mock_page.close = AsyncMock()
        # 模拟get_by_text.count.return_value为0，模拟cookie有效
        mock_page.get_by_text.return_value.count = AsyncMock(return_value=0)

        # 执行测试
        result = await cookie_auth_xhs('test_cookie.json')

        # 断言结果
        assert result is True
        mock_launch_browser.assert_called_once()

    @pytest.mark.unit
    @pytest.mark.auth
    @patch('src.utils.auth.asyncio')
    @patch('src.utils.auth.async_playwright')
    @patch('src.utils.auth.launch_browser')
    @patch('src.utils.auth.set_init_script')
    async def test_cookie_auth_xhs_production_failure_unit(self, mock_set_init_script, mock_launch_browser, mock_async_playwright, mock_asyncio):
        """单元测试：小红书cookie认证生产模式失败"""
        # 配置模拟返回值
        mock_browser = MagicMock()
        mock_context = MagicMock()
        mock_page = MagicMock()

        # 异步方法必须返回可等待对象
        mock_launch_browser.return_value = mock_browser
        mock_browser.new_context = AsyncMock(return_value=mock_context)
        mock_browser.close = AsyncMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)
        mock_context.close = AsyncMock()
        mock_set_init_script.return_value = mock_context

        # 模拟page操作
        mock_page.goto = AsyncMock()
        mock_page.wait_for_url = AsyncMock()
        mock_page.close = AsyncMock()
        # 模拟get_by_text.count.return_value大于0，模拟cookie无效
        mock_page.get_by_text.return_value.count = AsyncMock(return_value=1)

        # 执行测试
        result = await cookie_auth_xhs('test_cookie.json')

        # 断言结果
        assert result is False
        mock_launch_browser.assert_called_once()

    # ==========================================
    # 集成测试 - 模拟关键业务行为，不依赖真实环境
    # ==========================================

    @pytest.mark.integration
    @pytest.mark.auth
    async def test_check_cookie_all_platforms_test_mode_integration(self):
        """集成测试：所有平台cookie验证（测试模式）"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=True)

        # 执行测试
        xhs_result = await mock_auth_service.check_cookie(1, 'test_cookie.json')
        tencent_result = await mock_auth_service.check_cookie(2, 'test_cookie.json')
        douyin_result = await mock_auth_service.check_cookie(3, 'test_cookie.json')
        ks_result = await mock_auth_service.check_cookie(4, 'test_cookie.json')

        # 断言结果
        assert xhs_result is True
        assert tencent_result is True
        assert douyin_result is True
        assert ks_result is True

    @pytest.mark.integration
    @pytest.mark.auth
    async def test_check_cookie_all_platforms_invalid_test_mode_integration(self):
        """集成测试：所有平台无效cookie验证（测试模式）"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=False)

        # 执行测试
        xhs_result = await mock_auth_service.check_cookie(1, 'test_cookie.json')
        tencent_result = await mock_auth_service.check_cookie(2, 'test_cookie.json')
        douyin_result = await mock_auth_service.check_cookie(3, 'test_cookie.json')
        ks_result = await mock_auth_service.check_cookie(4, 'test_cookie.json')

        # 断言结果
        assert xhs_result is False
        assert tencent_result is False
        assert douyin_result is False
        assert ks_result is False

    @pytest.mark.integration
    @pytest.mark.auth
    @patch('src.utils.auth.cookie_auth_xhs')
    @patch('src.utils.auth.cookie_auth_tencent')
    @patch('src.utils.auth.cookie_auth_douyin')
    @patch('src.utils.auth.cookie_auth_ks')
    async def test_check_cookie_all_platforms_integration(self, mock_ks, mock_douyin, mock_tencent, mock_xhs):
        """集成测试：所有平台的cookie验证"""
        # 配置模拟返回值
        mock_xhs.return_value = True
        mock_tencent.return_value = True
        mock_douyin.return_value = True
        mock_ks.return_value = True

        # 执行测试
        xhs_result = await check_cookie(1, 'test_cookie.json')
        tencent_result = await check_cookie(2, 'test_cookie.json')
        douyin_result = await check_cookie(3, 'test_cookie.json')
        ks_result = await check_cookie(4, 'test_cookie.json')

        # 断言结果
        assert xhs_result is True
        assert tencent_result is True
        assert douyin_result is True
        assert ks_result is True

    @pytest.mark.integration
    @pytest.mark.auth
    @patch('src.utils.auth.cookie_auth_xhs')
    async def test_check_cookie_mixed_results_integration(self, mock_cookie_auth_xhs):
        """集成测试：混合结果的cookie验证"""
        # 配置模拟返回值，第一次调用成功，第二次失败
        mock_cookie_auth_xhs.side_effect = [True, False]

        # 执行测试
        result1 = await check_cookie(1, 'test_cookie.json')
        result2 = await check_cookie(1, 'test_cookie.json')

        # 断言结果
        assert result1 is True
        assert result2 is False
        assert mock_cookie_auth_xhs.call_count == 2

    # ==========================================
    # 边界条件测试 - 测试异常情况
    # ==========================================

    @pytest.mark.unit
    @pytest.mark.auth
    async def test_check_cookie_empty_file_path_unit(self):
        """单元测试：空文件路径的cookie验证"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=True)

        # 执行测试
        result = await mock_auth_service.check_cookie(1, '')

        # 断言结果 - 应该返回True，因为MockAuthService模拟cookie有效
        assert result is True

    @pytest.mark.unit
    @pytest.mark.auth
    async def test_check_cookie_none_platform_unit(self):
        """单元测试：None平台的cookie验证"""
        from tests.mock_services import MockAuthService

        # 创建MockAuthService实例
        mock_auth_service = MockAuthService(cookie_valid=True)

        # 执行测试 - 使用None作为平台
        result = await mock_auth_service.check_cookie(None, 'test_cookie.json')

        # 断言结果 - 应该返回False，因为None不是有效平台
        assert result is False
