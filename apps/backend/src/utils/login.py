import asyncio
import sqlite3
import datetime
import uuid
import logging
import traceback
import importlib
from pathlib import Path
from playwright.async_api import async_playwright

from src.utils.auth import check_cookie
from src.utils.base_social_media import set_init_script
from src.utils.browser import launch_browser
from src.db.db_manager import db_manager
from src.conf import BASE_DIR, LOCAL_CHROME_HEADLESS, LOCAL_CHROME_PATH, DEBUG_MODE

def get_or_create_group(cursor, group_name):
    """获取或创建组ID"""
    if not group_name:
        return None

    cursor.execute('SELECT id FROM account_groups WHERE name = ?', (group_name,))
    result = cursor.fetchone()
    if result:
        return result[0]

    cursor.execute('INSERT INTO account_groups (name, description) VALUES (?, ?)',
                   (group_name, f'自动创建的组: {group_name}'))
    return cursor.lastrowid

# 辅助函数：条件性打印调试信息
def debug_print(*args, **kwargs):
    """只在 DEBUG_MODE 开启时打印"""
    if DEBUG_MODE:
        print(*args, **kwargs)

# 优化：移除测试模式配置检查函数，改用依赖注入方式
# 优化：所有测试相关的模拟逻辑已迁移到MockLoginService

# 辅助函数：创建会话截图目录
def create_screenshot_dir(platform: str):
    """创建平台特定的会话截图目录

    Args:
        platform: 平台名称（如 'tencent', 'douyin', 'ks', 'xiaohongshu'）

    Returns:
        Path: 会话截图目录路径
    """
    # 获取当前时间戳（精确到毫秒），用于创建唯一的会话目录
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]

    # 创建截图根目录
    screenshots_root = Path(BASE_DIR / "logs" / "screenshots")
    screenshots_root.mkdir(exist_ok=True, parents=True)

    # 创建平台特定的会话目录
    session_dir = screenshots_root / platform / timestamp
    session_dir.mkdir(exist_ok=True, parents=True)

    return session_dir

# 辅助函数：条件性截图
async def debug_screenshot(page, session_dir: Path, filename: str, description: str = ""):
    """只在 DEBUG_MODE 开启时截图

    Args:
        page: Playwright 页面对象
        session_dir: 会话截图目录
        filename: 截图文件名
        description: 截图描述信息
    """
    # 动态读取DEBUG_MODE，以便在测试中可以patch
    import importlib
    conf = importlib.import_module("conf")
    if not getattr(conf, "DEBUG_MODE", False):
        return

    # 确保文件名有 .png 后缀
    if not filename.lower().endswith('.png'):
        filename = f"{filename}.png"

    # 构造完整的截图路径
    screenshot_path = session_dir / filename

    try:
        # 设置较短的超时时间，并禁用字体加载等待，提高截图成功率
        await page.screenshot(
            path=screenshot_path,
            timeout=10000,  # 10秒超时
            omit_background=True,  # 省略背景，提高截图速度
            animations="disabled"  # 禁用动画，提高截图稳定性
        )
        print(f"[DEBUG] 截图保存: {screenshot_path}" + (f" - {description}" if description else ""))
    except Exception as e:
        # 截图失败时记录错误，但不中断程序
        print(f"[DEBUG] 截图失败: {screenshot_path} - {e}")



# 抖音登录
async def douyin_cookie_gen(id, status_queue, group_name=None):
    # 优化：移除测试模式检查，改用依赖注入方式

    url_changed_event = asyncio.Event()

    # 创建会话截图目录
    screenshot_dir = create_screenshot_dir("douyin")

    async def on_url_change():
        """
        监听原页面URL变化的回调函数

        仅处理主框架的导航变化，避免iframe等子框架变化的干扰
        当URL发生变化时，记录日志、截图并设置事件信号
        """
        # 检查是否是主框架的变化
        if page.url != original_url:
            debug_print(f"[DEBUG] 原页面URL变化: {original_url} -> {page.url}")
            await debug_screenshot(page, screenshot_dir, "original_page_url_changed.png", "原页面URL变化后")
            url_changed_event.set()

    async with async_playwright() as playwright:
        browser = await launch_browser(playwright)
        # Setup context however you like.
        context = await browser.new_context()  # Pass any options
        context = await set_init_script(context)
        # Pause the page, and start recording manually.
        page = await context.new_page()

        # 页面加载前的截图
        await debug_screenshot(page, screenshot_dir, "before_navigation.png", "导航前")

        await page.goto("https://creator.douyin.com/")
        original_url = page.url
        debug_print(f"[DEBUG] 页面加载完成: {original_url}")

        # 页面加载后的截图
        await debug_screenshot(page, screenshot_dir, "after_navigation.png", "导航后")

        img_locator = page.get_by_role("img", name="二维码")

        # 二维码出现后的截图
        await debug_screenshot(page, screenshot_dir, "qrcode_displayed.png", "二维码显示后")

        # 获取 src 属性值
        src = await img_locator.get_attribute("src")
        print("✅ 图片地址:", src)
        status_queue.put(src)
        # 监听页面的 'framenavigated' 事件，只关注主框架的变化
        page.on('framenavigated',
                lambda frame: asyncio.create_task(on_url_change()) if frame == page.main_frame else None)
        try:
            # 优化：使用合理的超时时间（30秒），适合生产和测试环境
            # 优化：添加明确的超时日志和错误处理
            await asyncio.wait_for(url_changed_event.wait(), timeout=30)  # 优化：最多等待 30 秒
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
        # 确保cookiesFile目录存在
        cookies_dir = Path(BASE_DIR / "cookiesFile")
        cookies_dir.mkdir(exist_ok=True)
        await context.storage_state(path=cookies_dir / f"{uuid_v1}.json")
        result = await check_cookie(3, f"{uuid_v1}.json")
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
            # 获取组ID
            group_id = get_or_create_group(cursor, group_name)

            # 使用 UPSERT：如果已存在相同 type+userName 的记录，则更新 filePath 和 status
            # 登录成功后设置 last_validated_at，避免 getValidAccounts 重复验证
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


# 视频号登录
async def get_tencent_cookie(id, status_queue, group_name=None):
    # 优化：移除测试模式检查，改用依赖注入方式

    # 创建会话截图目录
    screenshot_dir = create_screenshot_dir("tencent")

    url_changed_event = asyncio.Event()
    async def on_url_change():
        # 检查是否是主框架的变化
        if page.url != original_url:
            debug_print(f"[DEBUG] 原页面URL变化: {original_url} -> {page.url}")
            await debug_screenshot(page, screenshot_dir, "original_page_url_changed.png", "原页面URL变化后")
            url_changed_event.set()

    async with async_playwright() as playwright:
        # Make sure to run headed.
        browser = await launch_browser(playwright)
        # Setup context however you like.
        context = await browser.new_context()  # Pass any options
        # Pause the page, and start recording manually.
        context = await set_init_script(context)
        page = await context.new_page()

        # 页面加载前的截图
        await debug_screenshot(page, screenshot_dir, "before_navigation.png", "导航前")

        await page.goto("https://channels.weixin.qq.com")
        original_url = page.url
        debug_print(f"[DEBUG] 页面加载完成: {original_url}")

        # 页面加载后的截图
        await debug_screenshot(page, screenshot_dir, "after_navigation.png", "导航后")

        # 监听新页面创建事件（处理扫码后新窗口打开的场景）
        async def on_new_page(new_page):
            debug_print(f"[DEBUG] 新窗口创建，URL：{new_page.url}")
            # 为新页面添加截图
            await debug_screenshot(new_page, screenshot_dir, "new_window_created.png", "新窗口创建时")

            # 监听新页面的加载完成事件
            async def on_new_page_load():
                debug_print(f"[DEBUG] 新窗口加载完成，URL：{new_page.url}")
                await debug_screenshot(new_page, screenshot_dir, "new_window_loaded.png", "新窗口加载完成后")
                # 检测新窗口是否包含登录成功的特征，或直接触发登录成功事件
                url_changed_event.set()

            # 监听新页面的导航事件
            async def on_new_page_navigate(frame):
                if frame == new_page.main_frame:
                    debug_print(f"[DEBUG] 新窗口导航，当前URL：{frame.url}")
                    await debug_screenshot(new_page, screenshot_dir, "new_window_navigated.png", "新窗口导航后")
                    # 检测导航后的URL是否包含登录成功特征
                    url_changed_event.set()

            # 注册新页面的事件监听器
            new_page.on('load', lambda: asyncio.create_task(on_new_page_load()))
            new_page.on('framenavigated', lambda frame: asyncio.create_task(on_new_page_navigate(frame)))

        # 注册上下文的新页面创建事件
        context.on('page', lambda new_page: asyncio.create_task(on_new_page(new_page)))

        # 监听当前页面的 'framenavigated' 事件，只关注主框架的变化
        async def _on_frame_navigated(frame):
            # 生成精确到毫秒的时间戳，确保截图文件名唯一
            timestamp = datetime.datetime.now().strftime("%H%M%S_%f")[:-3]
            if frame == page.main_frame:
                debug_print(f"[DEBUG] 主窗口framenavigated事件触发，当前URL：{frame.url}")
                await debug_screenshot(page, screenshot_dir, f"framenavigated_main_frame_{timestamp}.png", "主框架导航后")
                await on_url_change()
            else:
                debug_print(f"[DEBUG] 主窗口framenavigated事件触发（子框架），当前URL：{frame.url}")
                await debug_screenshot(page, screenshot_dir, f"framenavigated_sub_frame_{timestamp}.png", f"子框架导航后: {frame.url}")

        page.on('framenavigated', lambda frame: asyncio.create_task(_on_frame_navigated(frame)))

        # 等待 iframe 出现（最多等 60 秒）
        iframe_locator = page.frame_locator("iframe").first

        # 获取 iframe 中的第一个 img 元素
        img_locator = iframe_locator.get_by_role("img").first

        # 二维码出现后的截图
        await debug_screenshot(page, screenshot_dir, "qrcode_displayed.png", "二维码显示后")

        # 获取 src 属性值
        src = await img_locator.get_attribute("src")
        print("✅ 图片地址:", src)
        status_queue.put(src)

        try:
            debug_print("[DEBUG] 开始等待URL变化或登录成功标志...")
            # 优化：使用合理的超时时间（30秒）
            await asyncio.wait_for(url_changed_event.wait(), timeout=30)  # 优化：最多等待 30 秒
            debug_print("[DEBUG] 监听页面跳转或登录检测成功")
        except asyncio.TimeoutError:
            status_queue.put("500")
            error_msg = "监听页面跳转超时，登录失败"
            print(error_msg)
            await debug_screenshot(page, screenshot_dir, "url_change_timeout.png", "URL变化监听超时")

            # 记录详细的失败信息到日志
            logging.error(error_msg, extra={
                'platform': 'tencent',
                'screenshot_dir': screenshot_dir,
                'user_id': id
            })
            return {'success': False, 'error': 'TIMEOUT', 'message': error_msg}
        uuid_v1 = uuid.uuid1()
        debug_print(f"[DEBUG] UUID v1: {uuid_v1}")
        # 确保cookiesFile目录存在
        cookies_dir = Path(BASE_DIR / "cookiesFile")
        cookies_dir.mkdir(exist_ok=True)
        await context.storage_state(path=cookies_dir / f"{uuid_v1}.json")
        debug_print(f"[DEBUG] Cookie 保存到: {cookies_dir / f'{uuid_v1}.json'}")

        result = await check_cookie(2,f"{uuid_v1}.json") #会新打开一个浏览器窗口, 验证cookie是否有效
        if not result:
            status_queue.put("500")
            error_msg = "Cookie验证失败，登录状态无效"
            print(error_msg)
            # 这里增加截图其实是当前get_XX_cookie 方法内打开的page 截图, 实则没有参考意义, 没有好的选择就注释掉
            # await debug_screenshot(page, screenshot_dir, "cookie_validation_failed.png", "Cookie验证失败")

            # 记录详细的失败信息到日志
            logging.error(error_msg, extra={
                'platform': 'tencent',
                'cookie_file': f"{uuid_v1}.json",
                'screenshot_dir': screenshot_dir,
                'user_id': id
            })
            return {}

        await page.close()
        await context.close()
        await browser.close()
        debug_print("[DEBUG] 浏览器资源已释放")

        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            # 获取组ID
            group_id = get_or_create_group(cursor, group_name)

            # 使用 UPSERT：如果已存在相同 type+userName 的记录，则更新 filePath 和 status
            # 登录成功后设置 last_validated_at，避免 getValidAccounts 重复验证
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

        # 记录成功登录日志
        logging.info("腾讯视频号登录成功", extra={
            'platform': 'tencent',
            'user_id': id,
            'cookie_file': f"{uuid_v1}.json",
            'screenshot_dir': screenshot_dir
        })
        return {}

# 快手登录
async def get_ks_cookie(id, status_queue, group_name=None):
    # 优化：移除测试模式检查，改用依赖注入方式

    url_changed_event = asyncio.Event()

    async def log_with_timestamp(message, level="DEBUG"):
        """带时间戳的日志记录"""
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        if level == "DEBUG":
            debug_print(f"[{timestamp}] [DEBUG] {message}")
        else:
            print(f"[{timestamp}] [{level}] {message}")

    async def on_url_change(frame):
        """URL变化事件处理函数，记录详细的URL跳转信息"""
        if frame != page.main_frame:
            return

        current_url = frame.url
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

        # 记录URL变化信息
        debug_print(f"[{timestamp}] [DEBUG] URL变化检测 - 当前URL: {current_url}")
        debug_print(f"[{timestamp}] [DEBUG] URL变化检测 - 原始URL: {original_url}")

        # 检查是否跳转到profile页面，可能是登录成功
        if "cp.kuaishou.com/profile" in current_url:
            await log_with_timestamp(f"检测到跳转到profile页面: {current_url}")

            # 验证是否真的登录成功
            login_success = await verify_login_success(page, log_with_timestamp)
            if login_success:
                await log_with_timestamp("基于页面内容验证：登录成功")
                url_changed_event.set()
                return

        # 检查URL是否发生变化
        if current_url != original_url:
            await log_with_timestamp(f"页面URL变化: {original_url} -> {current_url}")

            # 检查是否登录成功
            login_success = await verify_login_success(page, log_with_timestamp)
            if login_success:
                await log_with_timestamp("基于页面内容验证：登录成功")
                url_changed_event.set()

    async def verify_login_success(page, log_func):
        """基于页面内容验证登录是否成功"""
        try:
            await log_func("开始基于页面内容验证登录状态...")

            # 等待页面加载完成
            await page.wait_for_load_state("networkidle", timeout=5000)

            # 检查页面标题
            page_title = await page.title()
            await log_func(f"当前页面标题: {page_title}")

            # 检查是否包含登录成功的特征元素
            # 1. 检查是否有用户头像
            try:
                avatar_locator = page.get_by_role("img").filter(has_attribute="class", containing="avatar")
                avatar_count = await avatar_locator.count()
                await log_func(f"检测到头像元素数量: {avatar_count}")
                if avatar_count > 0:
                    await log_func("检测到用户头像，可能登录成功")
                    return True
            except Exception as e:
                await log_func(f"检查头像元素时出错: {e}")

            # 2. 检查是否有发布按钮
            try:
                publish_locator = page.get_by_role("button").filter(has_text="发布")
                publish_count = await publish_locator.count()
                await log_func(f"检测到发布按钮数量: {publish_count}")
                if publish_count > 0:
                    await log_func("检测到发布按钮，可能登录成功")
                    return True
            except Exception as e:
                await log_func(f"检查发布按钮时出错: {e}")

            # 3. 检查是否有用户信息相关元素
            try:
                user_info_locator = page.locator(".user-info")
                user_info_count = await user_info_locator.count()
                await log_func(f"检测到用户信息元素数量: {user_info_count}")
                if user_info_count > 0:
                    await log_func("检测到用户信息，可能登录成功")
                    return True
            except Exception as e:
                await log_func(f"检查用户信息元素时出错: {e}")

            # 4. 检查是否不再包含登录相关元素
            try:
                login_text_locator = page.get_by_text("扫码登录")
                login_text_count = await login_text_locator.count()
                await log_func(f"检测到扫码登录文本数量: {login_text_count}")
                if login_text_count == 0:
                    await log_func("未检测到扫码登录文本，可能登录成功")
                    # 结合其他条件进一步判断
                    try:
                        # 检查是否有cp.kuaishou.com/profile的URL
                        if "cp.kuaishou.com/profile" in page.url:
                            await log_func("检测到profile页面且无登录文本，登录成功")
                            return True
                    except Exception as e:
                        await log_func(f"检查URL时出错: {e}")
            except Exception as e:
                await log_func(f"检查登录文本时出错: {e}")

            await log_func("基于页面内容验证：未确认登录成功")
            return False
        except Exception as e:
            await log_func(f"登录验证过程出错: {e}", "ERROR")
            return False

    async with async_playwright() as playwright:
        # Make sure to run headed.
        browser = await launch_browser(playwright)
        # Setup context however you like.
        context = await browser.new_context()  # Pass any options
        context = await set_init_script(context)
        # Pause the page, and start recording manually.
        page = await context.new_page()

        # 记录导航请求和响应（只记录关键请求）
        page.on("request", lambda request: asyncio.create_task(log_with_timestamp(f"请求URL: {request.url}, 方法: {request.method}")) if ("cp.kuaishou.com" in request.url or "passport.kuaishou.com" in request.url) else None)

        page.on("response", lambda response: asyncio.create_task(log_with_timestamp(f"响应URL: {response.url}, 状态码: {response.status}")) if ("cp.kuaishou.com" in response.url or "passport.kuaishou.com" in response.url) else None)

        # 记录初始访问信息
        await log_with_timestamp("准备访问快手创作者平台")
        initial_url = "https://cp.kuaishou.com"
        await log_with_timestamp(f"开始访问初始URL: {initial_url}")

        # 访问初始URL
        response = await page.goto(initial_url, wait_until="networkidle")
        if response:
            await log_with_timestamp(f"初始访问响应状态码: {response.status}")
            await log_with_timestamp(f"初始访问响应URL: {response.url}")

        original_url = page.url
        await log_with_timestamp(f"页面加载完成，当前URL: {original_url}")
        await log_with_timestamp(f"初始访问URL: {initial_url}")
        await log_with_timestamp(f"实际加载URL: {original_url}")

        # 定位并点击“立即登录”按钮（类型为 link）
        await log_with_timestamp("开始定位并点击立即登录按钮")
        login_button = page.get_by_role("link", name="立即登录")
        await login_button.click()
        await log_with_timestamp("点击了立即登录按钮")
        await log_with_timestamp(f"点击立即登录后URL: {page.url}")

        # 点击扫码登录
        await log_with_timestamp("开始定位并点击扫码登录按钮")
        await page.get_by_text("扫码登录").click()
        await log_with_timestamp("点击了扫码登录按钮")
        await log_with_timestamp(f"点击扫码登录后URL: {page.url}")

        # 定位二维码图片
        await log_with_timestamp("开始定位二维码图片")
        img_locator = page.get_by_role("img", name="qrcode")
        await log_with_timestamp("成功定位二维码图片")
        await log_with_timestamp(f"二维码页面URL: {page.url}")

        # 获取 src 属性值
        await log_with_timestamp("开始获取二维码图片数据")
        src = await img_locator.get_attribute("src")
        await log_with_timestamp("成功获取二维码图片数据")
        print("✅ 图片地址:", src)
        status_queue.put(src)
        await log_with_timestamp("已将二维码数据发送到前端")

        # 监听页面的 'framenavigated' 事件，确保捕获所有导航事件
        page.on('framenavigated', lambda frame: asyncio.create_task(on_url_change(frame)))

        # 也监听load事件，确保捕获页面加载完成事件
        page.on('load', lambda: asyncio.create_task(log_with_timestamp(f"页面加载完成事件触发，当前URL: {page.url}")))

        try:
            await log_with_timestamp("开始等待快手登录成功...")
            await log_with_timestamp("等待方式：URL变化 + 页面内容验证")
            await log_with_timestamp("超时时间：30秒")  # 优化：使用合理的超时时间

            # 等待登录成功事件或超时
            await asyncio.wait_for(url_changed_event.wait(), timeout=30)  # 优化：最多等待 30 秒

            await log_with_timestamp("快手登录检测成功")
        except asyncio.TimeoutError:
            await log_with_timestamp("监听页面跳转超时，登录失败", "ERROR")
            status_queue.put("500")
            error_msg = "监听页面跳转超时，登录失败"
            print(error_msg)

            # 记录详细的失败信息到日志
            import logging
            logging.error(error_msg, extra={
                'platform': 'kuaishou',
                'user_id': id
            })
            return {
                'success': False,
                'error': 'URL_CHANGE_TIMEOUT',
                'message': error_msg
            }

        # 登录成功后，再次验证页面内容
        await log_with_timestamp("登录成功后，再次基于页面内容验证登录状态...")
        final_login_success = await verify_login_success(page, log_with_timestamp)
        if not final_login_success:
            await log_with_timestamp("最终页面内容验证失败", "ERROR")
            status_queue.put("500")
            error_msg = "登录成功后基于页面内容验证失败"
            print(error_msg)
            return {
                'success': False,
                'error': 'FINAL_VERIFICATION_FAILED',
                'message': error_msg
            }

        await log_with_timestamp("最终页面内容验证成功")

        await log_with_timestamp("开始保存cookie信息")

        uuid_v1 = uuid.uuid1()
        await log_with_timestamp(f"生成UUID: {uuid_v1}")

        # 确保cookiesFile目录存在
        cookies_dir = Path(BASE_DIR / "cookiesFile")
        cookies_dir.mkdir(exist_ok=True)

        # 保存cookie信息
        cookie_file_path = cookies_dir / f"{uuid_v1}.json"
        await context.storage_state(path=cookie_file_path)
        await log_with_timestamp(f"Cookie信息已保存到: {cookie_file_path}")

        # 验证cookie有效性
        await log_with_timestamp("开始验证Cookie有效性")
        result = await check_cookie(4, f"{uuid_v1}.json")
        if not result:
            await log_with_timestamp("Cookie验证失败，登录状态无效", "ERROR")
            status_queue.put("500")
            error_msg = "Cookie验证失败，登录状态无效"
            print(error_msg)

            # 记录详细的失败信息到日志
            import logging
            logging.error(error_msg, extra={
                'platform': 'kuaishou',
                'cookie_file': f"{uuid_v1}.json",
                'user_id': id
            })
            return {
                'success': False,
                'error': 'COOKIE_VALIDATION_FAILED',
                'message': error_msg
            }

        await log_with_timestamp("Cookie验证成功")

        # 关闭浏览器
        await page.close()
        await context.close()
        await browser.close()
        await log_with_timestamp("浏览器资源已释放")

        # 记录用户状态到数据库
        await log_with_timestamp("开始记录用户状态到数据库")
        with sqlite3.connect(db_manager.get_db_path()) as conn:
            cursor = conn.cursor()
            # 获取组ID
            group_id = get_or_create_group(cursor, group_name)

            # 使用 UPSERT：如果已存在相同 type+userName 的记录，则更新 filePath 和 status
            # 登录成功后设置 last_validated_at，避免 getValidAccounts 重复验证
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
            await log_with_timestamp("用户状态已记录到数据库")

        print("✅ 用户状态已记录")
        status_queue.put("200")
        await log_with_timestamp("快手登录流程完成", "INFO")

# 小红书登录
async def xiaohongshu_cookie_gen(id, status_queue, group_name=None):
    # 优化：移除测试模式检查，改用依赖注入方式

    url_changed_event = asyncio.Event()

    # 创建会话截图目录
    screenshot_dir = create_screenshot_dir("xiaohongshu")

    async def on_url_change():
        # 检查是否是主框架的变化
        if page.url != original_url:
            debug_print(f"[DEBUG] 原页面URL变化: {original_url} -> {page.url}")
            await debug_screenshot(page, screenshot_dir, "original_page_url_changed.png", "原页面URL变化后")
            url_changed_event.set()

    async with async_playwright() as playwright:
        # Make sure to run headed.
        browser = await launch_browser(playwright)
        # Setup context however you like.
        context = await browser.new_context()  # Pass any options
        context = await set_init_script(context)
        # Pause the page, and start recording manually.
        page = await context.new_page()

        # 页面加载前的截图
        await debug_screenshot(page, screenshot_dir, "before_navigation.png", "导航前")

        await page.goto("https://creator.xiaohongshu.com/")
        original_url = page.url
        debug_print(f"[DEBUG] 页面加载完成: {original_url}")

        # 页面加载后的截图
        await debug_screenshot(page, screenshot_dir, "after_navigation.png", "导航后")

        await page.locator('img.css-wemwzq').click()

        # 点击登录按钮后的截图
        await debug_screenshot(page, screenshot_dir, "after_login_click.png", "点击登录按钮后")

        img_locator = page.get_by_role("img").nth(2)

        # 二维码出现后的截图
        await debug_screenshot(page, screenshot_dir, "qrcode_displayed.png", "二维码显示后")

        # 获取 src 属性值
        src = await img_locator.get_attribute("src")
        print("✅ 图片地址:", src)
        status_queue.put(src)
        # 监听页面的 'framenavigated' 事件，只关注主框架的变化
        page.on('framenavigated',
                lambda frame: asyncio.create_task(on_url_change()) if frame == page.main_frame else None)

        try:
            # 优化：使用合理的超时时间（30秒）
            await asyncio.wait_for(url_changed_event.wait(), timeout=30)  # 优化：最多等待 30 秒
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
        # 确保cookiesFile目录存在
        cookies_dir = Path(BASE_DIR / "cookiesFile")
        cookies_dir.mkdir(exist_ok=True)
        await context.storage_state(path=cookies_dir / f"{uuid_v1}.json")
        result = await check_cookie(1, f"{uuid_v1}.json")
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
            # 获取组ID
            group_id = get_or_create_group(cursor, group_name)

            # 使用 UPSERT：如果已存在相同 type+userName 的记录，则更新 filePath 和 status
            # 登录成功后设置 last_validated_at，避免 getValidAccounts 重复验证
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

# a = asyncio.run(xiaohongshu_cookie_gen(4,None))
# print(a)
