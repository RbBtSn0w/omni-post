# OmniPost Architecture

## Overview

OmniPost is built using a **Monorepo architecture** with a Vue 3 frontend and a
primary Node.js/TypeScript backend. The legacy Python backend remains in the
repository for compatibility and migration reference only. This document explains
the current system design, component interactions, and technical decisions.

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
│          Backend (Express + TypeScript, Primary)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Routes: /account, /publish, /articles, /browser       │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Services: TaskService, PublishService, LoginService   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Uploaders: Douyin, Xiaohongshu, Kuaishou, Weixin     │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Database: SQLite tables (tasks, articles, user_info)  │ │
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

The maintained backend lives in `apps/backend-node` and follows a strict
`Routes -> Services -> Uploaders` pattern. `apps/backend` is deprecated and
should only be consulted for compatibility work.

### Directory Structure

```
apps/backend-node/
├── src/
│   ├── app.ts                   # Express application factory
│   ├── core/                    # Core configuration
│   │   ├── config.ts
│   │   ├── constants.ts
│   │   └── logger.ts
│   │
│   ├── routes/                  # API endpoint definitions
│   │   ├── account.ts
│   │   ├── publish.ts
│   │   ├── article.ts
│   │   ├── browser.ts
│   │   └── file.ts
│   │
│   ├── services/                # Business logic layer
│   │   ├── task-service.ts
│   │   ├── publish-service.ts
│   │   ├── publish-executor.ts
│   │   ├── login-service.ts
│   │   ├── cookie-service.ts
│   │   └── article_service.ts
│   │
│   ├── uploader/                # Platform-specific uploaders
│   │   ├── douyin/
│   │   │   └── main.ts
│   │   ├── xiaohongshu/
│   │   │   └── main.ts
│   │   ├── kuaishou/
│   │   │   └── main.ts
│   │   ├── weixin/
│   │   │   └── main.ts
│   │   ├── bilibili/
│   │   │   └── main.ts
│   │   ├── zhihu/
│   │   │   └── main.ts
│   │   └── juejin/
│   │       └── main.ts
│   │
│   ├── db/                      # Database layer
│   │   ├── migrations.ts
│   │   └── index.ts
│   │
│   ├── utils/                   # Utility functions
│   │   ├── response.ts
│   │   └── path.ts
│   │
│   └── types/
│
├── tests/                       # Vitest test suite
│   ├── test_routes_publish.test.ts
│   ├── test_publish_executor.test.ts
│   ├── test_article_routes.test.ts
│   └── ...
└── package.json
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

```typescript
// Service pattern example (Node.js)
export class PublishService {
    /**
     * Orchestrates the publishing workflow.
     */
    constructor(
        private readonly taskService: TaskService,
        private readonly browserService: BrowserService
    ) {}

    async publishVideo(opts: UploadOptions): Promise<void> {
        /**
         * Main publishing orchestration.
         * 1. Validate input
         * 2. Create publishing tasks in DB
         * 3. Dispatch to specific platform uploaders
         * 4. Monitor and update progress
         */
        // Implementation
    }
}
```

# Uploader Pattern

The project uses a consistent pattern for all platform uploaders, utilizing shared utilities for browser management.

```typescript
// Shared Browser Launcher (src/core/browser.ts)
export async function launchBrowser(options: LaunchOptions) {
    /**
     * Centralized browser launch configuration.
     * Ensures consistent args (no-sandbox, disable-blink-features, etc.)
     */
}

// Platform Implementation Example (src/uploader/douyin/main.ts)
export class DouyinUploader extends BaseUploader {
    protected platformName = 'Douyin';

    async upload(context: BrowserContext, opts: UploadOptions): Promise<void> {
        /**
         * Upload workflows follow a try...finally pattern for resource safety.
         */
        const page = await context.newPage();
        try {
            // 1. Navigate to creator studio
            // 2. Perform login check
            // 3. Upload file & metadata
            // 4. Submit for publishing
        } finally {
            await page.close();
        }
    }
}
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

The backend uses Node.js's asynchronous runtime and Promises for concurrent operations:

```typescript
// Multiple uploads in parallel using Promise.all
async function publishToMultiplePlatforms(opts: UploadOptions) {
    const tasks = opts.platforms.map(platform =>
        uploadToPlatform(platform, opts)
    );
    const results = await Promise.all(tasks);
    return results;
}
```

Benefits:
- Non-blocking I/O operations (highly efficient for Playwright)
- Built-in support for asynchronous task execution
- Simplified orchestration of background jobs

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

### Backend Error Handling (Express)

```typescript
// Standard response utility
export const sendError = (res: Response, msg: string, code = 500) => {
    return res.status(code).json({
        code,
        msg,
        data: null
    });
};

// Service layer error management
try {
    await uploader.upload(context, opts);
} catch (err: any) {
    logger.error(`[${platform}] Upload failed: ${err.message}`);
    throw new Error(`Platform upload failure: ${err.message}`);
}
```

## Security Considerations

### Cookie Management

- Cookies stored in `apps/backend-node/data/cookies/`
- Organized in subdirectories by platform
- Managed via `cookie-service.ts` for lifecycle and validation
- Integrated with `browser-profile` for session persistence

### Authentication

- JWT-based authentication for all API endpoints
- Secured password hashing (using bcrypt or similar)
- CORS enabled for frontend-backend communication
- Request validation using unified middleware

### File Handling

- Uploads stored in `apps/backend-node/data/videoFile/`
- Validated by file-record service
- Automated cleanup of temporary artifacts

## Deployment Architecture

```
Development:
├── Frontend: localhost:5173 (Vite dev server)
└── Backend: localhost:5409 (Express/Node.js)

Production:
├── Frontend: Deployed to static hosting
│   ├── Built with npm run build
│   └── Served via Nginx/CDN
│
└── Backend: Node.js Service
    ├── Process managed by PM2/Systemd
    ├── Nginx reverse proxy
    └── SQLite database
```

## Performance Optimizations

### Frontend

- **Code Splitting**: Route-based splitting with Vue Router
- **Lazy Loading**: Components loaded on demand
- **State Management**: Optimized Pinia store access

### Backend

- **Playwright Context Reuse**: Efficient session handling
- **Non-blocking I/O**: High throughput for concurrent uploads
- **Task Queuing**: Managed background execution pipeline

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

- Unit tests for services (Vitest)
- Integration tests for API routes
- Platform automation diagnostics workflow

### Frontend Testing

- Unit tests for components and stores (Vitest)
- Composable behavior verification

## Monitoring & Logging

### Logging Levels

```typescript
import { logger } from './core/logger.js';

logger.debug("Detailed diagnostic information");
logger.info("General informational message");
logger.warn("Warning message");
logger.error("Error message");
```

### Log Storage

- Backend logs: `apps/backend-node/data/logs/`
- Organized by date and severity
- Streamed to console during development

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
