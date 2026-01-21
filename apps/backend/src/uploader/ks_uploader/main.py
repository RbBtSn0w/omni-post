# -*- coding: utf-8 -*-
import asyncio
import os
from datetime import datetime

from playwright.async_api import Playwright, async_playwright

from src.core.browser import launch_browser, set_init_script
from src.core.config import DEBUG_MODE, LOCAL_CHROME_HEADLESS
from src.core.logger import kuaishou_logger


class KSVideo(object):
    def __init__(self, title, file_path, tags, publish_date: datetime, account_file):
        self.title = title  # 视频标题
        self.file_path = file_path
        self.tags = tags if tags else []
        self.publish_date = publish_date
        self.account_file = account_file
        self.date_format = "%Y-%m-%d %H:%M"
        self.headless = LOCAL_CHROME_HEADLESS

    async def handle_upload_error(self, page):
        kuaishou_logger.error("视频出错了，重新上传中")
        await page.locator('div.progress-div [class^="upload-btn-input"]').set_input_files(
            self.file_path
        )

    async def upload(self, playwright: Playwright) -> None:
        """
        Upload video to Kuaishou Creator Platform.

        Uses try...finally to ensure browser resources are always released.
        """
        browser = None
        context = None

        try:
            # 使用统一的浏览器启动函数
            browser = await launch_browser(playwright, headless=self.headless)

            # 创建浏览器上下文
            context = await browser.new_context(
                storage_state=f"{self.account_file}", viewport={"width": 1920, "height": 1080}
            )
            context = await set_init_script(context)

            # 创建一个新的页面
            page = await context.new_page()
            # 访问指定的 URL
            await page.goto(
                "https://cp.kuaishou.com/article/publish/video", wait_until="domcontentloaded"
            )
            kuaishou_logger.info("正在上传-------{}.mp4".format(self.title))
            kuaishou_logger.info("正在打开主页...")

            # 点击 "上传视频" 按钮
            upload_button = page.locator("button[class^='_upload-btn']")
            await upload_button.wait_for(state="visible")

            async with page.expect_file_chooser() as fc_info:
                await upload_button.click()
            file_chooser = await fc_info.value
            await file_chooser.set_files(self.file_path)

            await asyncio.sleep(2)
            await asyncio.sleep(1)

            # 等待按钮可交互
            new_feature_button = page.locator('button[type="button"] span:text("我知道了")')
            if await new_feature_button.count() > 0:
                await new_feature_button.click()

            kuaishou_logger.info("正在填充标题和话题...")
            await page.get_by_text("描述").locator("xpath=following-sibling::div").click()
            kuaishou_logger.info("clear existing title")
            await page.keyboard.press("Backspace")
            await page.keyboard.press("Control+KeyA")
            await page.keyboard.press("Delete")
            kuaishou_logger.info("filling new  title")
            await page.keyboard.type(self.title)
            await page.keyboard.press("Enter")

            # 快手只能添加3个话题
            for index, tag in enumerate(self.tags[:3], start=1):
                kuaishou_logger.info("正在添加第%s个话题" % index)
                await page.keyboard.type(f"#{tag} ")
                await asyncio.sleep(2)

            max_retries = 60
            retry_count = 0

            while retry_count < max_retries:
                try:
                    number = await page.locator("text=上传中").count()
                    if number == 0:
                        kuaishou_logger.success("视频上传完毕")
                        break
                    else:
                        if retry_count % 5 == 0:
                            kuaishou_logger.info("正在上传视频中...")
                        await asyncio.sleep(2)
                except Exception as e:
                    kuaishou_logger.error(f"检查上传状态时发生错误: {e}")
                    await asyncio.sleep(2)
                retry_count += 1

            if retry_count == max_retries:
                kuaishou_logger.warning("超过最大重试次数，视频上传可能未完成。")

            # 定时任务
            if self.publish_date != 0:
                await self.set_schedule_time(page, self.publish_date)

            # 判断视频是否发布成功
            while True:
                try:
                    publish_button = page.get_by_text("发布", exact=True)
                    if await publish_button.count() > 0:
                        await publish_button.click()

                    await asyncio.sleep(1)
                    confirm_button = page.get_by_text("确认发布")
                    if await confirm_button.count() > 0:
                        await confirm_button.click()

                    await page.wait_for_url(
                        "https://cp.kuaishou.com/article/manage/video?status=2&from=publish",
                        timeout=5000,
                    )
                    kuaishou_logger.success("视频发布成功")
                    break
                except Exception as e:
                    kuaishou_logger.info(f"视频正在发布中... 错误: {e}")
                    await page.screenshot(full_page=True)
                    await asyncio.sleep(1)

            await context.storage_state(path=self.account_file)
            kuaishou_logger.info("cookie更新完毕！")

            if DEBUG_MODE:
                await asyncio.sleep(2)

        except Exception as e:
            kuaishou_logger.error(f"上传过程中发生异常: {e}")
            raise
        finally:
            if context:
                await context.close()
            if browser:
                await browser.close()

    async def main(self):
        async with async_playwright() as playwright:
            await self.upload(playwright)

    async def set_schedule_time(self, page, publish_date):
        kuaishou_logger.info("click schedule")
        publish_date_hour = publish_date.strftime("%Y-%m-%d %H:%M:%S")
        await page.locator("label:text('发布时间')").locator(
            "xpath=following-sibling::div"
        ).locator(".ant-radio-input").nth(1).click()
        await asyncio.sleep(1)

        await page.locator('div.ant-picker-input input[placeholder="选择日期时间"]').click()
        await asyncio.sleep(1)

        await page.keyboard.press("Control+KeyA")
        await page.keyboard.type(str(publish_date_hour))
        await page.keyboard.press("Enter")
        await asyncio.sleep(1)
