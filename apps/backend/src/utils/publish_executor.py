"""
Publish executor utilities for backward compatibility.

DEPRECATED: Please import from src.services.publish_executor instead.
"""

from src.services.task_service import task_service
from src.utils.postVideo import (
    post_video_tencent,
    post_video_DouYin,
    post_video_ks,
    post_video_xhs
)
from src.core.config import BASE_DIR
from src.services.publish_executor import (
    run_publish_task,
    start_publish_thread
)

__all__ = [
    'run_publish_task',
    'start_publish_thread',
    'task_service',
    'post_video_tencent',
    'post_video_DouYin',
    'post_video_ks',
    'post_video_xhs',
    'BASE_DIR'
]
