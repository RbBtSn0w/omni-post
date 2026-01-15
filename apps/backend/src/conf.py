"""
Configuration module for backward compatibility.

DEPRECATED: Please import from src.core.config instead.
"""

import sys

# Import all from core.config for backward compatibility
from src.core.config import (
    BASE_DIR,
    ROOT_DIR,
    XHS_SERVER,
    DEBUG_MODE,
    TEST_MODE,
    MOCK_CONFIG,
    LOCAL_CHROME_PATH,
    LOCAL_CHROME_HEADLESS,
    DATA_DIR,
    COOKIES_DIR,
    VIDEOS_DIR,
    LOGS_DIR,
)

# Re-export all symbols
__all__ = [
    'BASE_DIR',
    'ROOT_DIR',
    'XHS_SERVER',
    'DEBUG_MODE',
    'TEST_MODE',
    'MOCK_CONFIG',
    'LOCAL_CHROME_PATH',
    'LOCAL_CHROME_HEADLESS',
    'DATA_DIR',
    'COOKIES_DIR',
    'VIDEOS_DIR',
    'LOGS_DIR',
]

# Register this module as 'conf' alias for test patching
sys.modules.setdefault("conf", sys.modules[__name__])