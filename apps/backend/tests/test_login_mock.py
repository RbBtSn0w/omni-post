import pytest
from unittest.mock import MagicMock, AsyncMock, patch, ANY
import asyncio
from src.utils.login import douyin_cookie_gen, get_tencent_cookie, get_ks_cookie, xiaohongshu_cookie_gen

# Reuse locator mock helper
def create_mock_locator(text_content="", count_val=1, src="http://example.com/qr.png"):
    loc = AsyncMock()
    loc.count.return_value = count_val
    loc.get_attribute.return_value = src
    loc.click.return_value = None
    loc.fill.return_value = None

    # Chaining
    # locator(...) returns a locator. Sync method.
    loc.locator = MagicMock(return_value=loc)
    loc.get_by_role = MagicMock(return_value=loc)
    loc.get_by_text = MagicMock(return_value=loc)
    loc.filter = MagicMock(return_value=loc)
    loc.nth = MagicMock(return_value=loc)

    # Properties
    loc.first = loc
    loc.last = loc

    return loc

@pytest.mark.asyncio
class TestLoginUtils:
    @pytest.fixture
    def mock_playwright(self):
        playwright = AsyncMock()
        browser = AsyncMock()
        context = AsyncMock()
        page = AsyncMock()

        playwright.chromium.launch.return_value = browser
        browser.new_context.return_value = context
        context.new_page.return_value = page

        page.on = MagicMock()
        page.goto = AsyncMock()
        page.url = "http://initial.url"
        page.title.return_value = "Page Title"

        # Mock locators
        # IMPORTANT: These must be MagicMock because they are sync methods returning objects
        mock_loc = create_mock_locator()

        page.get_by_role = MagicMock(return_value=mock_loc)
        page.get_by_text = MagicMock(return_value=mock_loc)
        page.locator = MagicMock(return_value=mock_loc)
        page.frame_locator = MagicMock(return_value=mock_loc)

        return playwright, context, page

    @pytest.fixture
    def mock_queue(self):
        return MagicMock()

    @pytest.fixture
    def mock_db(self):
        conn = MagicMock()
        cursor = MagicMock()
        conn.cursor.return_value = cursor
        cursor.fetchone.return_value = (1,) # Existing group
        cursor.lastrowid = 1
        return conn

    @patch('src.utils.login.async_playwright')
    @patch('src.utils.login.launch_browser')
    @patch('src.utils.login.set_init_script')
    @patch('src.utils.login.check_cookie')
    @patch('src.utils.login.sqlite3')
    async def test_douyin_cookie_gen_success(self, mock_sqlite, mock_check_cookie, mock_init, mock_launch, mock_pw_cls, mock_playwright, mock_queue, mock_db):
        pw, ctx, page = mock_playwright
        mock_pw_cls.return_value.__aenter__.return_value = pw
        mock_launch.return_value = pw.chromium.launch.return_value
        mock_init.return_value = ctx

        mock_check_cookie.return_value = True
        mock_sqlite.connect.return_value.__enter__.return_value = mock_db

        # Simulate URL change event triggering
        # The code waits for event. mock wait_for to return immediately (success)
        with patch('asyncio.wait_for', new_callable=AsyncMock) as mock_wait:
            mock_wait.return_value = None # Success

            await douyin_cookie_gen("user1", mock_queue, "group1")

        # Verify
        page.goto.assert_called_with("https://creator.douyin.com/")
        mock_queue.put.assert_any_call("http://example.com/qr.png") # QR src
        mock_queue.put.assert_any_call("200") # Success
        mock_db.cursor.return_value.execute.assert_called()

    @patch('src.utils.login.async_playwright')
    @patch('src.utils.login.launch_browser')
    @patch('src.utils.login.set_init_script')
    @patch('src.utils.login.check_cookie')
    @patch('src.utils.login.sqlite3')
    async def test_tencent_cookie_gen_success(self, mock_sqlite, mock_check_cookie, mock_init, mock_launch, mock_pw_cls, mock_playwright, mock_queue, mock_db):
        pw, ctx, page = mock_playwright
        mock_pw_cls.return_value.__aenter__.return_value = pw
        mock_launch.return_value = pw.chromium.launch.return_value
        mock_init.return_value = ctx

        mock_check_cookie.return_value = True
        mock_sqlite.connect.return_value.__enter__.return_value = mock_db

        with patch('asyncio.wait_for', new_callable=AsyncMock) as mock_wait:
             # Tencent waits for url_changed_event.wait()
             mock_wait.return_value = None

             await get_tencent_cookie("user2", mock_queue, "group1")

        page.goto.assert_called_with("https://channels.weixin.qq.com")
        mock_queue.put.assert_any_call("200")

    @patch('src.utils.login.async_playwright')
    @patch('src.utils.login.launch_browser')
    @patch('src.utils.login.set_init_script')
    @patch('src.utils.login.check_cookie')
    @patch('src.utils.login.sqlite3')
    async def test_ks_cookie_gen_success(self, mock_sqlite, mock_check_cookie, mock_init, mock_launch, mock_pw_cls, mock_playwright, mock_queue, mock_db):
        pw, ctx, page = mock_playwright
        mock_pw_cls.return_value.__aenter__.return_value = pw
        mock_launch.return_value = pw.chromium.launch.return_value
        mock_init.return_value = ctx

        mock_check_cookie.return_value = True
        mock_sqlite.connect.return_value.__enter__.return_value = mock_db

        with patch('asyncio.wait_for', new_callable=AsyncMock) as mock_wait:
             mock_wait.return_value = None

             # Need to mock verify_login_success which uses page content
             # It uses page.title()

             await get_ks_cookie("user3", mock_queue, "group1")

        page.goto.assert_called()
        mock_queue.put.assert_any_call("200")

    @patch('src.utils.login.async_playwright')
    @patch('src.utils.login.launch_browser')
    @patch('src.utils.login.set_init_script')
    @patch('src.utils.login.check_cookie')
    @patch('src.utils.login.sqlite3')
    async def test_xhs_cookie_gen_success(self, mock_sqlite, mock_check_cookie, mock_init, mock_launch, mock_pw_cls, mock_playwright, mock_queue, mock_db):
        pw, ctx, page = mock_playwright
        mock_pw_cls.return_value.__aenter__.return_value = pw
        mock_launch.return_value = pw.chromium.launch.return_value
        mock_init.return_value = ctx

        mock_check_cookie.return_value = True
        mock_sqlite.connect.return_value.__enter__.return_value = mock_db

        with patch('asyncio.wait_for', new_callable=AsyncMock) as mock_wait:
             mock_wait.return_value = None

             await xiaohongshu_cookie_gen("user4", mock_queue, "group1")

        page.goto.assert_called_with("https://creator.xiaohongshu.com/")
        mock_queue.put.assert_any_call("200")
