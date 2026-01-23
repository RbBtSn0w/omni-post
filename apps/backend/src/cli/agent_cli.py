#!/usr/bin/env python3
"""
CLI entrypoint for invoking the AI-driven publishing agent.

This script provides a simple command-line interface to interact with
the agent service for natural language publishing tasks.
"""

import argparse
import json
import sys
from pathlib import Path

# Add src to path for imports - must be before service imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.agent_service import get_agent_service  # noqa: E402


def main():
    """Main CLI entrypoint."""
    parser = argparse.ArgumentParser(
        description="OmniPost AI Publishing Agent CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run agent with a simple prompt
  python -m src.cli.agent_cli "Schedule a video for tomorrow at 10am"

  # Provide context as JSON
  python -m src.cli.agent_cli "Publish video" --context '{"title":"My Video"}'

  # List available tools
  python -m src.cli.agent_cli --list-tools
        """
    )

    parser.add_argument(
        "prompt",
        nargs="?",
        help="Natural language prompt for the agent"
    )

    parser.add_argument(
        "--context",
        type=str,
        help="JSON string with additional context"
    )

    parser.add_argument(
        "--list-tools",
        action="store_true",
        help="List available agent tools and exit"
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output"
    )

    args = parser.parse_args()

    # Get agent service instance
    agent = get_agent_service()

    try:
        # List tools mode
        if args.list_tools:
            print("Available agent tools:")
            for tool in agent.get_registered_tools():
                print(f"  - {tool}")
            return 0

        # Validate prompt is provided
        if not args.prompt:
            parser.print_help()
            return 1

        # Parse context if provided
        context = {}
        if args.context:
            try:
                context = json.loads(args.context)
            except json.JSONDecodeError as e:
                print(f"Error: Invalid JSON in --context: {e}", file=sys.stderr)
                return 1

        # Start agent service
        if args.verbose:
            print("Starting agent service...")

        agent.start()

        # Run agent
        if args.verbose:
            print(f"Running agent with prompt: {args.prompt}")

        result = agent.run(args.prompt, context)

        # Stop agent service
        agent.stop()

        # Print result
        print(json.dumps(result, indent=2))

        # Return appropriate exit code
        return 0 if result.get("status") == "success" else 1

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1
    finally:
        # Ensure cleanup
        if agent.is_started:
            agent.stop()


if __name__ == "__main__":
    sys.exit(main())
