"""
Cookie validation service for omni-post backend.

This module provides cookie authentication services for all platforms.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright

from src.core.browser import launch_browser, set_init_script
from src.core.config import COOKIES_DIR
from src.core.constants import PlatformType
from src.core.logger import douyin_logger, kuaishou_logger, tencent_logger


class CookieService(ABC):
    """Cookie 验证服务抽象接口"""

    @abstractmethod
    async def cookie_auth_douyin(self, account_file: Path) -> bool:
        """验证抖音 Cookie"""
        pass

    @abstractmethod
    async def cookie_auth_tencent(self, account_file: Path) -> bool:
        """验证视频号 Cookie"""
        pass

    @abstractmethod
    async def cookie_auth_ks(self, account_file: Path) -> bool:
        """验证快手 Cookie"""
        pass

    @abstractmethod
    async def cookie_auth_xhs(self, account_file: Path) -> bool:
        """验证小红书 Cookie"""
        pass

    @abstractmethod
    async def cookie_auth_bilibili(self, account_file: Path) -> bool:
        """验证 Bilibili Cookie"""
        pass

    @abstractmethod
    async def check_cookie(self, platform_type: int, file_path: str) -> bool:
        """验证指定平台的 Cookie"""
        pass


class DefaultCookieService(CookieService):
    """默认 Cookie 验证服务实现"""

    def __init__(self):
        self.cookies_dir = COOKIES_DIR

    async def cookie_auth_douyin(self, account_file: Path) -> bool:
        async with async_playwright() as playwright:
            browser = await launch_browser(playwright)
            context = None
            page = None
            try:
                context = await browser.new_context(storage_state=account_file)
                context = await set_init_script(context)
                page = await context.new_page()
                await page.goto(
                    "https://creator.douyin.com/creator-micro/content/upload",
                    wait_until="domcontentloaded",
                )
                try:
                    await page.wait_for_url(
                        "https://creator.douyin.com/creator-micro/content/upload", timeout=5000
                    )
                    try:
                        await page.get_by_text("扫码登录").wait_for(timeout=5000)
                        douyin_logger.error("[+] cookie 失效，需要扫码登录")
                        return False
                    except Exception:  # Timeout or element not found means cookie is valid
                        douyin_logger.success("[+] cookie 有效")
                        return True
                except Exception:  # Failed to navigate to upload page
                    douyin_logger.error("[+] 等待5秒 cookie 失效")
                    return False
            finally:
                if page:
                    await page.close()
                if context:
                    await context.close()
                await browser.close()

    async def cookie_auth_tencent(self, account_file: Path) -> bool:
        async with async_playwright() as playwright:
            browser = await launch_browser(playwright)
            context = None
            page = None
            try:
                context = await browser.new_context(storage_state=account_file)
                context = await set_init_script(context)
                page = await context.new_page()
                await page.goto(
                    "https://channels.weixin.qq.com/platform/post/create",
                    wait_until="domcontentloaded",
                )
                try:
                    await page.wait_for_selector(
                        'div.title-name:has-text("微信小店")', timeout=5000
                    )
                    tencent_logger.error("[+] 等待5秒 cookie 失效")
                    return False
                except Exception:  # Timeout means cookie is valid (element not found)
                    tencent_logger.success("[+] cookie 有效")
                    return True
            finally:
                if page:
                    await page.close()
                if context:
                    await context.close()
                await browser.close()

    async def cookie_auth_ks(self, account_file: Path) -> bool:
        async with async_playwright() as playwright:
            browser = await launch_browser(playwright)
            context = None
            page = None
            try:
                context = await browser.new_context(storage_state=account_file)
                context = await set_init_script(context)
                page = await context.new_page()
                await page.goto(
                    "https://cp.kuaishou.com/article/publish/video", wait_until="domcontentloaded"
                )
                try:
                    await page.wait_for_selector(
                        "div.names div.container div.name:text('机构服务')", timeout=5000
                    )
                    kuaishou_logger.info("[+] 等待5秒 cookie 失效")
                    return False
                except Exception:  # Timeout means cookie is valid (element not found)
                    kuaishou_logger.success("[+] cookie 有效")
                    return True
            finally:
                if page:
                    await page.close()
                if context:
                    await context.close()
                await browser.close()

    async def cookie_auth_xhs(self, account_file: Path) -> bool:
        async with async_playwright() as playwright:
            browser = await launch_browser(playwright)
            context = None
            page = None
            try:
                context = await browser.new_context(storage_state=account_file)
                context = await set_init_script(context)
                page = await context.new_page()
                await page.goto(
                    "https://creator.xiaohongshu.com/creator-micro/content/upload",
                    wait_until="domcontentloaded",
                )
                try:
                    await page.wait_for_url(
                        "https://creator.xiaohongshu.com/creator-micro/content/upload", timeout=5000
                    )
                except Exception:  # Failed to reach upload page, cookie invalid
                    print("[+] 等待5秒 cookie 失效")
                    return False
                if (
                    await page.get_by_text("手机号登录").count()
                    or await page.get_by_text("扫码登录").count()
                ):
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

    async def cookie_auth_bilibili(self, account_file: Path) -> bool:
        async with async_playwright() as playwright:
            browser = await launch_browser(playwright)
            context = None
            page = None
            try:
                context = await browser.new_context(storage_state=account_file)
                context = await set_init_script(context)
                page = await context.new_page()
                await page.goto(
                    "https://member.bilibili.com/platform/home",
                    wait_until="domcontentloaded",
                )
                # 如果重定向到登录页，说明 Cookie 失效
                if "passport.bilibili.com" in page.url:
                    print("[+] bilibili cookie 失效")
                    return False
                else:
                    print("[+] bilibili cookie 有效")
                    return True
            finally:
                if page:
                    await page.close()
                if context:
                    await context.close()
                await browser.close()

    async def check_cookie(self, platform_type: int, file_path: str) -> bool:
        cookie_path = self.cookies_dir / file_path
        match platform_type:
            case PlatformType.XIAOHONGSHU:
                return await self.cookie_auth_xhs(cookie_path)
            case PlatformType.TENCENT:
                return await self.cookie_auth_tencent(cookie_path)
            case PlatformType.DOUYIN:
                return await self.cookie_auth_douyin(cookie_path)
            case PlatformType.KUAISHOU:
                return await self.cookie_auth_ks(cookie_path)
            case PlatformType.BILIBILI:
                return await self.cookie_auth_bilibili(cookie_path)
            case _:
                return False


# Global service instance
_cookie_service: Optional[DefaultCookieService] = None


def get_cookie_service() -> CookieService:
    """获取 Cookie 服务实例"""
    global _cookie_service
    if _cookie_service is None:
        _cookie_service = DefaultCookieService()
    return _cookie_service
