# OmniPost — Interaction Workflow Diagrams

Detailed ASCII diagrams for every major user-facing interaction process. Each
diagram follows the actual implementation: routes → services → uploaders →
Playwright automation.

---

## Table of Contents

1. [Platform Login (QR-Code / SSE)](#1-platform-login-qr-code--sse)
2. [Video Publishing End-to-End](#2-video-publishing-end-to-end)
3. [Article Publishing End-to-End](#3-article-publishing-end-to-end)
4. [Task Lifecycle & Status Polling](#4-task-lifecycle--status-polling)
5. [Account Management & Cookie Validation](#5-account-management--cookie-validation)
6. [Browser Profile Session Management](#6-browser-profile-session-management)

---

## 1. Platform Login (QR-Code / SSE)

The login flow uses **Server-Sent Events (SSE)** so the browser can display the
QR code image in real time and receive the final pass/fail status without
polling.

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────────────┐
│  Frontend   │       │  Express Route   │       │  Login Impl          │
│  (Vue 3)    │       │  GET /login      │       │  (Playwright)        │
└──────┬──────┘       └────────┬─────────┘       └──────────┬───────────┘
       │                       │                            │
       │  GET /login           │                            │
       │  ?type=<platform>     │                            │
       │  &id=<accountId>      │                            │
       │──────────────────────>│                            │
       │                       │                            │
       │  HTTP 200             │                            │
       │  Content-Type:        │                            │
       │  text/event-stream    │                            │
       │<──────────────────────│                            │
       │                       │                            │
       │                       │  Create EventEmitter       │
       │                       │  Create AbortController    │
       │                       │  activeQueues.set(id, ...)  │
       │                       │                            │
       │                       │  runAsyncFunction(         │
       │                       │    loginImpl, emitter,     │
       │                       │    signal)                 │
       │                       │──────────────────────────>│
       │                       │                            │
       │                       │                            │  launchBrowser()
       │                       │                            │  ──────────────►
       │                       │                            │  Navigate to
       │                       │                            │  platform URL
       │                       │                            │  ──────────────►
       │                       │                            │
       │                       │                            │  Locate QR-code
       │                       │                            │  <img> element
       │                       │                            │
       │  SSE event:           │  emitter.emit('message',   │
       │  data: <qr_img_url>   │  qrCodeUrl)                │
       │<──────────────────────│<──────────────────────────│
       │                       │                            │
       │  Display QR code      │                            │  Wait for URL
       │  image to user        │                            │  change (login
       │                       │                            │  success signal)
       │                       │                            │
       │  User scans QR code   │                            │
       │  with phone app       │                            │
       │                       │                            │
       │                       │                            │  URL changed ──►
       │                       │                            │  Save cookies
       │                       │                            │  to file
       │                       │                            │  saveUserInfo()
       │                       │                            │  ──────────────►
       │                       │                            │  DB upsert
       │                       │                            │  user_info row
       │                       │                            │
       │  SSE event:           │  emitter.emit('message',   │
       │  data: 200            │  '200')                    │
       │<──────────────────────│<──────────────────────────│
       │                       │                            │
       │  SSE stream closed    │  emitter.emit('end')       │
       │<──────────────────────│                            │
       │                       │                            │  browser.close()
       │                       │                            │  ──────────────►
       │                       │  activeQueues.delete(id)   │
       │                       │                            │

Cancellation path (user closes dialog / navigates away):
       │                       │                            │
       │  POST /cancelCookie   │                            │
       │  {id: <accountId>}    │                            │
       │──────────────────────>│                            │
       │                       │  abortController.abort()   │
       │                       │──────────────────────────>│
       │                       │                            │  signal 'abort'
       │                       │                            │  browser.close()
       │  HTTP 200             │                            │
       │<──────────────────────│                            │

SSE message codes:
  <url>  →  QR-code image URL for display
  200    →  Login succeeded; cookie saved
  500    →  Login failed / timeout
```

---

## 2. Video Publishing End-to-End

```
┌─────────┐  ┌───────────┐  ┌──────────────┐  ┌─────────────────┐  ┌──────────┐
│Frontend │  │File Route │  │Publish Route │  │ PublishExecutor │  │Uploader  │
│(Vue 3)  │  │POST /     │  │POST /post-   │  │ (background)    │  │(Playwright│
│         │  │uploadSave │  │Video[Batch]  │  │                 │  │automation)│
└────┬────┘  └─────┬─────┘  └──────┬───────┘  └────────┬────────┘  └────┬─────┘
     │              │               │                   │                │
     │ 1. Upload    │               │                   │                │
     │ video file   │               │                   │                │
     │─────────────>│               │                   │                │
     │              │ Validate      │                   │                │
     │              │ file type/    │                   │                │
     │              │ size          │                   │                │
     │              │ Save to       │                   │                │
     │              │ videoFile/    │                   │                │
     │              │ Insert        │                   │                │
     │              │ file_records  │                   │                │
     │ {fileId,     │               │                   │                │
     │  filePath}   │               │                   │                │
     │<─────────────│               │                   │                │
     │              │               │                   │                │
     │ 2. Submit    │               │                   │                │
     │ publish job  │               │                   │                │
     │ {platforms,  │               │                   │                │
     │  accounts,   │               │                   │                │
     │  fileList,   │               │                   │                │
     │  schedule,   │               │                   │                │
     │  metadata}   │               │                   │                │
     │─────────────────────────────>│                   │                │
     │              │               │                   │                │
     │              │               │ taskService       │                │
     │              │               │ .createTask()     │                │
     │              │               │ INSERT tasks row  │                │
     │              │               │ status='waiting'  │                │
     │              │               │                   │                │
     │              │               │ startPublish      │                │
     │              │               │ Thread(taskId,    │                │
     │              │               │  publishData)     │                │
     │              │               │──────────────────>│                │
     │              │               │                   │                │
     │ {taskId,     │               │                   │                │
     │  code:200}   │               │                   │                │
     │<─────────────────────────────│                   │                │
     │              │               │                   │                │
     │              │               │            ╔══════╧═══════╗       │
     │              │               │            ║ BACKGROUND   ║       │
     │              │               │            ╚══════╤═══════╝       │
     │              │               │                   │                │
     │              │               │            acquireSlot(taskId)     │
     │              │               │            (max 5 concurrent)      │
     │              │               │                   │                │
     │              │               │            lockManager             │
     │              │               │            .lock(accountKey)       │
     │              │               │                   │                │
     │              │               │            UPDATE tasks            │
     │              │               │            status='running'        │
     │              │               │                   │                │
     │              │               │            Validate file           │
     │              │               │            paths exist             │
     │              │               │                   │                │
     │              │               │            For each platform:      │
     │              │               │                   │                │
     │              │               │            enrichOpts()            │
     │              │               │            (add scheduledTimes)    │
     │              │               │                   │                │
     │              │               │            ┌──────▼──────────┐    │
     │              │               │            │Strategy select: │    │
     │              │               │            │  browser_profile│    │
     │              │               │            │  OR cookie file │    │
     │              │               │            └──────┬──────────┘    │
     │              │               │                   │                │
     │              │               │            Browser profile path:  │
     │              │               │            launchPersistent        │
     │              │               │            Context(profileDir)     │
     │              │               │                   │                │
     │              │               │            Cookie path:            │
     │              │               │            launchBrowser()         │
     │              │               │            + storageState          │
     │              │               │                   │─────────────>│
     │              │               │                   │                │
     │              │               │                   │         postVideo(
     │              │               │                   │         context,opts)
     │              │               │                   │         Navigate to
     │              │               │                   │         creator URL
     │              │               │                   │         Upload file
     │              │               │                   │         Fill form
     │              │               │                   │         Click Publish
     │              │               │                   │                │
     │              │               │                   │         ┌──────┴───────┐
     │              │               │                   │         │ success/fail │
     │              │               │                   │         └──────┬───────┘
     │              │               │                   │<───────────────│
     │              │               │            UPDATE tasks            │
     │              │               │            status='success'        │
     │              │               │            OR 'failed'             │
     │              │               │            progress=100            │
     │              │               │                   │                │
     │              │               │            lockManager             │
     │              │               │            .unlock(accountKey)     │
     │              │               │            releaseSlot(taskId)     │
     │              │               │                   │                │
     │ 3. Poll task │               │                   │                │
     │ GET /tasks   │               │                   │                │
     │─────────────────────────────>│                   │                │
     │ [{id,status, │               │                   │                │
     │   progress}] │               │                   │                │
     │<─────────────────────────────│                   │                │
```

### Schedule Timing Calculation

```
enableTimer = false               enableTimer = true
      │                                 │
      ▼                                 ▼
publishDatetimes = [0, 0, 0, …]   generateScheduleTimeNextDay(
(publish immediately)               fileCount,
                                    videosPerDay,
                                    dailyTimes[],
                                    startDays
                                  )
                                  Returns array of Date objects
                                  spread across future days
```

---

## 3. Article Publishing End-to-End

```
┌──────────┐   ┌─────────────────┐   ┌──────────────────┐   ┌────────────────┐
│Frontend  │   │ Article Route   │   │ ArticleService   │   │Article Uploader│
│(Vue 3)   │   │ /articles       │   │                  │   │(Playwright)    │
└────┬─────┘   └────────┬────────┘   └────────┬─────────┘   └───────┬────────┘
     │                  │                     │                     │
     │ 1. Create article│                     │                     │
     │ POST /articles   │                     │                     │
     │ {title,content,  │                     │                     │
     │  platform,tags}  │                     │                     │
     │─────────────────>│                     │                     │
     │                  │  createArticle()    │                     │
     │                  │────────────────────>│                     │
     │                  │                     │  INSERT articles    │
     │                  │                     │  (id, title,        │
     │                  │                     │   content, tags,    │
     │                  │                     │   status='draft')   │
     │  {id: article_…} │                     │                     │
     │<─────────────────│                     │                     │
     │                  │                     │                     │
     │ 2. Edit / update │                     │                     │
     │ PUT /articles/:id│                     │                     │
     │─────────────────>│  updateArticle()    │                     │
     │                  │────────────────────>│                     │
     │                  │                     │  UPDATE articles    │
     │  {code:200}      │                     │                     │
     │<─────────────────│                     │                     │
     │                  │                     │                     │
     │ 3. Publish       │                     │                     │
     │ POST /publish/   │                     │                     │
     │ article          │                     │                     │
     │ {article_id,     │                     │                     │
     │  account_id|     │                     │                     │
     │  browser_profile │                     │                     │
     │  _id, platform,  │                     │                     │
     │  schedule_time}  │                     │                     │
     │─────────────────>│  publishArticle()   │                     │
     │                  │────────────────────>│                     │
     │                  │                     │  resolveAccount     │
     │                  │                     │  FilePath()         │
     │                  │                     │  (verify platform   │
     │                  │                     │   type match)       │
     │                  │                     │                     │
     │                  │                     │  taskService        │
     │                  │                     │  .createTask()      │
     │                  │                     │  status='waiting'   │
     │                  │                     │                     │
     │                  │                     │  startPublish       │
     │                  │                     │  Thread(taskId,     │
     │                  │                     │  {content_type:     │
     │                  │                     │   'article', …})    │
     │  {taskId}        │                     │                     │
     │<─────────────────│                     │                     │
     │                  │                     │                     │
     │                  │            ╔════════╧════════╗            │
     │                  │            ║   BACKGROUND    ║            │
     │                  │            ╚════════╤════════╝            │
     │                  │                     │                     │
     │                  │            PublishExecutor                │
     │                  │            detects content_type           │
     │                  │            = 'article'                    │
     │                  │                     │                     │
     │                  │            For platform 6 (Zhihu)         │
     │                  │            → postArticleZhihu()           │
     │                  │                     │────────────────────>│
     │                  │                     │                     │
     │                  │            For platform 7 (Juejin)        │
     │                  │            → postArticleJuejin()          │
     │                  │                     │────────────────────>│
     │                  │                     │                     │
     │                  │                     │              Navigate editor
     │                  │                     │              Fill title/body
     │                  │                     │              Add tags
     │                  │                     │              Click Publish
     │                  │                     │<────────────────────│
     │                  │                     │  UPDATE articles    │
     │                  │                     │  status='published' │
     │                  │                     │  UPDATE tasks       │
     │                  │                     │  status='success'   │
     │                  │                     │                     │
     │ 4. Poll task     │                     │                     │
     │ GET /tasks       │                     │                     │
     │─────────────────>│                     │                     │
     │ [{status,        │                     │                     │
     │   progress}]     │                     │                     │
     │<─────────────────│                     │                     │
```

---

## 4. Task Lifecycle & Status Polling

```
                     Task State Machine
                     ──────────────────

   ┌──────────────────────────────────────────────────────────────┐
   │                                                              │
   │  POST /postVideo                                             │
   │  POST /postVideoBatch          INSERT tasks                  │
   │  POST /publish/article  ──────►  status = 'waiting'         │
   │                                  progress = 0               │
   │                                  priority = 1               │
   └──────────────────┬───────────────────────────────────────────┘
                      │
                      │  startPublishThread(taskId, publishData)
                      │  (non-blocking, returns immediately)
                      ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  CONCURRENCY GATE                                            │
   │                                                              │
   │  activeTasks < MAX_CONCURRENT_TASKS (5)?                     │
   │        │                                                     │
   │   YES  │  NO                                                 │
   │        │   └─► Queue task (FIFO)                            │
   │        │       Wait for releaseSlot() signal                │
   │        ▼                                                     │
   │  activeTasks++                                               │
   └──────────────────┬───────────────────────────────────────────┘
                      │
                      │  Lock resources
                      │  lockManager.lock(accountKey | profileKey)
                      │
                      ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  UPDATE tasks status = 'running'                             │
   └──────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Validate file paths │
           │  (fs.existsSync)     │
           └──────────┬───────────┘
                      │
            exists?   │   missing?
              ┌───────┤   ┌──────────────────────────┐
              │       │   │ UPDATE tasks              │
              │       └──►│ status = 'failed'         │
              │           │ error_msg = 'file missing'│
              │           └──────────────────────────┘
              ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  Dispatch to platform uploader                               │
   │  (Playwright browser automation)                             │
   └──────────────────┬───────────────────────────────────────────┘
                      │
             success? │  exception?
              ┌───────┤   ┌──────────────────────────┐
              │       │   │ UPDATE tasks              │
              │       └──►│ status = 'failed'         │
              │           │ error_msg = err.message   │
              │           └──────────────────────────┘
              ▼
   ┌──────────────────────────────────────────────────────────────┐
   │  UPDATE tasks                                                │
   │  status = 'success'                                          │
   │  progress = 100                                              │
   └──────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
   lockManager.unlock(keys)
   activeTasks──
   releaseSlot() → wake next queued task (if any)


Frontend status polling loop:
─────────────────────────────

  ┌─────────────────────────────────────────────────────────┐
  │  setInterval(pollFn, POLL_INTERVAL_MS)                  │
  │                                                         │
  │  GET /tasks                                             │
  │       ▼                                                 │
  │  Filter tasks where status ∈ {waiting, running}         │
  │       │                                                 │
  │  none │  some                                           │
  │       │   └──► Update Pinia store                      │
  │       │        Re-render task table / progress bars     │
  │       │                                                 │
  │  clearInterval (all done)                               │
  └─────────────────────────────────────────────────────────┘
```

---

## 5. Account Management & Cookie Validation

```
┌──────────┐   ┌────────────────────┐   ┌──────────────────────┐
│Frontend  │   │  Account Route     │   │  CookieService       │
│(Vue 3)   │   │                    │   │  (Playwright)        │
└────┬─────┘   └─────────┬──────────┘   └────────────┬─────────┘
     │                   │                           │
     │ ── Add / Login ───────────────────────────────────────── │
     │                   │                           │
     │  Login via SSE    │                           │
     │  (see Flow 1)     │                           │
     │                   │                           │
     │  After success:   │                           │
     │  user_info row    │                           │
     │  upserted with    │                           │
     │  status=1         │                           │
     │  (active)         │                           │
     │                   │                           │
     │ ── List Accounts ──────────────────────────────────────── │
     │                   │                           │
     │  GET /getAccounts │                           │
     │──────────────────>│                           │
     │                   │  SELECT * FROM user_info  │
     │                   │  ORDER BY id DESC         │
     │  [{id,type,       │                           │
     │    userName,      │                           │
     │    status,        │                           │
     │    group_id}]     │                           │
     │<──────────────────│                           │
     │                   │                           │
     │ ── Validate Accounts ──────────────────────────────────── │
     │                   │                           │
     │  GET /getValid    │                           │
     │  Accounts         │                           │
     │  [?id=X]          │                           │
     │  [?force=true]    │                           │
     │──────────────────>│                           │
     │                   │  For each account:        │
     │                   │                           │
     │                   │  ┌────────────────────────┴──────┐
     │                   │  │ cooldown check                │
     │                   │  │ (now - last_validated_at)     │
     │                   │  │        > 3 hours?             │
     │                   │  │   OR force=true?              │
     │                   │  └─────────┬──────────┬──────────┘
     │                   │      YES   │   NO     │
     │                   │            │          │
     │                   │            │          └──► return cached status
     │                   │            ▼
     │                   │  checkCookie(type, filePath)
     │                   │────────────────────────────────────>│
     │                   │                           │
     │                   │                           │  launchBrowser()
     │                   │                           │  Load storageState
     │                   │                           │  Navigate to
     │                   │                           │  platform URL
     │                   │                           │
     │                   │                           │  ┌──────────────┐
     │                   │                           │  │ Check login  │
     │                   │                           │  │ indicator    │
     │                   │                           │  │ present?     │
     │                   │                           │  └──────┬───────┘
     │                   │                           │  valid? │ invalid?
     │                   │                           │  true   │ false
     │                   │<─────────────────────────────────────┘
     │                   │                           │
     │                   │  UPDATE user_info         │
     │                   │  SET status = 0|1         │
     │                   │  SET last_validated_at    │
     │                   │  = NOW()                  │
     │                   │                           │
     │  [{…,status}]     │                           │
     │<──────────────────│                           │
     │                   │                           │
     │ ── Delete Account ─────────────────────────────────────── │
     │                   │                           │
     │  DELETE           │                           │
     │  /deleteAccount   │                           │
     │  {id}             │                           │
     │──────────────────>│                           │
     │                   │  DELETE FROM user_info    │
     │                   │  WHERE id = ?             │
     │                   │                           │
     │                   │  Remove cookie file       │
     │                   │  from disk                │
     │  {code:200}       │                           │
     │<──────────────────│                           │


Account Group Management
────────────────────────

  GET  /getGroups         → SELECT * FROM account_groups
  POST /addGroup          → INSERT account_groups (name, description)
  PUT  /updateGroup/:id   → UPDATE account_groups SET name/description
  DEL  /deleteGroup/:id   → DELETE account_groups WHERE id = ?
                            (accounts in group lose group_id → NULL)

  Group assignment occurs during login:
  GET /login?group=<groupName>
       │
       └─► getOrCreateGroup(groupName)
           Returns existing or creates new group row
           Linked to user_info.group_id on save
```

---

## 6. Browser Profile Session Management

```
┌──────────┐   ┌──────────────────┐   ┌──────────────────────────┐
│Frontend  │   │ Browser Route    │   │ BrowserService / Publish │
│(Vue 3)   │   │ /browser         │   │ Service                  │
└────┬─────┘   └────────┬─────────┘   └──────────────┬───────────┘
     │                  │                            │
     │ ── Create Profile ──────────────────────────────────────── │
     │                  │                            │
     │  POST /browser/  │                            │
     │  profiles        │                            │
     │  {name,          │                            │
     │   browser_type,  │                            │
     │   user_data_dir, │                            │
     │   profile_name,  │                            │
     │   is_default}    │                            │
     │─────────────────>│                            │
     │                  │  browserService            │
     │                  │  .createProfile()          │
     │                  │  INSERT browser_profiles   │
     │                  │  id = 'profile_<uuid8>'    │
     │  {id: profile_…} │                            │
     │<─────────────────│                            │
     │                  │                            │
     │ ── Link Profile to Publish Job ─────────────────────────── │
     │                  │                            │
     │  POST /postVideo │                            │
     │  {…,             │                            │
     │   browser_       │                            │
     │   profile_id:    │                            │
     │   "profile_…"}   │                            │
     │─────────────────>│                            │
     │                  │  (stored in task           │
     │                  │   publish_data JSON)       │
     │                  │                            │
     │ ── Publishing with Browser Profile ─────────────────────── │
     │                  │                            │
     │                  │            Executor reads  │
     │                  │            browser_profile_│
     │                  │            id from task    │
     │                  │                            │
     │                  │            lockManager     │
     │                  │            .lock(          │
     │                  │             'profile:<id>')│
     │                  │            (prevents       │
     │                  │             concurrent use)│
     │                  │                            │
     │                  │            browserService  │
     │                  │            .getProfile(id) │
     │                  │                            │
     │                  │            ┌───────────────┴──────────────┐
     │                  │            │  Profile found?              │
     │                  │            │  YES → launchPersistent      │
     │                  │            │         Context(             │
     │                  │            │          profile.            │
     │                  │            │          user_data_dir)      │
     │                  │            │  NO  → throw error           │
     │                  │            └───────────────┬──────────────┘
     │                  │                            │
     │                  │            setInitScript() │
     │                  │            (anti-bot       │
     │                  │             patches)       │
     │                  │                            │
     │                  │            dispatchUploader│
     │                  │            (browser uses   │
     │                  │             existing local │
     │                  │             session —      │
     │                  │             no QR code     │
     │                  │             needed)        │
     │                  │                            │
     │                  │            browser.close() │
     │                  │            lockManager     │
     │                  │            .unlock(        │
     │                  │             'profile:<id>')│
     │                  │                            │

Session Strategy Comparison:
─────────────────────────────

  ┌──────────────────────┬──────────────────────────────────────────────┐
  │ Strategy             │ Description                                  │
  ├──────────────────────┼──────────────────────────────────────────────┤
  │ Managed Cookie       │ JSON cookie file stored in data/cookies/.    │
  │ (account_list)       │ Loaded via storageState in a fresh context.  │
  │                      │ Validated by CookieService via Playwright.   │
  ├──────────────────────┼──────────────────────────────────────────────┤
  │ Local Browser        │ Chromium user-data-dir on host filesystem.   │
  │ Profile              │ Session persists across runs natively.       │
  │ (browser_profile_id) │ Only one task can use a profile at a time    │
  │                      │ (enforced by lockManager).                   │
  └──────────────────────┴──────────────────────────────────────────────┘
```

---

## Platform Type Reference

| ID | Constant               | Platform               | Supports        |
|----|------------------------|------------------------|-----------------|
| 1  | `XIAOHONGSHU`          | 小红书 (XHS)            | Video           |
| 2  | `WX_CHANNELS`          | 微信视频号               | Video           |
| 3  | `DOUYIN`               | 抖音                    | Video           |
| 4  | `KUAISHOU`             | 快手                    | Video           |
| 5  | `BILIBILI`             | 哔哩哔哩                 | Video           |
| 6  | `ZHIHU`                | 知乎                    | Article         |
| 7  | `JUEJIN`               | 掘金                    | Article         |
| 8  | `WX_OFFICIAL_ACCOUNT`  | 微信公众号               | Article         |

---

For the overall system architecture see [ARCHITECTURE.md](ARCHITECTURE.md).
