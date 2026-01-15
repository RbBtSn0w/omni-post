from datetime import datetime
from playwright.async_api import Playwright, async_playwright, Page
import os
import asyncio

from src.core.config import LOCAL_CHROME_HEADLESS, DEBUG_MODE
from src.core.browser import set_init_script, launch_browser
from src.core.logger import xiaohongshu_logger


class XiaoHongShuVideo(object):
    def __init__(self, title, file_path, tags, publish_date: datetime, account_file, thumbnail_path=None):
        self.title = title  # 视频标题
        self.file_path = file_path
        self.tags = tags
        self.publish_date = publish_date
        self.account_file = account_file
        self.date_format = '%Y年%m月%d日 %H:%M'
        self.headless = LOCAL_CHROME_HEADLESS
        self.thumbnail_path = thumbnail_path

    async def set_schedule_time_xiaohongshu(self, page, publish_date):
        xiaohongshu_logger.info("  [-] 正在设置定时发布时间...")
        xiaohongshu_logger.info(f"publish_date: {publish_date}")

        label_element = page.locator("label:has-text('定时发布')")
        await label_element.click()
        await asyncio.sleep(1)
        publish_date_hour = publish_date.strftime("%Y-%m-%d %H:%M")
        xiaohongshu_logger.info(f"publish_date_hour: {publish_date_hour}")

        await asyncio.sleep(1)
        await page.locator('.el-input__inner[placeholder="选择日期和时间"]').click()
        await page.keyboard.press("Control+KeyA")
        await page.keyboard.type(str(publish_date_hour))
        await page.keyboard.press("Enter")

        await asyncio.sleep(1)

    async def handle_upload_error(self, page):
        xiaohongshu_logger.info('视频出错了，重新上传中')
        await page.locator('div.progress-div [class^="upload-btn-input"]').set_input_files(self.file_path)

    async def upload(self, playwright: Playwright) -> None:
        """
        Upload video to Xiaohongshu Creator Platform.

        Uses try...finally to ensure browser resources are always released.
        """
        browser = None
        context = None

        try:
            # 使用统一的浏览器启动函数
            browser = await launch_browser(playwright, headless=self.headless)

            # 创建浏览器上下文
            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                storage_state=f"{self.account_file}"
            )
            context = await set_init_script(context)

            # 创建一个新的页面
            page = await context.new_page()
            # 访问指定的 URL
            await page.goto("https://creator.xiaohongshu.com/publish/publish?from=homepage&target=video", wait_until='domcontentloaded')
            xiaohongshu_logger.info(f'[+]正在上传-------{self.title}.mp4')
            xiaohongshu_logger.info(f'[-] 正在打开主页...')
            # 点击 "上传视频" 按钮
            await page.locator("div[class^='upload-content'] input[class='upload-input']").set_input_files(self.file_path)

            # 等待上传成功
            while True:
                try:
                    upload_input = await page.wait_for_selector('input.upload-input', timeout=3000)
                    preview_new = await upload_input.query_selector(
                        'xpath=following-sibling::div[contains(@class, "preview-new")]')
                    if preview_new:
                        stage_elements = await preview_new.query_selector_all('div.stage')
                        upload_success = False
                        for stage in stage_elements:
                            text_content = await page.evaluate('(element) => element.textContent', stage)
                            if '上传成功' in text_content:
                                upload_success = True
                                break
                        if upload_success:
                            xiaohongshu_logger.info("[+] 检测到上传成功标识!")
                            break
                        else:
                            xiaohongshu_logger.info("  [-] 未找到上传成功标识，继续等待...")
                    else:
                        xiaohongshu_logger.info("  [-] 未找到预览元素，继续等待...")
                        await asyncio.sleep(1)
                except Exception as e:
                    xiaohongshu_logger.info(f"  [-] 检测过程出错: {str(e)}，重新尝试...")
                    await asyncio.sleep(0.5)

            # 填充标题和话题
            await asyncio.sleep(1)
            xiaohongshu_logger.info(f'  [-] 正在填充标题和话题...')
            title_container = page.locator('div.plugin.title-container').locator('input.d-text')
            if await title_container.count():
                await title_container.fill(self.title[:30])
            else:
                titlecontainer = page.locator(".notranslate")
                await titlecontainer.click()
                await page.keyboard.press("Backspace")
                await page.keyboard.press("Control+KeyA")
                await page.keyboard.press("Delete")
                await page.keyboard.type(self.title)
                await page.keyboard.press("Enter")
            css_selector = ".ql-editor"
            for index, tag in enumerate(self.tags, start=1):
                await page.type(css_selector, "#" + tag)
                await page.press(css_selector, "Space")
            xiaohongshu_logger.info(f'总共添加{len(self.tags)}个话题')

            if self.publish_date != 0:
                await self.set_schedule_time_xiaohongshu(page, self.publish_date)

            # 判断视频是否发布成功
            while True:
                try:
                    if self.publish_date != 0:
                        await page.locator('button:has-text("定时发布")').click()
                    else:
                        await page.locator('button:has-text("发布")').click()
                    await page.wait_for_url(
                        "https://creator.xiaohongshu.com/publish/success?**",
                        timeout=3000
                    )
                    xiaohongshu_logger.success("  [-]视频发布成功")
                    break
                except:
                    xiaohongshu_logger.info("  [-] 视频正在发布中...")
                    await page.screenshot(full_page=True)
                    await asyncio.sleep(0.5)

            await context.storage_state(path=self.account_file)
            xiaohongshu_logger.success('  [-]cookie更新完毕！')

            if DEBUG_MODE:
                await asyncio.sleep(2)

        except Exception as e:
            xiaohongshu_logger.error(f"上传过程中发生异常: {e}")
            raise
        finally:
            if context:
                await context.close()
            if browser:
                await browser.close()

    async def set_thumbnail(self, page: Page, thumbnail_path: str):
        if thumbnail_path:
            await page.click('text="选择封面"')
            await page.wait_for_selector("div.semi-modal-content:visible")
            await page.click('text="设置竖封面"')
            await page.wait_for_timeout(2000)
            await page.locator("div[class^='semi-upload upload'] >> input.semi-upload-hidden-input").set_input_files(thumbnail_path)
            await page.wait_for_timeout(2000)
            await page.locator("div[class^='extractFooter'] button:visible:has-text('完成')").click()

    async def set_location(self, page: Page, location: str = "青岛市"):
        xiaohongshu_logger.info(f"开始设置位置: {location}")

        xiaohongshu_logger.info("等待地点输入框加载...")
        loc_ele = await page.wait_for_selector('div.d-text.d-select-placeholder.d-text-ellipsis.d-text-nowrap')
        xiaohongshu_logger.info(f"已定位到地点输入框: {loc_ele}")
        await loc_ele.click()
        xiaohongshu_logger.info("点击地点输入框完成")

        xiaohongshu_logger.info(f"等待1秒后输入位置名称: {location}")
        await page.wait_for_timeout(1000)
        await page.keyboard.type(location)
        xiaohongshu_logger.info(f"位置名称输入完成: {location}")

        xiaohongshu_logger.info("等待下拉列表加载...")
        dropdown_selector = 'div.d-popover.d-popover-default.d-dropdown.--size-min-width-large'
        await page.wait_for_timeout(3000)
        try:
            await page.wait_for_selector(dropdown_selector, timeout=3000)
            xiaohongshu_logger.info("下拉列表已加载")
        except:
            xiaohongshu_logger.info("下拉列表未按预期显示，可能结构已变化")

        xiaohongshu_logger.info("额外等待1秒确保内容渲染完成...")
        await page.wait_for_timeout(1000)

        xiaohongshu_logger.info("尝试使用更灵活的XPath选择器...")
        flexible_xpath = (
            f'//div[contains(@class, "d-popover") and contains(@class, "d-dropdown")]'
            f'//div[contains(@class, "d-options-wrapper")]'
            f'//div[contains(@class, "d-grid") and contains(@class, "d-options")]'
            f'//div[contains(@class, "name") and text()="{location}"]'
        )
        await page.wait_for_timeout(3000)

        xiaohongshu_logger.info(f"尝试定位包含'{location}'的选项...")
        try:
            location_option = await page.wait_for_selector(
                flexible_xpath,
                timeout=3000
            )

            if location_option:
                xiaohongshu_logger.info(f"使用灵活选择器定位成功: {location_option}")
            else:
                xiaohongshu_logger.info("灵活选择器未找到元素，尝试原始选择器...")
                location_option = await page.wait_for_selector(
                    f'//div[contains(@class, "d-popover") and contains(@class, "d-dropdown")]'
                    f'//div[contains(@class, "d-options-wrapper")]'
                    f'//div[contains(@class, "d-grid") and contains(@class, "d-options")]'
                    f'/div[1]//div[contains(@class, "name") and text()="{location}"]',
                    timeout=2000
                )

            xiaohongshu_logger.info("滚动到目标选项...")
            await location_option.scroll_into_view_if_needed()
            xiaohongshu_logger.info("元素已滚动到视图内")

            is_visible = await location_option.is_visible()
            xiaohongshu_logger.info(f"目标选项是否可见: {is_visible}")

            xiaohongshu_logger.info("准备点击目标选项...")
            await location_option.click()
            xiaohongshu_logger.info(f"成功选择位置: {location}")
            return True

        except Exception as e:
            xiaohongshu_logger.error(f"定位位置失败: {e}")

            xiaohongshu_logger.info("尝试获取下拉列表中的所有选项...")
            try:
                all_options = await page.query_selector_all(
                    '//div[contains(@class, "d-popover") and contains(@class, "d-dropdown")]'
                    '//div[contains(@class, "d-options-wrapper")]'
                    '//div[contains(@class, "d-grid") and contains(@class, "d-options")]'
                    '/div'
                )
                xiaohongshu_logger.info(f"找到 {len(all_options)} 个选项")

                for i, option in enumerate(all_options[:3]):
                    option_text = await option.inner_text()
                    xiaohongshu_logger.info(f"选项 {i+1}: {option_text.strip()[:50]}...")

            except Exception as e:
                xiaohongshu_logger.error(f"获取选项列表失败: {e}")

            return False

    async def main(self):
        async with async_playwright() as playwright:
            await self.upload(playwright)
