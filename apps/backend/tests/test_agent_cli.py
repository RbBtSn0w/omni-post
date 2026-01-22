"""
Test suite for Agent CLI

Tests the command-line interface for the AI agent.
"""

import pytest

from src.cli.agent_cli import main, parse_args


class TestParseArgs:
    """Test argument parsing"""

    def test_parse_basic_prompt(self):
        """Test parsing a basic prompt"""
        args = parse_args(["Publish to Douyin"])
        assert args.prompt == "Publish to Douyin"
        assert args.platform is None
        assert args.interactive is False

    def test_parse_with_platform(self):
        """Test parsing with platform argument"""
        args = parse_args(["Test prompt", "--platform", "douyin"])
        assert args.prompt == "Test prompt"
        assert args.platform == "douyin"

    def test_parse_with_account(self):
        """Test parsing with account argument"""
        args = parse_args(["Test prompt", "--account", "test_account"])
        assert args.prompt == "Test prompt"
        assert args.account == "test_account"

    def test_parse_interactive_mode(self):
        """Test parsing interactive flag"""
        args = parse_args(["--interactive"])
        assert args.interactive is True

    def test_parse_preview_mode(self):
        """Test parsing preview flag"""
        args = parse_args(["Test prompt", "--preview"])
        assert args.prompt == "Test prompt"
        assert args.preview is True

    def test_parse_mock_mode(self):
        """Test parsing mock flag"""
        args = parse_args(["Test prompt", "--mock"])
        assert args.prompt == "Test prompt"
        assert args.mock is True

    def test_parse_no_args_raises_error(self):
        """Test that no arguments raises error"""
        with pytest.raises(SystemExit):
            parse_args([])


class TestMainFunction:
    """Test main function"""

    def test_main_with_mock_service(self):
        """Test main function with mock service"""
        exit_code = main(["Test prompt", "--mock"])
        assert exit_code == 0

    def test_main_with_preview_mode(self):
        """Test main function with preview mode"""
        exit_code = main(["Test prompt", "--mock", "--preview"])
        assert exit_code == 0

    def test_main_with_platform(self):
        """Test main function with platform specification"""
        exit_code = main(["Publish video", "--mock", "--platform", "douyin"])
        assert exit_code == 0

    def test_main_with_account(self):
        """Test main function with account specification"""
        exit_code = main(
            ["Publish video", "--mock", "--account", "test_account.json"]
        )
        assert exit_code == 0

    def test_main_with_all_options(self):
        """Test main function with all options"""
        exit_code = main([
            "Test prompt",
            "--mock",
            "--platform", "xiaohongshu",
            "--account", "account.json",
            "--preview"
        ])
        assert exit_code == 0
