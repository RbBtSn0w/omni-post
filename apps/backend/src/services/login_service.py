#!/usr/bin/env python3
"""
登录服务接口和实现

该模块提供了登录服务的抽象接口和默认实现，用于解耦测试和生产代码，
避免直接依赖全局配置变量，实现测试隔离和依赖注入。
"""

import asyncio
import time
from queue import Queue
import uuid
from abc import ABC, abstractmethod
from typing import Dict, Optional, Tuple
from pathlib import Path

from src.conf import BASE_DIR
from src.utils.auth import check_cookie
from src.db.db_manager import db_manager

# 全局变量
active_queues = {}


# SSE 流生成器函数
def sse_stream(status_queue):
    while True:
        if not status_queue.empty():
            msg = status_queue.get()
            yield f"data: {msg}\n\n"
        else:
            # 避免 CPU 占满
            time.sleep(0.1)


# 包装函数：在线程中运行异步函数
def run_async_function(type, id, status_queue, group_name=None):
    # 创建登录服务实例
    login_service = DefaultLoginService()

    match type:
        case '1':
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(login_service.xiaohongshu_cookie_gen(id, status_queue, group_name))
            loop.close()
        case '2':
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(login_service.get_tencent_cookie(id, status_queue, group_name))
            loop.close()
        case '3':
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(login_service.douyin_cookie_gen(id, status_queue, group_name))
            loop.close()
        case '4':
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(login_service.get_ks_cookie(id, status_queue, group_name))
            loop.close()


class LoginService(ABC):
    """登录服务抽象接口"""

    def __init__(self,
                 login_status: bool = True,
                 cookie_valid: bool = True,
                 poll_timeout: int = 30,  # 优化：默认超时30秒，适合测试环境
                 poll_interval: float = 1.0):  # 优化：添加轮询间隔参数
        """
        初始化登录服务

        Args:
            login_status: 登录状态
            cookie_valid: cookie有效性
            poll_timeout: 轮询超时时间（秒）
            poll_interval: 轮询间隔时间（秒）
        """
        self.login_status = login_status
        self.cookie_valid = cookie_valid
        self.poll_timeout = poll_timeout
        self.poll_interval = poll_interval

    @abstractmethod
    async def douyin_cookie_gen(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """抖音登录"""
        pass

    @abstractmethod
    async def get_tencent_cookie(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """腾讯视频号登录"""
        pass

    @abstractmethod
    async def get_ks_cookie(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """快手登录"""
        pass

    @abstractmethod
    async def xiaohongshu_cookie_gen(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """小红书登录"""
        pass


class MockLoginService(LoginService):
    """用于测试的Mock登录服务实现"""

    async def douyin_cookie_gen(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """模拟抖音登录"""
        # 发送模拟二维码
        status_queue.put("https://mock-qrcode-url.com/douyin")

        # 根据配置发送状态码
        if self.login_status and self.cookie_valid:
            status_queue.put("200")
        else:
            status_queue.put("500")

        return {}

    async def get_tencent_cookie(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """模拟腾讯视频号登录"""
        # 发送模拟二维码
        status_queue.put("https://mock-qrcode-url.com/tencent")

        # 根据配置发送状态码
        if self.login_status and self.cookie_valid:
            status_queue.put("200")
        else:
            status_queue.put("500")

        return {}

    async def get_ks_cookie(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """模拟快手登录"""
        # 发送模拟二维码
        status_queue.put("https://mock-qrcode-url.com/ks")

        # 根据配置发送状态码
        if self.login_status and self.cookie_valid:
            status_queue.put("200")
        else:
            status_queue.put("500")

        return {}

    async def xiaohongshu_cookie_gen(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """模拟小红书登录"""
        # 发送模拟二维码
        status_queue.put("https://mock-qrcode-url.com/xiaohongshu")

        # 根据配置发送状态码
        if self.login_status and self.cookie_valid:
            status_queue.put("200")
        else:
            status_queue.put("500")

        return {}


class DefaultLoginService(LoginService):
    """默认登录服务实现，调用实际的登录逻辑"""

    async def douyin_cookie_gen(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """调用实际的抖音登录逻辑"""
        from src.utils.login import douyin_cookie_gen as original_douyin_login
        return await original_douyin_login(id, status_queue, group_name)

    async def get_tencent_cookie(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """调用实际的腾讯视频号登录逻辑"""
        from src.utils.login import get_tencent_cookie as original_tencent_login
        return await original_tencent_login(id, status_queue, group_name)

    async def get_ks_cookie(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """调用实际的快手登录逻辑"""
        from src.utils.login import get_ks_cookie as original_ks_login
        return await original_ks_login(id, status_queue, group_name)

    async def xiaohongshu_cookie_gen(self, id: str, status_queue, group_name: str = None) -> Optional[Dict]:
        """调用实际的小红书登录逻辑"""
        from src.utils.login import xiaohongshu_cookie_gen as original_xhs_login
        return await original_xhs_login(id, status_queue, group_name)


def get_login_service(config: Optional[Dict] = None) -> LoginService:
    """
    获取登录服务实例

    Args:
        config: 配置字典，包含login_status和cookie_valid等配置

    Returns:
        LoginService: 登录服务实例
    """
    if config is not None:  # 只要提供了config参数，即使是空字典，也返回MockLoginService
        # 如果提供了配置，返回MockLoginService实例
        return MockLoginService(
            login_status=config.get('login_status', True),
            cookie_valid=config.get('cookie_valid', True),
            poll_timeout=config.get('poll_timeout', 30),
            poll_interval=config.get('poll_interval', 1.0)
        )
    else:
        # 否则返回DefaultLoginService实例
        return DefaultLoginService()
