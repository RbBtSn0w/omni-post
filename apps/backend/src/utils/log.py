from pathlib import Path
from sys import stdout
from loguru import logger

from src.conf import BASE_DIR


def log_formatter(record: dict) -> str:
    """
    Formatter for log records.
    :param dict record: Log object containing log metadata & message.
    :returns: str
    """
    colors = {
        "TRACE": "#cfe2f3",
        "INFO": "#9cbfdd",
        "DEBUG": "#8598ea",
        "WARNING": "#dcad5a",
        "SUCCESS": "#3dd08d",
        "ERROR": "#ae2c2c"
    }
    color = colors.get(record["level"].name, "#b3cfe7")
    return f"<fg #70acde>{{time:YYYY-MM-DD HH:mm:ss}}</fg #70acde> | <fg {color}>{{level}}</fg {color}>: <light-white>{{message}}</light-white>\n"


def create_logger(log_name: str, file_path: str):
    """
    Create custom logger for different business modules.
    :param str log_name: name of log
    :param str file_path: Optional path to log file
    :returns: Configured logger
    """
    def filter_record(record):
        return record["extra"].get("business_name") == log_name

    try:
        # 构建完整的日志文件路径
        full_file_path = Path(BASE_DIR / file_path)
        # 获取日志文件所在的目录
        log_dir = full_file_path.parent

        # 确保日志目录存在，包括必要的父目录
        log_dir.mkdir(parents=True, exist_ok=True)

        # 添加日志处理器
        logger.add(full_file_path, filter=filter_record, level="INFO", rotation="10 MB", retention="10 days", backtrace=True, diagnose=True)
        return logger.bind(business_name=log_name)
    except Exception as e:
        # 记录目录创建失败的错误，并返回控制台日志记录器作为备选
        logger.error(f"创建日志目录或文件失败: {str(e)}")
        logger.error(f"日志文件路径: {file_path}")
        logger.error(f"请检查目录权限和路径配置")
        # 返回控制台日志记录器，确保程序不会因为日志问题而崩溃
        return logger.bind(business_name=log_name)


# Remove all existing handlers
logger.remove()
# Add a standard console handler
logger.add(stdout, colorize=True, format=log_formatter)

douyin_logger = create_logger('douyin', 'logs/douyin.log')
tencent_logger = create_logger('tencent', 'logs/tencent.log')
xhs_logger = create_logger('xhs', 'logs/xhs.log')
bilibili_logger = create_logger('bilibili', 'logs/bilibili.log')
kuaishou_logger = create_logger('kuaishou', 'logs/kuaishou.log')
xiaohongshu_logger = create_logger('xiaohongshu', 'logs/xiaohongshu.log')
