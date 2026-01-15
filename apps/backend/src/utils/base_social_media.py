"""
Base social media utilities for backward compatibility.

DEPRECATED: Please import from src.core.browser instead.
"""

from src.core.browser import (
    set_init_script,
    SOCIAL_MEDIA_DOUYIN,
    SOCIAL_MEDIA_TENCENT,
    SOCIAL_MEDIA_KUAISHOU,
)

__all__ = [
    'set_init_script',
    'SOCIAL_MEDIA_DOUYIN',
    'SOCIAL_MEDIA_TENCENT',
    'SOCIAL_MEDIA_KUAISHOU',
]
