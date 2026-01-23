"""
Tests for Agent Service.

These tests verify that the AgentService can be instantiated,
can register tools, and can execute simple agent operations
without requiring network access.
"""

import sys
from pathlib import Path

import pytest

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from services.agent_service import AgentService, get_agent_service  # noqa: E402


@pytest.fixture
def agent_service():
    """
    Provide a fresh AgentService instance for each test.

    This fixture ensures tests don't interfere with each other
    by resetting the singleton between tests.
    """
    # Reset singleton before test
    AgentService.reset_instance()

    # Get fresh instance
    service = AgentService.get_instance()

    yield service

    # Cleanup after test
    if service._started:
        service.stop()
    AgentService.reset_instance()


class TestAgentServiceInstantiation:
    """Test basic instantiation and lifecycle of AgentService."""

    def test_singleton_pattern(self):
        """Test that AgentService follows singleton pattern."""
        service1 = AgentService.get_instance()
        service2 = AgentService.get_instance()
        assert service1 is service2

    def test_get_agent_service_convenience_function(self):
        """Test convenience function returns same instance."""
        service1 = get_agent_service()
        service2 = AgentService.get_instance()
        assert service1 is service2

    def test_direct_instantiation_raises_error(self):
        """Test that direct instantiation is prevented."""
        AgentService.reset_instance()
        AgentService.get_instance()  # Create singleton

        with pytest.raises(RuntimeError, match="Use AgentService.get_instance"):
            AgentService()

    def test_reset_instance(self):
        """Test that reset_instance properly clears singleton."""
        service1 = AgentService.get_instance()
        AgentService.reset_instance()
        service2 = AgentService.get_instance()
        assert service1 is not service2


class TestAgentServiceLifecycle:
    """Test start and stop operations."""

    def test_start_agent(self, agent_service):
        """Test that agent can be started."""
        assert not agent_service._started
        agent_service.start()
        assert agent_service._started

    def test_start_idempotent(self, agent_service):
        """Test that calling start() multiple times is safe."""
        agent_service.start()
        assert agent_service._started

        # Should be no-op
        agent_service.start()
        assert agent_service._started

    def test_stop_agent(self, agent_service):
        """Test that agent can be stopped."""
        agent_service.start()
        assert agent_service._started

        agent_service.stop()
        assert not agent_service._started

    def test_stop_idempotent(self, agent_service):
        """Test that calling stop() multiple times is safe."""
        agent_service.start()
        agent_service.stop()
        assert not agent_service._started

        # Should be no-op
        agent_service.stop()
        assert not agent_service._started

    def test_stop_without_start(self, agent_service):
        """Test that stopping before starting is safe."""
        assert not agent_service._started
        agent_service.stop()  # Should not raise
        assert not agent_service._started


class TestToolRegistration:
    """Test tool registration functionality."""

    def test_default_preview_tool_registered(self, agent_service):
        """Test that preview tool is registered by default."""
        tools = agent_service.list_tools()
        assert "preview_publish" in tools
        assert "schema" in tools["preview_publish"]

    def test_register_custom_tool(self, agent_service):
        """Test registering a custom tool."""
        def my_tool(params: dict) -> dict:
            return {"result": "ok", "input": params}

        schema = {
            "description": "Test tool",
            "parameters": {
                "type": "object",
                "properties": {
                    "test": {"type": "string"}
                }
            }
        }

        agent_service.register_tool("my_tool", my_tool, schema)

        tools = agent_service.list_tools()
        assert "my_tool" in tools
        assert tools["my_tool"]["schema"] == schema

    def test_register_tool_without_schema(self, agent_service):
        """Test registering a tool without schema."""
        def simple_tool(params: dict) -> dict:
            return {"status": "ok"}

        agent_service.register_tool("simple_tool", simple_tool)

        tools = agent_service.list_tools()
        assert "simple_tool" in tools
        assert tools["simple_tool"]["schema"] == {}

    def test_register_tool_validation(self, agent_service):
        """Test that tool registration validates inputs."""
        # Empty name should raise
        with pytest.raises(ValueError, match="Tool name cannot be empty"):
            agent_service.register_tool("", lambda x: x)

        # Non-callable handler should raise
        with pytest.raises(ValueError, match="Tool handler must be callable"):
            agent_service.register_tool("bad_tool", "not_callable")

    def test_list_tools_excludes_handlers(self, agent_service):
        """Test that list_tools() doesn't expose handlers."""
        def my_tool(params: dict) -> dict:
            return {"result": "ok"}

        agent_service.register_tool("my_tool", my_tool, {"description": "Test"})

        tools = agent_service.list_tools()
        assert "handler" not in tools["my_tool"]
        assert "schema" in tools["my_tool"]


class TestAgentExecution:
    """Test agent execution with tools."""

    def test_run_requires_started_agent(self, agent_service):
        """Test that run() requires agent to be started."""
        with pytest.raises(RuntimeError, match="Agent not started"):
            agent_service.run("test prompt")

    def test_run_with_preview_tool(self, agent_service):
        """Test running agent with the default preview tool."""
        agent_service.start()

        result = agent_service.run("帮我发布视频到抖音")

        assert result["status"] == "ok"
        assert "result" in result
        assert "tool_used" in result
        assert result["tool_used"] == "preview_publish"

        # Check preview tool result structure
        tool_result = result["result"]
        assert tool_result["status"] == "ok"
        assert "recommended_title" in tool_result
        assert "recommended_tags" in tool_result
        assert "suggested_platforms" in tool_result

    def test_run_with_context(self, agent_service):
        """Test running agent with additional context."""
        agent_service.start()

        context = {
            "file_id": "test_123",
            "account_id": "douyin_main",
            "dry_run": True
        }

        result = agent_service.run("发布视频", context)

        assert result["status"] == "ok"
        assert "result" in result

        # Check that context was passed to tool
        tool_result = result["result"]
        assert "analysis" in tool_result
        assert "context_keys" in tool_result["analysis"]
        assert set(tool_result["analysis"]["context_keys"]) == set(context.keys())

    def test_run_deterministic_output(self, agent_service):
        """Test that preview tool produces deterministic output for testing."""
        agent_service.start()

        prompt = "test prompt"
        result1 = agent_service.run(prompt)
        result2 = agent_service.run(prompt)

        # Should get same result for same input
        assert result1["status"] == result2["status"]
        assert result1["tool_used"] == result2["tool_used"]

        # Preview tool should return consistent recommendations
        assert result1["result"]["recommended_title"] == result2["result"]["recommended_title"]
        assert result1["result"]["recommended_tags"] == result2["result"]["recommended_tags"]

    def test_run_captures_prompt_in_result(self, agent_service):
        """Test that agent captures the prompt in results."""
        agent_service.start()

        prompt = "这是一个测试提示"
        result = agent_service.run(prompt)

        assert result["status"] == "ok"
        tool_result = result["result"]
        assert "analysis" in tool_result
        assert tool_result["analysis"]["prompt_received"] == prompt


class TestAgentServiceIntegration:
    """Integration tests for complete workflows."""

    def test_full_lifecycle(self, agent_service):
        """Test complete lifecycle: start -> register -> run -> stop."""
        # Start
        agent_service.start()
        assert agent_service._started

        # Register custom tool
        def custom_tool(params: dict) -> dict:
            return {"custom": True, "params": params}

        agent_service.register_tool("custom", custom_tool)

        # Run (will use preview tool since we don't route to custom tool)
        result = agent_service.run("test")
        assert result["status"] == "ok"

        # Stop
        agent_service.stop()
        assert not agent_service._started

    def test_multiple_tools_coexist(self, agent_service):
        """Test that multiple tools can be registered and listed."""
        def tool1(params: dict) -> dict:
            return {"tool": "1"}

        def tool2(params: dict) -> dict:
            return {"tool": "2"}

        agent_service.register_tool("tool1", tool1)
        agent_service.register_tool("tool2", tool2)

        tools = agent_service.list_tools()
        assert len(tools) >= 3  # preview_publish + tool1 + tool2
        assert "tool1" in tools
        assert "tool2" in tools
        assert "preview_publish" in tools

    def test_error_handling_in_run(self, agent_service):
        """Test that errors in run are handled gracefully."""
        agent_service.start()

        # Mock a failure scenario by clearing tools
        # (This tests error path, though in practice preview_publish should exist)
        original_tools = agent_service._tools
        agent_service._tools = {}

        result = agent_service.run("test")

        assert result["status"] == "error"
        assert "error" in result

        # Restore tools
        agent_service._tools = original_tools


class TestAgentServiceConfiguration:
    """Test configuration and customization options."""

    def test_start_with_config(self, agent_service):
        """Test that start() accepts configuration."""
        config = {
            "model": "gpt-4",
            "temperature": 0.7
        }

        # Should not raise
        agent_service.start(config)
        assert agent_service._started

    def test_start_without_config(self, agent_service):
        """Test that start() works without configuration."""
        agent_service.start()
        assert agent_service._started


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
