import asyncio
from playwright.async_api import async_playwright
from src.conf import LOCAL_CHROME_HEADLESS, LOCAL_CHROME_PATH, DEBUG_MODE
from src.utils.base_social_media import set_init_script


def debug_print(*args, **kwargs):
    """只在 DEBUG_MODE 开启时打印"""
    if DEBUG_MODE:
        print(*args, **kwargs)


async def launch_browser(playwright):
    """统一的浏览器启动函数"""
    # 使用更多浏览器参数，模拟真实浏览器环境
    browser_args = [
        '--lang=en-GB',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.6613.100 Safari/537.36'
    ]
    launch_options = {
        'headless': LOCAL_CHROME_HEADLESS,
        'args': browser_args
    }
    
    if LOCAL_CHROME_PATH:
        debug_print(f"[DEBUG] 使用系统 Chrome: {LOCAL_CHROME_PATH}")
        launch_options['executable_path'] = LOCAL_CHROME_PATH
    else:
        debug_print("[DEBUG] 使用 Playwright 内置 Chromium")
    
    return await playwright.chromium.launch(**launch_options)
