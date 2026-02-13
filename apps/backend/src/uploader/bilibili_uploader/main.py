# -*- coding: utf-8 -*-
import asyncio
from datetime import datetime

from playwright.async_api import Playwright, async_playwright

from src.core.browser import launch_browser, set_init_script
from src.core.config import LOCAL_CHROME_HEADLESS
from src.core.logger import bilibili_logger


class BiliBiliVideo(object):
    def __init__(self, title, file_path, tags, publish_date: datetime, account_file):
        self.title = title
        self.file_path = file_path
        self.tags = tags if tags else []
        self.publish_date = publish_date
        self.account_file = account_file
        self.headless = LOCAL_CHROME_HEADLESS

    async def upload(self, playwright: Playwright) -> None:
        """
        Upload video to Bilibili Creator Platform.
        """
        browser = None
        context = None
        page = None

        try:
            browser = await launch_browser(playwright, headless=self.headless)
            context = await browser.new_context(
                storage_state=f"{self.account_file}", viewport={"width": 1920, "height": 1080}
            )
            context = await set_init_script(context)
            page = await context.new_page()

            await page.goto(
                "https://member.bilibili.com/platform/upload/video/frame",
                wait_until="domcontentloaded",
            )
            bilibili_logger.info("正在打开Bilibili上传页面...")

            # 探测视频上传输入框
            # Bilibili 的上传 input 可能是隐藏的，通常在 .upload-btn 或类似容器中
            upload_input = page.locator('input[type="file"]')
            await upload_input.set_input_files(self.file_path)

            bilibili_logger.info("已选择视频文件，等待上传中...")

            # 等待标题输入框出现，表示上传已开始并进入编辑页
            # 常见选择器：[placeholder="请输入稿件标题"], .video-title input
            try:
                title_input = page.locator('input[placeholder*="标题"], .video-title input').first
                await title_input.wait_for(timeout=60000)
            except Exception:
                bilibili_logger.warning("未检测到标题输入框，尝试继续...")

            bilibili_logger.info("开始填充稿件信息...")

            # 填充标题
            title_input = page.locator('input[placeholder*="标题"], .video-title input').first
            if await title_input.count() > 0:
                await title_input.click()
                await page.keyboard.press("Control+KeyA")
                await page.keyboard.press("Backspace")
                await title_input.fill(self.title)

            # 填充标签
            # selector: .tag-container input, .video-tag input
            tag_input = page.locator(
                '.tag-container input, .video-tag input, input[placeholder*="标签"]'
            ).first
            if await tag_input.count() > 0:
                for tag in self.tags:
                    await tag_input.fill(tag)
                    await page.keyboard.press("Enter")
                    await asyncio.sleep(1)

            # 填充简介
            # selector: .desc-container .editor, .video-desc textarea
            desc_area = page.locator(
                '.desc-container .editor, .video-desc textarea, textarea[placeholder*="简介"]'
            ).first
            if await desc_area.count() > 0:
                # 如果是可编辑div
                if await desc_area.get_attribute("contenteditable") == "true":
                    await desc_area.click()
                    await desc_area.fill(f"{self.title}\n{' '.join(['#'+t for t in self.tags])}")
                else:
                    await desc_area.fill(f"{self.title}\n{' '.join(['#'+t for t in self.tags])}")

            # 定时发布 (如果需要)
            if self.publish_date != 0:
                # Bilibili 的定时发布逻辑通常涉及点击“定时发布”单选框，然后选择日期时间
                bilibili_logger.info(f"计划发布时间: {self.publish_date}")
                # TODO: 实现 Bilibili 特有的时间选择逻辑

            # 点击发布按钮
            # selector: .submit-container .cc-btn, .submit-btn, button:has-text("立即投稿")
            submit_btn = page.locator(
                '.submit-container .cc-btn, .submit-btn, button:has-text("立即投稿"), button:has-text("发布")'
            ).first
            await submit_btn.click()

            bilibili_logger.success(f"Bilibili 稿件《{self.title}》发布操作已触发")

            # 等待一会儿确保请求发出
            await asyncio.sleep(5)

            # 更新 Cookie
            await context.storage_state(path=self.account_file)
            bilibili_logger.info("Bilibili Cookie 已更新")

        except Exception as e:
            bilibili_logger.error(f"Bilibili 上传、发布过程中发生异常: {e}")
            # Take a screenshot if it fails
            if page:
                try:
                    await page.screenshot(
                        path=f"bilibili_error_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    )
                except Exception as screenshot_error:
                    bilibili_logger.warning(
                        f"Failed to capture Bilibili error screenshot: {screenshot_error}"
                    )
            raise
        finally:
            if context:
                await context.close()
            if browser:
                await browser.close()

    async def main(self):
        async with async_playwright() as playwright:
            await self.upload(playwright)
