---
description: OmniPost Project Prompts - Uploaders, Tasks, Auth, Frontend, Backend, Debugging
---

# OmniPost Project-Specific Prompts

Collection of prompts for real-world development scenarios.

## 🚀 Platform Uploaders

### New Platform Support
```
Create a new uploader for Bilibili:
1. Create directory `src/uploader/bilibili_uploader/`
2. Implement `main.py` inheriting base_uploader pattern
3. Implement `async upload(playwright)` method handling login, upload, publish flow
4. Add `post_video_bilibili` method in `PublishService`
5. Add unit and integration tests
Reference: apps/backend/src/uploader/douyin_uploader/main.py
```

### Optimize Existing Uploader
```
Optimize Douyin video upload flow, add product link association:
- File: apps/backend/src/uploader/douyin_uploader/main.py
- Implement `set_product_link` method to handle link input and validation
- Handle product short title truncation (max 10 chars)
- Add error handling: invalid link, product not found
- Test: Ensure product dialog is handled and closed correctly
```

## 📋 Task Management

### Task System Enhancement
```
Add priority queue feature to task system:
1. DB Migration: ALTER TABLE tasks ADD COLUMN priority INTEGER DEFAULT 1
2. Add `priority` parameter to `TaskService.create_task`
3. Frontend TaskList: Add priority filter and sorting
4. Executor: Schedule tasks by priority (P0 > P1 > P2)
5. Add tests covering all priority scenarios
```

### Retry Mechanism
```
Implement automatic task retry mechanism:
- Service: `PublishService` add `retry_with_backoff` logic
- DB: Record `retry_count`, `max_retries`, `last_retry_at`
- Frontend: TaskDetail shows retry status, count, and next retry time
- Config: Support exponential backoff (1min, 5min, 15min, 30min)
- Test: Verify retry limits and status updates
```

## 🔐 Auth & Login

### Cookie Management
```
Fix XiaoHongShu login Cookie expiration issue:
- Check: apps/backend/src/uploader/xiaohongshu_uploader/login.py
- Verify Cookie validity check logic (check keys like `sessionid`)
- Add Cookie refresh mechanism (auto re-login 24h before expiry)
- Test: Use MockLoginService to isolate login flow
- Log: Record Cookie expiry and refresh events
```

### Batch Login
```
Add multi-account batch login feature:
- Frontend: AccountManagement.vue add batch select and login button
- Backend: LoginService support concurrent login (concurrency=3)
- SSE: Real-time push for each account status (waiting/scanned/success/failed)
- Queue: Use Queue to manage login task order
- Error Handling: Single account failure should not affect others
```

## 🎨 Frontend

### Pinia Store
```
Create Video Draft Store:
- File: apps/frontend/src/stores/draft.js
- State: drafts (list), currentDraft (editing)
- Actions: saveDraft, loadDrafts, deleteDraft
- Persistence: Use localStorage
- Feature: Auto-save (debounce 2s), restore pending edits
```

### Components
```
Develop VideoPreview.vue component:
- Props: videoUrl, thumbnail, duration
- Features: Play/Pause, Draggable progress bar, Volume control, Fullscreen
- Style: Follow Element Plus design specs, responsive
- Location: apps/frontend/src/components/VideoPreview.vue
- Optimization: Lazy load video, preload first frame as cover
```

## 🔧 Backend Services

### Service Refactor
```
Refactor PublishService using Dependency Injection:
- Create Abstract Interface: `PublishService` (ABC)
- Implementations: `DefaultPublishService`, `TestPublishService`
- Test: Use `MockPublishService` replacing real uploaders
- Factory: `get_publish_service(config=None)` supporting config injection
- Backward Compat: Keep existing API signature
```

### RESTful API
```
Add Task Management RESTful Endpoints:
- GET /api/tasks?page=1&size=20&status=waiting - List tasks (pagination)
- GET /api/tasks/:id - Task detail
- PUT /api/tasks/:id - Update task (status, priority)
- DELETE /api/tasks/:id - Delete task
- POST /api/tasks/:id/retry - Manual retry
Reference: apps/backend/src/routes/publish.py
```

## 🐛 Debugging

### Uploader Debugging
```
Debug Douyin upload failure:
Steps:
1. Log: `tail -f apps/backend/data/logs/douyin.log`
2. Cookie Verify: `python -c "from debug_utils import debug_cookie; debug_cookie('path/to/cookie.json')"`
3. Playwright Record: Add `record_video_dir="./debug_videos/"` in `upload()`
4. Screenshot: `await page.screenshot(path="step_{i}.png")`
5. Selector Check: `await page.locator('selector').count()`
6. Headless Off: `LOCAL_CHROME_HEADLESS = False`
```

### Performance
```
Optimize Task List page load speed:
Analysis:
- Frontend: Vue DevTools Performance recording
- Backend: SQL query log (>100ms warning)
- Network: API latency

Optimization:
- Frontend: Virtual Scrolling (data > 100)
- Backend: Pagination, indexes (status, created_at)
- Cache: Pinia store with 30m expiry
- Test: Validate with 1000+ records
```

### CORS
```
Frontend API CORS Error Troubleshooting:
Checklist:
1. Backend: `curl http://localhost:5409/api/health`
2. Vite Proxy: Check `vite.config.js` server.proxy
3. Browser Console: Network panel (Request URL, Status)
4. Flask CORS: Confirm Flask-CORS origin config
5. Env Vars: Check `VITE_API_BASE_URL`
```

## 🧪 Testing

### Unit Testing
```
Add full test coverage for TaskService:
Scenarios:
- test_create_task_success
- test_create_task_invalid_params
- test_create_task_db_error
- test_update_task_concurrent
- test_json_serialization
Goal Coverage: 85%+
Reference: tests/test_service_task.py
```

### E2E Testing
```
Write Login Flow E2E Test:
- Use pytest + playwright
- Mock QR code scan (status_queue.put("200"))
- Verify Cookie file generation
- Check DB account status update
- Ensure repeatability (beforeEach cleanup)
- Timeout: 30s
Reference: tests/test_login_core.py
```

## 📦 Database

### Migrations
```
Add Database Migration: Tasks table `scheduled_time` column:
Steps:
1. Create: `src/db/migrations/003_add_scheduled_time.sql`
2. SQL: `ALTER TABLE tasks ADD COLUMN scheduled_time DATETIME;`
3. Test: Verify on dev DB
4. TaskService: Update `create_task` to use new field
5. Rollback: Write DROP COLUMN script
6. Doc: Update schema docs
```

### Analysis
```
Generate Last 24h Failed Tasks Report:
SQL:
SELECT id, title, platforms, status, error_msg, created_at
FROM tasks
WHERE status='failed' AND datetime(created_at) > datetime('now', '-1 day')
ORDER BY created_at DESC;

Report: Stats on failure rate per platform, common error types
```

---

💡 **Usage**:
1. Copy scenario description.
2. Adjust params as needed.
3. Reference file paths for context.

📚 **References**:
- [Add Feature Workflow](../../.agent/workflows/add-feature.md)
- [Debug Workflow](../../.agent/workflows/debug.md)
- [Code Style Guide](../instructions/code-style.instructions.md)
