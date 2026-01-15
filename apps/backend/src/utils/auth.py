"""
Authentication utilities for backward compatibility.

DEPRECATED: Please import from src.services.cookie_service instead.
"""

from pathlib import Path
from src.services.cookie_service import get_cookie_service


async def cookie_auth_douyin(account_file):
    """验证抖音 Cookie - 兼容层"""
    acc_path = Path(account_file) if isinstance(account_file, str) else account_file
    return await get_cookie_service().cookie_auth_douyin(acc_path)


async def cookie_auth_tencent(account_file):
    """验证视频号 Cookie - 兼容层"""
    acc_path = Path(account_file) if isinstance(account_file, str) else account_file
    return await get_cookie_service().cookie_auth_tencent(acc_path)


async def cookie_auth_ks(account_file):
    """验证快手 Cookie - 兼容层"""
    acc_path = Path(account_file) if isinstance(account_file, str) else account_file
    return await get_cookie_service().cookie_auth_ks(acc_path)


async def cookie_auth_xhs(account_file):
    """验证小红书 Cookie - 兼容层"""
    acc_path = Path(account_file) if isinstance(account_file, str) else account_file
    return await get_cookie_service().cookie_auth_xhs(acc_path)


async def check_cookie(type, file_path):
    """验证指定平台的 Cookie 有效性 - 兼容层"""
    return await get_cookie_service().check_cookie(type, file_path)


__all__ = [
    'check_cookie',
    'cookie_auth_douyin',
    'cookie_auth_tencent',
    'cookie_auth_ks',
    'cookie_auth_xhs'
]
