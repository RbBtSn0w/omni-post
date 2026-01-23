# GitHub Copilot SDK Integration

This document describes the GitHub Copilot SDK integration for the OmniPost backend, which enables AI-driven publishing through natural language interactions.

## Overview

The integration provides:
- **Agent Service**: A service layer that manages Copilot SDK client lifecycle and tool registration
- **CLI Interface**: A command-line tool for invoking the agent with natural language prompts
- **Tool System**: A framework for registering backend functions as callable tools for the agent

## Installation

1. Install the GitHub Copilot SDK dependency:
```bash
cd apps/backend
.venv/bin/pip install github-copilot-sdk>=0.1.0
```

2. (Optional) Configure environment variables:
```bash
export COPILOT_CLI_PATH=/path/to/cli  # Optional: custom CLI path
export COPILOT_PROVIDER=github        # Default: "github"
```

## Usage

### Command Line Interface

The CLI provides several ways to interact with the agent:

#### List available tools
```bash
python -m src.cli.agent_cli --list-tools
```

#### Run agent with a prompt
```bash
python -m src.cli.agent_cli "Schedule a video for tomorrow at 10am"
```

#### Provide context as JSON
```bash
python -m src.cli.agent_cli "Publish video" --context '{"title":"My Video","platform":"douyin"}'
```

#### Enable verbose output
```bash
python -m src.cli.agent_cli "Publish video" --verbose
```

### Programmatic API

You can also use the agent service directly in your Python code:

```python
from src.services.agent_service import get_agent_service

# Get the singleton agent service instance
agent = get_agent_service()

# Register a custom tool
def upload_video(title, file_path):
    return {"status": "uploaded", "title": title}

agent.register_tool("upload_video", upload_video)

# Start the agent
agent.start()

# Run the agent with a prompt
result = agent.run(
    "Upload a video titled 'My First Video'",
    context={"file_path": "/path/to/video.mp4"}
)

print(result)

# Stop the agent when done
agent.stop()
```

## Architecture

### AgentService Class

The `AgentService` class in `src/services/agent_service.py` provides:

- **Lifecycle Management**:
  - `start()`: Initialize the Copilot client
  - `stop()`: Clean up and release resources
  - `is_started`: Property to check service status

- **Tool Registration**:
  - `register_tool(name, callable)`: Register a function as an agent tool
  - `get_registered_tools()`: List all registered tools

- **Execution**:
  - `run(prompt, context)`: Execute agent with natural language prompt

### Built-in Tools

#### preview_tool
A demonstration tool that returns a deterministic response:
```json
{
  "status": "ok",
  "recommended_title": "AI-Generated Video Title",
  "message": "Preview tool executed successfully"
}
```

## Testing

Run the test suite:
```bash
cd apps/backend
.venv/bin/python -m pytest tests/test_agent_service.py -xvs
```

The tests verify:
- Service initialization and lifecycle
- Tool registration and execution
- Error handling (missing SDK, duplicate tools, etc.)
- Configuration from environment variables
- Singleton pattern for global service instance

## Integration with Uploaders

The agent service is designed to integrate with existing uploader functions. Example:

```python
from src.services.agent_service import get_agent_service
from src.uploader.douyin_uploader.main import DouYinVideo

agent = get_agent_service()

# Wrap uploader as a tool
def publish_to_douyin(title, file_path, tags, account_file):
    uploader = DouYinVideo(
        title=title,
        file_path=file_path,
        tags=tags,
        publish_date=datetime.now(),
        account_file=account_file
    )
    # Execute upload (simplified - actual code would use asyncio)
    return {"status": "success", "platform": "douyin"}

agent.register_tool("publish_to_douyin", publish_to_douyin)
```

## Configuration

The agent service supports configuration via environment variables:

- `COPILOT_CLI_PATH`: Optional path to the Copilot CLI binary
- `COPILOT_PROVIDER`: Provider to use (default: "github")

Configuration is read during `AgentService` initialization.

## Error Handling

The service provides informative error messages:

- **SDK Not Installed**: Suggests installation command
- **Service Not Started**: Prompts to call `start()` first
- **Duplicate Tools**: Prevents overwriting existing tool registrations
- **Multiple Start Calls**: Prevents re-initialization

## Future Enhancements

Potential improvements for this integration:

1. **Tool Auto-Discovery**: Automatically register uploaders as tools
2. **Streaming Responses**: Support streaming agent responses for long-running tasks
3. **Tool Metadata**: Add descriptions and schemas for better agent understanding
4. **Session Management**: Support for multi-turn conversations
5. **Async Support**: Full async/await support for better concurrency

## Notes

- The agent service uses a singleton pattern for application-wide consistency
- Tools are registered by name and must be unique
- The service requires explicit start/stop calls for proper resource management
- All agent executions return JSON-serializable dictionaries
