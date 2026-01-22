# GitHub Copilot Agent Integration Guide

## Overview

The OmniPost backend now integrates GitHub Copilot SDK to enable AI-driven, natural-language publishing. This guide explains the agent architecture, CLI usage, tool registration patterns, and configuration options.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────┐
│              CLI Interface                       │
│         (src/cli/agent_cli.py)                  │
│  - Argument parsing                             │
│  - Interactive mode                             │
│  - User I/O handling                            │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│           AgentService Layer                     │
│      (src/services/agent_service.py)            │
│  - Abstract interface (AgentService)            │
│  - Mock implementation (MockAgentService)       │
│  - Production impl (DefaultAgentService)        │
│  - Factory function (get_agent_service)         │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│        GitHub Copilot SDK Client                │
│         (github-copilot-sdk)                    │
│  - LLM interaction                              │
│  - Tool invocation                              │
│  - Response generation                          │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│             Registered Tools                     │
│  - preview_tool (built-in)                      │
│  - upload_douyin (future)                       │
│  - upload_xiaohongshu (future)                  │
│  - ...                                          │
└─────────────────────────────────────────────────┘
```

### Service Pattern

The agent service follows OmniPost's standard service pattern:

1. **Abstract Base Class** (`AgentService`): Defines the interface
2. **Mock Implementation** (`MockAgentService`): For testing without SDK
3. **Default Implementation** (`DefaultAgentService`): Production implementation with Copilot SDK
4. **Factory Function** (`get_agent_service(config)`): Returns appropriate implementation

## CLI Usage

### Installation

Ensure the agent dependencies are installed:

```bash
cd apps/backend
npm run env:install
```

### Basic Usage

```bash
# Single-shot command
npm run agent -- "Publish my video to Douyin"

# With platform specification
npm run agent -- "Upload video" --platform douyin

# Preview mode (dry run)
npm run agent -- "Plan publishing strategy" --preview

# Mock mode (for testing without SDK)
npm run agent -- "Test prompt" --mock
```

### Interactive Mode

```bash
npm run agent -- --interactive --mock
```

## Configuration

Configure via environment variables or `src/core/config.py`:

```bash
export COPILOT_CLI_PATH=/path/to/copilot
export AGENT_PROVIDER=copilot
```

## Tool Registration

Register Python functions as tools the AI can invoke:

```python
from src.services.agent_service import get_agent_service

agent = get_agent_service({"mock": True})
agent.start()

def upload_to_douyin(title: str, video_path: str) -> dict:
    return {"status": "success", "platform": "douyin"}

agent.register_tool("upload_douyin", upload_to_douyin)
```

## Testing

```bash
npm test tests/test_agent_service.py
npm test tests/test_agent_cli.py
```

For complete documentation, see the full guide at `docs/AGENT_GUIDE.md`.
