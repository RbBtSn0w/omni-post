"""
Agent service module for omni-post backend.

This module provides AI agent capabilities using the GitHub Copilot SDK.
It allows natural language interaction with the publishing system by
wrapping uploader functions as callable tools for the agent.
"""

import os
from typing import Callable, Dict, Optional


class AgentService:
    """
    Service for managing AI agent interactions.

    Provides lifecycle management (start/stop) and a simple API
    for running agent prompts with context. Tools can be registered
    to make backend functionality accessible to the agent.
    """

    def __init__(self):
        """Initialize the agent service."""
        self._client = None
        self._tools = {}
        self._is_started = False

        # Configuration from environment
        self._copilot_cli_path = os.getenv("COPILOT_CLI_PATH")
        self._provider = os.getenv("COPILOT_PROVIDER", "github")

        # Register default preview tool
        self.register_tool("preview_tool", self._preview_tool_impl)

    def _preview_tool_impl(self, **kwargs) -> dict:
        """
        Stub tool for demonstration and testing.

        Returns a deterministic response with recommended title.
        This tool can be used to verify the agent can successfully
        call registered tools.
        """
        return {
            "status": "ok",
            "recommended_title": "AI-Generated Video Title",
            "message": "Preview tool executed successfully"
        }

    def start(self) -> None:
        """
        Start the agent client.

        Initializes the Copilot SDK client. Does not auto-start on import
        to allow for explicit lifecycle management.

        Raises:
            RuntimeError: If client is already started or initialization fails
        """
        if self._is_started:
            raise RuntimeError("Agent service is already started")

        try:
            # Import here to avoid dependency issues if SDK not installed
            from github_copilot_sdk import CopilotClient

            # Initialize client with configuration
            self._client = CopilotClient(
                provider=self._provider,
                cli_path=self._copilot_cli_path
            )

            self._is_started = True

        except ImportError as e:
            raise RuntimeError(
                "GitHub Copilot SDK not installed. "
                "Please install it with: pip install github-copilot-sdk>=0.1.0"
            ) from e
        except Exception as e:
            raise RuntimeError("Failed to initialize Copilot client: {}".format(e)) from e

    def stop(self) -> None:
        """
        Stop the agent client.

        Cleanly shuts down the Copilot SDK client and releases resources.
        """
        if self._client and self._is_started:
            try:
                # Cleanup client resources if needed
                if hasattr(self._client, 'close'):
                    self._client.close()
            except Exception as e:
                print(f"Warning: Error during client shutdown: {e}")
            finally:
                self._client = None
                self._is_started = False

    def register_tool(self, name: str, callable_fn: Callable) -> None:
        """
        Register a callable as a tool for the agent.

        Args:
            name: Unique identifier for the tool
            callable_fn: Function that the agent can invoke

        Raises:
            ValueError: If name is already registered
        """
        if name in self._tools:
            raise ValueError(f"Tool '{name}' is already registered")

        self._tools[name] = callable_fn

    def run(self, prompt: str, context: Optional[Dict] = None) -> dict:
        """
        Run the agent with a given prompt and context.

        Args:
            prompt: Natural language instruction for the agent
            context: Optional dictionary with additional context/parameters

        Returns:
            Dictionary containing agent response and any results

        Raises:
            RuntimeError: If agent is not started or execution fails
        """
        if not self._is_started:
            raise RuntimeError(
                "Agent service is not started. Call start() first."
            )

        context = context or {}

        try:
            # For now, provide a simple stub implementation
            # In a real integration, this would call the Copilot SDK
            # with the registered tools and return the agent's response

            # Stub response for demonstration
            return {
                "status": "success",
                "prompt": prompt,
                "context": context,
                "response": "Agent execution completed",
                "available_tools": list(self._tools.keys())
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "prompt": prompt
            }

    def get_registered_tools(self) -> list:
        """
        Get list of registered tool names.

        Returns:
            List of tool names that can be called by the agent
        """
        return list(self._tools.keys())

    @property
    def is_started(self) -> bool:
        """Check if the agent service is started."""
        return self._is_started


# Singleton instance for application-wide use
_agent_service_instance: Optional[AgentService] = None


def get_agent_service() -> AgentService:
    """
    Get the singleton AgentService instance.

    Returns:
        The global AgentService instance
    """
    global _agent_service_instance
    if _agent_service_instance is None:
        _agent_service_instance = AgentService()
    return _agent_service_instance
