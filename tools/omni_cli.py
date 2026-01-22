"""
OmniPost CLI - Command-line interface for AI-driven publishing.

This module provides a CLI entrypoint to interact with the AgentService
and execute publishing tasks using natural language instructions.

Example usage:
    python -m tools.omni_cli post "帮我把这个视频发到抖音，标题要吸引年轻人" --title "我的视频"
    python -m tools.omni_cli post "发布到小红书" --title "分享日常" --dry-run
    python -m tools.omni_cli list-tools
"""

import argparse
import json
import sys
from pathlib import Path

# Add backend src to path for imports
backend_src = Path(__file__).parent.parent / "apps" / "backend" / "src"
sys.path.insert(0, str(backend_src))

from services.agent_service import get_agent_service  # noqa: E402


def cmd_post(args: argparse.Namespace) -> int:
    """
    Execute a publishing task using natural language instruction.

    Args:
        args: Parsed command-line arguments

    Returns:
        Exit code (0 for success, 1 for error)
    """
    agent = get_agent_service()

    # Build context from CLI arguments
    context = {}
    if args.title:
        context["title"] = args.title
    if args.file_path:
        context["file_path"] = args.file_path
    if args.platforms:
        context["platforms"] = args.platforms
    if args.account_id:
        context["account_id"] = args.account_id
    if args.dry_run:
        context["dry_run"] = True

    try:
        # Start agent if not already started
        agent.start()

        # Execute the task
        result = agent.run(args.prompt, context)

        # Print JSON result
        print(json.dumps(result, ensure_ascii=False, indent=2))

        # Return success if status is "success"
        return 0 if result.get("status") == "success" else 1

    except Exception as e:
        error_result = {
            "status": "error",
            "result": None,
            "message": f"CLI execution failed: {str(e)}"
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1
    finally:
        # Clean up agent (optional - could keep it running)
        if args.stop_agent:
            agent.stop()


def cmd_list_tools(args: argparse.Namespace) -> int:
    """
    List all registered agent tools.

    Args:
        args: Parsed command-line arguments

    Returns:
        Exit code (always 0)
    """
    agent = get_agent_service()
    agent.start()

    tools = agent.list_tools()
    result = {
        "status": "success",
        "tools": tools,
        "count": len(tools)
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def main() -> int:
    """
    Main CLI entrypoint.

    Returns:
        Exit code
    """
    parser = argparse.ArgumentParser(
        description="OmniPost CLI - AI-driven multi-platform publishing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Publish with natural language instruction
  python -m tools.omni_cli post "发布视频到抖音" --title "我的视频"

  # Preview mode (dry run)
  python -m tools.omni_cli post "分享到小红书" --title "日常" --dry-run

  # With file path and account
  python -m tools.omni_cli post "上传视频" --file-path /path/to/video.mp4 --account-id 1

  # List available tools
  python -m tools.omni_cli list-tools
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Post command
    post_parser = subparsers.add_parser(
        "post",
        help="Execute a publishing task using natural language"
    )
    post_parser.add_argument(
        "prompt",
        type=str,
        help="Natural language instruction (e.g., '发布视频到抖音，标题要吸引人')"
    )
    post_parser.add_argument(
        "--title",
        type=str,
        help="Video title"
    )
    post_parser.add_argument(
        "--file-path",
        type=str,
        help="Path to video file"
    )
    post_parser.add_argument(
        "--platforms",
        type=str,
        nargs="+",
        help="Target platforms (douyin, xiaohongshu, weixin, kuaishou)"
    )
    post_parser.add_argument(
        "--account-id",
        type=int,
        help="Account ID to use for publishing"
    )
    post_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview mode - don't actually upload"
    )
    post_parser.add_argument(
        "--stop-agent",
        action="store_true",
        default=True,
        help="Stop agent after execution (default: True)"
    )
    post_parser.set_defaults(func=cmd_post)

    # List tools command
    list_parser = subparsers.add_parser(
        "list-tools",
        help="List all registered agent tools"
    )
    list_parser.set_defaults(func=cmd_list_tools)

    # Parse arguments
    args = parser.parse_args()

    # Execute command
    if hasattr(args, "func"):
        return args.func(args)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
