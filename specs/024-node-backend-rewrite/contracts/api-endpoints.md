# API Contracts: Node.js TypeScript 后端

**Branch**: `024-node-backend-rewrite` | **Date**: 2026-03-07

> 所有端点必须与 Python 后端完全兼容。前端无需修改。

## Base Configuration

- **Base URL**: `http://localhost:5409/api`
- **Content-Type**: `application/json` (除文件上传外)
- **CORS**: 允许所有来源

## 标准响应格式

```typescript
interface ApiResponse<T = any> {
  code: number;     // 200=成功, 400=参数错误, 404=未找到, 500=服务器错误
  msg?: string;
  message?: string; // group 路由使用 message 而非 msg
  data?: T;
}
```

---

## Dashboard 路由

### GET `/getDashboardStats`

**响应**:
```json
{
  "code": 200,
  "msg": "获取数据成功",
  "data": {
    "accountStats": { "total": 0, "normal": 0, "abnormal": 0 },
    "platformStats": { "kuaishou": 0, "douyin": 0, "channels": 0, "xiaohongshu": 0 },
    "taskStats": { "total": 0, "completed": 0, "inProgress": 0, "failed": 0, "waiting": 0 },
    "contentStats": { "total": 0, "published": 0, "draft": 0 },
    "taskTrend": { "xAxis": ["3-1","3-2",...], "series": [...] },
    "contentStatsData": { "xAxis": [...], "series": [...] },
    "recentTasks": [...]
  }
}
```

---

## Account 路由

### GET `/getAccounts`
快速获取所有账号（不验证 Cookie）。

### GET `/getValidAccounts[?id=<accountId>]`
获取有效账号（含 Cookie 验证）。可选参数 `id` 筛选。

### GET `/getAccountStatus?id=<accountId>`
获取单个账号实时状态。

### GET `/deleteAccount?id=<accountId>`
删除账号。

### POST `/updateUserinfo`
更新账号信息。Body: `{ id, type, filePath?, userName?, group_id? }`

---

## File 路由

### POST `/upload`
上传文件。`multipart/form-data`，字段名 `file`。

### GET `/getFile?filename=<filename>`
获取/下载文件。

### POST `/uploadSave`
上传并保存文件记录到数据库。`multipart/form-data`，字段名 `file`，可选 `filename`。

### GET `/getFiles`
获取所有文件记录。

### GET `/deleteFile?id=<fileId>`
删除文件及记录。

---

## Cookie 路由

### POST `/uploadCookie`
上传 Cookie 文件。`multipart/form-data`，字段名 `file`，表单字段 `id` + `platform`。

### GET `/downloadCookie?filePath=<path>`
下载 Cookie 文件。

---

## Group 路由

### GET `/getGroups`
获取所有账号组（含账号计数）。

### POST `/createGroup`
创建组。Body: `{ name, description? }`

### PUT `/updateGroup/<groupId>`
更新组。Body: `{ name, description? }`

### DELETE `/deleteGroup/<groupId>`
删除组。

### GET `/getGroupAccounts/<groupId>`
获取组内所有账号。

---

## Publish 路由

### GET `/login?type=<platformType>&id=<accountId>[&group=<groupName>]`
SSE 登录流。返回 `text/event-stream`。

### GET `/tasks`
获取所有任务。

### DELETE `/tasks/<taskId>`
删除任务。

### PATCH `/tasks/<taskId>`
更新任务状态。Body: `{ status, progress? }`

### POST `/tasks/<taskId>/start`
启动/重试任务。

### POST `/postVideo`
创建并执行发布任务。Body:
```json
{
  "type": 3,
  "title": "视频标题",
  "tags": "#tag1 #tag2",
  "fileList": ["uuid_filename.mp4"],
  "accountList": ["account/cookie.json"],
  "category": "生活",
  "enableTimer": false,
  "videosPerDay": 1,
  "dailyTimes": [6, 11, 14],
  "startDays": 0,
  "thumbnail": "",
  "productLink": "",
  "productTitle": "",
  "isDraft": false
}
```

### POST `/postVideoBatch`
批量创建发布任务。Body: 上述对象的数组。
