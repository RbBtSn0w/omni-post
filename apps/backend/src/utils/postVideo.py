"""
Video posting utilities for backward compatibility.

DEPRECATED: Please import from src.services.publish_service instead.
"""

from src.core.constants import TencentZoneTypes
from src.services.publish_service import get_publish_service


def post_video_tencent(title, files, tags, account_file,
                       category=TencentZoneTypes.LIFESTYLE.value,
                       enableTimer=False, videos_per_day=1,
                       daily_times=None, start_days=0, is_draft=False):
    """发布视频到腾讯视频号 - 兼容层"""
    return get_publish_service().post_video_tencent(
        title, files, tags, account_file, category,
        enableTimer, videos_per_day, daily_times, start_days, is_draft
    )


def post_video_DouYin(title, files, tags, account_file,
                      category=TencentZoneTypes.LIFESTYLE.value,
                      enableTimer=False, videos_per_day=1,
                      daily_times=None, start_days=0,
                      thumbnail_path='', productLink='', productTitle=''):
    """发布视频到抖音 - 兼容层"""
    return get_publish_service().post_video_douyin(
        title, files, tags, account_file, category,
        enableTimer, videos_per_day, daily_times, start_days,
        thumbnail_path, productLink, productTitle
    )


def post_video_ks(title, files, tags, account_file,
                  category=TencentZoneTypes.LIFESTYLE.value,
                  enableTimer=False, videos_per_day=1,
                  daily_times=None, start_days=0):
    """发布视频到快手 - 兼容层"""
    return get_publish_service().post_video_ks(
        title, files, tags, account_file, category,
        enableTimer, videos_per_day, daily_times, start_days
    )


def post_video_xhs(title, files, tags, account_file,
                   category=TencentZoneTypes.LIFESTYLE.value,
                   enableTimer=False, videos_per_day=1,
                   daily_times=None, start_days=0):
    """发布视频到小红书 - 兼容层"""
    return get_publish_service().post_video_xhs(
        title, files, tags, account_file, category,
        enableTimer, videos_per_day, daily_times, start_days
    )


__all__ = [
    'post_video_tencent',
    'post_video_DouYin',
    'post_video_ks',
    'post_video_xhs',
    'TencentZoneTypes'
]