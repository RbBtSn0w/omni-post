"""
Login utilities for backward compatibility.

DEPRECATED: Please import from src.services.login_impl instead.
"""

from src.services.login_impl import (
    get_or_create_group,
    douyin_cookie_gen,
    get_tencent_cookie,
    get_ks_cookie,
    xiaohongshu_cookie_gen,
    debug_print,
    create_screenshot_dir,
    debug_screenshot
)

__all__ = [
    'get_or_create_group',
    'douyin_cookie_gen',
    'get_tencent_cookie',
    'get_ks_cookie',
    'xiaohongshu_cookie_gen',
    'debug_print',
    'create_screenshot_dir',
    'debug_screenshot'
]
