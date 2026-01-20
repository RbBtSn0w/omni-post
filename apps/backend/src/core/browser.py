"""
Browser automation utilities for omni-post backend.

This module provides unified browser launch and configuration functions
for Playwright-based automation across all social media platforms.
"""

import datetime
from pathlib import Path
from typing import Optional

from playwright.async_api import Browser, BrowserContext, Page

from src.core.config import (
    BASE_DIR,
    DEBUG_MODE,
    LOCAL_CHROME_HEADLESS,
    LOCAL_CHROME_PATH,
    LOGS_DIR,
)

# Social media platform identifiers
SOCIAL_MEDIA_DOUYIN = "douyin"
SOCIAL_MEDIA_TENCENT = "tencent"
SOCIAL_MEDIA_KUAISHOU = "kuaishou"
SOCIAL_MEDIA_XIAOHONGSHU = "xiaohongshu"


def debug_print(*args, **kwargs):
    """Print only when DEBUG_MODE is enabled."""
    if DEBUG_MODE:
        print(*args, **kwargs)


async def set_init_script(context: BrowserContext) -> BrowserContext:
    """
    Apply stealth script to browser context to avoid detection.

    Args:
        context: Playwright browser context

    Returns:
        The same context with stealth script applied
    """
    stealth_js_path = Path(BASE_DIR / "utils" / "stealth.min.js")
    if stealth_js_path.exists():
        await context.add_init_script(path=stealth_js_path)
    else:
        debug_print(f"[WARN] Stealth script not found: {stealth_js_path}")
    return context


async def launch_browser(playwright, headless: Optional[bool] = None) -> Browser:
    """
    Launch browser with unified configuration.

    Args:
        playwright: Playwright instance
        headless: Override headless mode (default: use config)

    Returns:
        Launched browser instance
    """
    browser_args = [
        "--lang=en-GB",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.6613.100 Safari/537.36",
    ]

    launch_options = {
        "headless": headless if headless is not None else LOCAL_CHROME_HEADLESS,
        "args": browser_args,
    }

    if LOCAL_CHROME_PATH:
        debug_print(f"[DEBUG] 使用系统 Chrome: {LOCAL_CHROME_PATH}")
        launch_options["executable_path"] = LOCAL_CHROME_PATH
    else:
        debug_print("[DEBUG] 使用 Playwright 内置 Chromium")

    return await playwright.chromium.launch(**launch_options)


def create_screenshot_dir(platform: str) -> Path:
    """
    创建平台特定的会话截图目录

    Args:
        platform: 平台名称（如 'tencent', 'douyin', 'ks', 'xiaohongshu'）

    Returns:
        Path: 会话截图目录路径
    """
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
    screenshots_root = LOGS_DIR / "screenshots"
    screenshots_root.mkdir(exist_ok=True, parents=True)
    session_dir = screenshots_root / platform / timestamp
    session_dir.mkdir(exist_ok=True, parents=True)
    return session_dir


async def debug_screenshot(page: Page, session_dir: Path, filename: str, description: str = ""):
    """
    只在 DEBUG_MODE 开启时截图

    Args:
        page: Playwright 页面对象
        session_dir: 会话截图目录
        filename: 截图文件名
        description: 截图描述信息
    """
    if not DEBUG_MODE:
        return

    if not filename.lower().endswith(".png"):
        filename = f"{filename}.png"

    screenshot_path = session_dir / filename

    try:
        await page.screenshot(
            path=screenshot_path, timeout=10000, omit_background=True, animations="disabled"
        )
        debug_print(
            f"[DEBUG] 截图保存: {screenshot_path}" + (f" - {description}" if description else "")
        )
    except Exception as e:
        debug_print(f"[DEBUG] 截图失败: {screenshot_path} - {e}")
