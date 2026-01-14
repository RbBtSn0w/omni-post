"""
后台定时任务：预验证即将过期的 Cookie
可通过 APScheduler 或 Flask-APScheduler 集成到应用中

使用方式：
  from src.utils.cookie_scheduler import start_cookie_validation_scheduler
  start_cookie_validation_scheduler(app)
"""
import asyncio
import sqlite3
from datetime import datetime, timedelta
from typing import Optional
import threading
import time

from src.db.db_manager import db_manager


# 配置参数
VALIDATION_INTERVAL_HOURS = 4  # 每隔多少小时检查一次
COOKIE_EXPIRE_HOURS = 24  # Cookie 多久未验证视为需要预验证
MAX_CONCURRENT_VALIDATIONS = 2  # 最大并发验证数


def get_accounts_needing_validation(hours_threshold: int = COOKIE_EXPIRE_HOURS) -> list:
    """
    获取需要预验证的账号列表
    条件：last_validated_at 超过指定小时数 或 从未验证过
    """
    with sqlite3.connect(db_manager.get_db_path()) as conn:
        cursor = conn.cursor()

        # 计算阈值时间点
        threshold_time = datetime.now() - timedelta(hours=hours_threshold)
        threshold_str = threshold_time.strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute('''
            SELECT id, type, filePath, userName, status, last_validated_at
            FROM user_info
            WHERE last_validated_at IS NULL
               OR last_validated_at < ?
            ORDER BY last_validated_at ASC NULLS FIRST
        ''', (threshold_str,))

        return cursor.fetchall()


async def validate_single_account(account_id: int, account_type: int, file_path: str):
    """异步验证单个账号"""
    from src.utils import auth

    try:
        print(f"🔄 [定时任务] 预验证账号 ID={account_id}, type={account_type}")
        flag = await auth.check_cookie(account_type, file_path)

        # 更新数据库状态
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            status = 1 if flag else 0
            cursor.execute('''
                UPDATE user_info
                SET status = ?, last_validated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (status, account_id))
            conn.commit()

        status_text = "✅ 有效" if flag else "❌ 无效"
        print(f"   账号 ID={account_id}: {status_text}")

        return flag

    except Exception as e:
        print(f"   账号 ID={account_id} 验证失败: {e}")
        return None


async def run_scheduled_validation():
    """执行定时验证任务"""
    print(f"\n{'='*50}")
    print(f"🕐 [定时任务] 开始 Cookie 预验证 - {datetime.now()}")
    print(f"{'='*50}")

    accounts = get_accounts_needing_validation()

    if not accounts:
        print("✓ 没有需要预验证的账号")
        return

    print(f"📋 发现 {len(accounts)} 个账号需要预验证")

    # 使用信号量限制并发数
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_VALIDATIONS)

    async def validate_with_semaphore(account):
        async with semaphore:
            account_id, account_type, file_path, user_name, status, last_validated = account
            await validate_single_account(account_id, account_type, file_path)
            # 添加小延迟避免过快请求
            await asyncio.sleep(2)

    # 并发验证所有账号
    tasks = [validate_with_semaphore(account) for account in accounts]
    await asyncio.gather(*tasks)

    print(f"\n✅ [定时任务] Cookie 预验证完成 - {datetime.now()}")


def validation_loop(interval_hours: int = VALIDATION_INTERVAL_HOURS):
    """
    在后台线程中运行的验证循环
    """
    interval_seconds = interval_hours * 3600

    while True:
        try:
            # 运行异步验证任务
            asyncio.run(run_scheduled_validation())
        except Exception as e:
            print(f"❌ [定时任务] 验证循环出错: {e}")

        # 等待下次执行
        print(f"⏳ [定时任务] 下次验证将在 {interval_hours} 小时后进行")
        time.sleep(interval_seconds)


def start_cookie_validation_scheduler(interval_hours: int = VALIDATION_INTERVAL_HOURS):
    """
    启动 Cookie 验证定时任务（在后台线程中运行）

    Args:
        interval_hours: 验证间隔（小时）
    """
    print(f"🚀 启动 Cookie 预验证定时任务 (间隔: {interval_hours} 小时)")

    thread = threading.Thread(
        target=validation_loop,
        args=(interval_hours,),
        daemon=True,  # 守护线程，主程序退出时自动结束
        name="CookieValidationScheduler"
    )
    thread.start()

    return thread


# 可选：手动触发一次验证
def trigger_validation_now():
    """手动触发一次验证（阻塞）"""
    asyncio.run(run_scheduled_validation())


if __name__ == '__main__':
    # 直接运行时执行一次验证
    trigger_validation_now()
