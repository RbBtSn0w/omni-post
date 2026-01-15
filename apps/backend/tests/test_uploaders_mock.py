import pytest
from unittest.mock import MagicMock, AsyncMock, patch, PropertyMock
from datetime import datetime
import asyncio

# Import classes to test
from src.uploader.douyin_uploader.main import DouYinVideo
from src.uploader.tencent_uploader.main import TencentVideo
from src.uploader.ks_uploader.main import KSVideo
from src.uploader.xiaohongshu_uploader.main import XiaoHongShuVideo

def create_mock_locator(count_val=1):
    """Create a locator mock that handles sync chaining and async methods"""
    loc = AsyncMock()
    # Async methods that return values
    loc.count.return_value = count_val
    loc.all_inner_texts.return_value = []
    # Async methods that return None (actions)
    loc.click.return_value = None
    loc.fill.return_value = None
    loc.check.return_value = None
    loc.set_input_files.return_value = None
    loc.press.return_value = None
    loc.type.return_value = None
    loc.get_attribute.return_value = None
    loc.is_visible.return_value = True
    loc.scroll_into_view_if_needed.return_value = None
    loc.wait_for.return_value = None

    # Query methods
    loc.query_selector.return_value = loc # Returns self as child
    loc.query_selector_all.return_value = [loc] # Returns list of self

    # Sync chaining methods MUST be MagicMock
    chain_mock = MagicMock(return_value=loc)
    loc.locator = chain_mock
    type(loc).first = PropertyMock(return_value=loc)
    type(loc).last = PropertyMock(return_value=loc)
    loc.nth = chain_mock
    loc.filter = chain_mock

    return loc

@pytest.mark.asyncio
class TestUploaders:
    @pytest.fixture
    def mock_playwright(self):
        playwright = AsyncMock()
        browser = AsyncMock()
        context = AsyncMock()
        page = AsyncMock()

        playwright.chromium.launch.return_value = browser
        browser.new_context.return_value = context
        context.new_page.return_value = page

        # Default Factory
        def locator_factory(selector=None, **kwargs):
            # Intelligent Mocking based on selector
            count = 1
            if selector:
                if "上传中" in selector:
                    count = 0 # Simulate upload finished (Kuaishou)
                elif "重新上传" in selector:
                    count = 1 # Simulate finished (Douyin)
                elif "div.stage" in str(selector) or "stage" in str(selector):
                    count = 1

            return create_mock_locator(count_val=count)

        # Explicitly set synchronous mocks
        page.locator = MagicMock(side_effect=locator_factory)

        # get_by_* helpers
        page.get_by_text = MagicMock(side_effect=lambda text, **kw: locator_factory(text))
        page.get_by_role = MagicMock(side_effect=lambda role, **kw: locator_factory(role))
        page.get_by_label = MagicMock(side_effect=lambda label, **kw: locator_factory(label))
        page.get_by_placeholder = MagicMock(side_effect=lambda ph, **kw: locator_factory(ph))

        # Async page methods
        page.goto.return_value = None
        page.wait_for_url.return_value = None

        # wait_for_selector must return a locator (async)
        page.wait_for_selector.return_value = create_mock_locator(1)

        page.wait_for_timeout.return_value = None

        # Fix: .value must be an AWAITABLE coroutine returning an object
        async def get_fc_value():
            return AsyncMock()

        file_chooser_info = MagicMock()
        file_chooser_info.value = get_fc_value()

        # Setup context manager
        cm = MagicMock()
        cm.__aenter__.return_value = file_chooser_info
        cm.__aexit__.return_value = None

        page.expect_file_chooser = MagicMock(return_value=cm)

        # Helper for XHS evaluate
        page.evaluate.return_value = "上传成功"

        return playwright, context, page

    @patch('src.uploader.douyin_uploader.main.launch_browser', new_callable=AsyncMock)
    @patch('src.uploader.douyin_uploader.main.set_init_script', new_callable=AsyncMock)
    async def test_douyin_basic(self, mock_init, mock_launch, mock_playwright):
        pw, ctx, page = mock_playwright
        mock_init.return_value = ctx

        mock_browser = AsyncMock()
        mock_browser.new_context.return_value = ctx
        mock_launch.return_value = mock_browser

        uploader = DouYinVideo('Title', 'path', ['tag'], 0, 'acc', thumbnail_path='thumb')
        await uploader.upload(pw)
        page.goto.assert_called_with("https://creator.douyin.com/creator-micro/content/upload", wait_until='domcontentloaded')
        mock_browser.close.assert_called_once()

    @patch('src.uploader.douyin_uploader.main.launch_browser', new_callable=AsyncMock)
    @patch('src.uploader.douyin_uploader.main.set_init_script', new_callable=AsyncMock)
    async def test_douyin_complex(self, mock_init, mock_launch, mock_playwright):
        pw, ctx, page = mock_playwright
        mock_init.return_value = ctx

        mock_browser = AsyncMock()
        mock_browser.new_context.return_value = ctx
        mock_launch.return_value = mock_browser

        uploader = DouYinVideo(
            title='Title',
            file_path='path',
            tags=['tag'],
            publish_date=datetime.now(),
            account_file='acc',
            thumbnail_path='thumb',
            productLink='http://item',
            productTitle='Item'
        )
        await uploader.upload(pw)
        assert page.locator.called

    @patch('src.uploader.tencent_uploader.main.launch_browser', new_callable=AsyncMock)
    @patch('src.uploader.tencent_uploader.main.set_init_script', new_callable=AsyncMock)
    async def test_tencent_basic(self, mock_init, mock_launch, mock_playwright):
        pw, ctx, page = mock_playwright
        mock_init.return_value = ctx

        # Mock launch_browser to return our mock browser
        mock_browser = AsyncMock()
        mock_browser.new_context.return_value = ctx
        mock_launch.return_value = mock_browser

        def tencent_side_effect(selector=None, **kwargs):
            loc = create_mock_locator(1)
            # Make sure it has get_attribute
            loc.get_attribute.return_value = "weui-desktop-btn_primary semi-switch-checked"
            return loc

        page.locator.side_effect = tencent_side_effect
        page.get_by_role.side_effect = lambda r, **kw: tencent_side_effect(r)

        uploader = TencentVideo('Title', 'path', ['tag'], 0, 'acc')
        await uploader.upload(pw)
        page.goto.assert_called_with("https://channels.weixin.qq.com/platform/post/create", wait_until='domcontentloaded')
        # Verify browser was closed in finally block
        mock_browser.close.assert_called_once()


    @patch('src.uploader.tencent_uploader.main.launch_browser', new_callable=AsyncMock)
    @patch('src.uploader.tencent_uploader.main.set_init_script', new_callable=AsyncMock)
    async def test_tencent_complex(self, mock_init, mock_launch, mock_playwright):
        pw, ctx, page = mock_playwright
        mock_init.return_value = ctx

        # Mock launch_browser to return our mock browser
        mock_browser = AsyncMock()
        mock_browser.new_context.return_value = ctx
        mock_launch.return_value = mock_browser

        def tencent_side_effect(selector=None, **kwargs):
            loc = create_mock_locator(1)
            loc.get_attribute.return_value = "weui-desktop-btn_primary"
            return loc
        page.locator.side_effect = tencent_side_effect
        page.get_by_role.side_effect = lambda r, **kw: tencent_side_effect(r)

        uploader = TencentVideo('Title', 'path', ['tag'], 0, 'acc', category='Ent', is_draft=True)
        await uploader.upload(pw)
        # Verify browser was closed in finally block
        mock_browser.close.assert_called_once()

    @patch('src.uploader.ks_uploader.main.launch_browser', new_callable=AsyncMock)
    @patch('src.uploader.ks_uploader.main.set_init_script', new_callable=AsyncMock)
    async def test_kuaishou(self, mock_init, mock_launch, mock_playwright):
        pw, ctx, page = mock_playwright
        mock_init.return_value = ctx

        mock_browser = AsyncMock()
        mock_browser.new_context.return_value = ctx
        mock_launch.return_value = mock_browser

        uploader = KSVideo('Title', 'path', ['tag'], 0, 'acc')
        await uploader.upload(pw)
        page.goto.assert_called_with("https://cp.kuaishou.com/article/publish/video", wait_until='domcontentloaded')
        mock_browser.close.assert_called_once()

    @patch('src.uploader.xiaohongshu_uploader.main.launch_browser', new_callable=AsyncMock)
    @patch('src.uploader.xiaohongshu_uploader.main.set_init_script', new_callable=AsyncMock)
    async def test_xhs(self, mock_init, mock_launch, mock_playwright):
        pw, ctx, page = mock_playwright
        mock_init.return_value = ctx

        mock_browser = AsyncMock()
        mock_browser.new_context.return_value = ctx
        mock_launch.return_value = mock_browser

        uploader = XiaoHongShuVideo('Title', 'path', ['tag'], 0, 'acc')
        await uploader.upload(pw)
        page.goto.assert_called_with("https://creator.xiaohongshu.com/publish/publish?from=homepage&target=video", wait_until='domcontentloaded')
        mock_browser.close.assert_called_once()
