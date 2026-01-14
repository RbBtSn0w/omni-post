# -*- coding: utf-8 -*-
from datetime import datetime

from playwright.async_api import Playwright, async_playwright
import os
import asyncio

from src.conf import LOCAL_CHROME_PATH, LOCAL_CHROME_HEADLESS
from src.utils.base_social_media import set_init_script
from src.utils.log import kuaishou_logger


class KSVideo(object):
    def __init__(self, title, file_path, tags, publish_date: datetime, account_file):
        self.title = title  # 视频标题
        self.file_path = file_path
        self.tags = tags
        self.publish_date = publish_date
        self.account_file = account_file
        self.date_format = '%Y-%m-%d %H:%M'
        self.local_executable_path = LOCAL_CHROME_PATH
        self.headless = LOCAL_CHROME_HEADLESS

    async def handle_upload_error(self, page):
        kuaishou_logger.error("视频出错了，重新上传中")
        await page.locator('div.progress-div [class^="upload-btn-input"]').set_input_files(self.file_path)

    async def upload(self, playwright: Playwright) -> None:
        # 使用 Chromium 浏览器启动一个浏览器实例
        print(self.local_executable_path)
        # 添加启动参数以确保 headless 模式正常工作
        launch_args = [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-dev-shm-usage',
        ]
        if self.local_executable_path:
            browser = await playwright.chromium.launch(
                headless=self.headless,
                executable_path=self.local_executable_path,
                args=launch_args
            )
        else:
            browser = await playwright.chromium.launch(
                headless=self.headless,
                args=launch_args
            )
        # 创建一个浏览器上下文，使用指定的 cookie 文件
        # 添加 viewport 和 user-agent 设置以确保页面正确渲染
        context = await browser.new_context(
            storage_state=f"{self.account_file}",
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        context = await set_init_script(context)
        # 创建一个新的页面
        page = await context.new_page()
        # 访问指定的 URL
        await page.goto("https://cp.kuaishou.com/article/publish/video", wait_until='networkidle')
        kuaishou_logger.info('正在上传-------{}.mp4'.format(self.title))
        # 等待页面跳转到指定的 URL，没进入，则自动等待到超时
        kuaishou_logger.info('正在打开主页...')
        await page.wait_for_url("https://cp.kuaishou.com/article/publish/video")
        # 点击 "上传视频" 按钮
        upload_button = page.locator("button[class^='_upload-btn']")
        await upload_button.wait_for(state='visible')  # 确保按钮可见

        async with page.expect_file_chooser() as fc_info:
            await upload_button.click()
        file_chooser = await fc_info.value
        await file_chooser.set_files(self.file_path)

        await asyncio.sleep(2)

        # if not await page.get_by_text("封面编辑").count():
        #     raise Exception("似乎没有跳转到到编辑页面")

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

        max_retries = 60  # 设置最大重试次数,最大等待时间为 2 分钟
        retry_count = 0

        while retry_count < max_retries:
            try:
                # 获取包含 '上传中' 文本的元素数量
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
                await asyncio.sleep(2)  # 等待 2 秒后重试
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

                # 等待页面跳转，确认发布成功
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

        await context.storage_state(path=self.account_file)  # 保存cookie
        kuaishou_logger.info('cookie更新完毕！')
        await asyncio.sleep(2)  # 这里延迟是为了方便眼睛直观的观看
        # 关闭浏览器上下文和浏览器实例
        await context.close()
        await browser.close()

    async def main(self):
        async with async_playwright() as playwright:
            await self.upload(playwright)

    async def set_schedule_time(self, page, publish_date):
        kuaishou_logger.info("click schedule")
        publish_date_hour = publish_date.strftime("%Y-%m-%d %H:%M:%S")
        await page.locator("label:text('发布时间')").locator('xpath=following-sibling::div').locator(
            '.ant-radio-input').nth(1).click()
        await asyncio.sleep(1)

        await page.locator('div.ant-picker-input input[placeholder="选择日期时间"]').click()
        await asyncio.sleep(1)

        await page.keyboard.press("Control+KeyA")
        await page.keyboard.type(str(publish_date_hour))
        await page.keyboard.press("Enter")
        await asyncio.sleep(1)
