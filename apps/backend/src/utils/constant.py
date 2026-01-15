"""
Constants module for backward compatibility.

DEPRECATED: Please import from src.core.constants instead.
"""

from src.core.constants import (
    TencentZoneTypes,
    VideoZoneTypes,
    PlatformType,
    PLATFORM_NAMES,
    PLATFORM_LOGIN_URLS,
)

__all__ = [
    'TencentZoneTypes',
    'VideoZoneTypes',
    'PlatformType',
    'PLATFORM_NAMES',
    'PLATFORM_LOGIN_URLS',
]
