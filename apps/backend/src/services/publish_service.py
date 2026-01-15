"""
Publish service module for omni-post backend.

This module provides video publishing service abstractions.
"""

import asyncio
from abc import ABC, abstractmethod
from typing import List, Optional
from pathlib import Path

from src.core.config import BASE_DIR
from src.core.constants import TencentZoneTypes
from src.utils.files_times import generate_schedule_time_next_day

# Re-export uploader classes at module level for test patching
from src.uploader.tencent_uploader.main import TencentVideo
from src.uploader.douyin_uploader.main import DouYinVideo
from src.uploader.ks_uploader.main import KSVideo
from src.uploader.xiaohongshu_uploader.main import XiaoHongShuVideo


class PublishService(ABC):
    """发布服务抽象接口"""

    @abstractmethod
    def post_video_tencent(self, title: str, files: List[str], tags: str,
                           account_file: List[str], category: str = TencentZoneTypes.LIFESTYLE.value,
                           enable_timer: bool = False, videos_per_day: int = 1,
                           daily_times: Optional[List] = None, start_days: int = 0,
                           is_draft: bool = False) -> None:
        pass

    @abstractmethod
    def post_video_douyin(self, title: str, files: List[str], tags: str,
                          account_file: List[str], category: str = TencentZoneTypes.LIFESTYLE.value,
                          enable_timer: bool = False, videos_per_day: int = 1,
                          daily_times: Optional[List] = None, start_days: int = 0,
                          thumbnail_path: str = '', product_link: str = '',
                          product_title: str = '') -> None:
        pass

    @abstractmethod
    def post_video_ks(self, title: str, files: List[str], tags: str,
                      account_file: List[str], category: str = TencentZoneTypes.LIFESTYLE.value,
                      enable_timer: bool = False, videos_per_day: int = 1,
                      daily_times: Optional[List] = None, start_days: int = 0) -> None:
        pass

    @abstractmethod
    def post_video_xhs(self, title: str, files: List[str], tags: str,
                       account_file: List[str], category: str = TencentZoneTypes.LIFESTYLE.value,
                       enable_timer: bool = False, videos_per_day: int = 1,
                       daily_times: Optional[List] = None, start_days: int = 0) -> None:
        pass


class DefaultPublishService(PublishService):
    """默认发布服务实现"""

    def __init__(self):
        self.cookies_dir = BASE_DIR / "cookiesFile"
        self.videos_dir = BASE_DIR / "videoFile"

    def _get_full_paths(self, files: List[str], account_files: List[str]):
        full_files = [Path(self.videos_dir / file) for file in files]
        full_accounts = [Path(self.cookies_dir / file) for file in account_files]
        return full_files, full_accounts

    def _get_publish_datetimes(self, file_count: int, enable_timer: bool,
                                videos_per_day: int, daily_times: Optional[List],
                                start_days: int):
        if enable_timer:
            return generate_schedule_time_next_day(file_count, videos_per_day, daily_times, start_days)
        return [0 for _ in range(file_count)]

    def post_video_tencent(self, title: str, files: List[str], tags: str,
                           account_file: List[str], category: str = TencentZoneTypes.LIFESTYLE.value,
                           enable_timer: bool = False, videos_per_day: int = 1,
                           daily_times: Optional[List] = None, start_days: int = 0,
                           is_draft: bool = False) -> None:
        full_files, full_accounts = self._get_full_paths(files, account_file)
        publish_datetimes = self._get_publish_datetimes(len(files), enable_timer, videos_per_day, daily_times, start_days)
        for index, file in enumerate(full_files):
            for cookie in full_accounts:
                print(f"文件路径{str(file)}")
                print(f"视频文件名：{file}")
                print(f"标题：{title}")
                print(f"Hashtag：{tags}")
                app = TencentVideo(title, str(file), tags, publish_datetimes[index], cookie, category, is_draft)
                asyncio.run(app.main(), debug=False)

    def post_video_douyin(self, title: str, files: List[str], tags: str,
                          account_file: List[str], category: str = TencentZoneTypes.LIFESTYLE.value,
                          enable_timer: bool = False, videos_per_day: int = 1,
                          daily_times: Optional[List] = None, start_days: int = 0,
                          thumbnail_path: str = '', product_link: str = '',
                          product_title: str = '') -> None:
        full_files, full_accounts = self._get_full_paths(files, account_file)
        publish_datetimes = self._get_publish_datetimes(len(files), enable_timer, videos_per_day, daily_times, start_days)
        for index, file in enumerate(full_files):
            for cookie in full_accounts:
                print(f"文件路径{str(file)}")
                print(f"视频文件名：{file}")
                print(f"标题：{title}")
                print(f"Hashtag：{tags}")
                app = DouYinVideo(title, str(file), tags, publish_datetimes[index], cookie, thumbnail_path, product_link, product_title)
                asyncio.run(app.main(), debug=False)

    def post_video_ks(self, title: str, files: List[str], tags: str,
                      account_file: List[str], category: str = TencentZoneTypes.LIFESTYLE.value,
                      enable_timer: bool = False, videos_per_day: int = 1,
                      daily_times: Optional[List] = None, start_days: int = 0) -> None:
        full_files, full_accounts = self._get_full_paths(files, account_file)
        publish_datetimes = self._get_publish_datetimes(len(files), enable_timer, videos_per_day, daily_times, start_days)
        for index, file in enumerate(full_files):
            for cookie in full_accounts:
                print(f"文件路径{str(file)}")
                print(f"视频文件名：{file}")
                print(f"标题：{title}")
                print(f"Hashtag：{tags}")
                app = KSVideo(title, str(file), tags, publish_datetimes[index], cookie)
                asyncio.run(app.main(), debug=False)

    def post_video_xhs(self, title: str, files: List[str], tags: str,
                       account_file: List[str], category: str = TencentZoneTypes.LIFESTYLE.value,
                       enable_timer: bool = False, videos_per_day: int = 1,
                       daily_times: Optional[List] = None, start_days: int = 0) -> None:
        full_files, full_accounts = self._get_full_paths(files, account_file)
        publish_datetimes = self._get_publish_datetimes(len(files), enable_timer, videos_per_day, daily_times, start_days) if enable_timer else 0
        for index, file in enumerate(full_files):
            for cookie in full_accounts:
                print(f"视频文件名：{file}")
                print(f"标题：{title}")
                print(f"Hashtag：{tags}")
                publish_time = publish_datetimes[index] if isinstance(publish_datetimes, list) else publish_datetimes
                app = XiaoHongShuVideo(title, file, tags, publish_time, cookie)
                asyncio.run(app.main(), debug=False)


_default_publish_service: Optional[DefaultPublishService] = None


def get_publish_service() -> PublishService:
    """获取发布服务实例"""
    global _default_publish_service
    if _default_publish_service is None:
        _default_publish_service = DefaultPublishService()
    return _default_publish_service
