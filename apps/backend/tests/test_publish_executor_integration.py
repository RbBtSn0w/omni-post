from unittest.mock import MagicMock, patch

import pytest

from src.core.constants import PlatformType
from src.services.publish_executor import run_publish_task
from src.services.task_service import task_service


@pytest.fixture
def mock_task_service():
    with patch("src.services.publish_executor.task_service") as mock:
        yield mock


@pytest.fixture
def mock_uploaders():
    with (
        patch("src.services.publish_executor.post_video_xhs") as mock_xhs,
        patch("src.services.publish_executor.post_video_tencent") as mock_tencent,
        patch("src.services.publish_executor.post_video_DouYin") as mock_douyin,
        patch("src.services.publish_executor.post_video_ks") as mock_ks,
        patch("src.services.publish_executor.post_video_bilibili") as mock_bilibili,
    ):
        yield {
            PlatformType.XIAOHONGSHU: mock_xhs,
            PlatformType.TENCENT: mock_tencent,
            PlatformType.DOUYIN: mock_douyin,
            PlatformType.KUAISHOU: mock_ks,
            PlatformType.BILIBILI: mock_bilibili,
        }


@pytest.fixture
def mock_file_exists():
    with patch("pathlib.Path.exists") as mock:
        mock.return_value = True
        yield mock


def test_run_publish_task_dispatch(mock_task_service, mock_uploaders, mock_file_exists):
    """Test correct uploader dispatch based on platform type"""

    # Test cases for each platform
    test_cases = [
        (PlatformType.XIAOHONGSHU, "XiaoHongShu Title"),
        (PlatformType.TENCENT, "Tencent Title"),
        (PlatformType.DOUYIN, "Douyin Title"),
        (PlatformType.KUAISHOU, "Kuaishou Title"),
        (PlatformType.BILIBILI, "Bilibili Title"),
    ]

    for platform_type, title in test_cases:
        task_data = {
            "type": platform_type,
            "title": title,
            "fileList": ["video.mp4"],
            "accountList": ["account.json"],
            "tags": "test",
            "category": "lifestyle",
            "enableTimer": False,
            "videosPerDay": 1,
            "dailyTimes": [],
            "startDays": 0,
        }

        run_publish_task("task_123", task_data)

        # Verify specific uploader was called
        mock_uploaders[platform_type].assert_called_once()
        mock_task_service.update_task_status.assert_called_with("task_123", "completed", 100)

        # Reset mocks for next iteration
        for mock in mock_uploaders.values():
            mock.reset_mock()


def test_run_publish_task_unknown_platform(mock_task_service, mock_file_exists):
    """Test handling of unknown platform type"""
    task_data = {
        "type": 999,  # Invalid type
        "title": "Test",
        "fileList": ["video.mp4"],
        "accountList": ["account.json"],
    }

    run_publish_task("task_invalid", task_data)

    # Should report failure
    # Verify called with failed status
    args, kwargs = mock_task_service.update_task_status.call_args
    assert args[0] == "task_invalid"
    assert args[1] == "failed"
    assert "error_msg" in kwargs
    assert "Unknown platform type: 999" in kwargs["error_msg"]
