#!/usr/bin/env python3
"""
Example demonstrating the GitHub Copilot SDK integration.

This script shows how to use the agent service programmatically
without requiring the actual SDK to be installed (uses mock for demo).
"""

import sys
from pathlib import Path
from unittest.mock import Mock, patch

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from services.agent_service import get_agent_service  # noqa: E402


def demo_agent_service():
    """Demonstrate agent service functionality."""
    print("=" * 60)
    print("GitHub Copilot SDK Integration Demo")
    print("=" * 60)

    # Get agent service instance
    agent = get_agent_service()
    print("\n✓ Agent service instance created")

    # Register a custom tool
    def example_tool(title, platform):
        """Example tool that could wrap an uploader."""
        return {
            "status": "success",
            "message": "Would publish '{}' to {}".format(title, platform)
        }

    agent.register_tool("example_tool", example_tool)
    print("✓ Registered custom tool: example_tool")

    # List all available tools
    tools = agent.get_registered_tools()
    print("\n📋 Available tools ({}):".format(len(tools)))
    for tool in tools:
        print("   - {}".format(tool))

    # Test preview_tool
    print("\n🧪 Testing preview_tool:")
    result = agent._preview_tool_impl()
    print("   Status: {}".format(result['status']))
    print("   Title: {}".format(result['recommended_title']))

    # Mock the SDK and demonstrate full lifecycle
    print("\n🔄 Demonstrating full lifecycle (with mocked SDK):")

    mock_sdk = Mock()
    mock_client = Mock()
    mock_sdk.CopilotClient = Mock(return_value=mock_client)

    with patch.dict('sys.modules', {'github_copilot_sdk': mock_sdk}):
        # Start agent
        agent.start()
        print("   ✓ Agent started")

        # Run agent with prompt
        prompt = "Schedule video publication"
        context = {"title": "My Video", "platform": "douyin"}

        result = agent.run(prompt, context)
        print("   ✓ Agent executed prompt: '{}'".format(prompt))
        print("   Response status: {}".format(result['status']))
        print("   Available tools: {}".format(result['available_tools']))

        # Stop agent
        agent.stop()
        print("   ✓ Agent stopped")

    print("\n" + "=" * 60)
    print("Demo completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    demo_agent_service()
