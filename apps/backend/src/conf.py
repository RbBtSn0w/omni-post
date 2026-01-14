import os
import platform
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
XHS_SERVER = "http://127.0.0.1:11901"

# Debug / Test 模式开关（可在测试中通过 monkeypatch 覆盖）
DEBUG_MODE = True  # 设置为 True 开启调试日志和截图
TEST_MODE = False  # 默认关闭测试模式，测试用例会按需 patch

# Mock 配置（用于测试中 patch）
MOCK_CONFIG = {
    'login_status': False,
    'cookie_valid': False
}

# Chrome 浏览器路径配置
# LOCAL_CHROME_PATH = None  # 使用 Playwright 内置 Chromium
if platform.system() == "Windows":
    # Windows 环境
    LOCAL_CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe" # change me if necessary！

elif platform.system() == "Darwin":
    # macOS 环境
    LOCAL_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" # change me if necessary

else:
    # linux environment
    LOCAL_CHROME_PATH = "/usr/bin/google-chrome"  # change me if necessary！ for example /usr/bin/google-chrome


# 是否以无界面模式运行 Chrome
LOCAL_CHROME_HEADLESS = True  # 生产模式：使用 headless



# 提示信息
if LOCAL_CHROME_PATH is None:
    print("📌 使用 Playwright 自带的 Chromium 浏览器")
    print("💡 如需使用系统 Chrome，请修改 conf.py 中的 LOCAL_CHROME_PATH")
else:
    if not Path(LOCAL_CHROME_PATH).exists():
        print(f"⚠️  警告：Chrome 路径不存在: {LOCAL_CHROME_PATH}")
        print("💡 建议将 LOCAL_CHROME_PATH 设置为 None 以使用 Playwright 自带的 Chromium")
    else:
        print(f"📌 使用系统 Chrome: {LOCAL_CHROME_PATH}")

    # 为了便于测试补丁，将模块别名注册为顶级 "conf"
    sys.modules.setdefault("conf", sys.modules[__name__])