"""
Browser utilities module for backward compatibility.

DEPRECATED: Please import from src.core.browser instead.
"""

from src.core.browser import (
    debug_print,
    launch_browser,
    set_init_script,
    create_browser_context,
    create_screenshot_dir,
    debug_screenshot,
    SOCIAL_MEDIA_DOUYIN,
    SOCIAL_MEDIA_TENCENT,
    SOCIAL_MEDIA_KUAISHOU,
    SOCIAL_MEDIA_XIAOHONGSHU,
)

__all__ = [
    'debug_print',
    'launch_browser',
    'set_init_script',
    'create_browser_context',
    'create_screenshot_dir',
    'debug_screenshot',
    'SOCIAL_MEDIA_DOUYIN',
    'SOCIAL_MEDIA_TENCENT',
    'SOCIAL_MEDIA_KUAISHOU',
    'SOCIAL_MEDIA_XIAOHONGSHU',
]
