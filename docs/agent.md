# GitHub Copilot Agent Integration

This document explains how to use the GitHub Copilot SDK agent integration in OmniPost for natural language driven publishing.

## Overview

The agent feature enables you to publish content using natural language instructions instead of manual form filling. The system uses GitHub Copilot SDK to understand your intent and invoke the appropriate platform uploaders.

**Key Features:**
- Natural language publishing commands
- CLI tool for quick publishing from terminal
- Extensible tool registration system
- Stub mode for testing without network access

## Quick Start

### 1. Install Dependencies

First, ensure you have the GitHub Copilot SDK installed:

```bash
cd apps/backend
pip install -r requirements.txt
```

The requirements.txt now includes `github-copilot-sdk>=0.1.0`.

### 2. Test the Agent Service

Run the agent service tests to verify everything works:

```bash
cd apps/backend
pytest tests/test_agent_service.py -v
```

All tests should pass without requiring network access or Copilot API keys (tests use stub mode).

### 3. Use the CLI Demo

The CLI provides a command-line interface to the agent:

```bash
# List available accounts
python -m tools.omni_cli accounts

# List accounts for a specific platform
python -m tools.omni_cli accounts --platform douyin

# Publish with natural language
python -m tools.omni_cli post "帮我把这个视频发到抖音，标题要吸引年轻人"

# Publish a specific file
python -m tools.omni_cli post --file data/videos/my_video.mp4 --platforms douyin xiaohongshu

# Dry run (preview only)
python -m tools.omni_cli post "上传视频到抖音" --dry-run

# Refresh accounts and show account' status info
python -m tools.omni_cli accounts --refresh


```

### 4. Use in Python Code

You can also use the agent service directly in your Python code:

```python
from services.agent_service import AgentService

# Get singleton instance
agent = AgentService.get_instance()

# Start the agent
agent.start()

# Run with natural language prompt
result = agent.run(
    "帮我把这个视频发到抖音，标题要吸引年轻人",
    context={
        "file_id": "video_123",
        "account_id": "douyin_main",
        "dry_run": False
    }
)

print(result)

# Stop the agent
agent.stop()
```

## Architecture

### Components

1. **AgentService** (`apps/backend/src/services/agent_service.py`)
   - Manages the Copilot agent lifecycle
   - Registers tools that the agent can invoke
   - Provides `start()`, `stop()`, `run()`, and `register_tool()` API

2. **CLI Tool** (`tools/omni_cli.py`)
   - Command-line interface for agent-driven publishing
   - Supports both natural language and structured parameters
   - Integrates with database to list accounts and files

3. **Tests** (`apps/backend/tests/test_agent_service.py`)
   - Comprehensive test suite for agent functionality
   - Uses stub mode for offline testing
   - Validates tool registration and execution

### Data Flow

```
User Input (CLI or API)
    ↓
AgentService.run(prompt, context)
    ↓
[Future: Copilot SDK analyzes prompt]
    ↓
Tool Selection & Invocation
    ↓
Uploader Execution (Playwright)
    ↓
Result Returned to User
```

## Integrating Real Uploaders

The current implementation includes a **stub preview tool** for testing. To wire real uploaders:

### Step 1: Create Tool Wrapper

Create a function that wraps an existing uploader. Example for Douyin:

```python
# In agent_service.py or a separate tools module

from src.uploader.douyin_uploader.main import DouYinVideo
from playwright.async_api import async_playwright
import asyncio
from datetime import datetime

def create_douyin_upload_tool():
    """
    Create a tool that wraps the Douyin uploader.
    """
    def douyin_upload_handler(params: dict) -> dict:
        """
        Upload video to Douyin platform.

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
            # Parse publish date
            publish_date = datetime.now()
            if 'publish_date' in params:
                publish_date = datetime.fromisoformat(params['publish_date'])

            # Create uploader instance
            uploader = DouYinVideo(
                title=params['title'],
                file_path=params['file_path'],
                tags=params.get('tags', []),
                publish_date=publish_date,
                account_file=params['account_file']
            )

            # Run async upload in sync context
            async def do_upload():
                async with async_playwright() as playwright:
                    await uploader.upload(playwright)

            asyncio.run(do_upload())

            return {
                "status": "success",
                "platform": "douyin",
                "title": params['title']
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    return {
        "handler": douyin_upload_handler,
        "schema": {
            "description": "Upload video to Douyin (TikTok) platform",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Video title"
                    },
                    "file_path": {
                        "type": "string",
                        "description": "Full path to video file"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Video tags/hashtags"
                    },
                    "account_file": {
                        "type": "string",
                        "description": "Path to account cookie file"
                    },
                    "publish_date": {
                        "type": "string",
                        "description": "ISO format publish date (optional)"
                    }
                },
                "required": ["title", "file_path", "account_file"]
            }
        }
    }
```

### Step 2: Register Tool on Startup

Register the tool when initializing your application:

```python
from services.agent_service import get_agent_service

# Get agent service
agent = get_agent_service()

# Create and register Douyin tool
douyin_tool = create_douyin_upload_tool()
agent.register_tool(
    "upload_to_douyin",
    douyin_tool["handler"],
    douyin_tool["schema"]
)

# Similarly for other platforms...
xiaohongshu_tool = create_xiaohongshu_upload_tool()
agent.register_tool("upload_to_xiaohongshu", xiaohongshu_tool["handler"], xiaohongshu_tool["schema"])

# Start agent
agent.start()
```

### Step 3: Update Agent Logic (Future)

Once GitHub Copilot SDK is fully integrated, it will automatically:
1. Analyze the natural language prompt
2. Select the appropriate tool(s) based on the prompt and context
3. Extract parameters from the prompt
4. Invoke the tool(s)
5. Return results

## Configuration

### Environment Variables

The agent service respects the following configuration options:

- **TEST_MODE**: Set to `True` to use stub mode (no actual SDK calls)
- **DEBUG_MODE**: Set to `True` to enable debug logging

### CLI Path Configuration

When integrating the real Copilot SDK, you may need to configure the CLI path:

```python
agent.start({
    'cli_path': '/path/to/github-copilot-cli',
    'model': 'gpt-4',
    'temperature': 0.7
})
```

## Testing

### Running Tests

```bash
# Run all agent tests
cd apps/backend
pytest tests/test_agent_service.py -v

# Run with coverage
pytest tests/test_agent_service.py --cov=src/services/agent_service --cov-report=term

# Run specific test
pytest tests/test_agent_service.py::TestAgentExecution::test_run_with_preview_tool -v
```

### Writing Tests

Tests use the stub mode by default, so they don't require network access:

```python
import pytest
from services.agent_service import AgentService

@pytest.fixture
def agent_service():
    AgentService.reset_instance()
    service = AgentService.get_instance()
    yield service
    if service._started:
        service.stop()
    AgentService.reset_instance()

def test_my_feature(agent_service):
    agent_service.start()
    result = agent_service.run("test prompt")
    assert result["status"] == "ok"
```

## Troubleshooting

### Issue: "Agent not started" Error

**Solution**: Call `agent.start()` before `agent.run()`:

```python
agent = AgentService.get_instance()
agent.start()  # Must call this first
result = agent.run("prompt")
```

### Issue: Import Error for github-copilot-sdk

**Solution**: Install the dependency:

```bash
cd apps/backend
pip install -r requirements.txt
```

### Issue: No Accounts Found

**Solution**: Add accounts through the web interface or database:

1. Start the web app: `npm run dev`
2. Navigate to http://localhost:5173
3. Add accounts through the Account Management page

### Issue: CLI Not Found

**Solution**: Run from repository root:

```bash
# From repository root
python -m tools.omni_cli post "test"

# Or add to PYTHONPATH
export PYTHONPATH=/path/to/omni-post:$PYTHONPATH
python -m tools.omni_cli post "test"
```

## Roadmap

### Current Status (v1.0 - Stub Mode)

- ✅ AgentService with start/stop/run/register API
- ✅ CLI tool for command-line publishing
- ✅ Stub preview tool for offline testing
- ✅ Comprehensive test suite
- ✅ Documentation

### Next Steps

1. **Full SDK Integration**: Replace stub with actual GitHub Copilot SDK calls
2. **Tool Routing**: Implement smart tool selection based on prompts
3. **Real Uploaders**: Wire all platform uploaders as tools
4. **Streaming Support**: Add streaming responses for long-running uploads
5. **Advanced Context**: Enhance context with account selection, scheduling, etc.
6. **Web UI Integration**: Add agent interface to web dashboard
7. **Error Recovery**: Implement retry logic and error handling
8. **Multi-file Support**: Enable batch publishing of multiple files

## Code Pointers

Key files for uploader integration:

- **Douyin**: `apps/backend/src/uploader/douyin_uploader/main.py`
- **Xiaohongshu**: `apps/backend/src/uploader/xiaohongshu_uploader/main.py`
- **WeChat Channels**: `apps/backend/src/uploader/tencent_uploader/main.py`
- **Kuaishou**: `apps/backend/src/uploader/ks_uploader/main.py`

All uploaders follow a similar pattern:
1. Constructor: Accept title, file_path, tags, publish_date, account_file
2. `async upload(playwright: Playwright)`: Main upload method using Playwright
3. Error handling with try/finally for browser cleanup

## Support

For questions or issues:

1. Check [ARCHITECTURE.md](../ARCHITECTURE.md) for system design
2. Review [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines
3. Open an issue on GitHub with the `agent` label
4. Check existing tests in `tests/test_agent_service.py` for usage examples

---

**Last Updated**: January 2026
