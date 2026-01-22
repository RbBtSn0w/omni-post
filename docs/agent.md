# AI Agent Integration Guide

## Overview

OmniPost now includes an AI agent powered by GitHub Copilot SDK that enables natural language driven publishing workflows. The agent can accept Chinese or English instructions and orchestrate video uploads to multiple platforms.

## Features

- **Natural Language Interface**: Give instructions in plain language (Chinese or English)
- **Multi-Platform Support**: Publish to Douyin, Xiaohongshu, WeChat Channels, and Kuaishou
- **Tool Registration System**: Extend the agent with custom uploader functions
- **CLI Access**: Command-line interface for scripting and automation
- **Stub Mode**: Test and develop without Copilot SDK or network access

## Installation

### Prerequisites

- Python 3.10+
- OmniPost backend installed and configured
- GitHub Copilot CLI (optional, for full SDK features)

### Install Dependencies

Add the GitHub Copilot SDK to your backend environment:

```bash
cd apps/backend
.venv/bin/pip install github-copilot-sdk>=0.1.0
```

Or install all backend dependencies:

```bash
npm run install:backend
```

## Quick Start

### Using the CLI

The simplest way to use the agent is through the command-line interface:

```bash
# Basic usage - publish with natural language instruction
python -m tools.omni_cli post "发布视频到抖音" --title "我的第一个视频"

# Preview mode (dry run, no actual upload)
python -m tools.omni_cli post "分享到小红书" --title "日常分享" --dry-run

# With file path
python -m tools.omni_cli post "上传这个视频" \
    --title "精彩瞬间" \
    --file-path /path/to/video.mp4

# Specify platform and account
python -m tools.omni_cli post "发布视频" \
    --title "我的视频" \
    --platforms douyin xiaohongshu \
    --account-id 1

# List available tools
python -m tools.omni_cli list-tools
```

### Using the Python API

You can also integrate the agent directly in your Python code:

```python
from services.agent_service import get_agent_service

# Get the agent instance
agent = get_agent_service()

# Start the agent
agent.start()

# Execute a task
result = agent.run(
    prompt="发布到抖音和小红书",
    context={
        "title": "我的视频",
        "file_path": "/path/to/video.mp4",
        "account_id": 1
    }
)

print(result)
# {
#   "status": "success",
#   "result": {...},
#   "message": "Task completed"
# }

# Clean up
agent.stop()
```

## Architecture

### AgentService API

The `AgentService` class provides the core agent functionality:

**Methods:**

- `start()`: Initialize the agent and prepare for execution
- `stop()`: Clean up agent resources
- `run(prompt: str, context: dict) -> dict`: Execute a natural language task
- `register_tool(name: str, callable)`: Register an uploader as a callable tool
- `list_tools() -> List[str]`: List all registered tool names

**Context Parameters:**

- `title`: Video title
- `file_path`: Path to video file
- `platforms`: List of target platforms
- `account_id`: Account to use for publishing
- `dry_run`: Preview mode (no actual upload)

## Integrating Real Uploaders

Currently, the agent uses stub tools for testing. To integrate real platform uploaders:

### 1. Create an Uploader Wrapper

Wrap the existing uploader in a JSON-friendly function:

```python
# Example: Douyin uploader wrapper
from src.uploader.douyin_uploader.main import DouYinVideo
from playwright.async_api import async_playwright
import asyncio

def douyin_uploader_tool(
    title: str,
    file_path: str,
    tags: str,
    account_file: str,
    publish_date: str = None
) -> dict:
    """
    Upload video to Douyin platform.
    
    Args:
        title: Video title
        file_path: Absolute path to video file
        tags: Video tags (space or comma separated)
        account_file: Path to account cookies file
        publish_date: Optional scheduled publish time
        
    Returns:
        Dict with upload status and details
    """
    async def upload():
        async with async_playwright() as playwright:
            uploader = DouYinVideo(
                title=title,
                file_path=file_path,
                tags=tags,
                publish_date=publish_date,
                account_file=account_file
            )
            await uploader.upload(playwright)
            return {
                "status": "success",
                "platform": "douyin",
                "title": title
            }
    
    try:
        result = asyncio.run(upload())
        return result
    except Exception as e:
        return {
            "status": "error",
            "platform": "douyin",
            "error": str(e)
        }
```

### 2. Register the Tool

Register your wrapper with the agent:

```python
from services.agent_service import get_agent_service

agent = get_agent_service()
agent.start()

# Register the Douyin uploader
agent.register_tool("publish_douyin", douyin_uploader_tool)

# Similarly for other platforms
agent.register_tool("publish_xiaohongshu", xiaohongshu_uploader_tool)
agent.register_tool("publish_weixin", weixin_uploader_tool)
agent.register_tool("publish_kuaishou", kuaishou_uploader_tool)
```

### 3. Platform-Specific Uploader Locations

Reference the existing uploaders in `src/uploader/`:

- **Douyin**: `src/uploader/douyin_uploader/main.py` → `DouYinVideo`
- **Xiaohongshu**: `src/uploader/xiaohongshu_uploader/main.py` → `XiaoHongShuVideo`
- **WeChat Channels**: `src/uploader/tencent_uploader/main.py` → `TencentVideo`
- **Kuaishou**: `src/uploader/ks_uploader/main.py` → `KSVideo`

Each uploader takes similar parameters:
- `title`: str
- `file_path`: str
- `tags`: str
- `publish_date`: Optional[str]
- `account_file`: str

### 4. Replace Stub Execution

Once real tools are registered, the agent will use them instead of the preview stub. You can remove or modify the `_execute_stub` method in `agent_service.py` to integrate with the actual Copilot SDK reasoning.

## Running Tests

Test the agent service:

```bash
cd apps/backend
.venv/bin/python -m pytest tests/test_agent_service.py -v
```

Run all tests:

```bash
npm run test:backend
```

## Configuration

### Environment Variables

You can configure the agent through environment variables or the config dict:

- `COPILOT_CLI_PATH`: Path to GitHub Copilot CLI (optional)
- `AGENT_HEADLESS`: Run browsers in headless mode (default: true)
- `AGENT_TIMEOUT`: Operation timeout in seconds (default: 300)

### Config Dictionary

Pass configuration when initializing the agent:

```python
config = {
    "headless": False,  # Show browser for debugging
    "timeout": 600,     # 10 minute timeout
    "cli_path": "/usr/local/bin/github-copilot"
}

agent = AgentService(config=config)
```

## Troubleshooting

### Import Errors

If you encounter import errors when running the CLI:

```bash
# Make sure you're in the repo root
cd /path/to/omni-post

# Run with PYTHONPATH set
PYTHONPATH=apps/backend/src python -m tools.omni_cli post "测试"
```

### Agent Not Starting

If the agent fails to start:

1. Check that dependencies are installed: `.venv/bin/pip list | grep copilot`
2. Verify Python version: `python --version` (should be 3.10+)
3. Check logs for error messages

### Tool Not Found

If tools aren't being called:

1. List registered tools: `python -m tools.omni_cli list-tools`
2. Verify tool registration in your code
3. Check that tool names match what the agent expects

## Advanced Usage

### Custom Tool Development

Create specialized tools for your workflow:

```python
def batch_upload_tool(files: list, platform: str, title_template: str) -> dict:
    """Upload multiple files with templated titles."""
    results = []
    for i, file_path in enumerate(files):
        title = title_template.format(index=i+1)
        result = upload_single(file_path, title, platform)
        results.append(result)
    
    return {
        "status": "success",
        "uploaded_count": len(results),
        "results": results
    }

agent.register_tool("batch_upload", batch_upload_tool)
```

### Integration with Existing Routes

Use the agent from Flask routes:

```python
from flask import Blueprint, request, jsonify
from services.agent_service import get_agent_service

agent_bp = Blueprint('agent', __name__)

@agent_bp.route('/api/agent/publish', methods=['POST'])
def agent_publish():
    data = request.json
    agent = get_agent_service()
    
    if not agent._started:
        agent.start()
    
    result = agent.run(
        prompt=data['instruction'],
        context=data.get('context', {})
    )
    
    return jsonify(result)
```

## Next Steps

1. **Install Copilot CLI**: For full SDK features, install the GitHub Copilot CLI
2. **Wire Real Uploaders**: Replace stub tools with actual platform uploaders
3. **Add Streaming**: Implement streaming responses for long-running uploads
4. **Enhance Reasoning**: Use full Copilot SDK for better natural language understanding
5. **Add Authentication**: Integrate with existing account management system

## References

- [GitHub Copilot SDK Documentation](https://github.com/github/copilot-sdk)
- [OmniPost Architecture](../ARCHITECTURE.md)
- [Backend README](../apps/backend/README.md)
- [Uploader Implementations](../apps/backend/src/uploader/)

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing uploader implementations for patterns
- Review test cases for usage examples
