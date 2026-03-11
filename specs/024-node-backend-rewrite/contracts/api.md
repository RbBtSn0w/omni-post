# API 接口契约 (API Contracts)

## 概述
为了确保 Vue 3 前端能够无缝切换，Node.js 后端必须 100% 兼容现有的 Python API。所有的路由响应结构必须遵循以下基础格式：

```typescript
interface ApiResponse<T> {
  code: number; // 200 成功, 其他失败
  msg: string;  // 提示信息
  data?: T;     // 详情数据
}
```

## 路由模块及端点

### 1. 账号管理 (`/api/account` 或同等挂载点)
- `GET /getAccounts` -> 返回所有账号列表（数组套数组的格式，详见 B3 bug 修复内容）
- `GET /getGroups` -> 返回账号组列表
- `GET /getValidAccounts` -> 检查并返回状态有效的账号
- `GET /deleteAccount?id={id}` -> 删除账号并清理关联 Cookie json 文件
- `POST /updateUserinfo` -> 启用/禁用账号等更新操作

### 2. 发布控制 (`/api/publish` 或同等)
- `GET /login?type={1-5}&id={optional_id}&group_id={optional_id}` -> **关键端点**：SSE 事件流，返回二维码及登录进度
- `POST /postVideo` -> 接收表单，创建任务
- `POST /postVideoBatch` -> 批量或多平台发布
- `GET /tasks` -> 获取全部任务列表
- `PATCH /tasks/:taskId` -> 取消或更新任务状态
- `POST /tasks/:taskId/start` -> 重新执行失败的任务
- `DELETE /tasks/:taskId` -> 删除任务

### 3. 数据大盘 (`/api/dashboard` 或同等)
- `GET /getDashboardStats` -> 返回聚合的大盘数据（总览、趋势图、内容矩阵、最近5条任务）

### 4. 文件与素材管理 (`/api/file`)
- `POST /upload_file` -> 标准 `multipart/form-data` 文件上传，存储到 `data/videos/`
- `GET /getFiles` -> 获取素材列表
- `DELETE /deleteFile?fileName=xxx` -> 删除文件

### 5. Cookies管理 (`/api/cookie`)
- `POST /uploadCookies` -> 接收并保存跨平台导入的 cookie JSON 文件

## 技术选型约束
所有的 API 实现必须采用 `express.Router()` 模块化组织，并挂载于与前端 `vite.config.ts` 中代理匹配的前缀（通常是直接挂载或挂载到 `/api` 视现有路由情况而定）。对于登录功能的 SSE 流，务必显式设置以下 Header：
```typescript
res.writeHead(200, {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
});
```
