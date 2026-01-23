from unittest.mock import MagicMock, patch

from src.services.login_service import run_async_function


def test_run_async_function_dispatch():
    """Test run_async_function correctly dispatches to login service methods"""

    with (
        patch("src.services.login_service.DefaultLoginService") as MockService,
        patch("src.services.login_service.asyncio") as mock_asyncio,
    ):

        mock_service_instance = MockService.return_value
        mock_loop = MagicMock()
        mock_asyncio.new_event_loop.return_value = mock_loop

        status_queue = MagicMock()

        # Test Xiaohongshu (Type 1)
        run_async_function("1", "id1", status_queue)
        mock_service_instance.xiaohongshu_cookie_gen.assert_called()

        # Test Tencent (Type 2)
        run_async_function("2", "id2", status_queue)
        mock_service_instance.get_tencent_cookie.assert_called()

        # Test Douyin (Type 3)
        run_async_function("3", "id3", status_queue)
        mock_service_instance.douyin_cookie_gen.assert_called()

        # Test Kuaishou (Type 4)
        run_async_function("4", "id4", status_queue)
        mock_service_instance.get_ks_cookie.assert_called()

        # Test Bilibili (Type 5)
        run_async_function("5", "id5", status_queue)
        mock_service_instance.bilibili_cookie_gen.assert_called()
