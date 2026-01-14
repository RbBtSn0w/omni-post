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
│   │   ├── Login.vue
│   │   ├── Dashboard.vue
│   │   ├── AccountManagement.vue
│   │   ├── VideoPublishing.vue
│   │   └── TaskMonitor.vue
│   │
│   ├── components/               # Reusable UI components
│   │   ├── VideoUploader.vue
│   │   ├── AccountSelector.vue
│   │   ├── PublishForm.vue
│   │   ├── TaskList.vue
│   │   └── ...
│   │
│   ├── stores/                   # Pinia state management
│   │   ├── auth.js              # Authentication state
│   │   ├── videos.js            # Video management
│   │   ├── accounts.js          # Account management
│   │   ├── tasks.js             # Publishing tasks
│   │   └── ui.js                # UI state
│   │
│   ├── api/                     # API service layer
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── accounts.js          # Account endpoints
│   │   ├── videos.js            # Video endpoints
│   │   ├── publish.js           # Publishing endpoints
│   │   └── common.js            # Shared axios instance
│   │
│   ├── router/                  # Vue Router configuration
│   │   └── index.js
│   │
│   ├── composables/             # Composition API utilities
│   │   ├── useAuth.js           # Authentication logic
│   │   ├── useForm.js           # Form handling
│   │   └── useTask.js           # Task management
│   │
│   ├── utils/                   # Utility functions
│   │   ├── format.js
│   │   ├── validate.js
│   │   └── date.js
│   │
│   ├── styles/                  # Global styles
│   │   └── variables.css
│   │
│   ├── assets/                  # Static assets
│   │   ├── images/
│   │   └── icons/
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
│   ├── cli_main.py              # CLI entry point
│   ├── conf.py                  # Configuration
│   │
│   ├── routes/                  # API endpoint definitions
│   │   ├── __init__.py
│   │   ├── auth_routes.py       # /api/auth/*
│   │   ├── account_routes.py    # /api/accounts/*
│   │   ├── video_routes.py      # /api/videos/*
│   │   ├── publish_routes.py    # /api/publish/*
│   │   ├── task_routes.py       # /api/tasks/*
│   │   └── health_routes.py     # /api/health
│   │
│   ├── services/                # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py      # Authentication logic
│   │   ├── account_service.py   # Account management
│   │   ├── upload_service.py    # Upload orchestration
│   │   ├── publish_service.py   # Publishing logic
│   │   ├── task_service.py      # Task scheduling
│   │   └── cookie_service.py    # Cookie management
│   │
│   ├── uploader/                # Platform-specific uploaders
│   │   ├── __init__.py
│   │   ├── base_uploader.py     # Abstract base class
│   │   ├── douyin_uploader/
│   │   │   ├── __init__.py
│   │   │   ├── uploader.py
│   │   │   ├── login.py
│   │   │   └── utils.py
│   │   ├── xiaohongshu_uploader/
│   │   ├── ks_uploader/
│   │   └── tencent_uploader/
│   │
│   ├── utils/                   # Utility functions
│   │   ├── __init__.py
│   │   ├── file_handler.py      # File operations
│   │   ├── cookie_handler.py    # Cookie management
│   │   ├── encrypt.py           # Encryption utilities
│   │   ├── logger.py            # Logging setup
│   │   ├── network.py           # Network utilities
│   │   └── validators.py        # Input validation
│   │
│   ├── db/                      # Database layer
│   │   ├── __init__.py
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── database.py          # Database connection
│   │   ├── createTable.py       # Database initialization
│   │   ├── user.py              # User model
│   │   ├── account.py           # Account model
│   │   ├── video.py             # Video model
│   │   └── task.py              # Task model
│   │
│   ├── cookies/                 # Cookie storage by platform
│   │   ├── douyin_uploader/
│   │   ├── xiaohongshu_uploader/
│   │   ├── ks_uploader/
│   │   └── tencent_uploader/
│   │
│   ├── videoFile/               # Temporary video storage
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
│   ├── POST /register          # User registration
│   ├── POST /login             # User login
│   ├── POST /logout            # User logout
│   └── GET /me                 # Current user info
│
├── /accounts
│   ├── GET /                   # List all accounts
│   ├── POST /                  # Create account
│   ├── GET /<id>               # Get account details
│   ├── PUT /<id>               # Update account
│   ├── DELETE /<id>            # Delete account
│   └── POST /<id>/login        # Login to platform
│
├── /videos
│   ├── GET /                   # List videos
│   ├── POST /                  # Upload video
│   ├── GET /<id>               # Get video details
│   ├── PUT /<id>               # Update video info
│   └── DELETE /<id>            # Delete video
│
├── /publish
│   ├── POST /                  # Publish to platforms
│   ├── GET /status/<task_id>   # Get publish status
│   └── POST /<task_id>/cancel  # Cancel publishing
│
├── /tasks
│   ├── GET /                   # List publishing tasks
│   ├── GET /<id>               # Get task details
│   └── GET /<id>/logs          # Get task logs
│
└── /health
    └── GET /                   # Health check
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

### Uploader Pattern

```python
# Base uploader interface
class BaseUploader(ABC):
    @abstractmethod
    async def login(self, account_cookie):
        """Login to platform using cookie."""
        pass

    @abstractmethod
    async def upload(self, video_path, metadata):
        """Upload video with metadata."""
        pass

    @abstractmethod
    async def publish(self, video_id, publish_time):
        """Schedule or immediately publish."""
        pass

# Platform-specific implementation
class DouyinUploader(BaseUploader):
    async def login(self, account_cookie):
        async with async_playwright() as playwright:
            # Browser automation logic
            pass

    async def upload(self, video_path, metadata):
        # Douyin-specific upload logic
        pass
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
