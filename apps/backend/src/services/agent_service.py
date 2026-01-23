"""
Agent Service Module for GitHub Copilot SDK Integration.

This module provides an AgentService class that manages a Copilot Agent
for natural language publishing tasks. The agent can invoke registered
tools (uploader functions) based on user prompts.

Example Usage:
    from src.services.agent_service import AgentService

    # Get singleton instance
    agent = AgentService.get_instance()

    # Start the agent (if not already started)
    agent.start()

    # Register a custom tool
    def my_tool(params: dict) -> dict:
        return {"status": "ok", "result": "processed"}

    agent.register_tool("my_tool", my_tool, {
        "description": "A custom tool",
        "parameters": {
            "type": "object",
            "properties": {
                "input": {"type": "string", "description": "Input text"}
            }
        }
    })

    # Run agent with a prompt
    result = agent.run("帮我把这个视频发到抖音", {"file_id": "123"})

    # Stop the agent
    agent.stop()
"""

import asyncio
import logging
from datetime import datetime
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger(__name__)


def create_uploader_tool(
    platform: str, uploader_class, uploader_module_path: str
) -> Dict[str, Any]:
    """
    Factory function to create an uploader tool wrapper.

    Args:
        platform: Platform name (e.g., 'douyin', 'xiaohongshu')
        uploader_class: The uploader class to wrap
        uploader_module_path: Import path for lazy loading

    Returns:
        dict: Tool definition with handler and schema
    """

    def handler(params: dict) -> dict:
        """
        Upload video to the specified platform.

        Args:
            params: {
                "title": str,
                "file_path": str,
                "tags": list[str],
                "account_file": str,
                "publish_date": str (ISO format, optional),
            }

        Returns:
            dict: {"status": "success"} or {"status": "error", "error": "..."}
        """
        try:
            from playwright.async_api import async_playwright

            # Parse publish date
            publish_date = datetime.now()
            if "publish_date" in params and params["publish_date"]:
                publish_date = datetime.fromisoformat(params["publish_date"])

            # Create uploader instance
            uploader = uploader_class(
                title=params["title"],
                file_path=params["file_path"],
                tags=params.get("tags", []),
                publish_date=publish_date,
                account_file=params["account_file"],
            )

            # Run async upload in sync context
            async def do_upload():
                async with async_playwright() as playwright:
                    await uploader.upload(playwright)

            asyncio.run(do_upload())

            return {"status": "success", "platform": platform, "title": params["title"]}

        except Exception as e:
            logger.error(f"Upload to {platform} failed: {e}")
            return {"status": "error", "platform": platform, "error": str(e)}

    return {
        "handler": handler,
        "schema": {
            "description": f"Upload video to {platform} platform",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Video title"},
                    "file_path": {"type": "string", "description": "Path to video file"},
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Video tags/hashtags",
                    },
                    "account_file": {
                        "type": "string",
                        "description": "Path to account cookie file",
                    },
                    "publish_date": {
                        "type": "string",
                        "description": "ISO format publish date (optional)",
                    },
                },
                "required": ["title", "file_path", "account_file"],
            },
        },
    }


def get_uploader_tools() -> Dict[str, Dict[str, Any]]:
    """
    Get all available uploader tools using a data-driven approach.

    Returns:
        dict: Mapping of tool names to tool definitions (handler + schema)
    """
    from src.core.constants import PLATFORM_REGISTRY, PlatformType

    # Mapping of platform types to their uploader module paths and class names
    # Note: Defined here to keep constants.py free of service/uploader dependencies
    UPLOADER_CONFIG = {
        PlatformType.XIAOHONGSHU: ("src.uploader.xiaohongshu_uploader.main", "XiaoHongShuVideo"),
        PlatformType.TENCENT: ("src.uploader.tencent_uploader.main", "TencentVideo"),
        PlatformType.DOUYIN: ("src.uploader.douyin_uploader.main", "DouYinVideo"),
        PlatformType.KUAISHOU: ("src.uploader.ks_uploader.main", "KSVideo"),
        PlatformType.BILIBILI: ("src.uploader.bilibili_uploader.main", "BiliBiliVideo"),
    }

    tools = {}
    import importlib

    for p_type, (mod_path, class_name) in UPLOADER_CONFIG.items():
        try:
            # Get platform info from centralized registry
            info = PLATFORM_REGISTRY.get(p_type)
            if not info:
                continue

            cli_name = info["name_cli"]

            # Dynamic import
            module = importlib.import_module(mod_path)
            uploader_class = getattr(module, class_name)

            # Create tool with consistent naming: upload_to_<cli_name>
            tool_name = f"upload_to_{cli_name}"
            tools[tool_name] = create_uploader_tool(cli_name, uploader_class, mod_path)

        except (ImportError, AttributeError) as e:
            logger.warning(f"Could not load uploader for {p_type.name}: {e}")
        except Exception as e:
            logger.error(f"Error registering tool for {p_type.name}: {e}")

    return tools


class AgentService:
    """
    Service for managing GitHub Copilot Agent integration.

    This service provides methods to:
    - Start and stop the Copilot agent
    - Register tools (uploader functions) that the agent can call
    - Run the agent with natural language prompts

    The service is implemented as a singleton to ensure only one
    agent instance is active at a time.

    Attributes:
        _instance: Singleton instance
        _started: Whether the agent has been started
        _tools: Dictionary of registered tools
        _agent: The underlying Copilot agent instance (if available)
    """

    _instance: Optional["AgentService"] = None

    def __init__(self):
        """Initialize the AgentService. Use get_instance() instead."""
        if AgentService._instance is not None:
            raise RuntimeError("Use AgentService.get_instance() to get the singleton instance")

        self._started = False
        self._tools: Dict[str, Dict[str, Any]] = {}
        self._agent = None
        self._client = None

        # Register default stub tool for testing
        self._register_preview_tool()

    @classmethod
    def get_instance(cls) -> "AgentService":
        """
        Get the singleton instance of AgentService.

        Returns:
            AgentService: The singleton instance
        """
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset_instance(cls):
        """
        Reset the singleton instance (mainly for testing).

        This will stop the agent if it's running and clear the instance.
        """
        if cls._instance is not None:
            if cls._instance._started:
                cls._instance.stop()
            cls._instance = None

    def _register_preview_tool(self):
        """
        Register a stub preview tool for testing and demonstration.

        This tool returns a deterministic JSON result that can be used
        in unit tests without network access.

        TODO: Replace with real uploader tool registrations in production.
        """

        def preview_tool(params: dict) -> dict:
            """
            Preview tool that analyzes content and returns recommendations.

            Args:
                params: Dictionary with 'prompt' and optional 'context'

            Returns:
                dict: Result with status and recommendations
            """
            prompt = params.get("prompt", "")
            context = params.get("context", {})

            # Deterministic response for testing
            result = {
                "status": "ok",
                "recommended_title": "精彩视频分享",
                "recommended_tags": ["热门", "推荐", "精选"],
                "suggested_platforms": ["douyin", "xiaohongshu"],
                "analysis": {"prompt_received": prompt, "context_keys": list(context.keys())},
            }

            logger.info(f"Preview tool executed with prompt: {prompt}")
            return result

        self.register_tool(
            name="preview_publish",
            handler=preview_tool,
            schema={
                "description": "Preview and analyze publishing recommendations for content",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "prompt": {
                            "type": "string",
                            "description": "Natural language publishing request",
                        },
                        "context": {
                            "type": "object",
                            "description": "Additional context (file_id, account_id, etc.)",
                        },
                    },
                    "required": ["prompt"],
                },
            },
        )

    def register_uploader_tools(self):
        """
        Register all available uploader tools.

        This method loads uploader tools for all supported platforms
        (douyin, xiaohongshu, tencent, kuaishou, bilibili) and registers
        them with the agent service.

        Note:
            This should be called after start() if you want the agent
            to have access to real uploaders. Tools are imported lazily
            to avoid ImportErrors when uploaders are not available.
        """
        uploader_tools = get_uploader_tools()
        for name, tool in uploader_tools.items():
            self.register_tool(name, tool["handler"], tool["schema"])
            logger.info(f"Registered uploader tool: {name}")

        logger.info(f"Registered {len(uploader_tools)} uploader tools")

    def start(self, config: Optional[Dict[str, Any]] = None):
        """
        Start the Copilot agent.

        This method initializes the GitHub Copilot SDK client and prepares
        the agent for use. It's safe to call multiple times - subsequent
        calls are no-ops if already started.

        Args:
            config: Optional configuration dictionary for the agent.
                   Can include 'cli_path', 'model', 'provider', etc.

        Raises:
            ImportError: If github-copilot-sdk is not installed
            RuntimeError: If agent initialization fails

        Note:
            The actual Copilot SDK integration is minimal in this initial
            implementation. The SDK would be imported and configured here
            in a production deployment.
        """
        if self._started:
            logger.info("Agent already started, ignoring start() call")
            return

        try:
            # TODO: Import and initialize actual Copilot SDK
            # from github_copilot_sdk import CopilotClient
            # self._client = CopilotClient(config or {})
            # self._agent = self._client.create_agent()

            # For now, use a mock implementation for testing
            logger.info("Starting agent service (stub mode)")
            self._started = True
            logger.info("Agent service started successfully")

        except Exception as e:
            logger.error(f"Failed to start agent service: {e}")
            raise RuntimeError(f"Agent startup failed: {e}")

    def stop(self):
        """
        Stop the Copilot agent and release resources.

        This method should be called when shutting down the application
        or when the agent is no longer needed. It's safe to call multiple
        times - subsequent calls are no-ops if already stopped.
        """
        if not self._started:
            logger.info("Agent not started, ignoring stop() call")
            return

        try:
            # TODO: Clean up actual Copilot SDK resources
            # if self._client:
            #     self._client.close()

            logger.info("Stopping agent service")
            self._started = False
            self._agent = None
            self._client = None
            logger.info("Agent service stopped successfully")

        except Exception as e:
            logger.error(f"Error stopping agent service: {e}")
            raise

    def register_tool(
        self, name: str, handler: Callable[[dict], dict], schema: Optional[Dict[str, Any]] = None
    ):
        """
        Register a tool that the agent can invoke.

        Tools are functions that the agent can call based on natural
        language prompts. Each tool should accept a dictionary of
        parameters and return a dictionary result.

        Args:
            name: Unique name for the tool
            handler: Callable that processes tool invocation
                    Should accept dict and return dict
            schema: Optional JSON schema describing the tool's
                   parameters and purpose

        Example:
            def douyin_upload(params):
                title = params['title']
                file_path = params['file_path']
                # ... upload logic ...
                return {"status": "success", "video_id": "123"}

            agent.register_tool(
                "upload_to_douyin",
                douyin_upload,
                {
                    "description": "Upload video to Douyin platform",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "file_path": {"type": "string"}
                        },
                        "required": ["title", "file_path"]
                    }
                }
            )

        Note:
            In production, tools should wrap actual uploader functions
            from src/uploader/*/main.py. The handler must manage Playwright
            contexts and async execution as needed.
        """
        if not name:
            raise ValueError("Tool name cannot be empty")

        if not callable(handler):
            raise ValueError("Tool handler must be callable")

        self._tools[name] = {"handler": handler, "schema": schema or {}}

        logger.info(f"Registered tool: {name}")

        # TODO: Register with actual Copilot agent
        # if self._agent:
        #     self._agent.register_tool(name, handler, schema)

    def run(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute the agent with a natural language prompt.

        This method processes a user's natural language request and
        invokes appropriate tools to fulfill it. The agent analyzes
        the prompt, selects relevant tools, and returns results.

        Args:
            prompt: Natural language instruction (e.g., "帮我把这个视频发到抖音")
            context: Optional context dictionary with metadata:
                    - file_id: ID of video file to publish
                    - account_id: Account to use for publishing
                    - platform: Target platform hint
                    - dry_run: If True, preview only without actual upload

        Returns:
            dict: Result from agent execution with structure:
                {
                    "status": "ok" | "error",
                    "result": {...},  # Tool-specific result
                    "error": "...",   # Error message if status is "error"
                    "tool_used": "tool_name"
                }

        Raises:
            RuntimeError: If agent is not started

        Example:
            result = agent.run(
                "帮我把这个视频发到抖音，标题要吸引年轻人",
                {"file_id": "123", "account_id": "douyin_main"}
            )
        """
        if not self._started:
            raise RuntimeError("Agent not started. Call start() first.")

        logger.info(f"Running agent with prompt: {prompt}")

        try:
            # TODO: Use actual Copilot SDK to process prompt
            # response = self._agent.chat(prompt, context=context)
            # return response

            # For now, use stub implementation that calls preview tool
            # This allows tests to work without network access
            preview_tool = self._tools.get("preview_publish")
            if preview_tool:
                result = preview_tool["handler"]({"prompt": prompt, "context": context or {}})
                return {"status": "ok", "result": result, "tool_used": "preview_publish"}
            else:
                return {"status": "error", "error": "No tools available"}

        except Exception as e:
            logger.error(f"Agent execution failed: {e}")
            return {"status": "error", "error": str(e)}

    def list_tools(self) -> Dict[str, Dict[str, Any]]:
        """
        Get a list of all registered tools.

        Returns:
            dict: Dictionary mapping tool names to their schemas
                 (handler is excluded from output)
        """
        return {name: {"schema": tool["schema"]} for name, tool in self._tools.items()}


# Convenience function to get the singleton instance
def get_agent_service() -> AgentService:
    """
    Get the singleton AgentService instance.

    This is a convenience function equivalent to AgentService.get_instance().

    Returns:
        AgentService: The singleton instance
    """
    return AgentService.get_instance()


# Example integration with uploaders (commented out - for documentation)
"""
# Example: How to wire a real uploader as an agent tool

from src.uploader.douyin_uploader.main import DouYinVideo
from playwright.async_api import async_playwright
import asyncio

def create_douyin_upload_tool():
    '''
    Create a tool that wraps the Douyin uploader.

    This demonstrates how to integrate an existing uploader
    with the agent system.
    '''
    def douyin_upload_handler(params: dict) -> dict:
        '''
        Upload video to Douyin platform.

        Args:
            params: {
                "title": str,
                "file_path": str,
                "tags": list[str],
                "account_file": str,
                "publish_date": str (ISO format),
            }

        Returns:
            dict: {"status": "success"} or {"status": "error", "error": "..."}
        '''
        try:
            from datetime import datetime

            uploader = DouYinVideo(
                title=params['title'],
                file_path=params['file_path'],
                tags=params.get('tags', []),
                publish_date=datetime.fromisoformat(
                    params.get('publish_date', datetime.now().isoformat())
                ),
                account_file=params['account_file']
            )

            # Run async upload in sync context
            async def do_upload():
                async with async_playwright() as playwright:
                    await uploader.upload(playwright)

            asyncio.run(do_upload())

            return {"status": "success", "platform": "douyin"}

        except Exception as e:
            return {"status": "error", "error": str(e)}

    return {
        "handler": douyin_upload_handler,
        "schema": {
            "description": "Upload video to Douyin (TikTok) platform",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Video title"},
                    "file_path": {"type": "string", "description": "Path to video file"},
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Video tags"
                    },
                    "account_file": {
                        "type": "string",
                        "description": "Path to account cookie file"
                    },
                    "publish_date": {
                        "type": "string",
                        "description": "ISO format publish date"
                    }
                },
                "required": ["title", "file_path", "account_file"]
            }
        }
    }

# To register this tool:
# agent = get_agent_service()
# tool = create_douyin_upload_tool()
# agent.register_tool("upload_to_douyin", tool["handler"], tool["schema"])
"""
