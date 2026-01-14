#!/usr/bin/env python3
import pytest
import asyncio
from queue import Queue
from typing import Dict, Optional

from src.services.login_service import (
    LoginService,
    MockLoginService,
    DefaultLoginService,
    get_login_service
)


class TestLoginService:
    """测试登录服务接口和实现"""

    @pytest.mark.asyncio
    async def test_mock_login_service_douyin_success(self):
        """测试Mock登录服务的抖音登录成功情况"""
        # 创建状态队列
        status_queue = Queue()
        
        # 创建Mock登录服务实例，配置为成功登录
        login_service = MockLoginService(login_status=True, cookie_valid=True)
        
        # 调用登录方法
        result = await login_service.douyin_cookie_gen("test_user", status_queue)
        
        # 验证结果
        assert result == {}
        assert status_queue.qsize() == 2
        
        # 验证队列内容
        qrcode_url = status_queue.get()
        assert qrcode_url == "https://mock-qrcode-url.com/douyin"
        
        status_code = status_queue.get()
        assert status_code == "200"

    @pytest.mark.asyncio
    async def test_mock_login_service_douyin_failure(self):
        """测试Mock登录服务的抖音登录失败情况"""
        # 创建状态队列
        status_queue = Queue()
        
        # 创建Mock登录服务实例，配置为失败登录
        login_service = MockLoginService(login_status=False, cookie_valid=True)
        
        # 调用登录方法
        result = await login_service.douyin_cookie_gen("test_user", status_queue)
        
        # 验证结果
        assert result == {}
        assert status_queue.qsize() == 2
        
        # 验证队列内容
        qrcode_url = status_queue.get()
        assert qrcode_url == "https://mock-qrcode-url.com/douyin"
        
        status_code = status_queue.get()
        assert status_code == "500"

    @pytest.mark.asyncio
    async def test_mock_login_service_tencent_success(self):
        """测试Mock登录服务的腾讯视频号登录成功情况"""
        # 创建状态队列
        status_queue = Queue()
        
        # 创建Mock登录服务实例，配置为成功登录
        login_service = MockLoginService(login_status=True, cookie_valid=True)
        
        # 调用登录方法
        result = await login_service.get_tencent_cookie("test_user", status_queue)
        
        # 验证结果
        assert result == {}
        assert status_queue.qsize() == 2
        
        # 验证队列内容
        qrcode_url = status_queue.get()
        assert qrcode_url == "https://mock-qrcode-url.com/tencent"
        
        status_code = status_queue.get()
        assert status_code == "200"

    @pytest.mark.asyncio
    async def test_mock_login_service_ks_success(self):
        """测试Mock登录服务的快手登录成功情况"""
        # 创建状态队列
        status_queue = Queue()
        
        # 创建Mock登录服务实例，配置为成功登录
        login_service = MockLoginService(login_status=True, cookie_valid=True)
        
        # 调用登录方法
        result = await login_service.get_ks_cookie("test_user", status_queue)
        
        # 验证结果
        assert result == {}
        assert status_queue.qsize() == 2
        
        # 验证队列内容
        qrcode_url = status_queue.get()
        assert qrcode_url == "https://mock-qrcode-url.com/ks"
        
        status_code = status_queue.get()
        assert status_code == "200"

    @pytest.mark.asyncio
    async def test_mock_login_service_xiaohongshu_success(self):
        """测试Mock登录服务的小红书登录成功情况"""
        # 创建状态队列
        status_queue = Queue()
        
        # 创建Mock登录服务实例，配置为成功登录
        login_service = MockLoginService(login_status=True, cookie_valid=True)
        
        # 调用登录方法
        result = await login_service.xiaohongshu_cookie_gen("test_user", status_queue)
        
        # 验证结果
        assert result == {}
        assert status_queue.qsize() == 2
        
        # 验证队列内容
        qrcode_url = status_queue.get()
        assert qrcode_url == "https://mock-qrcode-url.com/xiaohongshu"
        
        status_code = status_queue.get()
        assert status_code == "200"

    def test_get_login_service_with_config(self):
        """测试带配置的登录服务工厂函数"""
        # 使用配置获取Mock登录服务
        config = {
            'login_status': False,
            'cookie_valid': True,
            'poll_timeout': 60,
            'poll_interval': 2.0
        }
        
        login_service = get_login_service(config)
        
        # 验证返回的是MockLoginService实例
        assert isinstance(login_service, MockLoginService)
        assert login_service.login_status == False
        assert login_service.cookie_valid == True
        assert login_service.poll_timeout == 60
        assert login_service.poll_interval == 2.0

    def test_get_login_service_without_config(self):
        """测试不带配置的登录服务工厂函数"""
        # 不使用配置获取默认登录服务
        login_service = get_login_service()
        
        # 验证返回的是DefaultLoginService实例
        assert isinstance(login_service, DefaultLoginService)

    def test_get_login_service_with_empty_config(self):
        """测试带空配置的登录服务工厂函数"""
        # 使用空配置获取登录服务
        login_service = get_login_service({})
        
        # 验证返回的是MockLoginService实例，使用默认配置
        assert isinstance(login_service, MockLoginService)
        assert login_service.login_status == True  # 默认值
        assert login_service.cookie_valid == True  # 默认值
        assert login_service.poll_timeout == 30    # 默认值
        assert login_service.poll_interval == 1.0   # 默认值

    @pytest.mark.asyncio
    async def test_mock_login_service_cookie_invalid(self):
        """测试Mock登录服务的Cookie无效情况"""
        # 创建状态队列
        status_queue = Queue()
        
        # 创建Mock登录服务实例，配置为Cookie无效
        login_service = MockLoginService(login_status=True, cookie_valid=False)
        
        # 调用登录方法
        result = await login_service.douyin_cookie_gen("test_user", status_queue)
        
        # 验证结果
        assert result == {}
        assert status_queue.qsize() == 2
        
        # 验证返回500状态码
        status_queue.get()  # 跳过二维码URL
        status_code = status_queue.get()
        assert status_code == "500"

    @pytest.mark.asyncio
    async def test_mock_login_service_poll_timeout_config(self):
        """测试Mock登录服务的轮询超时配置"""
        # 创建Mock登录服务实例，配置自定义轮询超时
        login_service = MockLoginService(poll_timeout=120, poll_interval=5.0)
        
        # 验证配置被正确应用
        assert login_service.poll_timeout == 120
        assert login_service.poll_interval == 5.0

    def test_login_service_abstract_class(self):
        """测试LoginService抽象类"""
        # 验证LoginService是抽象类
        with pytest.raises(TypeError):
            # 不能直接实例化抽象类
            LoginService()

    def test_login_service_inheritance(self):
        """测试登录服务的继承关系"""
        # 验证MockLoginService继承自LoginService
        mock_service = MockLoginService()
        assert isinstance(mock_service, LoginService)
        
        # 验证DefaultLoginService继承自LoginService
        default_service = DefaultLoginService()
        assert isinstance(default_service, LoginService)
