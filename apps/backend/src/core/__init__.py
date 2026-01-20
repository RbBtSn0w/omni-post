"""
Core infrastructure module for omni-post backend.

This module provides centralized configuration, constants, and utilities.
"""

from src.core.config import (
    BASE_DIR,
    DEBUG_MODE,
    LOCAL_CHROME_HEADLESS,
    LOCAL_CHROME_PATH,
    MOCK_CONFIG,
    ROOT_DIR,
    TEST_MODE,
    XHS_SERVER,
)

__all__ = [
    "BASE_DIR",
    "ROOT_DIR",
    "XHS_SERVER",
    "DEBUG_MODE",
    "TEST_MODE",
    "MOCK_CONFIG",
    "LOCAL_CHROME_PATH",
    "LOCAL_CHROME_HEADLESS",
]
