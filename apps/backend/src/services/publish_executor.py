"""
Publish executor service for omni-post backend.

This module handles task execution for video publishing.
"""

import threading
import traceback
from pathlib import Path

from src.services.task_service import task_service
from src.utils.postVideo import post_video_tencent, post_video_DouYin, post_video_ks, post_video_xhs
from src.core.config import BASE_DIR


def run_publish_task(task_id, publish_data):
    """
    Execute publish task in a separate thread.
    Update task status in DB.
    """
    print(f"\n{'='*50}")
    print(f"[PUBLISH] Starting task {task_id}")
    print(f"{'='*50}")
    task_service.update_task_status(task_id, 'uploading', 0)

    try:
        # Extract data
        type = publish_data.get('type')
        title = publish_data.get('title')
        tags = publish_data.get('tags')
        file_list = publish_data.get('fileList', [])
        account_list = publish_data.get('accountList', [])
        category = publish_data.get('category')
        if category == 0: category = None
        enableTimer = publish_data.get('enableTimer')
        videos_per_day = publish_data.get('videosPerDay')
        daily_times = publish_data.get('dailyTimes')
        start_days = publish_data.get('startDays')
        productLink = publish_data.get('productLink', '')
        productTitle = publish_data.get('productTitle', '')
        thumbnail_path = publish_data.get('thumbnail', '')
        is_draft = publish_data.get('isDraft', False)

        # Debug logging
        platform_names = {1: '小红书', 2: '视频号', 3: '抖音', 4: '快手'}
        print(f"[PUBLISH] Platform: {platform_names.get(type, f'Unknown({type})')}")
        print(f"[PUBLISH] Title: {title}")
        print(f"[PUBLISH] Tags: {tags}")
        print(f"[PUBLISH] File list: {file_list}")
        print(f"[PUBLISH] Account list: {account_list}")
        print(f"[PUBLISH] Enable timer: {enableTimer}")

        # Validate files exist
        video_dir = Path(BASE_DIR / "videoFile")
        cookie_dir = Path(BASE_DIR / "cookiesFile")

        print(f"\n[VALIDATE] Checking video files in: {video_dir}")
        for f in file_list:
            file_path = video_dir / f
            if file_path.exists():
                print(f"  ✓ Video exists: {f}")
            else:
                print(f"  ✗ Video MISSING: {f}")
                raise FileNotFoundError(f"Video file not found: {file_path}")

        print(f"\n[VALIDATE] Checking cookie files in: {cookie_dir}")
        for acc in account_list:
            acc_path = cookie_dir / acc
            if acc_path.exists():
                print(f"  ✓ Cookie exists: {acc}")
            else:
                print(f"  ✗ Cookie MISSING: {acc}")
                raise FileNotFoundError(f"Cookie file not found: {acc_path}")

        print(f"\n[PUBLISH] All validations passed. Starting upload...")

        # Call appropriate uploader
        match type:
            case 1:
                post_video_xhs(title, file_list, tags, account_list, category, enableTimer, videos_per_day, daily_times, start_days)
            case 2:
                post_video_tencent(title, file_list, tags, account_list, category, enableTimer, videos_per_day, daily_times, start_days, is_draft)
            case 3:
                post_video_DouYin(title, file_list, tags, account_list, category, enableTimer, videos_per_day, daily_times, start_days, thumbnail_path, productLink, productTitle)
            case 4:
                post_video_ks(title, file_list, tags, account_list, category, enableTimer, videos_per_day, daily_times, start_days)
            case _:
                raise ValueError(f"Unknown platform type: {type}")

        # If successful
        print(f"\n[PUBLISH] Task {task_id} completed successfully!")
        task_service.update_task_status(task_id, 'completed', 100)

    except Exception as e:
        print(f"\n[PUBLISH] Task {task_id} FAILED: {e}")
        traceback.print_exc()
        task_service.update_task_status(task_id, 'failed', error_msg=str(e))


def start_publish_thread(task_id, publish_data):
    """Start the publish task in a daemon thread"""
    thread = threading.Thread(target=run_publish_task, args=(task_id, publish_data))
    thread.daemon = True
    thread.start()
