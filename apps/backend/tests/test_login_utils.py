#!/usr/bin/env python3
import asyncio
import pytest
import os
from pathlib import Path
from unittest.mock import MagicMock, patch, call
from datetime import datetime

from src.utils.login import (
    debug_print,
    create_screenshot_dir,
    debug_screenshot,
)


class TestLoginUtils:
    """测试登录工具函数"""

    @patch('src.core.config.DEBUG_MODE', True)
    def test_debug_print_enabled(self, capsys):
        """测试DEBUG_MODE开启时debug_print正常打印"""
        debug_print("Test debug message", end="")
        captured = capsys.readouterr()
        assert captured.out == "Test debug message"

    @patch('src.core.config.DEBUG_MODE', False)
    def test_debug_print_disabled(self, capsys):
        """测试DEBUG_MODE关闭时debug_print不打印"""
        debug_print("Test debug message")
        captured = capsys.readouterr()
        assert captured.out == ""

    def test_create_screenshot_dir(self):
        """测试创建截图目录功能"""
        platform = "test_platform"
        dir_path = create_screenshot_dir(platform)

        # 验证目录格式
        assert isinstance(dir_path, Path)
        assert platform in str(dir_path)

        # 验证目录存在
        assert dir_path.exists()

        # 验证目录结构
        assert dir_path.parent.name == platform
        assert dir_path.parent.parent.name == "screenshots"

        # 清理测试创建的目录
        import shutil
        # 只删除我们创建的特定时间戳目录
        shutil.rmtree(dir_path)

    @patch('src.core.config.DEBUG_MODE', True)
    @pytest.mark.asyncio
    async def test_debug_screenshot_enabled(self):
        """测试DEBUG_MODE开启时debug_screenshot正常截图"""
        # 创建一个模拟的page对象
        mock_page = MagicMock()
        mock_page.screenshot = MagicMock()
        mock_page.screenshot.return_value = None

        # 创建测试目录
        screenshot_dir = Path("/tmp/test_screenshots")
        screenshot_dir.mkdir(exist_ok=True)

        try:
            await debug_screenshot(mock_page, screenshot_dir, "test_screenshot", "Test description")

            # 验证screenshot方法被调用
            mock_page.screenshot.assert_called_once()

            # 验证调用参数
            call_args = mock_page.screenshot.call_args
            assert Path(call_args.kwargs["path"]).name == "test_screenshot.png"
            assert call_args.kwargs["timeout"] == 10000
        finally:
            # 清理测试目录
            import shutil
            shutil.rmtree(screenshot_dir, ignore_errors=True)

    @patch('src.core.config.DEBUG_MODE', False)
    @pytest.mark.asyncio
    async def test_debug_screenshot_disabled(self):
        """测试DEBUG_MODE关闭时debug_screenshot不截图"""
        # 创建一个模拟的page对象
        mock_page = MagicMock()
        mock_page.screenshot = MagicMock()

        # 创建测试目录
        screenshot_dir = Path("/tmp/test_screenshots")
        screenshot_dir.mkdir(exist_ok=True)

        try:
            await debug_screenshot(mock_page, screenshot_dir, "test_screenshot")

            # 验证screenshot方法未被调用
            mock_page.screenshot.assert_not_called()
        finally:
            # 清理测试目录
            import shutil
            shutil.rmtree(screenshot_dir, ignore_errors=True)

    @pytest.mark.asyncio
    async def test_debug_screenshot_without_extension(self):
        """测试不带扩展名的文件名处理"""
        @patch('src.conf.DEBUG_MODE', True)
        async def run_test():
            # 创建一个模拟的page对象
            mock_page = MagicMock()
            mock_page.screenshot = MagicMock()
            mock_page.screenshot.return_value = None

            # 创建测试目录
            screenshot_dir = Path("/tmp/test_screenshots")
            screenshot_dir.mkdir(exist_ok=True)

            try:
                await debug_screenshot(mock_page, screenshot_dir, "test_screenshot_no_ext")

                # 验证screenshot方法被调用，且文件名带有.png扩展名
                mock_page.screenshot.assert_called_once()
                call_args = mock_page.screenshot.call_args
                assert Path(call_args.kwargs["path"]).name == "test_screenshot_no_ext.png"
            finally:
                # 清理测试目录
                import shutil
                shutil.rmtree(screenshot_dir, ignore_errors=True)

        await run_test()

    @pytest.mark.asyncio
    async def test_debug_screenshot_with_png_extension(self):
        """测试带有.png扩展名的文件名处理"""
        @patch('src.conf.DEBUG_MODE', True)
        async def run_test():
            # 创建一个模拟的page对象
            mock_page = MagicMock()
            mock_page.screenshot = MagicMock()
            mock_page.screenshot.return_value = None

            # 创建测试目录
            screenshot_dir = Path("/tmp/test_screenshots")
            screenshot_dir.mkdir(exist_ok=True)

            try:
                await debug_screenshot(mock_page, screenshot_dir, "test_screenshot.png")

                # 验证screenshot方法被调用，且文件名保持不变
                mock_page.screenshot.assert_called_once()
                call_args = mock_page.screenshot.call_args
                assert Path(call_args.kwargs["path"]).name == "test_screenshot.png"
            finally:
                # 清理测试目录
                import shutil
                shutil.rmtree(screenshot_dir, ignore_errors=True)

        await run_test()

    @patch('src.utils.login.DEBUG_MODE', True)
    @pytest.mark.asyncio
    async def test_debug_screenshot_failure(self):
        """测试截图失败时的处理"""
        # 创建一个模拟的page对象，让screenshot方法抛出异常
        mock_page = MagicMock()
        mock_page.screenshot = MagicMock(side_effect=Exception("Screenshot failed"))

        # 创建测试目录
        screenshot_dir = Path("/tmp/test_screenshots")
        screenshot_dir.mkdir(exist_ok=True)

        try:
            # 验证函数不会崩溃
            await debug_screenshot(mock_page, screenshot_dir, "test_screenshot")

            # 验证screenshot方法被调用
            mock_page.screenshot.assert_called_once()
        finally:
            # 清理测试目录
            import shutil
            # 使用ignore_errors=True直接忽略所有删除错误
            shutil.rmtree(screenshot_dir, ignore_errors=True)

    def test_create_screenshot_dir_timestamp_format(self):
        """测试截图目录的时间戳格式"""
        platform = "test_platform"
        dir_path = create_screenshot_dir(platform)

        try:
            # 获取目录名（时间戳部分）
            timestamp_str = dir_path.name

            # 验证时间戳格式：YYYYmmdd_HHMMSS_mmm
            datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S_%f")
        finally:
            # 清理测试目录
            import shutil
            shutil.rmtree(dir_path)

    def test_create_screenshot_dir_nested_structure(self):
        """测试截图目录的嵌套结构"""
        platform = "test_platform"
        dir_path = create_screenshot_dir(platform)

        try:
            # 验证目录结构：BASE_DIR/logs/screenshots/platform/timestamp
            expected_parent = dir_path.parent.parent
            assert expected_parent.name == "screenshots"
            assert expected_parent.parent.name == "logs"
        finally:
            # 清理测试目录
            import shutil
            shutil.rmtree(dir_path)