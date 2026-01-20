"""
Logging configuration for omni-post backend.

This module provides centralized logging configuration.
"""

from sys import stdout

from loguru import logger

from src.core.config import BASE_DIR, LOGS_DIR


def log_formatter(record: dict) -> str:
    """
    Formatter for log records.
    """
    colors = {
        "TRACE": "#cfe2f3",
        "INFO": "#9cbfdd",
        "DEBUG": "#8598ea",
        "WARNING": "#dcad5a",
        "SUCCESS": "#3dd08d",
        "ERROR": "#ae2c2c",
    }
    color = colors.get(record["level"].name, "#b3cfe7")
    return f"<fg #70acde>{{time:YYYY-MM-DD HH:mm:ss}}</fg #70acde> | <fg {color}>{{level}}</fg {color}>: <light-white>{{message}}</light-white>\n"


def create_business_logger(log_name: str, file_path: str):
    """
    Create custom logger for different business modules.
    """

    def filter_record(record):
        return record["extra"].get("business_name") == log_name

    try:
        full_file_path = LOGS_DIR / file_path
        log_dir = full_file_path.parent
        log_dir.mkdir(parents=True, exist_ok=True)
        logger.add(
            full_file_path,
            filter=filter_record,
            level="INFO",
            rotation="10 MB",
            retention="10 days",
            backtrace=True,
            diagnose=True,
        )
        return logger.bind(business_name=log_name)
    except Exception as e:
        logger.error(f"创建日志目录或文件失败: {str(e)}")
        return logger.bind(business_name=log_name)


# Remove all existing handlers and add console handler
logger.remove()
logger.add(stdout, colorize=True, format=log_formatter)

# Create business loggers
douyin_logger = create_business_logger("douyin", "douyin.log")
tencent_logger = create_business_logger("tencent", "tencent.log")
xhs_logger = create_business_logger("xhs", "xhs.log")
bilibili_logger = create_business_logger("bilibili", "bilibili.log")
kuaishou_logger = create_business_logger("kuaishou", "kuaishou.log")
xiaohongshu_logger = create_business_logger("xiaohongshu", "xiaohongshu.log")
