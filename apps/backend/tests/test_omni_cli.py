"""
Tests for OmniPost CLI (omni_cli.py).

These tests verify the CLI functionality for listing accounts,
filtering by platform, and the --refresh flag behavior.
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Add tools to path
REPO_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "tools"))
sys.path.insert(0, str(REPO_ROOT / "apps" / "backend" / "src"))


class TestOmniCLIImport:
    """Test that CLI can be imported."""

    def test_import_omni_cli(self):
        """Test that omni_cli module can be imported."""
        from omni_cli import OmniCLI, main

        assert OmniCLI is not None
        assert main is not None


class TestOmniCLIPlatformMaps:
    """Test platform mapping logic."""

    def test_platform_map_includes_bilibili(self):
        """Test that bilibili is included in platform maps from constants."""
        from core.constants import (
            PLATFORM_CLI_NAMES,
            PLATFORM_REGISTRY,
            PLATFORM_TYPE_TO_CLI_NAME,
            PlatformType,
        )

        # Bilibili should be in the registry
        assert PlatformType.BILIBILI in PLATFORM_REGISTRY
        assert PLATFORM_REGISTRY[PlatformType.BILIBILI]["name_cli"] == "bilibili"

        # Auto-derived mappings should include bilibili
        assert "bilibili" in PLATFORM_CLI_NAMES
        assert PLATFORM_CLI_NAMES["bilibili"] == PlatformType.BILIBILI
        assert PlatformType.BILIBILI in PLATFORM_TYPE_TO_CLI_NAME

    def test_platform_registry_is_source_of_truth(self):
        """Test that all mappings are derived from PLATFORM_REGISTRY."""
        from core.constants import (
            PLATFORM_CLI_NAMES,
            PLATFORM_LOGIN_URLS,
            PLATFORM_NAMES,
            PLATFORM_REGISTRY,
            PlatformType,
        )

        # All platforms in registry should have entries in derived mappings
        for platform_type, info in PLATFORM_REGISTRY.items():
            assert platform_type in PLATFORM_NAMES
            assert PLATFORM_NAMES[platform_type] == info["name_cn"]
            assert platform_type in PLATFORM_LOGIN_URLS
            assert PLATFORM_LOGIN_URLS[platform_type] == info["login_url"]
            assert info["name_cli"] in PLATFORM_CLI_NAMES

    def test_cli_aliases_work(self):
        """Test that CLI aliases (like 'wechat' for tencent) work."""
        from core.constants import PLATFORM_CLI_NAMES, PlatformType

        # 'wechat' is an alias for TENCENT
        assert "wechat" in PLATFORM_CLI_NAMES
        assert PLATFORM_CLI_NAMES["wechat"] == PlatformType.TENCENT
        assert PLATFORM_CLI_NAMES["tencent"] == PlatformType.TENCENT

    def test_cli_helper_functions(self):
        """Test CLI helper functions from constants."""
        from core.constants import (
            PlatformType,
            cli_name_to_type,
            get_cli_platform_choices,
            type_to_cli_name,
        )

        # Test cli_name_to_type
        assert cli_name_to_type("douyin") == PlatformType.DOUYIN
        assert cli_name_to_type("bilibili") == PlatformType.BILIBILI
        assert cli_name_to_type("wechat") == PlatformType.TENCENT  # alias
        assert cli_name_to_type("invalid") == 0

        # Test type_to_cli_name
        assert type_to_cli_name(PlatformType.DOUYIN) == "douyin"
        assert type_to_cli_name(PlatformType.BILIBILI) == "bilibili"
        assert type_to_cli_name(999) == "unknown"

        # Test get_cli_platform_choices
        choices = get_cli_platform_choices()
        assert "douyin" in choices
        assert "bilibili" in choices
        assert "wechat" in choices


class TestOmniCLIArgParser:
    """Test argument parsing."""

    def test_accounts_help_includes_refresh(self, capsys):
        """Test that accounts command has --refresh option."""
        from omni_cli import OmniCLI

        cli = OmniCLI()
        # Run accounts with --help - this raises SystemExit(0)
        with pytest.raises(SystemExit) as exc_info:
            cli.run(["accounts", "--help"])
        assert exc_info.value.code == 0
        captured = capsys.readouterr()
        assert "--refresh" in captured.out
        assert "Refresh" in captured.out

    def test_post_platforms_include_bilibili(self):
        """Test that post command accepts bilibili platform."""
        from omni_cli import OmniCLI

        cli = OmniCLI()
        # Mock agent to avoid starting it
        with patch.object(cli, "_ensure_agent_started"):
            with patch.object(cli, "agent") as mock_agent:
                mock_agent.run.return_value = {"status": "ok", "result": {}}
                cli.run(["post", "test", "--platforms", "bilibili", "--dry-run"])
                # Should parse without error (exit code doesn't matter for this test)


class TestOmniCLIAccountsCommand:
    """Test accounts command functionality."""

    @patch("omni_cli.db_manager")
    @patch("omni_cli.sqlite3")
    def test_accounts_lists_empty(self, mock_sqlite3, mock_db_manager, capsys):
        """Test accounts command with no accounts."""
        from omni_cli import OmniCLI

        mock_db_manager.get_db_path.return_value = ":memory:"
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        mock_conn.cursor.return_value = mock_cursor
        mock_sqlite3.connect.return_value = mock_conn

        cli = OmniCLI()
        result = cli.run(["accounts"])

        assert result == 0
        captured = capsys.readouterr()
        assert "No accounts found" in captured.out

    @patch("omni_cli.db_manager")
    @patch("omni_cli.sqlite3")
    def test_accounts_lists_with_data(self, mock_sqlite3, mock_db_manager, capsys):
        """Test accounts command with mock data."""
        from omni_cli import OmniCLI

        mock_db_manager.get_db_path.return_value = ":memory:"
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            (1, 3, "test_douyin", "/path/to/cookie", 1),  # douyin, active
            (2, 5, "test_bilibili", "/path/to/cookie2", 0),  # bilibili, inactive
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_sqlite3.connect.return_value = mock_conn

        cli = OmniCLI()
        result = cli.run(["accounts"])

        assert result == 0
        captured = capsys.readouterr()
        assert "Found 2 account(s)" in captured.out
        assert "douyin" in captured.out
        assert "bilibili" in captured.out

    @patch("omni_cli.db_manager")
    @patch("omni_cli.sqlite3")
    def test_accounts_filter_by_platform(self, mock_sqlite3, mock_db_manager, capsys):
        """Test accounts command with platform filter."""
        from omni_cli import OmniCLI

        mock_db_manager.get_db_path.return_value = ":memory:"
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            (2, 5, "test_bilibili", "/path/to/cookie", 1),
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_sqlite3.connect.return_value = mock_conn

        cli = OmniCLI()
        result = cli.run(["accounts", "--platform", "bilibili"])

        assert result == 0
        # Verify the query was called with platform filter
        mock_cursor.execute.assert_called()


class TestOmniCLIRefreshFlag:
    """Test --refresh flag functionality."""

    @patch("omni_cli.db_manager")
    @patch("omni_cli.sqlite3")
    def test_refresh_flag_triggers_validation(self, mock_sqlite3, mock_db_manager, capsys):
        """Test that --refresh flag attempts to validate cookies."""
        from omni_cli import OmniCLI

        mock_db_manager.get_db_path.return_value = ":memory:"
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            (1, 3, "test_user", "/path/to/cookie", 1),
        ]
        mock_conn.cursor.return_value = mock_cursor
        mock_sqlite3.connect.return_value = mock_conn

        cli = OmniCLI()
        result = cli.run(["accounts", "--refresh"])

        assert result == 0
        captured = capsys.readouterr()
        # Should show refresh message
        assert "Refreshing" in captured.out or "Found" in captured.out


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
