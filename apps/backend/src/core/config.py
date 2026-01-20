"""
Core configuration module for omni-post backend.

This module centralizes all configuration settings.
"""

import platform
import sys
from pathlib import Path

# Directory paths
BASE_DIR = Path(__file__).parent.parent.resolve()  # src/
ROOT_DIR = BASE_DIR.parent  # apps/backend/
DATA_DIR = ROOT_DIR / "data"
COOKIES_DIR = DATA_DIR / "cookies"
VIDEOS_DIR = DATA_DIR / "videos"
LOGS_DIR = DATA_DIR / "logs"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
COOKIES_DIR.mkdir(exist_ok=True)
VIDEOS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# File upload settings
MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500MB

# Server settings
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 5409
XHS_SERVER = "http://127.0.0.1:11901"

# Debug / Test mode switches
DEBUG_MODE = True  # Set to True to enable debug logs and screenshots
TEST_MODE = False  # Default off, tests will patch as needed

# Mock configuration (for test patching)
MOCK_CONFIG = {"login_status": False, "cookie_valid": False}

# Chrome browser path configuration
if platform.system() == "Windows":
    LOCAL_CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe"
elif platform.system() == "Darwin":
    LOCAL_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else:
    LOCAL_CHROME_PATH = "/usr/bin/google-chrome"

# Headless mode setting
LOCAL_CHROME_HEADLESS = True


# Browser info logging (moved to avoid execution during import)
# Call log_browser_info() explicitly from app startup if needed
def log_browser_info():
    """Log browser configuration information at startup."""
    if not TEST_MODE:
        if LOCAL_CHROME_PATH is None:
            print("📌 使用 Playwright 自带的 Chromium 浏览器")
            print("💡 如需使用系统 Chrome，请修改 conf.py 中的 LOCAL_CHROME_PATH")
        else:
            if not Path(LOCAL_CHROME_PATH).exists():
                print(f"⚠️  警告：Chrome 路径不存在: {LOCAL_CHROME_PATH}")
                print("💡 建议将 LOCAL_CHROME_PATH 设置为 None 以使用 Playwright 自带的 Chromium")
            else:
                print(f"📌 使用系统 Chrome: {LOCAL_CHROME_PATH}")


# Register module alias for test patching compatibility
sys.modules.setdefault("conf", sys.modules.get("src.conf", sys.modules.get(__name__)))
