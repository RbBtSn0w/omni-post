from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.constants import PlatformType
from src.services.cookie_service import DefaultCookieService


@pytest.fixture
def cookie_service():
    return DefaultCookieService()


@pytest.fixture
def mock_path_exists():
    with patch("pathlib.Path.exists") as mock:
        mock.return_value = True
        yield mock


@pytest.mark.asyncio
async def test_check_cookie_dispatch(cookie_service, mock_path_exists):
    """Test check_cookie correctly dispatches to specific methods"""

    # Mock individual auth methods
    cookie_service.cookie_auth_xhs = AsyncMock(return_value=True)
    cookie_service.cookie_auth_tencent = AsyncMock(return_value=True)
    cookie_service.cookie_auth_douyin = AsyncMock(return_value=True)
    cookie_service.cookie_auth_ks = AsyncMock(return_value=True)
    cookie_service.cookie_auth_bilibili = AsyncMock(return_value=True)

    file_path = "test_cookie.json"

    # Test dispatch for each platform
    assert await cookie_service.check_cookie(PlatformType.XIAOHONGSHU, file_path) is True
    cookie_service.cookie_auth_xhs.assert_called_once()

    assert await cookie_service.check_cookie(PlatformType.TENCENT, file_path) is True
    cookie_service.cookie_auth_tencent.assert_called_once()

    assert await cookie_service.check_cookie(PlatformType.DOUYIN, file_path) is True
    cookie_service.cookie_auth_douyin.assert_called_once()

    assert await cookie_service.check_cookie(PlatformType.KUAISHOU, file_path) is True
    cookie_service.cookie_auth_ks.assert_called_once()

    assert await cookie_service.check_cookie(PlatformType.BILIBILI, file_path) is True
    cookie_service.cookie_auth_bilibili.assert_called_once()


@pytest.mark.asyncio
async def test_check_cookie_unknown(cookie_service, mock_path_exists):
    """Test check_cookie with unknown platform type"""
    assert await cookie_service.check_cookie(999, "test.json") is False
