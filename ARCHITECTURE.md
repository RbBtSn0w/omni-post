# OmniPost Architecture

## Overview

OmniPost is built using a **Monorepo architecture** with separate frontend and backend applications. This document explains the overall system design, component interactions, and technical decisions.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Browser                             │
│                   (http://localhost:5173)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────┐
│                    Frontend (Vue 3 + Vite)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Views: Dashboard, Accounts, Publishing, Logs          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Components: Forms, Tables, Modals, Upload             │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Stores (Pinia): Auth, Videos, Accounts, UI            │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ API Layer: axios-based service calls                  │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API calls
                           │ (http://localhost:5409)
┌──────────────────────────▼──────────────────────────────────┐
│                 Backend (Flask + Python 3.10)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Routes: /api/auth, /api/accounts, /api/publish        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Services: AuthService, UploadService, TaskScheduler   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Uploaders: DouYin, Xiaohongshu, Kuaishou, Tencent    │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Database: SQLite models (User, Account, Video, Task)  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Utils: File handling, Cookie management, Encryption   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ Browser automation
┌──────────────────────────▼──────────────────────────────────┐
│              Playwright + Chromium Browser                   │
│       (Platform automation: Login, Upload, Publish)          │
└──────────────────────────┬──────────────────────────────────┘
                           │ Web requests
┌──────────────────────────▼──────────────────────────────────┐
│          Social Media Platforms                              │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐  │
│  │   Douyin     │  Xiaohongshu │   Kuaishou   │ Tencent  │  │
│  └──────────────┴──────────────┴──────────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Directory Structure

```
apps/frontend/
├── src/
│   ├── views/                    # Page components
│   │   ├── Dashboard.vue
│   │   ├── AccountManagement.vue
│   │   ├── PublishCenter.vue    # Video Publishing Interface
│   │   ├── TaskManagement.vue   # Task Monitoring
│   │   ├── MaterialManagement.vue
│   │   └── ...
│   │
│   ├── components/               # Reusable UI components
│   │   ├── GroupSelector.vue
│   │   └── ...
│   │
│   ├── stores/                   # Pinia state management
│   │   ├── user.js              # Authentication/User state
│   │   ├── account.js           # Account management
│   │   ├── task.js              # Publishing tasks
│   │   ├── group.js             # Group management
│   │   └── app.js               # Global UI state
│   │
│   ├── api/                     # API service layer
│   │   ├── user.js              # Authentication endpoints
│   │   ├── account.js           # Account endpoints
│   │   ├── material.js          # Material/Video endpoints
│   │   ├── task.js              # Task endpoints
│   │   ├── dashboard.js         # Dashboard stats
│   │   └── index.js             # Shared axios instance
│   │
│   ├── router/                  # Vue Router configuration
│   │   └── index.js
│   │
│   ├── composables/             # Composition API utilities
│   │   ├── useAccountActions.js
│   │   └── useAccountFilter.js
│   │
│   ├── utils/                   # Utility functions
│   │   ├── request.js
│   │   └── dataCache.js
│   │
│   ├── styles/                  # Global styles
│   │   └── ...
│   │
│   ├── assets/                  # Static assets
│   │
│   ├── App.vue                  # Root component
│   └── main.js                  # Application entry point
│
├── tests/                       # Test suite
│   ├── unit/                    # Unit tests
│   ├── composables/             # Composable tests
│   ├── stores/                  # Store tests
│   ├── utils/                   # Utility tests
│   └── setup.js
│
├── public/                      # Public assets
├── index.html
├── vite.config.js
├── vitest.config.js
└── package.json
```

### Data Flow

1. **User Interaction** → UI Component
2. **Component** → API Service Layer
3. **API Service** → REST Request to Backend
4. **Response** → Pinia Store Update
5. **Store Update** → Component Re-render

### State Management (Pinia)

```javascript
// Example store structure
const useVideoStore = defineStore('videos', () => {
  // State
  const videos = ref([])
  const loading = ref(false)
  const selectedVideo = ref(null)

  // Getters
  const videoCount = computed(() => videos.value.length)

  // Actions
  const fetchVideos = async () => {
    loading.value = true
    try {
      const data = await getVideos()
      videos.value = data
    } finally {
      loading.value = false
    }
  }

  return { videos, loading, selectedVideo, videoCount, fetchVideos }
})
```

### Component Communication

```
Parent Component
    ├── Props (Down)
    └── Emits (Up)
        ↓
Child Components
    ├── Composables (Shared logic)
    └── Stores (Global state)
```

## Backend Architecture

### Directory Structure

```
apps/backend/
├── src/
│   ├── app.py                   # Flask application factory
│   ├── core/                    # Core configuration
│   │   ├── config.py
│   │   ├── constants.py
│   │   └── logger.py
│   │
│   ├── routes/                  # API endpoint definitions
│   │   ├── account.py           # Account management
│   │   ├── publish.py           # Publishing operations
│   │   ├── dashboard.py         # Dashboard stats
│   │   ├── file.py              # File management
│   │   ├── group.py             # Group management
│   │   └── cookie.py            # Cookie operations
│   │
│   ├── services/                # Business logic layer
│   │   ├── auth_service.py      # Authentication logic
│   │   ├── task_service.py      # Task scheduling
│   │   ├── publish_service.py   # Publishing orchestration
│   │   ├── publish_executor.py  # Task execution logic
│   │   ├── login_service.py     # Login management
│   │   ├── login_impl.py        # Login implementations
│   │   └── cookie_service.py    # Cookie management
│   │
│   ├── uploader/                # Platform-specific uploaders
│   │   ├── __init__.py
│   │   ├── base_uploader.py     # Abstract base class
│   │   ├── douyin_uploader/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── login.py
│   │   │   └── utils.py
│   │   ├── xiaohongshu_uploader/
│   │   │   ├── __init__.py
│   │   │   └── main.py
│   │   ├── ks_uploader/
│   │   │   ├── __init__.py
│   │   │   └── main.py
│   │   └── tencent_uploader/
│   │   │   ├── __init__.py
│   │   │   └── main.py
│   │
│   ├── utils/                   # Utility functions
│   │   ├── network.py           # Network utilities
│   │   └── files_times.py       # File and time helpers
│   │
│   ├── db/                      # Database layer
│   │   ├── db_manager.py        # Database connection & management
│   │   └── createTable.py       # Database initialization
│   │
│   └── __init__.py
│
├── tests/                       # Comprehensive test suite
│   ├── conftest.py              # Pytest configuration
│   ├── mock_services.py         # Mock services
│   ├── test_auth.py
│   ├── test_account.py
│   ├── test_upload.py
│   ├── test_database.py
│   └── ...
│
├── requirements.txt             # Python dependencies
├── pyproject.toml               # Project metadata
├── pytest.ini                   # Pytest configuration
└── package.json                 # NPM scripts
```

### API Routes Structure

```
/api/
├── /auth
│   ├── POST /auth/login             # User login
│   ├── ...
│
├── /account
│   ├── GET /                   # List all accounts
│   ├── POST /add               # Add account
│   ├── POST /update            # Update account
│   ├── POST /delete            # Delete account
│   └── GET /get_valid          # Get valid accounts
│
├── /file
│   ├── GET /get_all_files      # List files
│   ├── POST /upload_file       # Upload video/image
│   └── POST /delete_file       # Delete file
│
├── /publish
│   ├── POST /post_video        # Publish video
│   └── GET /get_tasks          # Get tasks list
│
├── /dashboard
│   └── GET /stats              # Dashboard statistics
│
├── /group
│   ├── GET /get_groups         # Get groups
│   ├── POST /create_group      # Create group
│   └── ...
```

### Service Layer Architecture

```python
# Service pattern example
class PublishService:
    """Orchestrates the publishing workflow."""

    def __init__(self, upload_service, task_service, db_session):
        self.upload_service = upload_service
        self.task_service = task_service
        self.db = db_session

    async def publish_video(self, video_id, platforms, publish_time):
        """
        Main publishing orchestration.

        1. Validate input
        2. Get video and accounts
        3. Create publishing task
        4. Schedule uploads
        5. Monitor progress
        """
        # Implementation
```

# Uploader Pattern

The project uses a consistent pattern for all platform uploaders, utilizing shared utilities for browser management.

```python
# Shared Browser Launcher (src/core/browser.py)
async def launch_browser(playwright, headless=True, ...):
    """
    Centralized browser launch configuration.
    Ensures consistent args (no-sandbox, disable-blink-features, etc.)
    """
    pass

# Platform Implementation Example (src/uploader/douyin_uploader/main.py)
class DouYinVideo(object):
    def __init__(self, title, file_path, tags, ...):
        self.title = title
        # ...

    async def upload(self, playwright: Playwright) -> None:
        """
        Upload workflows follow a try...finally pattern for resource safety.
        """
        browser = None
        context = None
        try:
            # unified browser launch
            browser = await launch_browser(playwright, headless=self.headless)

            # Platform specific logic
            context = await browser.new_context(...)
            page = await context.new_page()

            # ... automation steps ...

        finally:
            # Ensure resources are always cleaned up
            if context: await context.close()
            if browser: await browser.close()
```

## Database Schema

### Core Models

```
User
├── id (PK)
├── username (UNIQUE)
├── email (UNIQUE)
├── password_hash
├── created_at
└── updated_at

Account
├── id (PK)
├── user_id (FK → User)
├── platform (douyin|xiaohongshu|ks|tencent)
├── account_name
├── cookie_path
├── status (active|inactive|expired)
├── created_at
└── updated_at

Video
├── id (PK)
├── user_id (FK → User)
├── file_path
├── title
├── description
├── tags (JSON)
├── file_size
├── duration
├── created_at
└── updated_at

Task
├── id (PK)
├── user_id (FK → User)
├── video_id (FK → Video)
├── account_id (FK → Account)
├── platform
├── status (pending|running|success|failed)
├── publish_time
├── error_message
├── created_at
└── updated_at
```

## Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Submit credentials
       ▼
┌────────────────────┐
│   Login Endpoint   │
└──────┬─────────────┘
       │
       │ 2. Verify credentials
       ▼
┌────────────────────┐
│  Generate JWT      │
└──────┬─────────────┘
       │
       │ 3. Return token
       ▼
┌──────────────────────┐
│ Store in localStorage│
└──────┬───────────────┘
       │
       │ 4. Include in headers
       ▼
┌──────────────────────┐
│  API Requests        │
└──────┬───────────────┘
       │
       │ 5. Verify token
       ▼
┌──────────────────────┐
│  Middleware Check    │
└──────┬───────────────┘
       │
       ├─ Valid → Continue
       └─ Invalid → 401 Unauthorized
```

## Video Publishing Workflow

```
┌─────────────────────┐
│ User Uploads Video  │
└──────┬──────────────┘
       │
       │ 1. File validation
       ▼
┌──────────────────────────┐
│ Store in videoFile/      │
│ Save metadata to DB      │
└──────┬───────────────────┘
       │
       │ 2. Select platforms & time
       ▼
┌──────────────────────────┐
│ Create Publishing Tasks  │
└──────┬───────────────────┘
       │
       │ 3. Schedule or immediate
       ▼
┌──────────────────────────┐
│ Task Scheduler           │
└──────┬───────────────────┘
       │
       ├─ Scheduled → Wait for time
       └─ Immediate → Execute now
       │
       ▼
┌──────────────────────────────────┐
│ For Each Platform:               │
│  1. Get account & cookie         │
│  2. Launch browser               │
│  3. Login using cookie           │
│  4. Upload video & metadata      │
│  5. Publish                      │
│  6. Close browser                │
└──────┬───────────────────────────┘
       │
       │ 4. Update task status
       ▼
┌──────────────────────────┐
│ Update DB with results   │
│ Send notifications       │
└──────────────────────────┘
```

## Async/Concurrency Model

The backend uses Python's `asyncio` for concurrent operations:

```python
# Multiple uploads in parallel
async def publish_to_multiple_platforms(video_id, accounts):
    tasks = [
        upload_to_platform(video_id, account)
        for account in accounts
    ]
    results = await asyncio.gather(*tasks)
    return results
```

Benefits:
- Non-blocking I/O operations
- Multiple platform uploads in parallel
- Better resource utilization
- Improved response times

## Error Handling

### Frontend Error Handling

```javascript
try {
  await uploadVideo(file)
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
  } else if (error.response?.status === 413) {
    // File too large
  } else {
    // Generic error handling
  }
}
```

### Backend Error Handling

```python
@app.errorhandler(404)
def not_found(e):
    return {'error': 'Not found'}, 404

@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal error: {str(e)}")
    return {'error': 'Internal server error'}, 500

# Service layer
try:
    await uploader.upload(video_path, metadata)
except FileNotFoundError as e:
    logger.error(f"File not found: {str(e)}")
    raise ValueError(f"Video file not found: {video_path}")
except TimeoutError as e:
    logger.error(f"Upload timeout: {str(e)}")
    raise Exception("Upload took too long, please try again")
```

## Security Considerations

### Cookie Management

- Cookies stored encrypted in `apps/backend/src/cookies/`
- Separate directories per platform
- Encrypted before storage using `utils/encrypt.py`
- Decrypted on-demand for platform login

### Authentication

- JWT tokens for API authentication
- Password hashing using industry standards
- CORS configuration for frontend requests
- Input validation on all endpoints

### File Handling

- Validate file types and sizes
- Store uploads in isolated `videoFile/` directory
- Clean up after successful publish
- Scan for malware (optional)

## Deployment Architecture

```
Development:
├── Frontend: localhost:5173 (Vite dev server)
└── Backend: localhost:5409 (Flask dev server)

Production:
├── Frontend: Deployed to static hosting
│   ├── Built with npm run build
│   ├── Served as static files
│   └── CDN for assets
│
└── Backend: Deployed to server
    ├── Gunicorn WSGI server
    ├── Nginx reverse proxy
    └── SQLite database
```

## Performance Optimizations

### Frontend

- **Code Splitting**: Route-based splitting with Vue Router
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Asset compression
- **Caching**: Service workers for offline capability

### Backend

- **Connection Pooling**: Database connection reuse
- **Async Operations**: Non-blocking I/O
- **Task Queuing**: Scheduled tasks using APScheduler
- **Caching**: Response caching for frequent queries

## Testing Strategy

### Test Pyramid

```
      ▲
     / \
    /   \ E2E Tests (10%)
   /     \
  /───────\ Integration Tests (30%)
 /         \
/───────────\ Unit Tests (60%)
```

### Backend Testing

- Unit tests for individual services
- Mock external dependencies (Playwright, APIs)
- Integration tests for database operations
- E2E tests for complete workflows

### Frontend Testing

- Unit tests for components and composables
- Store tests with mock data
- API layer tests with mock responses
- E2E tests for user workflows (optional)

## Monitoring & Logging

### Logging Levels

```python
import logging

logger = logging.getLogger(__name__)

logger.debug("Detailed diagnostic information")
logger.info("General informational message")
logger.warning("Warning message")
logger.error("Error message")
logger.critical("Critical system failure")
```

### Log Storage

- Backend logs: `apps/backend/src/logs/`
- Organized by date and level
- Rotation policy for log management

## Future Enhancements

- [ ] Message queue for task distribution
- [ ] Real-time WebSocket notifications
- [ ] Scheduled job management UI
- [ ] Multi-user account sharing
- [ ] Video analytics integration
- [ ] Bulk scheduling interface
- [ ] API rate limiting
- [ ] Advanced retry mechanisms

---

For more information, see:
- [README_EN.md](README_EN.md) - Project overview
- [CONTRIBUTING_EN.md](CONTRIBUTING_EN.md) - Development guidelines
