"""
Test suite for AgentService

Tests the AI agent service including Mock and Default implementations,
tool registration, and factory function behavior.
"""

import pytest

from src.services.agent_service import (
    AgentService,
    DefaultAgentService,
    MockAgentService,
    get_agent_service,
)


class TestMockAgentService:
    """Test suite for MockAgentService"""

    def test_initialization(self):
        """Test MockAgentService can be instantiated"""
        service = MockAgentService()
        assert isinstance(service, AgentService)
        assert service.config == {}
        assert service._started is False

    def test_initialization_with_config(self):
        """Test MockAgentService with custom config"""
        config = {
            "mock_responses": {
                "test_prompt": {"status": "custom", "result": "custom response"}
            }
        }
        service = MockAgentService(config)
        assert service.config == config
        assert service._mock_responses == config["mock_responses"]

    def test_start_stop_lifecycle(self):
        """Test start and stop methods"""
        service = MockAgentService()
        assert service._started is False

        service.start()
        assert service._started is True

        service.stop()
        assert service._started is False

    def test_register_tool(self):
        """Test tool registration"""
        service = MockAgentService()

        def sample_tool(arg1, arg2):
            return f"{arg1} {arg2}"

        service.register_tool("sample_tool", sample_tool)
        assert "sample_tool" in service._tools
        assert service._tools["sample_tool"] == sample_tool

    def test_run_default_response(self):
        """Test run method with default mock response"""
        service = MockAgentService()
        result = service.run("Test prompt")

        assert result["status"] == "success"
        assert result["result"] == "Mock agent executed successfully"
        assert result["prompt"] == "Test prompt"
        assert result["context"] is None

    def test_run_with_context(self):
        """Test run method with context"""
        service = MockAgentService()
        context = {"platform": "douyin", "account": "test_account"}
        result = service.run("Test prompt", context)

        assert result["status"] == "success"
        assert result["context"] == context

    def test_run_with_custom_mock_response(self):
        """Test run method with pre-configured mock response"""
        config = {
            "mock_responses": {
                "custom_prompt": {"status": "custom", "data": "custom_data"}
            }
        }
        service = MockAgentService(config)
        result = service.run("custom_prompt")

        assert result["status"] == "custom"
        assert result["data"] == "custom_data"

    def test_call_log_tracking(self):
        """Test that run calls are logged for assertion"""
        service = MockAgentService()

        service.run("prompt1", {"key1": "value1"})
        service.run("prompt2", {"key2": "value2"})

        call_log = service.get_call_log()
        assert len(call_log) == 2
        assert call_log[0]["prompt"] == "prompt1"
        assert call_log[0]["context"] == {"key1": "value1"}
        assert call_log[1]["prompt"] == "prompt2"
        assert call_log[1]["context"] == {"key2": "value2"}

    def test_stop_clears_state(self):
        """Test that stop clears tools and call log"""
        service = MockAgentService()
        service.register_tool("tool1", lambda: None)
        service.run("test")

        assert len(service._tools) == 1
        assert len(service.get_call_log()) == 1

        service.stop()

        assert len(service._tools) == 0
        assert len(service.get_call_log()) == 0


class TestDefaultAgentService:
    """Test suite for DefaultAgentService"""

    def test_initialization(self):
        """Test DefaultAgentService can be instantiated"""
        service = DefaultAgentService()
        assert isinstance(service, AgentService)
        assert service._started is False
        assert service._client is None

    def test_initialization_with_config(self):
        """Test DefaultAgentService with config"""
        config = {
            "copilot_cli_path": "/usr/bin/copilot",
            "provider": "openai",
        }
        service = DefaultAgentService(config)
        assert service.config == config

    def test_preview_tool(self):
        """Test built-in preview tool function"""
        result = DefaultAgentService._preview_tool(title="Test Title", platform="douyin")

        assert result["status"] == "ok"
        assert result["recommended_title"] == "Test Title"
        assert result["platform"] == "douyin"
        assert "tags" in result
        assert result["message"] == "Preview generated successfully"

    def test_preview_tool_default_args(self):
        """Test preview tool with default arguments"""
        result = DefaultAgentService._preview_tool()

        assert result["status"] == "ok"
        assert result["recommended_title"] == "AI Generated Title"
        assert result["platform"] == "douyin"

    def test_run_without_start_raises_error(self):
        """Test that run() raises error if service not started"""
        service = DefaultAgentService()

        with pytest.raises(RuntimeError, match="Agent service not started"):
            service.run("Test prompt")

    def test_register_tool(self):
        """Test tool registration in default service"""
        service = DefaultAgentService()

        def test_tool():
            return "result"

        service.register_tool("test_tool", test_tool)
        assert "test_tool" in service._tools
        assert service._tools["test_tool"] == test_tool


class TestGetAgentService:
    """Test suite for get_agent_service factory function"""

    def test_get_mock_service(self):
        """Test factory returns MockAgentService when mock=True"""
        config = {"mock": True}
        service = get_agent_service(config)

        assert isinstance(service, MockAgentService)
        assert service.config == config

    def test_get_default_service(self):
        """Test factory returns DefaultAgentService by default"""
        service = get_agent_service()
        assert isinstance(service, DefaultAgentService)

    def test_get_default_service_with_config(self):
        """Test factory returns DefaultAgentService with config"""
        config = {"copilot_cli_path": "/usr/bin/copilot"}
        service = get_agent_service(config)

        assert isinstance(service, DefaultAgentService)
        assert service.config == config

    def test_get_default_service_when_mock_false(self):
        """Test factory returns DefaultAgentService when mock=False"""
        config = {"mock": False, "provider": "copilot"}
        service = get_agent_service(config)

        assert isinstance(service, DefaultAgentService)


class TestIntegrationScenarios:
    """Integration test scenarios for agent service"""

    def test_mock_service_full_workflow(self):
        """Test complete workflow with mock service"""
        # Create and configure service
        config = {
            "mock": True,
            "mock_responses": {
                "Publish to Douyin": {
                    "status": "success",
                    "result": "Video published successfully",
                }
            },
        }
        service = get_agent_service(config)

        # Register tools
        def upload_tool(platform, title):
            return f"Uploaded '{title}' to {platform}"

        service.register_tool("upload", upload_tool)

        # Start service
        service.start()
        assert service._started is True

        # Run agent
        result = service.run("Publish to Douyin", {"title": "My Video"})
        assert result["status"] == "success"
        assert result["result"] == "Video published successfully"

        # Verify call log
        call_log = service.get_call_log()
        assert len(call_log) == 1
        assert call_log[0]["prompt"] == "Publish to Douyin"

        # Stop service
        service.stop()
        assert service._started is False

    def test_preview_tool_integration(self):
        """Test preview tool can be called directly"""
        result = DefaultAgentService._preview_tool(
            title="My Amazing Video", platform="xiaohongshu"
        )

        assert result["status"] == "ok"
        assert result["recommended_title"] == "My Amazing Video"
        assert result["platform"] == "xiaohongshu"
        assert isinstance(result["tags"], list)
        assert len(result["tags"]) > 0
