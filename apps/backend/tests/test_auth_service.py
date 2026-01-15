#!/usr/bin/env python3
import pytest
from pathlib import Path
from abc import ABC
from unittest.mock import patch, MagicMock, AsyncMock

from src.services.auth_service import (
    AuthService,
    DefaultAuthService,
    default_auth_service
)


class TestAuthService:
    """测试认证服务接口和实现"""

    def test_auth_service_abstract_class(self):
        """测试AuthService抽象类不能直接实例化"""
        # 验证AuthService是抽象类
        with pytest.raises(TypeError):
            # 不能直接实例化抽象类
            AuthService()

    def test_auth_service_inheritance(self):
        """测试DefaultAuthService继承关系"""
        # 验证DefaultAuthService继承自AuthService
        default_service = DefaultAuthService()
        assert isinstance(default_service, AuthService)
        assert issubclass(DefaultAuthService, AuthService)

    def test_default_auth_service_instance(self):
        """测试DefaultAuthService实例创建"""
        # 创建DefaultAuthService实例
        auth_service = DefaultAuthService()
        assert isinstance(auth_service, DefaultAuthService)
        assert isinstance(auth_service, AuthService)

    def test_default_auth_service_singleton(self):
        """测试全局默认认证服务实例"""
        # 验证全局实例是DefaultAuthService的实例
        assert isinstance(default_auth_service, DefaultAuthService)
        assert isinstance(default_auth_service, AuthService)

    @pytest.mark.asyncio
    @patch('src.services.cookie_service.DefaultCookieService.cookie_auth_douyin')
    async def test_cookie_auth_douyin(self, mock_cookie_auth_douyin):
        """测试抖音cookie认证方法"""
        # 设置mock返回值
        mock_cookie_auth_douyin.return_value = True

        # 创建认证服务实例
        auth_service = DefaultAuthService()

        # 调用认证方法
        result = await auth_service.cookie_auth_douyin(Path("test.json"))

        # 验证结果
        assert result == True

    @pytest.mark.asyncio
    @patch('src.services.cookie_service.DefaultCookieService.cookie_auth_tencent')
    async def test_cookie_auth_tencent(self, mock_cookie_auth_tencent):
        """测试腾讯视频号cookie认证方法"""
        # 设置mock返回值
        mock_cookie_auth_tencent.return_value = True

        # 创建认证服务实例
        auth_service = DefaultAuthService()

        # 调用认证方法
        result = await auth_service.cookie_auth_tencent(Path("test.json"))

        # 验证结果
        assert result == True

    @pytest.mark.asyncio
    @patch('src.services.cookie_service.DefaultCookieService.cookie_auth_ks')
    async def test_cookie_auth_ks(self, mock_cookie_auth_ks):
        """测试快手cookie认证方法"""
        # 设置mock返回值
        mock_cookie_auth_ks.return_value = False

        # 创建认证服务实例
        auth_service = DefaultAuthService()

        # 调用认证方法
        result = await auth_service.cookie_auth_ks(Path("test.json"))

        # 验证结果
        assert result == False

    @pytest.mark.asyncio
    @patch('src.services.cookie_service.DefaultCookieService.cookie_auth_xhs')
    async def test_cookie_auth_xhs(self, mock_cookie_auth_xhs):
        """测试小红书cookie认证方法"""
        # 设置mock返回值
        mock_cookie_auth_xhs.return_value = False

        # 创建认证服务实例
        auth_service = DefaultAuthService()

        # 调用认证方法
        result = await auth_service.cookie_auth_xhs(Path("test.json"))

        # 验证结果
        assert result == False

    @pytest.mark.asyncio
    @patch('src.services.cookie_service.get_cookie_service')
    async def test_check_cookie(self, mock_check_cookie):
        """测试检查cookie有效性方法"""
        # 设置mock返回值
        mock_service = MagicMock()
        mock_service.check_cookie = AsyncMock(return_value=True)
        mock_check_cookie.return_value = mock_service

        # 创建认证服务实例
        auth_service = DefaultAuthService()

        # 调用检查方法
        result = await auth_service.check_cookie(1, "test.json")

        # 验证结果
        assert result == True

    @pytest.mark.asyncio
    @patch('src.services.cookie_service.get_cookie_service')
    async def test_check_cookie_invalid(self, mock_check_cookie):
        """测试检查无效cookie方法"""
        # 设置mock返回值
        mock_service = MagicMock()
        mock_service.check_cookie = AsyncMock(return_value=False)
        mock_check_cookie.return_value = mock_service

        # 创建认证服务实例
        auth_service = DefaultAuthService()

        # 调用检查方法
        result = await auth_service.check_cookie(2, "test.json")

        # 验证结果
        assert result == False

    def test_auth_service_methods_signatures(self):
        """测试认证服务方法签名"""
        # 创建认证服务实例
        auth_service = DefaultAuthService()

        # 验证方法存在
        assert hasattr(auth_service, 'cookie_auth_douyin')
        assert hasattr(auth_service, 'cookie_auth_tencent')
        assert hasattr(auth_service, 'cookie_auth_ks')
        assert hasattr(auth_service, 'cookie_auth_xhs')
        assert hasattr(auth_service, 'check_cookie')

    @pytest.mark.asyncio
    async def test_global_auth_service_methods(self):
        """测试全局认证服务实例的方法调用"""
        # 测试全局实例的方法是否可调用
        assert hasattr(default_auth_service, 'cookie_auth_douyin')
        assert hasattr(default_auth_service, 'cookie_auth_tencent')
        assert hasattr(default_auth_service, 'cookie_auth_ks')
        assert hasattr(default_auth_service, 'cookie_auth_xhs')
        assert hasattr(default_auth_service, 'check_cookie')

    def test_auth_service_abstract_methods(self):
        """测试认证服务的抽象方法列表"""
        # 获取AuthService的所有抽象方法
        import inspect
        abstract_methods = [
            name for name, func in inspect.getmembers(AuthService, predicate=inspect.isfunction)
            if getattr(func, '__isabstractmethod__', False)
        ]

        # 验证所有预期的抽象方法都存在
        expected_methods = [
            'cookie_auth_douyin',
            'cookie_auth_tencent',
            'cookie_auth_ks',
            'cookie_auth_xhs',
            'check_cookie'
        ]

        for method in expected_methods:
            assert method in abstract_methods

    def test_auth_service_concrete_methods(self):
        """测试DefaultAuthService实现了所有抽象方法"""
        # 创建DefaultAuthService实例
        auth_service = DefaultAuthService()

        # 验证所有抽象方法都被实现
        assert hasattr(auth_service, 'cookie_auth_douyin')
        assert callable(auth_service.cookie_auth_douyin)

        assert hasattr(auth_service, 'cookie_auth_tencent')
        assert callable(auth_service.cookie_auth_tencent)

        assert hasattr(auth_service, 'cookie_auth_ks')
        assert callable(auth_service.cookie_auth_ks)

        assert hasattr(auth_service, 'cookie_auth_xhs')
        assert callable(auth_service.cookie_auth_xhs)

        assert hasattr(auth_service, 'check_cookie')
        assert callable(auth_service.check_cookie)
