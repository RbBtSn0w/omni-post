#!/usr/bin/env python3
import asyncio
import pytest
from unittest.mock import MagicMock, AsyncMock


@pytest.mark.asyncio
async def test_tencent_cookie_success():
    """测试腾讯视频号登录成功（使用MockLoginService）"""
    # 创建一个模拟的status_queue
    mock_queue = MagicMock()
    mock_queue.put = AsyncMock()
    
    from tests.mock_services import MockLoginService
    # 创建MockLoginService实例
    mock_login_service = MockLoginService(login_status=True, cookie_valid=True)
    
    # 调用函数
    await mock_login_service.get_tencent_cookie("test_account", mock_queue)
    
    # 断言结果
    mock_queue.put.assert_any_call("https://mock-qrcode-url.com/tencent")
    mock_queue.put.assert_any_call("200")

@pytest.mark.asyncio
async def test_tencent_cookie_failure():
    """测试腾讯视频号登录失败（使用MockLoginService）"""
    # 创建一个模拟的status_queue
    mock_queue = MagicMock()
    mock_queue.put = AsyncMock()
    
    from tests.mock_services import MockLoginService
    # 创建MockLoginService实例
    mock_login_service = MockLoginService(login_status=False, cookie_valid=False)
    
    # 调用函数
    await mock_login_service.get_tencent_cookie("test_account", mock_queue)
    
    # 断言结果
    mock_queue.put.assert_any_call("https://mock-qrcode-url.com/tencent")
    mock_queue.put.assert_any_call("500")

@pytest.mark.asyncio
async def test_tencent_cookie_invalid_cookie():
    """测试腾讯视频号登录成功但cookie无效（使用MockLoginService）"""
    # 创建一个模拟的status_queue
    mock_queue = MagicMock()
    mock_queue.put = AsyncMock()
    
    from tests.mock_services import MockLoginService
    # 创建MockLoginService实例
    mock_login_service = MockLoginService(login_status=True, cookie_valid=False)
    
    # 调用函数
    await mock_login_service.get_tencent_cookie("test_account", mock_queue)
    
    # 断言结果
    mock_queue.put.assert_any_call("https://mock-qrcode-url.com/tencent")
    mock_queue.put.assert_any_call("500")



