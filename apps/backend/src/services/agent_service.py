"""
Agent service module for omni-post backend.

This module provides AI agent integration using GitHub Copilot SDK.
The agent can orchestrate publishing tasks using natural language instructions
and call platform-specific uploader functions as tools.
"""

import json
import logging
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


class AgentService:
    """
    AI Agent service for natural language driven publishing automation.

    This service initializes and manages a GitHub Copilot SDK agent that can:
    - Accept natural language publishing instructions
    - Call registered uploader functions as tools
    - Orchestrate complex multi-platform publishing workflows

    Example usage:
        >>> agent = AgentService()
        >>> agent.start()
        >>> result = agent.run("发布视频到抖音", {"file_path": "/path/to/video.mp4"})
        >>> agent.stop()

    API:
        - start(): Initialize the agent and prepare for execution
        - stop(): Clean up agent resources
        - run(prompt: str, context: dict) -> dict: Execute a natural language task
        - register_tool(name: str, callable): Register an uploader as a callable tool
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the AgentService.

        Args:
            config: Optional configuration dictionary with keys:
                - 'headless': bool, run in headless mode (default: True)
                - 'timeout': int, operation timeout in seconds (default: 300)
                - 'cli_path': str, path to GitHub Copilot CLI (optional)
        """
        self.config = config or {}
        self._client = None
        self._tools: Dict[str, Callable] = {}
        self._started = False

        # Register built-in stub tool for testing
        self._register_preview_tool()

    def _register_preview_tool(self) -> None:
        """
        Register a preview stub tool for testing purposes.

        This tool returns a deterministic JSON response without calling
        real uploaders or Playwright. Replace with real uploader tools
        in production by calling register_tool().
        """
        def preview_tool(title: str, platform: str = "douyin") -> Dict[str, Any]:
            """
            Preview tool stub - returns recommended metadata without upload.

            Args:
                title: Original video title
                platform: Target platform (douyin, xiaohongshu, weixin, kuaishou)

            Returns:
                Dict with status and recommended publishing metadata
            """
            # Simulate AI-generated recommendations
            recommendations = {
                "douyin": "🔥 ",
                "xiaohongshu": "✨ ",
                "weixin": "📱 ",
                "kuaishou": "🎬 "
            }
            prefix = recommendations.get(platform, "")

            return {
                "status": "ok",
                "recommended_title": f"{prefix}{title}",
                "recommended_tags": f"#{platform} #视频 #分享",
                "platform": platform,
                "preview_mode": True,
                "message": "This is a preview. Wire real uploaders to execute."
            }

        self.register_tool("preview_publish", preview_tool)

    def start(self) -> None:
        """
        Start the agent service.

        Initializes the GitHub Copilot SDK client and prepares for execution.
        This method must be called before run() can be used.

        Note: In this minimal implementation, we use a local stub mode.
        To use the full Copilot SDK:
            from github_copilot import CopilotClient
            self._client = CopilotClient(...)
        """
        if self._started:
            logger.warning("AgentService already started")
            return

        logger.info("Starting AgentService (stub mode)")
        # TODO: Initialize real GitHub Copilot SDK client when ready
        # self._client = CopilotClient(cli_path=self.config.get('cli_path'))
        self._client = "stub_client"  # Placeholder for testing
        self._started = True
        logger.info("AgentService started successfully")

    def stop(self) -> None:
        """
        Stop the agent service and clean up resources.

        Closes any open connections and releases resources.
        """
        if not self._started:
            logger.warning("AgentService not started")
            return

        logger.info("Stopping AgentService")
        # TODO: Clean up real Copilot client
        # if self._client:
        #     self._client.close()
        self._client = None
        self._started = False
        logger.info("AgentService stopped")

    def run(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute a natural language task using the agent.

        Args:
            prompt: Natural language instruction (e.g., "发布这个视频到抖音")
            context: Optional context dictionary with:
                - file_path: str, path to video file
                - account_id: int, account to use
                - platforms: List[str], target platforms
                - dry_run: bool, preview mode without actual upload

        Returns:
            Dictionary with execution results:
                - status: str, "success" or "error"
                - result: Any, tool execution result
                - message: str, human-readable message

        Raises:
            RuntimeError: If agent not started or execution fails
        """
        if not self._started:
            raise RuntimeError("AgentService not started. Call start() first.")

        context = context or {}
        logger.info(f"Running agent task: {prompt}")
        logger.debug(f"Context: {json.dumps(context, ensure_ascii=False)}")

        try:
            # TODO: Replace with real Copilot SDK agent execution
            # result = self._client.run(prompt, tools=self._tools, context=context)

            # Stub implementation: parse simple instructions
            result = self._execute_stub(prompt, context)

            return {
                "status": "success",
                "result": result,
                "message": "Task completed (stub mode)"
            }
        except Exception as e:
            logger.error(f"Agent execution failed: {e}", exc_info=True)
            return {
                "status": "error",
                "result": None,
                "message": f"Execution failed: {str(e)}"
            }

    def _execute_stub(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Stub execution logic for testing without Copilot SDK.

        Parses simple keywords and calls the preview tool.
        Replace this with real agent reasoning when SDK is integrated.

        Args:
            prompt: Natural language prompt
            context: Execution context

        Returns:
            Tool execution result
        """
        # Simple keyword-based routing
        platform = "douyin"
        if "小红书" in prompt or "xiaohongshu" in prompt.lower():
            platform = "xiaohongshu"
        elif "微信" in prompt or "weixin" in prompt.lower() or "wechat" in prompt.lower():
            platform = "weixin"
        elif "快手" in prompt or "kuaishou" in prompt.lower():
            platform = "kuaishou"

        # Extract title from context or use default
        title = context.get("title", "我的视频")

        # Call the preview tool
        preview_fn = self._tools.get("preview_publish")
        if preview_fn:
            return preview_fn(title=title, platform=platform)
        else:
            return {"error": "No tools registered"}

    def register_tool(self, name: str, handler: Callable) -> None:
        """
        Register a callable function as a tool the agent can invoke.

        Tools should be uploader wrappers with JSON-friendly signatures.

        Args:
            name: Unique tool name (e.g., "publish_douyin", "preview_publish")
            handler: Callable function that takes JSON-serializable args
                     and returns a JSON-serializable dict

        Example:
            >>> def douyin_uploader_wrapper(title, file_path, tags, account_file):
            ...     # Call src.uploader.douyin_uploader.main.DouYinVideo
            ...     result = upload_to_douyin(title, file_path, tags, account_file)
            ...     return {"status": "uploaded", "video_id": result.id}
            >>> agent.register_tool("publish_douyin", douyin_uploader_wrapper)

        TODO: Wire real uploader functions here. Example pattern:
            from src.uploader.douyin_uploader.main import DouYinVideo
            import asyncio
            from playwright.async_api import async_playwright

            def real_douyin_tool(title, file_path, tags, account_file):
                async def upload():
                    async with async_playwright() as p:
                        uploader = DouYinVideo(title, file_path, tags, None, account_file)
                        await uploader.upload(p)
                        return {"status": "success"}
                return asyncio.run(upload())

            agent.register_tool("publish_douyin", real_douyin_tool)
        """
        logger.info(f"Registering tool: {name}")
        self._tools[name] = handler

    def list_tools(self) -> List[str]:
        """
        List all registered tool names.

        Returns:
            List of tool names available to the agent
        """
        return list(self._tools.keys())


# Singleton instance for convenience
_agent_instance: Optional[AgentService] = None


def get_agent_service() -> AgentService:
    """
    Get or create the global AgentService singleton.

    Returns:
        AgentService instance
    """
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = AgentService()
    return _agent_instance
