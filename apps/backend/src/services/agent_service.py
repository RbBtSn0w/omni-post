#!/usr/bin/env python3
"""
AI Agent Service - GitHub Copilot SDK Integration

This module provides an abstraction for AI agent functionality using GitHub Copilot SDK.
It enables natural-language publishing through tool registration and agent orchestration.
"""

from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, Optional


class AgentService(ABC):
    """Abstract interface for AI agent service"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize agent service.

        Args:
            config: Optional configuration dictionary for agent behavior
        """
        self.config = config or {}
        self._tools = {}
        self._client = None
        self._started = False

    @abstractmethod
    def start(self) -> None:
        """Start the agent client and initialize resources"""
        pass

    @abstractmethod
    def stop(self) -> None:
        """Stop the agent client and cleanup resources"""
        pass

    @abstractmethod
    def run(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Run agent with a prompt and optional context.

        Args:
            prompt: Natural language prompt for the agent
            context: Optional context dictionary (e.g., user preferences, available accounts)

        Returns:
            Dictionary with agent response (status, result, metadata)
        """
        pass

    @abstractmethod
    def register_tool(self, name: str, callable_func: Callable) -> None:
        """
        Register a tool that the agent can call.

        Args:
            name: Tool name
            callable_func: Python callable that the agent can invoke
        """
        pass


class MockAgentService(AgentService):
    """Mock implementation for testing"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize mock agent service.

        Args:
            config: Optional configuration with 'mock_responses' key
        """
        super().__init__(config)
        self._mock_responses = self.config.get("mock_responses", {})
        self._call_log = []  # Track calls for test assertions

    def start(self) -> None:
        """Mock start - just sets flag"""
        self._started = True

    def stop(self) -> None:
        """Mock stop - clears state"""
        self._started = False
        self._tools.clear()
        self._call_log.clear()

    def run(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Mock run - returns configured response or default.

        Args:
            prompt: Natural language prompt
            context: Optional context

        Returns:
            Mock response dictionary
        """
        self._call_log.append({"prompt": prompt, "context": context})

        # Return mock response if configured
        if prompt in self._mock_responses:
            return self._mock_responses[prompt]

        # Default mock response
        return {
            "status": "success",
            "result": "Mock agent executed successfully",
            "prompt": prompt,
            "context": context,
        }

    def register_tool(self, name: str, callable_func: Callable) -> None:
        """
        Mock register - stores tool for inspection.

        Args:
            name: Tool name
            callable_func: Tool callable
        """
        self._tools[name] = callable_func

    def get_call_log(self):
        """Get log of run() calls for test assertions"""
        return self._call_log


class DefaultAgentService(AgentService):
    """Production implementation using GitHub Copilot SDK"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize default agent service with Copilot SDK.

        Args:
            config: Configuration dictionary with optional keys:
                    - 'copilot_cli_path': Path to Copilot CLI
                    - 'provider': LLM provider ('copilot', 'openai', etc.)
        """
        super().__init__(config)
        self._client = None

    def start(self) -> None:
        """Start the Copilot client"""
        if self._started:
            return

        try:
            # Import here to avoid hard dependency at module load time
            # This allows mock service to work without SDK installed
            from github_copilot_sdk import CopilotClient

            # Initialize Copilot client
            # Note: Actual SDK API may differ - adjust when real SDK is available
            copilot_cli_path = self.config.get("copilot_cli_path")
            self._client = CopilotClient(cli_path=copilot_cli_path)

            # Register built-in preview tool
            self.register_tool("preview_tool", self._preview_tool)

            self._started = True

        except ImportError as e:
            raise RuntimeError(
                "github-copilot-sdk not installed. "
                "Install via: pip install github-copilot-sdk>=0.1.0"
            ) from e
        except Exception as e:
            raise RuntimeError(f"Failed to start agent client: {e}") from e

    def stop(self) -> None:
        """Stop the Copilot client and cleanup"""
        if not self._started:
            return

        try:
            if self._client:
                # Close client connection if SDK provides cleanup method
                if hasattr(self._client, "close"):
                    self._client.close()
                self._client = None

            self._tools.clear()
            self._started = False

        except Exception as e:
            raise RuntimeError(f"Failed to stop agent client: {e}") from e

    def run(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Run agent with Copilot SDK.

        Args:
            prompt: Natural language prompt
            context: Optional context (e.g., available platforms, accounts)

        Returns:
            Agent response dictionary with status and result
        """
        if not self._started:
            raise RuntimeError("Agent service not started. Call start() first.")

        try:
            # Build agent input with context
            agent_input = {"prompt": prompt, "context": context or {}}

            # Run agent via Copilot SDK
            # Note: Actual SDK API may differ - adjust when real SDK is available
            response = self._client.run(agent_input, tools=list(self._tools.values()))

            return {
                "status": "success",
                "result": response,
                "prompt": prompt,
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "prompt": prompt,
            }

    def register_tool(self, name: str, callable_func: Callable) -> None:
        """
        Register a tool for the agent to call.

        Args:
            name: Tool name
            callable_func: Callable function
        """
        self._tools[name] = callable_func

    @staticmethod
    def _preview_tool(title: str = "", platform: str = "douyin") -> Dict[str, Any]:
        """
        Built-in preview tool that returns publishing recommendations.

        Args:
            title: Original title (if provided)
            platform: Target platform

        Returns:
            Dictionary with recommendations
        """
        return {
            "status": "ok",
            "recommended_title": title or "AI Generated Title",
            "platform": platform,
            "tags": ["AI", "自动化", "OmniPost"],
            "message": "Preview generated successfully",
        }


def get_agent_service(config: Optional[Dict[str, Any]] = None) -> AgentService:
    """
    Factory function to get appropriate agent service implementation.

    Args:
        config: Configuration dictionary. If contains 'mock' key with True value,
                returns MockAgentService; otherwise returns DefaultAgentService.

    Returns:
        AgentService implementation (Mock or Default)
    """
    if config and config.get("mock", False):
        return MockAgentService(config)
    else:
        return DefaultAgentService(config)
