import asyncio
import configparser
import os

from playwright.async_api import async_playwright
from xhs import XhsClient

from src.conf import BASE_DIR, LOCAL_CHROME_HEADLESS, LOCAL_CHROME_PATH
from src.utils.base_social_media import set_init_script
from src.utils.log import tencent_logger, kuaishou_logger, douyin_logger
from pathlib import Path
from src.uploader.xiaohongshu_uploader.main import sign_local
from src.utils.browser import launch_browser


async def cookie_auth_douyin(account_file):
    async with async_playwright() as playwright:
        browser = await launch_browser(playwright)
        context = None
        page = None
        try:
            context = await browser.new_context(storage_state=account_file)
            context = await set_init_script(context)
            # 创建一个新的页面
            page = await context.new_page()
            # 访问指定的 URL
            await page.goto("https://creator.douyin.com/creator-micro/content/upload")
            try:
                await page.wait_for_url("https://creator.douyin.com/creator-micro/content/upload", timeout=5000)
                # 2024.06.17 抖音创作者中心改版
                # 判断
                # 等待"扫码登录"元素出现，超时 5 秒（如果 5 秒没出现，说明 cookie 有效）
                try:
                    await page.get_by_text("扫码登录").wait_for(timeout=5000)
                    douyin_logger.error("[+] cookie 失效，需要扫码登录")
                    return False
                except:
                    douyin_logger.success("[+]  cookie 有效")
                    return True
            except:
                douyin_logger.error("[+] 等待5秒 cookie 失效")
                return False
        finally:
            if page:
                await page.close()
            if context:
                await context.close()
            await browser.close()


async def cookie_auth_tencent(account_file):
    async with async_playwright() as playwright:
        browser = await launch_browser(playwright)
        context = None
        page = None
        try:
            context = await browser.new_context(storage_state=account_file)
            context = await set_init_script(context)
            # 创建一个新的页面
            page = await context.new_page()
            # 访问指定的 URL
            await page.goto("https://channels.weixin.qq.com/platform/post/create")
            try:
                await page.wait_for_selector('div.title-name:has-text("微信小店")', timeout=5000)  # 等待5秒
                tencent_logger.error("[+] 等待5秒 cookie 失效")
                return False
            except:
                tencent_logger.success("[+] cookie 有效")
                return True
        finally:
            if page:
                await page.close()
            if context:
                await context.close()
            await browser.close()


async def cookie_auth_ks(account_file):
    async with async_playwright() as playwright:
        browser = await launch_browser(playwright)
        context = None
        page = None
        try:
            context = await browser.new_context(storage_state=account_file)
            context = await set_init_script(context)
            # 创建一个新的页面
            page = await context.new_page()
            # 访问指定的 URL
            await page.goto("https://cp.kuaishou.com/article/publish/video")
            try:
                await page.wait_for_selector("div.names div.container div.name:text('机构服务')", timeout=5000)  # 等待5秒
                kuaishou_logger.info("[+] 等待5秒 cookie 失效")
                return False
            except:
                kuaishou_logger.success("[+] cookie 有效")
                return True
        finally:
            if page:
                await page.close()
            if context:
                await context.close()
            await browser.close()


async def cookie_auth_xhs(account_file):
    async with async_playwright() as playwright:
        browser = await launch_browser(playwright)
        context = None
        page = None
        try:
            context = await browser.new_context(storage_state=account_file)
            context = await set_init_script(context)
            # 创建一个新的页面
            page = await context.new_page()
            # 访问指定的 URL
            await page.goto("https://creator.xiaohongshu.com/creator-micro/content/upload")
            try:
                await page.wait_for_url("https://creator.xiaohongshu.com/creator-micro/content/upload", timeout=5000)
            except:
                print("[+] 等待5秒 cookie 失效")
                return False
            # 2024.06.17 抖音创作者中心改版
            if await page.get_by_text('手机号登录').count() or await page.get_by_text('扫码登录').count():
                print("[+] 等待5秒 cookie 失效")
                return False
            else:
                print("[+] cookie 有效")
                return True
        finally:
            if page:
                await page.close()
            if context:
                await context.close()
            await browser.close()

# 🙋 check_cookie 方法在一起请求中被双重调用, 可能会留有隐患：
# 1. 登录流程 ：登录成功后验证新获取的Cookie有效性
# 2. Web页面完成登录流程后触发账号查询 ：通过 /getValidAccounts 接口批量验证所有账号的Cookie状态
async def check_cookie(type, file_path):
    match type:
        # 小红书
        case 1:
            return await cookie_auth_xhs(Path(BASE_DIR / "cookiesFile" / file_path))
        # 视频号
        case 2:
            return await cookie_auth_tencent(Path(BASE_DIR / "cookiesFile" / file_path))
        # 抖音
        case 3:
            return await cookie_auth_douyin(Path(BASE_DIR / "cookiesFile" / file_path))
        # 快手
        case 4:
            return await cookie_auth_ks(Path(BASE_DIR / "cookiesFile" / file_path))
        case _:
            return False

# a = asyncio.run(check_cookie(1,"3a6cfdc0-3d51-11f0-8507-44e51723d63c.json"))
# print(a)
