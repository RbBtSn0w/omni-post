#!/usr/bin/env python3
"""
OmniPost CLI - Command-line interface for agent-driven publishing.

This CLI provides a natural language interface to the OmniPost publishing
system using the GitHub Copilot SDK agent.

Usage:
    python -m tools.omni_cli post "帮我把这个视频发到抖音，标题要吸引年轻人"
    python -m tools.omni_cli post --file video.mp4 --platforms douyin xiaohongshu
    python -m tools.omni_cli post --file video.mp4 --dry-run

Examples:
    # Natural language publishing request
    python -m tools.omni_cli post "发布视频到抖音和小红书"

    # Specify file and platforms
    python -m tools.omni_cli post --file data/videos/my_video.mp4 --platforms douyin

    # Dry run (preview only)
    python -m tools.omni_cli post "上传视频" --dry-run

    # List available accounts
    python -m tools.omni_cli accounts --platform douyin

Requirements:
    - Backend must be installed (pip install -r apps/backend/requirements.txt)
    - Database must be initialized (python src/db/createTable.py)
    - At least one account should be configured in the system
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add apps/backend/src to Python path
REPO_ROOT = Path(__file__).parent.parent.resolve()
BACKEND_SRC = REPO_ROOT / "apps" / "backend" / "src"
sys.path.insert(0, str(BACKEND_SRC))

try:
    from services.agent_service import AgentService
    from db.db_manager import db_manager
    import sqlite3
except ImportError as e:
    print(f"Error: Failed to import backend modules: {e}", file=sys.stderr)
    print("Make sure you've installed backend dependencies:", file=sys.stderr)
    print("  cd apps/backend && pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)


class OmniCLI:
    """Command-line interface for OmniPost agent."""

    def __init__(self):
        """Initialize the CLI."""
        self.agent = None
        self.db_path = None

    def _ensure_agent_started(self):
        """Ensure the agent service is started."""
        if self.agent is None:
            self.agent = AgentService.get_instance()
            if not self.agent._started:
                self.agent.start()

    def _get_db_connection(self):
        """Get a database connection."""
        if self.db_path is None:
            self.db_path = db_manager.get_db_path()
        return sqlite3.connect(self.db_path)

    def _list_accounts(self, platform: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List available accounts from the database.

        Args:
            platform: Optional platform filter (douyin, xiaohongshu, tencent, kuaishou)

        Returns:
            List of account dictionaries
        """
        platform_map = {
            'douyin': 3,
            'xiaohongshu': 1,
            'tencent': 2,
            'wechat': 2,
            'kuaishou': 4
        }

        conn = self._get_db_connection()
        cursor = conn.cursor()

        try:
            if platform:
                platform_id = platform_map.get(platform.lower())
                if platform_id is None:
                    print(f"Warning: Unknown platform '{platform}', showing all accounts")
                    cursor.execute("SELECT id, type, userName, filePath, status FROM user_info")
                else:
                    cursor.execute(
                        "SELECT id, type, userName, filePath, status FROM user_info WHERE type = ?",
                        (platform_id,)
                    )
            else:
                cursor.execute("SELECT id, type, userName, filePath, status FROM user_info")

            accounts = []
            for row in cursor.fetchall():
                account_id, acc_type, username, filepath, status = row
                platform_map_reverse = {
                    1: 'xiaohongshu',
                    2: 'wechat',
                    3: 'douyin',
                    4: 'kuaishou'
                }
                platform_name = platform_map_reverse.get(acc_type, 'unknown')
                accounts.append({
                    'id': account_id,
                    'platform': platform_name,
                    'username': username,
                    'file_path': filepath,
                    'status': 'active' if status == 1 else 'inactive'
                })

            return accounts

        finally:
            conn.close()

    def cmd_accounts(self, args):
        """
        List available accounts.

        Args:
            args: Parsed command-line arguments
        """
        accounts = self._list_accounts(args.platform)

        if not accounts:
            print("No accounts found in the database.")
            print("\nTo add accounts, use the web interface at http://localhost:5173")
            return 0

        print(f"Found {len(accounts)} account(s):\n")
        for acc in accounts:
            status_icon = "✓" if acc['status'] == 'active' else "✗"
            print(f"  {status_icon} [{acc['platform']}] {acc['username']} (ID: {acc['id']})")

        return 0

    def cmd_post(self, args):
        """
        Post content using natural language or structured parameters.

        Args:
            args: Parsed command-line arguments
        """
        # Start the agent
        self._ensure_agent_started()

        # Build context from arguments
        context = {}

        if args.file:
            file_path = Path(args.file)
            if not file_path.exists():
                print(f"Error: File not found: {args.file}", file=sys.stderr)
                return 1
            context['file_path'] = str(file_path.resolve())
            context['file_name'] = file_path.name

        if args.platforms:
            context['platforms'] = args.platforms

        if args.account_id:
            context['account_id'] = args.account_id

        if args.dry_run:
            context['dry_run'] = True

        # Construct prompt
        prompt = args.prompt
        if not prompt:
            # Generate a default prompt based on arguments
            if args.file:
                platform_str = ", ".join(args.platforms) if args.platforms else "all platforms"
                prompt = f"发布视频 {args.file} 到 {platform_str}"
            else:
                prompt = "帮我发布内容"

        # Run the agent
        print(f"🤖 Processing request: {prompt}")
        if context:
            print(f"📋 Context: {json.dumps(context, ensure_ascii=False, indent=2)}")

        try:
            result = self.agent.run(prompt, context)

            print("\n" + "="*60)
            print("🎯 Agent Response:")
            print("="*60)
            print(json.dumps(result, ensure_ascii=False, indent=2))
            print("="*60)

            if result.get('status') == 'ok':
                print("\n✅ Success!")
                return 0
            else:
                print("\n❌ Failed:", result.get('error', 'Unknown error'))
                return 1

        except Exception as e:
            print(f"\n❌ Error: {e}", file=sys.stderr)
            return 1
        finally:
            # Clean up
            if self.agent:
                self.agent.stop()

    def run(self, argv: Optional[List[str]] = None) -> int:
        """
        Run the CLI with the given arguments.

        Args:
            argv: Command-line arguments (defaults to sys.argv[1:])

        Returns:
            Exit code (0 for success, non-zero for error)
        """
        parser = argparse.ArgumentParser(
            description="OmniPost CLI - Natural language multi-platform publishing",
            formatter_class=argparse.RawDescriptionHelpFormatter,
            epilog="""
Examples:
  %(prog)s post "帮我把这个视频发到抖音，标题要吸引年轻人"
  %(prog)s post --file video.mp4 --platforms douyin xiaohongshu
  %(prog)s post --file video.mp4 --dry-run
  %(prog)s accounts --platform douyin
            """
        )

        subparsers = parser.add_subparsers(dest='command', help='Available commands')

        # Post command
        post_parser = subparsers.add_parser(
            'post',
            help='Post content using natural language or structured parameters'
        )
        post_parser.add_argument(
            'prompt',
            nargs='?',
            help='Natural language publishing instruction (e.g., "发布视频到抖音")'
        )
        post_parser.add_argument(
            '--file',
            help='Path to video file to publish'
        )
        post_parser.add_argument(
            '--platforms',
            nargs='+',
            choices=['douyin', 'xiaohongshu', 'wechat', 'tencent', 'kuaishou'],
            help='Target platforms (can specify multiple)'
        )
        post_parser.add_argument(
            '--account-id',
            type=int,
            help='Specific account ID to use for publishing'
        )
        post_parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview the action without actually uploading'
        )

        # Accounts command
        accounts_parser = subparsers.add_parser(
            'accounts',
            help='List available accounts'
        )
        accounts_parser.add_argument(
            '--platform',
            choices=['douyin', 'xiaohongshu', 'wechat', 'tencent', 'kuaishou'],
            help='Filter by platform'
        )

        # Parse arguments
        args = parser.parse_args(argv)

        if not args.command:
            parser.print_help()
            return 1

        # Dispatch to command handler
        if args.command == 'post':
            return self.cmd_post(args)
        elif args.command == 'accounts':
            return self.cmd_accounts(args)
        else:
            print(f"Error: Unknown command: {args.command}", file=sys.stderr)
            return 1


def main(argv: Optional[List[str]] = None) -> int:
    """
    Main entry point for the CLI.

    Args:
        argv: Command-line arguments (defaults to sys.argv[1:])

    Returns:
        Exit code (0 for success, non-zero for error)
    """
    cli = OmniCLI()
    return cli.run(argv)


if __name__ == '__main__':
    sys.exit(main())
