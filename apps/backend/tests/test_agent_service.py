"""
Tests for AgentService module.

This module tests the AI agent service functionality, including:
- Service initialization and lifecycle
- Tool registration
- Task execution with stub tools
"""

import pytest

from src.services.agent_service import AgentService, get_agent_service


class TestAgentService:
    """Test cases for AgentService class."""

    def test_agent_initialization(self):
        """Test that AgentService can be instantiated."""
        agent = AgentService()
        assert agent is not None
        assert not agent._started
        assert len(agent._tools) == 1  # preview_tool is registered by default

    def test_agent_start_stop(self):
        """Test agent start and stop lifecycle."""
        agent = AgentService()

        # Initially not started
        assert not agent._started

        # Start the agent
        agent.start()
        assert agent._started
        assert agent._client is not None

        # Stop the agent
        agent.stop()
        assert not agent._started
        assert agent._client is None

    def test_agent_start_idempotent(self):
        """Test that calling start() multiple times is safe."""
        agent = AgentService()

        agent.start()
        agent.start()  # Should not raise
        assert agent._started

        agent.stop()

    def test_agent_stop_when_not_started(self):
        """Test that calling stop() when not started is safe."""
        agent = AgentService()

        agent.stop()  # Should not raise
        assert not agent._started

    def test_tool_registration(self):
        """Test registering custom tools."""
        agent = AgentService()

        # Define a simple tool
        def dummy_tool(arg1: str, arg2: int) -> dict:
            return {"result": f"{arg1}_{arg2}"}

        # Register the tool
        agent.register_tool("dummy", dummy_tool)

        # Verify it's registered
        assert "dummy" in agent._tools
        assert agent._tools["dummy"] == dummy_tool

        # Verify it's in the list
        tools = agent.list_tools()
        assert "dummy" in tools
        assert "preview_publish" in tools  # Default tool

    def test_preview_tool_registration(self):
        """Test that preview_publish tool is registered by default."""
        agent = AgentService()

        # Check default tool exists
        assert "preview_publish" in agent._tools

        # Call the preview tool
        preview_fn = agent._tools["preview_publish"]
        result = preview_fn(title="测试视频", platform="douyin")

        # Verify result structure
        assert result["status"] == "ok"
        assert "🔥" in result["recommended_title"]
        assert "测试视频" in result["recommended_title"]
        assert result["platform"] == "douyin"
        assert result["preview_mode"] is True

    def test_preview_tool_different_platforms(self):
        """Test preview tool with different platforms."""
        agent = AgentService()
        preview_fn = agent._tools["preview_publish"]

        # Test each platform
        platforms = {
            "douyin": "🔥",
            "xiaohongshu": "✨",
            "weixin": "📱",
            "kuaishou": "🎬"
        }

        for platform, emoji in platforms.items():
            result = preview_fn(title="视频", platform=platform)
            assert result["status"] == "ok"
            assert emoji in result["recommended_title"]
            assert result["platform"] == platform

    def test_run_without_start_raises_error(self):
        """Test that run() raises error if agent not started."""
        agent = AgentService()

        with pytest.raises(RuntimeError, match="not started"):
            agent.run("发布视频")

    def test_run_with_stub_execution(self):
        """Test agent run() method with stub execution."""
        agent = AgentService()
        agent.start()

        try:
            # Test with douyin prompt
            result = agent.run("发布到抖音", {"title": "我的视频"})

            assert result["status"] == "success"
            assert result["result"] is not None
            assert result["result"]["platform"] == "douyin"
            assert "🔥" in result["result"]["recommended_title"]
            assert result["message"] is not None

        finally:
            agent.stop()

    def test_run_xiaohongshu_detection(self):
        """Test platform detection from Chinese keywords."""
        agent = AgentService()
        agent.start()

        try:
            result = agent.run("分享到小红书", {"title": "日常"})

            assert result["status"] == "success"
            assert result["result"]["platform"] == "xiaohongshu"
            assert "✨" in result["result"]["recommended_title"]

        finally:
            agent.stop()

    def test_run_weixin_detection(self):
        """Test WeChat platform detection."""
        agent = AgentService()
        agent.start()

        try:
            result = agent.run("上传到微信视频号", {"title": "分享"})

            assert result["status"] == "success"
            assert result["result"]["platform"] == "weixin"
            assert "📱" in result["result"]["recommended_title"]

        finally:
            agent.stop()

    def test_run_kuaishou_detection(self):
        """Test Kuaishou platform detection."""
        agent = AgentService()
        agent.start()

        try:
            result = agent.run("发布到快手", {"title": "视频"})

            assert result["status"] == "success"
            assert result["result"]["platform"] == "kuaishou"
            assert "🎬" in result["result"]["recommended_title"]

        finally:
            agent.stop()

    def test_run_with_context(self):
        """Test run() with various context parameters."""
        agent = AgentService()
        agent.start()

        try:
            context = {
                "title": "测试标题",
                "file_path": "/path/to/video.mp4",
                "account_id": 123,
                "dry_run": True
            }

            result = agent.run("发布视频", context)

            assert result["status"] == "success"
            assert result["result"]["recommended_title"] is not None

        finally:
            agent.stop()

    def test_list_tools(self):
        """Test listing all registered tools."""
        agent = AgentService()

        # Should have default preview tool
        tools = agent.list_tools()
        assert len(tools) >= 1
        assert "preview_publish" in tools

        # Add more tools
        agent.register_tool("tool1", lambda: {})
        agent.register_tool("tool2", lambda: {})

        tools = agent.list_tools()
        assert len(tools) >= 3
        assert "tool1" in tools
        assert "tool2" in tools

    def test_singleton_pattern(self):
        """Test get_agent_service() returns singleton."""
        agent1 = get_agent_service()
        agent2 = get_agent_service()

        assert agent1 is agent2  # Same instance

        # Modifications to one affect the other
        agent1.register_tool("shared_tool", lambda: {})
        assert "shared_tool" in agent2.list_tools()

    def test_config_initialization(self):
        """Test AgentService initialization with custom config."""
        config = {
            "headless": False,
            "timeout": 600,
            "cli_path": "/custom/path"
        }

        agent = AgentService(config=config)

        assert agent.config == config
        assert agent.config["headless"] is False
        assert agent.config["timeout"] == 600

    def test_error_handling_in_run(self):
        """Test that errors in execution are caught and returned."""
        agent = AgentService()
        agent.start()

        try:
            # Modify agent to call the error tool
            def mock_execute(prompt, context):
                raise ValueError("Simulated execution error")

            agent._execute_stub = mock_execute

            result = agent.run("test", {})

            # Should return error status, not raise
            assert result["status"] == "error"
            assert "error" in result["message"].lower()

        finally:
            agent.stop()
