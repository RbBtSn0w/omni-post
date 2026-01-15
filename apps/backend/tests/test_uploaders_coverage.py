
import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime

from src.uploader.xiaohongshu_uploader.main import XiaoHongShuVideo
from src.uploader.tencent_uploader.main import TencentVideo, format_str_for_short_title
from src.uploader.douyin_uploader.main import DouYinVideo

# --- Helper Mock Classes ---

class MockLocator:
    """
    Simulates Playwright's Locator API.
    """
    def __init__(self, name="mock_locator"):
        self.name = name
        # Async methods
        self.click = AsyncMock(name=f"{name}.click")
        self.fill = AsyncMock(name=f"{name}.fill")
        self.set_input_files = AsyncMock(name=f"{name}.set_input_files")
        self.type = AsyncMock(name=f"{name}.type")
        self.press = AsyncMock(name=f"{name}.press")
        # Default count to 1 so "if locator.count():" works for positive cases
        self.count = AsyncMock(name=f"{name}.count", return_value=1)
        self.get_attribute = AsyncMock(name=f"{name}.get_attribute", return_value="")
        self.is_visible = AsyncMock(name=f"{name}.is_visible", return_value=True)
        self.is_disabled = AsyncMock(name=f"{name}.is_disabled", return_value=False)
        self.scroll_into_view_if_needed = AsyncMock(name=f"{name}.scroll_into_view_if_needed")
        self.inner_text = AsyncMock(name=f"{name}.inner_text", return_value="text")
        self.check = AsyncMock(name=f"{name}.check")
        self.query_selector = AsyncMock(name=f"{name}.query_selector")
        self.query_selector_all = AsyncMock(name=f"{name}.query_selector_all", return_value=[])
        self.evaluate = AsyncMock(name=f"{name}.evaluate", return_value=[])

    # Sync chaining methods
    def locator(self, selector):
        return self

    def filter(self, has_text=None):
        return self

    def nth(self, index):
        return self

    @property
    def first(self):
        return self

class MockPage:
    """
    Simulates Playwright's Page API.
    """
    def __init__(self):
        self.locator = MagicMock(return_value=MockLocator("page_locator"))
        self.get_by_text = MagicMock(return_value=MockLocator("get_by_text"))
        self.get_by_role = MagicMock(return_value=MockLocator("get_by_role"))
        self.get_by_label = MagicMock(return_value=MockLocator("get_by_label"))

        self.wait_for_selector = AsyncMock(return_value=MockLocator("wait_for_selector"))
        self.wait_for_timeout = AsyncMock()
        self.wait_for_url = AsyncMock()
        self.keyboard = AsyncMock()
        self.keyboard.type = AsyncMock()
        self.keyboard.press = AsyncMock()

        self.click = AsyncMock()
        self.evaluate = AsyncMock(return_value=[])
        self.query_selector_all = AsyncMock(return_value=[])
        self.inner_text = AsyncMock(return_value="")
        self.url = "https://example.com"

# --- Tests ---

class TestUploadersCoverage:

    @pytest.fixture
    def mock_page(self):
        return MockPage()

    @pytest.mark.asyncio
    async def test_xhs_set_schedule_time(self, mock_page):
        uploader = XiaoHongShuVideo(
            title="test", file_path="test.mp4", tags=[],
            publish_date=datetime(2026, 1, 1, 12, 0), account_file="test.json"
        )

        await uploader.set_schedule_time_xiaohongshu(mock_page, uploader.publish_date)

        mock_page.keyboard.type.assert_called_with("2026-01-01 12:00")

    @pytest.mark.asyncio
    async def test_xhs_set_location_success(self, mock_page):
        uploader = XiaoHongShuVideo(
            title="test", file_path="test.mp4", tags=[],
            publish_date=datetime(2026, 1, 1, 12, 0), account_file="test.json"
        )

        loc_ele = MockLocator("location_input_div")
        mock_page.wait_for_selector.return_value = loc_ele

        result = await uploader.set_location(mock_page, "Beijing")

        assert result is True
        loc_ele.click.assert_called()
        mock_page.keyboard.type.assert_called_with("Beijing")

    @pytest.mark.asyncio
    async def test_xhs_set_location_failure(self, mock_page):
        uploader = XiaoHongShuVideo(
            title="test", file_path="test.mp4", tags=[],
            publish_date=datetime(2026, 1, 1, 12, 0), account_file="test.json"
        )

        # We need the first wait_for_selector to succeed (finding the input box),
        # but the subsequent one (finding the option) to fail.

        mock_input = MockLocator("input_box")

        # side_effect for wait_for_selector:
        # 1. Success (input box)
        # 2. Success (dropdown appear check - line 242)
        # 3. Failure (finding option - line 265)
        # 4. Failure (fallback option - line 275)
        mock_page.wait_for_selector.side_effect = [
            mock_input,
            MockLocator("dropdown"),
            Exception("Timeout"),
            Exception("Timeout")
        ]

        result = await uploader.set_location(mock_page, "Nowhere")

        assert result is False

    @pytest.mark.asyncio
    async def test_xhs_handle_upload_error(self, mock_page):
        uploader = XiaoHongShuVideo(
            title="test", file_path="test.mp4", tags=[],
            publish_date=0, account_file="test.json"
        )

        file_input = MockLocator("file_input")
        mock_page.locator.return_value = file_input

        await uploader.handle_upload_error(mock_page)

        file_input.set_input_files.assert_called_with("test.mp4")

    def test_tencent_format_short_title(self):
        assert format_str_for_short_title("Normal Title") == "NormalTitle"
        assert len(format_str_for_short_title("A" * 20)) == 16
        assert format_str_for_short_title("Test《》") == "Test《》"

    @pytest.mark.asyncio
    async def test_tencent_set_schedule_time(self, mock_page):
        uploader = TencentVideo(
            title="test", file_path="test.mp4", tags=[],
            publish_date=datetime(2026, 1, 1, 12, 0), account_file="test.json"
        )

        mock_page.inner_text.return_value = "01月"

        link_element = MockLocator("day_link")
        link_element.evaluate.return_value = "" # not disabled
        link_element.inner_text.return_value = "1"
        mock_page.query_selector_all.return_value = [link_element]

        await uploader.set_schedule_time_tencent(mock_page, uploader.publish_date)

        mock_page.keyboard.type.assert_called_with("12")

    @pytest.mark.asyncio
    async def test_douyin_set_schedule(self, mock_page):
        uploader = DouYinVideo(
            title="test", file_path="test.mp4", tags=[],
            publish_date=datetime(2026, 1, 1, 12, 0), account_file="test.json"
        )

        await uploader.set_schedule_time_douyin(mock_page, uploader.publish_date)

        mock_page.keyboard.type.assert_called_with("2026-01-01 12:00")

    @pytest.mark.asyncio
    async def test_douyin_set_product_link_success(self, mock_page):
        uploader = DouYinVideo(
            title="test", file_path="test.mp4", tags=[],
            publish_date=0, account_file="test.json"
        )

        # Configure button locator to simulate "enabled" state
        add_button = MockLocator("add_button")
        add_button.get_attribute.return_value = "class-normal"

        input_field = MockLocator("input_field")

        # Configure error modal to be NOT found
        error_modal = MockLocator("error_modal")
        error_modal.count.return_value = 0

        # Complex side effect to return correct mocks based on selector
        def locator_side_effect(selector):
            if '添加链接' in str(selector):
                return add_button
            if '未搜索到对应商品' in str(selector):
                return error_modal
            return input_field

        mock_page.locator.side_effect = locator_side_effect


        # Use patch to mock the internal handle_product_dialog call
        with patch.object(uploader, 'handle_product_dialog', new_callable=AsyncMock) as mock_handle:
            mock_handle.return_value = True

            result = await uploader.set_product_link(mock_page, "http://link", "Product")

            assert result is True
