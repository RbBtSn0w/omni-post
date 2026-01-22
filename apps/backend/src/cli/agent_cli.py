#!/usr/bin/env python3
"""
Agent CLI - Natural Language Publishing Interface

This CLI provides a command-line interface for AI-driven publishing
using the AgentService to interpret user prompts and execute publishing tasks.

Usage:
    python -m src.cli.agent_cli "Publish my latest video to Douyin"
    python -m src.cli.agent_cli --help
"""

import argparse
import sys
from typing import Optional

from src.core.config import AGENT_PROVIDER, COPILOT_CLI_PATH
from src.services.agent_service import get_agent_service


def parse_args(argv: Optional[list] = None) -> argparse.Namespace:
    """
    Parse command line arguments.

    Args:
        argv: Command line arguments (defaults to sys.argv[1:])

    Returns:
        Parsed arguments namespace
    """
    parser = argparse.ArgumentParser(
        description="AI-powered publishing agent for OmniPost",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage
  python -m src.cli.agent_cli "Publish video to Douyin with title 'My Video'"

  # With platform specification
  python -m src.cli.agent_cli "Upload to 小红书" --platform xiaohongshu

  # Interactive mode
  python -m src.cli.agent_cli --interactive

  # Preview mode (dry run)
  python -m src.cli.agent_cli "Plan publishing strategy" --preview
        """,
    )

    parser.add_argument(
        "prompt",
        nargs="?",
        help="Natural language prompt for the agent (e.g., 'Publish to Douyin')",
    )

    parser.add_argument(
        "--platform",
        choices=["douyin", "xiaohongshu", "tencent", "kuaishou", "all"],
        help="Target platform (optional, can be inferred from prompt)",
    )

    parser.add_argument(
        "--account",
        help="Account identifier or cookie file path",
    )

    parser.add_argument(
        "--interactive",
        "-i",
        action="store_true",
        help="Start interactive mode for multi-turn conversation",
    )

    parser.add_argument(
        "--preview",
        action="store_true",
        help="Preview mode - show what would be done without executing",
    )

    parser.add_argument(
        "--mock",
        action="store_true",
        help="Use mock agent service for testing (no real SDK calls)",
    )

    args = parser.parse_args(argv)

    # Validate: need either prompt or interactive mode
    if not args.prompt and not args.interactive:
        parser.error("Either provide a prompt or use --interactive mode")

    return args


def interactive_mode(agent_service):
    """
    Run agent in interactive mode for multi-turn conversation.

    Args:
        agent_service: Initialized AgentService instance
    """
    print("🤖 OmniPost Agent - Interactive Mode")
    print("Type 'quit' or 'exit' to stop, 'help' for assistance\n")

    while True:
        try:
            prompt = input("You: ").strip()

            if not prompt:
                continue

            if prompt.lower() in ["quit", "exit", "q"]:
                print("👋 Goodbye!")
                break

            if prompt.lower() == "help":
                print("\nAvailable commands:")
                print("  - Publish to <platform>")
                print("  - Preview my video")
                print("  - Check account status")
                print("  - quit/exit - Exit interactive mode")
                print()
                continue

            # Run agent
            result = agent_service.run(prompt)

            print(f"\n🤖 Agent: {result.get('result', result)}\n")

        except KeyboardInterrupt:
            print("\n\n👋 Interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}\n")


def main(argv: Optional[list] = None) -> int:
    """
    Main entry point for agent CLI.

    Args:
        argv: Command line arguments (defaults to sys.argv[1:])

    Returns:
        Exit code (0 for success, 1 for error)
    """
    args = parse_args(argv)

    # Prepare configuration
    config = {}
    if args.mock:
        config["mock"] = True
    else:
        config["copilot_cli_path"] = COPILOT_CLI_PATH
        config["provider"] = AGENT_PROVIDER

    # Initialize agent service
    try:
        agent_service = get_agent_service(config)
        agent_service.start()

        print("✅ Agent service started successfully")
        print(f"📡 Provider: {config.get('provider', 'mock' if args.mock else 'default')}")
        print()

        # Run interactive or single-shot mode
        if args.interactive:
            interactive_mode(agent_service)
        else:
            # Build context from arguments
            context = {}
            if args.platform:
                context["platform"] = args.platform
            if args.account:
                context["account"] = args.account
            if args.preview:
                context["preview_mode"] = True

            # Run agent with prompt
            print(f"🎯 Prompt: {args.prompt}")
            result = agent_service.run(args.prompt, context)

            # Display result
            if result.get("status") == "success":
                print(f"\n✅ Success: {result.get('result')}")
            else:
                print(f"\n❌ Error: {result.get('error', 'Unknown error')}")
                return 1

    except Exception as e:
        print(f"❌ Failed to start agent: {e}", file=sys.stderr)
        return 1

    finally:
        # Cleanup
        try:
            if "agent_service" in locals():
                agent_service.stop()
                print("\n🛑 Agent service stopped")
        except Exception as e:
            print(f"⚠️  Warning during cleanup: {e}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
