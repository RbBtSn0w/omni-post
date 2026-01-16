"""
Login implementation service for omni-post backend.

This module provides login functionality for all supported platforms.
"""

import asyncio
import datetime
import logging
import sqlite3
import uuid
import sys
from pathlib import Path

from playwright.async_api import async_playwright

from src.core.config import BASE_DIR, DEBUG_MODE, LOGS_DIR, COOKIES_DIR
from src.core.browser import launch_browser, set_init_script
from src.db.db_manager import db_manager
from src.services.cookie_service import get_cookie_service


# Helper functions
def debug_print(*args, **kwargs):
    """Print only when DEBUG_MODE is enabled."""
    if DEBUG_MODE:
        print(*args, **kwargs)


def create_screenshot_dir(platform: str) -> Path:
    """Create platform-specific session screenshot directory."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
    screenshots_root = LOGS_DIR / "screenshots"
    screenshots_root.mkdir(exist_ok=True, parents=True)
    session_dir = screenshots_root / platform / timestamp
    session_dir.mkdir(exist_ok=True, parents=True)
    return session_dir


async def debug_screenshot(page, session_dir: Path, filename: str, description: str = ""):
    """Take screenshot if DEBUG_MODE is enabled."""
    if not DEBUG_MODE:
        return

    if not filename.lower().endswith('.png'):
        filename = f"{filename}.png"

    screenshot_path = session_dir / filename

    try:
        await page.screenshot(
            path=screenshot_path,
            timeout=10000,
            omit_background=True,
            animations="disabled"
        )
        print(f"[DEBUG] 截图保存: {screenshot_path}" + (f" - {description}" if description else ""))
    except Exception as e:
        print(f"[DEBUG] 截图失败: {screenshot_path} - {e}")


def get_or_create_group(cursor, group_name):
    """Get or create account group ID."""
    if not group_name:
        return None

    cursor.execute('SELECT id FROM account_groups WHERE name = ?', (group_name,))
    result = cursor.fetchone()
    if result:
        return result[0]

    cursor.execute('INSERT INTO account_groups (name, description) VALUES (?, ?)',
                   (group_name, f'自动创建的组: {group_name}'))
    return cursor.lastrowid


async def douyin_cookie_gen(id, status_queue, group_name=None):
    """Douyin login implementation."""
    url_changed_event = asyncio.Event()
    screenshot_dir = create_screenshot_dir("douyin")

    async def on_url_change():
        if page.url != original_url:
            debug_print(f"[DEBUG] 原页面URL变化: {original_url} -> {page.url}")
            await debug_screenshot(page, screenshot_dir, "original_page_url_changed.png", "原页面URL变化后")
            url_changed_event.set()

    async with async_playwright() as playwright:
        browser = await launch_browser(playwright)
        context = await browser.new_context()
        context = await set_init_script(context)
        page = await context.new_page()

        await debug_screenshot(page, screenshot_dir, "before_navigation.png", "导航前")
        await page.goto("https://creator.douyin.com/")
        original_url = page.url
        debug_print(f"[DEBUG] 页面加载完成: {original_url}")

        await debug_screenshot(page, screenshot_dir, "after_navigation.png", "导航后")
        img_locator = page.get_by_role("img", name="二维码")
        await debug_screenshot(page, screenshot_dir, "qrcode_displayed.png", "二维码显示后")

        src = await img_locator.get_attribute("src")
        print("✅ 图片地址:", src)
        status_queue.put(src)

        page.on('framenavigated',
                lambda frame: asyncio.create_task(on_url_change()) if frame == page.main_frame else None)

        try:
            await asyncio.wait_for(url_changed_event.wait(), timeout=30)
            debug_print("[DEBUG] 抖音登录检测成功")
        except asyncio.TimeoutError:
            error_msg = "抖音登录页面跳转监听超时"
            print(error_msg)
            await page.close()
            await context.close()
            await browser.close()
            status_queue.put("500")
            return {'success': False, 'error': 'TIMEOUT', 'message': error_msg}

        uuid_v1 = uuid.uuid1()
        print(f"UUID v1: {uuid_v1}")
        cookies_dir = COOKIES_DIR
        cookies_dir.mkdir(exist_ok=True, parents=True)
        await context.storage_state(path=cookies_dir / f"{uuid_v1}.json")

        result = await get_cookie_service().check_cookie(3, f"{uuid_v1}.json")
        if not result:
            status_queue.put("500")
            await page.close()
            await context.close()
            await browser.close()
            return None

        await page.close()
        await context.close()
        await browser.close()

        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            group_id = get_or_create_group(cursor, group_name)
            cursor.execute('''
                INSERT INTO user_info (type, filePath, userName, status, group_id, created_at, last_validated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT(type, userName) DO UPDATE SET
                    filePath = excluded.filePath,
                    status = excluded.status,
                    group_id = COALESCE(excluded.group_id, user_info.group_id),
                    last_validated_at = CURRENT_TIMESTAMP
            ''', (3, f"{uuid_v1}.json", id, 1, group_id))
            conn.commit()
            print("✅ 用户状态已记录")

        status_queue.put("200")


async def get_tencent_cookie(id, status_queue, group_name=None):
    """Tencent Video login implementation."""
    screenshot_dir = create_screenshot_dir("tencent")
    url_changed_event = asyncio.Event()

    async def on_url_change():
        if page.url != original_url:
            debug_print(f"[DEBUG] 原页面URL变化: {original_url} -> {page.url}")
            await debug_screenshot(page, screenshot_dir, "original_page_url_changed.png", "原页面URL变化后")
            url_changed_event.set()

    async with async_playwright() as playwright:
        browser = await launch_browser(playwright)
        context = await browser.new_context()
        context = await set_init_script(context)
        page = await context.new_page()

        await debug_screenshot(page, screenshot_dir, "before_navigation.png", "导航前")
        await page.goto("https://channels.weixin.qq.com")
        original_url = page.url
        debug_print(f"[DEBUG] 页面加载完成: {original_url}")
        await debug_screenshot(page, screenshot_dir, "after_navigation.png", "导航后")

        async def on_new_page(new_page):
            debug_print(f"[DEBUG] 新窗口创建，URL：{new_page.url}")
            await debug_screenshot(new_page, screenshot_dir, "new_window_created.png", "新窗口创建时")

            async def on_new_page_load():
                debug_print(f"[DEBUG] 新窗口加载完成，URL：{new_page.url}")
                await debug_screenshot(new_page, screenshot_dir, "new_window_loaded.png", "新窗口加载完成后")
                url_changed_event.set()

            async def on_new_page_navigate(frame):
                if frame == new_page.main_frame:
                    debug_print(f"[DEBUG] 新窗口导航，当前URL：{frame.url}")
                    await debug_screenshot(new_page, screenshot_dir, "new_window_navigated.png", "新窗口导航后")
                    url_changed_event.set()

            new_page.on('load', lambda: asyncio.create_task(on_new_page_load()))
            new_page.on('framenavigated', lambda frame: asyncio.create_task(on_new_page_navigate(frame)))

        context.on('page', lambda new_page: asyncio.create_task(on_new_page(new_page)))

        async def _on_frame_navigated(frame):
            timestamp = datetime.datetime.now().strftime("%H%M%S_%f")[:-3]
            if frame == page.main_frame:
                debug_print(f"[DEBUG] 主窗口framenavigated事件触发，当前URL：{frame.url}")
                await debug_screenshot(page, screenshot_dir, f"framenavigated_main_frame_{timestamp}.png", "主框架导航后")
                await on_url_change()
            else:
                debug_print(f"[DEBUG] 主窗口framenavigated事件触发（子框架），当前URL：{frame.url}")
                await debug_screenshot(page, screenshot_dir, f"framenavigated_sub_frame_{timestamp}.png", f"子框架导航后: {frame.url}")

        page.on('framenavigated', lambda frame: asyncio.create_task(_on_frame_navigated(frame)))

        iframe_locator = page.frame_locator("iframe").first
        img_locator = iframe_locator.get_by_role("img").first

        await debug_screenshot(page, screenshot_dir, "qrcode_displayed.png", "二维码显示后")
        src = await img_locator.get_attribute("src")
        print("✅ 图片地址:", src)
        status_queue.put(src)

        try:
            debug_print("[DEBUG] 开始等待URL变化或登录成功标志...")
            await asyncio.wait_for(url_changed_event.wait(), timeout=30)
            debug_print("[DEBUG] 监听页面跳转或登录检测成功")
        except asyncio.TimeoutError:
            status_queue.put("500")
            error_msg = "监听页面跳转超时，登录失败"
            print(error_msg)
            await debug_screenshot(page, screenshot_dir, "url_change_timeout.png", "URL变化监听超时")
            logging.error(error_msg, extra={'platform': 'tencent', 'screenshot_dir': screenshot_dir, 'user_id': id})
            return {'success': False, 'error': 'TIMEOUT', 'message': error_msg}

        uuid_v1 = uuid.uuid1()
        debug_print(f"[DEBUG] UUID v1: {uuid_v1}")
        cookies_dir = COOKIES_DIR
        cookies_dir.mkdir(exist_ok=True, parents=True)
        await context.storage_state(path=cookies_dir / f"{uuid_v1}.json")
        debug_print(f"[DEBUG] Cookie 保存到: {cookies_dir / f'{uuid_v1}.json'}")

        result = await get_cookie_service().check_cookie(2, f"{uuid_v1}.json")
        if not result:
            status_queue.put("500")
            error_msg = "Cookie验证失败，登录状态无效"
            print(error_msg)
            logging.error(error_msg, extra={'platform': 'tencent', 'cookie_file': f"{uuid_v1}.json", 'screenshot_dir': screenshot_dir, 'user_id': id})
            return {}

        await page.close()
        await context.close()
        await browser.close()
        debug_print("[DEBUG] 浏览器资源已释放")

        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            group_id = get_or_create_group(cursor, group_name)
            cursor.execute('''
                INSERT INTO user_info (type, filePath, userName, status, group_id, created_at, last_validated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT(type, userName) DO UPDATE SET
                    filePath = excluded.filePath,
                    status = excluded.status,
                    group_id = COALESCE(excluded.group_id, user_info.group_id),
                    last_validated_at = CURRENT_TIMESTAMP
            ''', (2, f"{uuid_v1}.json", id, 1, group_id))
            conn.commit()
            debug_print(f"[DEBUG] 用户状态已记录到数据库，user_id: {id}")
            print("✅ 用户状态已记录")

        status_queue.put("200")
        logging.info("腾讯视频号登录成功", extra={'platform': 'tencent', 'user_id': id, 'cookie_file': f"{uuid_v1}.json", 'screenshot_dir': screenshot_dir})
        return {}


async def get_ks_cookie(id, status_queue, group_name=None):
    """Kuaishou login implementation."""
    url_changed_event = asyncio.Event()

    async def log_with_timestamp(message, level="DEBUG"):
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        if level == "DEBUG":
            debug_print(f"[{timestamp}] [DEBUG] {message}")
        else:
            print(f"[{timestamp}] [{level}] {message}")

    async def on_url_change(frame):
        if frame != page.main_frame:
            return

        current_url = frame.url
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        debug_print(f"[{timestamp}] [DEBUG] URL变化检测 - 当前URL: {current_url}")
        debug_print(f"[{timestamp}] [DEBUG] URL变化检测 - 原始URL: {original_url}")

        if "cp.kuaishou.com/profile" in current_url:
            await log_with_timestamp(f"检测到跳转到profile页面: {current_url}")
            login_success = await verify_login_success(page, log_with_timestamp)
            if login_success:
                await log_with_timestamp("基于页面内容验证：登录成功")
                url_changed_event.set()
                return

        if current_url != original_url:
            await log_with_timestamp(f"页面URL变化: {original_url} -> {current_url}")
            login_success = await verify_login_success(page, log_with_timestamp)
            if login_success:
                await log_with_timestamp("基于页面内容验证：登录成功")
                url_changed_event.set()

    async def verify_login_success(page, log_func):
        try:
            await log_func("开始基于页面内容验证登录状态...")
            await page.wait_for_load_state("networkidle", timeout=5000)
            page_title = await page.title()
            await log_func(f"当前页面标题: {page_title}")

            try:
                avatar_locator = page.get_by_role("img").filter(has_attribute="class", containing="avatar")
                if await avatar_locator.count() > 0:
                    await log_func("检测到用户头像，可能登录成功")
                    return True
            except Exception as e:
                await log_func(f"检查头像元素时出错: {e}")

            try:
                publish_locator = page.get_by_role("button").filter(has_text="发布")
                if await publish_locator.count() > 0:
                    await log_func("检测到发布按钮，可能登录成功")
                    return True
            except Exception as e:
                await log_func(f"检查发布按钮时出错: {e}")

            try:
                user_info_locator = page.locator(".user-info")
                if await user_info_locator.count() > 0:
                    await log_func("检测到用户信息，可能登录成功")
                    return True
            except Exception as e:
                await log_func(f"检查用户信息元素时出错: {e}")

            try:
                login_text_locator = page.get_by_text("扫码登录")
                if await login_text_locator.count() == 0:
                    await log_func("未检测到扫码登录文本，可能登录成功")
                    if "cp.kuaishou.com/profile" in page.url:
                        await log_func("检测到profile页面且无登录文本，登录成功")
                        return True
            except Exception as e:
                await log_func(f"检查登录文本时出错: {e}")

            await log_func("基于页面内容验证：未确认登录成功")
            return False
        except Exception as e:
            await log_func(f"登录验证过程出错: {e}", "ERROR")
            return False

    async with async_playwright() as playwright:
        browser = await launch_browser(playwright)
        context = await browser.new_context()
        context = await set_init_script(context)
        page = await context.new_page()

        page.on("request", lambda request: asyncio.create_task(log_with_timestamp(f"请求URL: {request.url}, 方法: {request.method}")) if ("cp.kuaishou.com" in request.url or "passport.kuaishou.com" in request.url) else None)
        page.on("response", lambda response: asyncio.create_task(log_with_timestamp(f"响应URL: {response.url}, 状态码: {response.status}")) if ("cp.kuaishou.com" in response.url or "passport.kuaishou.com" in response.url) else None)

        initial_url = "https://cp.kuaishou.com"
        response = await page.goto(initial_url, wait_until="networkidle")
        original_url = page.url

        await page.get_by_role("link", name="立即登录").click()
        await page.get_by_text("扫码登录").click()

        img_locator = page.get_by_role("img", name="qrcode")
        src = await img_locator.get_attribute("src")
        print("✅ 图片地址:", src)
        status_queue.put(src)

        page.on('framenavigated', lambda frame: asyncio.create_task(on_url_change(frame)))
        page.on('load', lambda: asyncio.create_task(log_with_timestamp(f"页面加载完成事件触发，当前URL: {page.url}")))

        try:
            await asyncio.wait_for(url_changed_event.wait(), timeout=30)
            await log_with_timestamp("快手登录检测成功")
        except asyncio.TimeoutError:
            await log_with_timestamp("监听页面跳转超时，登录失败", "ERROR")
            status_queue.put("500")
            error_msg = "监听页面跳转超时，登录失败"
            print(error_msg)
            logging.error(error_msg, extra={'platform': 'kuaishou', 'user_id': id})
            return {'success': False, 'error': 'URL_CHANGE_TIMEOUT', 'message': error_msg}

        final_login_success = await verify_login_success(page, log_with_timestamp)
        if not final_login_success:
            await log_with_timestamp("最终页面内容验证失败", "ERROR")
            status_queue.put("500")
            return {'success': False, 'error': 'FINAL_VERIFICATION_FAILED', 'message': "登录成功后基于页面内容验证失败"}

        uuid_v1 = uuid.uuid1()
        cookies_dir = COOKIES_DIR
        cookies_dir.mkdir(exist_ok=True, parents=True)
        await context.storage_state(path=cookies_dir / f"{uuid_v1}.json")
        await log_with_timestamp(f"Cookie信息已保存到: {cookies_dir / f'{uuid_v1}.json'}")

        result = await get_cookie_service().check_cookie(4, f"{uuid_v1}.json")
        if not result:
            await log_with_timestamp("Cookie验证失败，登录状态无效", "ERROR")
            status_queue.put("500")
            error_msg = "Cookie验证失败，登录状态无效"
            print(error_msg)
            logging.error(error_msg, extra={'platform': 'kuaishou', 'cookie_file': f"{uuid_v1}.json", 'user_id': id})
            return {'success': False, 'error': 'COOKIE_VALIDATION_FAILED', 'message': error_msg}

        await page.close()
        await context.close()
        await browser.close()

        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            group_id = get_or_create_group(cursor, group_name)
            cursor.execute('''
                INSERT INTO user_info (type, filePath, userName, status, group_id, created_at, last_validated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT(type, userName) DO UPDATE SET
                    filePath = excluded.filePath,
                    status = excluded.status,
                    group_id = COALESCE(excluded.group_id, user_info.group_id),
                    last_validated_at = CURRENT_TIMESTAMP
            ''', (4, f"{uuid_v1}.json", id, 1, group_id))
            conn.commit()
            print("✅ 用户状态已记录")

        status_queue.put("200")


async def xiaohongshu_cookie_gen(id, status_queue, group_name=None):
    """Xiaohongshu login implementation."""
    url_changed_event = asyncio.Event()
    screenshot_dir = create_screenshot_dir("xiaohongshu")

    async def on_url_change():
        if page.url != original_url:
            debug_print(f"[DEBUG] 原页面URL变化: {original_url} -> {page.url}")
            await debug_screenshot(page, screenshot_dir, "original_page_url_changed.png", "原页面URL变化后")
            url_changed_event.set()

    async with async_playwright() as playwright:
        browser = await launch_browser(playwright)
        context = await browser.new_context()
        context = await set_init_script(context)
        page = await context.new_page()

        await debug_screenshot(page, screenshot_dir, "before_navigation.png", "导航前")
        await page.goto("https://creator.xiaohongshu.com/")
        original_url = page.url
        debug_print(f"[DEBUG] 页面加载完成: {original_url}")

        await debug_screenshot(page, screenshot_dir, "after_navigation.png", "导航后")
        await page.locator('img.css-wemwzq').click()
        await debug_screenshot(page, screenshot_dir, "after_login_click.png", "点击登录按钮后")

        img_locator = page.get_by_role("img").nth(2)
        await debug_screenshot(page, screenshot_dir, "qrcode_displayed.png", "二维码显示后")

        src = await img_locator.get_attribute("src")
        print("✅ 图片地址:", src)
        status_queue.put(src)

        page.on('framenavigated',
                lambda frame: asyncio.create_task(on_url_change()) if frame == page.main_frame else None)

        try:
            await asyncio.wait_for(url_changed_event.wait(), timeout=30)
            print("监听页面跳转成功")
        except asyncio.TimeoutError:
            error_msg = "小红书登录页面跳转监听超时"
            status_queue.put("500")
            print(error_msg)
            await page.close()
            await context.close()
            await browser.close()
            return {'success': False, 'error': 'TIMEOUT', 'message': error_msg}

        uuid_v1 = uuid.uuid1()
        print(f"UUID v1: {uuid_v1}")
        cookies_dir = COOKIES_DIR
        cookies_dir.mkdir(exist_ok=True, parents=True)
        await context.storage_state(path=cookies_dir / f"{uuid_v1}.json")

        result = await get_cookie_service().check_cookie(1, f"{uuid_v1}.json")
        if not result:
            status_queue.put("500")
            await page.close()
            await context.close()
            await browser.close()
            return None

        await page.close()
        await context.close()
        await browser.close()

        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            group_id = get_or_create_group(cursor, group_name)
            cursor.execute('''
                INSERT INTO user_info (type, filePath, userName, status, group_id, created_at, last_validated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT(type, userName) DO UPDATE SET
                    filePath = excluded.filePath,
                    status = excluded.status,
                    group_id = COALESCE(excluded.group_id, user_info.group_id),
                    last_validated_at = CURRENT_TIMESTAMP
            ''', (1, f"{uuid_v1}.json", id, 1, group_id))
            conn.commit()
            print("✅ 用户状态已记录")
        status_queue.put("200")
