"""
Logging utilities for backward compatibility.

DEPRECATED: Please import from src.core.logger instead.
"""

from src.core.logger import (
    log_formatter,
    create_business_logger,
    douyin_logger,
    tencent_logger,
    xhs_logger,
    bilibili_logger,
    kuaishou_logger,
    xiaohongshu_logger,
    logger
)

# Alias for backward compatibility
create_logger = create_business_logger

__all__ = [
    'log_formatter',
    'create_logger',
    'create_business_logger',
    'douyin_logger',
    'tencent_logger',
    'xhs_logger',
    'bilibili_logger',
    'kuaishou_logger',
    'xiaohongshu_logger',
    'logger'
]
