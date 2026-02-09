---
trigger: always_on
description: Core architecture, stack, and patterns for OmniPost
---

# OmniPost Core Instructions

## Project Overview

OmniPost is a multi-platform video publishing automation tool using a monorepo architecture. The system enables content creators to publish videos to multiple Chinese social media platforms (Douyin, WeChat Channels, Xiaohongshu, Kuaishou, Bilibili) through a unified Vue 3 frontend and Python Flask backend.

**Key Stack:**
- **Frontend:** Vue 3 + Vite, Pinia (state management), Element Plus UI, Axios
- **Backend:** Flask, Python 3.10, SQLite, Playwright (browser automation)

## Architecture Patterns

### Monitor Structure
- `/apps/frontend/` - Vue 3 web application
- `/apps/backend/` - Flask REST API service

### Backend Service Layer Architecture
The backend follows a **three-layer pattern**:
1. **Routes** (`src/routes/*.py`) - HTTP endpoints, request handling
2. **Services** (`src/services/*.py`) - Business logic and orchestration
3. **Uploaders** (`src/uploader/*/main.py`) - Platform-specific automation

**Service examples:**
- `PublishService` - Abstract interface for publishing logic
- `TaskService` - Task lifecycle management using SQLite
- `LoginService` - Platform authentication via Playwright
- `DefaultPublishService` - Concrete implementation using uploaders

### Frontend State Management (Pinia)
Stores are located in `src/stores/` using Composition API pattern. Components dispatch store actions → stores call API services → responses update state.

## Data Flow & Integration

**Publishing Workflow:**
1. Frontend upload via `/api/file/upload_file`
2. Frontend POST `/api/publish/postVideo`
3. Backend creates Task, triggers `start_publish_thread()`
4. Worker thread runs async uploader using Playwright
5. Frontend polls `/api/publish/tasks`

**Authentication Pattern:**
- Login endpoint SSE stream at `/api/publish/login?type=<platform>&id=<accountId>`
- Uses `Queue` for thread-safe communication between sync Flask handler and async worker

## Critical Conventions

1. **Service methods** are stateless; instantiate services per request or use singletons
2. **Platform types** use integer constants (1-5) in database
3. **Datetime scheduling** uses `utils/files_times.py` helpers
4. **File paths** stored as relative paths in DB; resolve via `BASE_DIR` at runtime
5. **JSON serialization** in database for list/dict fields (platforms, file_list, account_list, schedule_data, publish_data)
6. **Logging** includes platform-specific loggers
