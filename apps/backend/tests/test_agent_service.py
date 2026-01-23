"""
Tests for agent service module.

Verifies that the AgentService can be instantiated, tools can be registered,
and basic agent functionality works as expected.
"""

import pytest
import sys
from unittest.mock import MagicMock, patch, Mock

from src.services.agent_service import AgentService, get_agent_service


class TestAgentService:
    """Test suite for AgentService class."""

    def test_agent_service_initialization(self):
        """Test that AgentService can be instantiated."""
        agent = AgentService()
        assert agent is not None
        assert not agent.is_started

    def test_preview_tool_registered_by_default(self):
        """Test that preview_tool is registered by default."""
        agent = AgentService()
        tools = agent.get_registered_tools()
        assert "preview_tool" in tools

    def test_preview_tool_returns_expected_response(self):
        """Test that preview_tool returns deterministic response."""
        agent = AgentService()
        result = agent._preview_tool_impl()

        assert result["status"] == "ok"
        assert "recommended_title" in result
        assert result["recommended_title"] == "AI-Generated Video Title"
        assert "message" in result

    def test_register_tool(self):
        """Test registering a custom tool."""
        agent = AgentService()

        def custom_tool():
            return {"result": "custom"}

        agent.register_tool("custom_tool", custom_tool)
        tools = agent.get_registered_tools()

        assert "custom_tool" in tools
        assert agent._tools["custom_tool"] == custom_tool

    def test_register_duplicate_tool_raises_error(self):
        """Test that registering a duplicate tool name raises ValueError."""
        agent = AgentService()

        def tool1():
            return {"result": "1"}

        def tool2():
            return {"result": "2"}

        agent.register_tool("test_tool", tool1)

        with pytest.raises(ValueError, match="already registered"):
            agent.register_tool("test_tool", tool2)

    def test_run_without_start_raises_error(self):
        """Test that calling run() before start() raises RuntimeError."""
        agent = AgentService()

        with pytest.raises(RuntimeError, match="not started"):
            agent.run("test prompt")

    def test_start_initializes_client(self):
        """Test that start() initializes the Copilot client."""
        # Mock the github_copilot_sdk module
        mock_sdk = Mock()
        mock_client = MagicMock()
        mock_sdk.CopilotClient = MagicMock(return_value=mock_client)

        with patch.dict('sys.modules', {'github_copilot_sdk': mock_sdk}):
            agent = AgentService()
            agent.start()

            assert agent.is_started
            mock_sdk.CopilotClient.assert_called_once()

            agent.stop()

    def test_start_twice_raises_error(self):
        """Test that calling start() twice raises RuntimeError."""
        # Mock the github_copilot_sdk module
        mock_sdk = Mock()
        mock_client = MagicMock()
        mock_sdk.CopilotClient = MagicMock(return_value=mock_client)

        with patch.dict('sys.modules', {'github_copilot_sdk': mock_sdk}):
            agent = AgentService()
            agent.start()

            with pytest.raises(RuntimeError, match="already started"):
                agent.start()

            agent.stop()

    def test_stop_cleans_up_client(self):
        """Test that stop() properly cleans up the client."""
        # Mock the github_copilot_sdk module
        mock_sdk = Mock()
        mock_client = MagicMock()
        mock_sdk.CopilotClient = MagicMock(return_value=mock_client)

        with patch.dict('sys.modules', {'github_copilot_sdk': mock_sdk}):
            agent = AgentService()
            agent.start()
            agent.stop()

            assert not agent.is_started
            assert agent._client is None

    def test_run_returns_success_response(self):
        """Test that run() returns expected response structure."""
        # Mock the github_copilot_sdk module
        mock_sdk = Mock()
        mock_client = MagicMock()
        mock_sdk.CopilotClient = MagicMock(return_value=mock_client)

        with patch.dict('sys.modules', {'github_copilot_sdk': mock_sdk}):
            agent = AgentService()
            agent.start()

            prompt = "Test prompt"
            context = {"key": "value"}
            result = agent.run(prompt, context)

            assert result["status"] == "success"
            assert result["prompt"] == prompt
            assert result["context"] == context
            assert "available_tools" in result
            assert "preview_tool" in result["available_tools"]

            agent.stop()

    def test_run_with_no_context(self):
        """Test that run() works without context parameter."""
        # Mock the github_copilot_sdk module
        mock_sdk = Mock()
        mock_client = MagicMock()
        mock_sdk.CopilotClient = MagicMock(return_value=mock_client)

        with patch.dict('sys.modules', {'github_copilot_sdk': mock_sdk}):
            agent = AgentService()
            agent.start()

            result = agent.run("Test prompt")

            assert result["status"] == "success"
            assert result["context"] == {}

            agent.stop()

    def test_get_agent_service_singleton(self):
        """Test that get_agent_service returns singleton instance."""
        service1 = get_agent_service()
        service2 = get_agent_service()

        assert service1 is service2

    def test_environment_variable_configuration(self):
        """Test that agent service reads configuration from environment."""
        with patch.dict('os.environ', {
            'COPILOT_CLI_PATH': '/custom/path/cli',
            'COPILOT_PROVIDER': 'custom_provider'
        }):
            agent = AgentService()

            assert agent._copilot_cli_path == '/custom/path/cli'
            assert agent._provider == 'custom_provider'

    def test_default_provider_configuration(self):
        """Test that agent service has default provider."""
        with patch.dict('os.environ', {}, clear=True):
            agent = AgentService()

            assert agent._provider == 'github'


class TestAgentServiceIntegration:
    """Integration tests for agent service."""

    def test_tool_registration_workflow(self):
        """Test complete workflow of registering and listing tools."""
        agent = AgentService()

        # Should have preview_tool by default
        assert len(agent.get_registered_tools()) == 1

        # Register multiple tools
        def tool1():
            return {"result": "1"}

        def tool2():
            return {"result": "2"}

        agent.register_tool("tool1", tool1)
        agent.register_tool("tool2", tool2)

        # Check all tools are registered
        tools = agent.get_registered_tools()
        assert len(tools) == 3
        assert "preview_tool" in tools
        assert "tool1" in tools
        assert "tool2" in tools

    def test_full_lifecycle(self):
        """Test full agent lifecycle: start, run, stop."""
        # Mock the github_copilot_sdk module
        mock_sdk = Mock()
        mock_client = MagicMock()
        mock_sdk.CopilotClient = MagicMock(return_value=mock_client)

        with patch.dict('sys.modules', {'github_copilot_sdk': mock_sdk}):
            agent = AgentService()

            # Initial state
            assert not agent.is_started

            # Start
            agent.start()
            assert agent.is_started

            # Run
            result = agent.run("Test prompt", {"key": "value"})
            assert result["status"] == "success"

            # Stop
            agent.stop()
            assert not agent.is_started

    def test_start_without_sdk_raises_error(self):
        """Test that starting without SDK installed raises informative error."""
        # Mock ImportError when trying to import github_copilot_sdk
        import builtins
        real_import = builtins.__import__

        def mock_import(name, *args, **kwargs):
            if name == 'github_copilot_sdk':
                raise ImportError("No module named 'github_copilot_sdk'")
            return real_import(name, *args, **kwargs)

        with patch('builtins.__import__', side_effect=mock_import):
            agent = AgentService()
            with pytest.raises(RuntimeError, match="not installed"):
                agent.start()
