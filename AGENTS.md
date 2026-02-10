# OmniPost Copilot Instructions

## Project Overview

OmniPost is a multi-platform video publishing automation tool using a monorepo architecture. The system enables content creators to publish videos to multiple Chinese social media platforms (Douyin, WeChat Channels, Xiaohongshu, Kuaishou) through a unified Vue 3 frontend and Python Flask backend.

**Key Stack:**
- **Frontend:** Vue 3 + Vite, Pinia (state management), Element Plus UI, Axios
- **Backend:** Flask, Python 3.10, SQLite, Playwright (browser automation)
- **Dev Commands:** `npm run dev:frontend`, `npm run dev:backend`, `npm run test:backend`, `npm run test:frontend`

## Architecture Patterns

### Monorepo Structure
- `/apps/frontend/` - Vue 3 web application
- `/apps/backend/` - Flask REST API service
- Shared via workspace in root `package.json`
- Run commands with `-w apps/<name>` flag or from app directory

### Backend Service Layer Architecture
The backend follows a **three-layer pattern**:
1. **Routes** (`src/routes/*.py`) - HTTP endpoints, request handling
2. **Services** (`src/services/*.py`) - Business logic and orchestration
3. **Uploaders** (`src/uploader/*/main.py`) - Platform-specific automation

**Service examples:**
- `PublishService` - Abstract interface for publishing logic
- `TaskService` - Task lifecycle management (create, update, delete) using SQLite
- `LoginService` - Platform authentication via Playwright
- `DefaultPublishService` - Concrete implementation using uploaders

### Frontend State Management (Pinia)
Stores are located in `src/stores/` using Composition API pattern:
```javascript
export const useTaskStore = defineStore('task', () => {
  const tasks = ref([])
  const fetchTasks = async () => { /* API call */ }
  return { tasks, fetchTasks }
})
```
Components dispatch store actions → stores call API services → responses update state.

## Data Flow & Integration

**Publishing Workflow:**
1. Frontend → Upload video file + metadata via `/api/file/upload_file`
2. User selects platform, accounts, schedule → POST `/api/publish/postVideo`
3. Backend creates `Task` record (status='waiting'), triggers `start_publish_thread()`
4. Worker thread runs async uploader (e.g., `DouYinVideo.upload()`) using Playwright
5. Task status updated throughout execution; frontend polls `/api/publish/tasks`

**Authentication Pattern:**
- Login endpoint SSE stream at `/api/publish/login?type=<platform>&id=<accountId>`
- Uses `Queue` for thread-safe communication between sync Flask handler and async worker
- Worker sends status updates via SSE: `sse_stream()` generator iterates queue messages

## Database Schema

SQLite tables in `src/db/createTable.py`:
- **user_info** - Social accounts (type: 1=Xiaohongshu, 2=WeChat, 3=Douyin, 4=Kuaishou)
- **account_groups** - Group organization for accounts
- **file_records** - Uploaded video metadata
- **tasks** - Publishing job records (JSON fields: platforms, file_list, account_list, schedule_data)

All data accessed via `TaskService` singleton which handles connection pooling.

## Platform Uploader Pattern

Each platform in `src/uploader/<platform>_uploader/main.py` implements:
- Constructor takes: title, file_path, tags, publish_date, account_file, optional params
- `async upload(playwright: Playwright)` - Main orchestration using Playwright Page API
- Uses Playwright for QR code scanning, form filling, file upload, time scheduling
- Error handling with retry logic and `handle_upload_error()` pattern

**Key:** Uploaders are instantiated in `PublishService` methods which call `asyncio.run(uploader.upload(playwright))` to execute async code synchronously.

## Development Workflows

### Backend Setup & Testing
```bash
npm run install:backend          # Create .venv and install deps
npm run dev:backend              # Start Flask on port 5409
npm run test:backend             # Run pytest with coverage
npm run lint:backend             # flake8 checks
```

### Frontend Setup & Testing
```bash
npm run install:frontend         # Install node_modules
npm run dev:frontend             # Vite dev server on port 5173
npm run test:frontend            # Vitest with coverage option
npm run lint:frontend            # ESLint auto-fix
```

### Database Initialization
```bash
npm run db:init -w apps/backend  # Runs createTable.py, creates database.db
```

### CI/CD
GitHub Actions runs: linting, testing, and coverage on push to main.

## Project-Specific Patterns

### Async/Sync Bridge
Backend mixes sync Flask handlers with async worker threads:
- Route handlers are sync (Flask requirement)
- Long-running tasks spawn background threads via `threading.Thread(..., daemon=True)`
- Thread-safe communication via `Queue` (status_queue)
- SSE stream reads queue in generator: `def sse_stream(status_queue): yield f"data: {queue.get()}"`

### Service Mocking & Testing
- `MockLoginService` in tests for isolation (conftest.py fixtures)
- Patch service imports in test modules: `@patch('src.services.login_service.DefaultLoginService')`
- Mock uploaders to avoid Playwright dependency in tests
- Fixtures provide temp SQLite database for test isolation

### Configuration & Constants
- `src/core/config.py` - Paths (BASE_DIR, DATA_DIR, COOKIES_DIR, VIDEOS_DIR), Chrome path
- `src/core/constants.py` - Enum types (TencentZoneTypes), platform type mappings
- `src/core/browser.py` - Playwright browser initialization helpers
- `src/core/logger.py` - Per-platform loggers (douyin_logger, etc.)

### Error Handling
- Services use try-finally for resource cleanup (Playwright contexts/browsers)
- Uploaders catch and retry on failure via `handle_upload_error()`
- TaskService logs errors to task.error_msg field
- Network utilities provide `async_retry()` decorator with timeout support

## Critical Files by Purpose

**Understanding the System:**
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Complete system diagrams and data flows
- [apps/backend/README.md](../apps/backend/README.md) - Backend-specific setup

**Core Service Logic:**
- [src/services/publish_service.py](../apps/backend/src/services/publish_service.py) - Publishing orchestration
- [src/services/task_service.py](../apps/backend/src/services/task_service.py) - Task CRUD operations
- [src/services/login_service.py](../apps/backend/src/services/login_service.py) - Auth orchestration

**Platform Implementations:**
- [src/uploader/douyin_uploader/main.py](../apps/backend/src/uploader/douyin_uploader/main.py) - Douyin platform automation
- Similar pattern for `xiaohongshu_uploader`, `tencent_uploader`, `ks_uploader`

**Frontend Integration:**
- [src/stores/task.js](../apps/frontend/src/stores/task.js) - Task state management and API calls
- [src/api/](../apps/frontend/src/api/) - All API client services

**Testing Reference:**
- [tests/test_app_async_function.py](../apps/backend/tests/test_app_async_function.py) - Async function testing patterns
- [tests/conftest.py](../apps/backend/tests/conftest.py) - Pytest fixtures and database setup

## Key Conventions to Follow

1. **Service methods** are stateless; instantiate services per request or use singletons
2. **Platform types** use integer constants (1-4) in database; convert to/from human-readable strings in API responses
3. **Datetime scheduling** uses `utils/files_times.py` helpers to calculate publish times from user input
4. **File paths** stored as relative paths in DB; resolve via `BASE_DIR` and `VIDEOS_DIR` at runtime
5. **JSON serialization** in database: platform, file_list, account_list, schedule_data are stored as JSON strings
6. **Logging** includes platform-specific loggers; use `logger_name.info()` for structured output
7. **Mock imports** in tests use module paths matching actual imports to enable `@patch()`
