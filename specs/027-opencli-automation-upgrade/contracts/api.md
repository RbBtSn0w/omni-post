# API Contract: Enhance Automation and Stability using OpenCLI Patterns

## 浏览器配置文件管理 (Browser Profiles)

### 1. 获取所有配置文件
**GET** `/api/browser/profiles`
*   **Response**: `200 OK`
    ```json
    [
      { "id": "uuid", "name": "Work Chrome", "user_data_dir": "/path/to/data", "profile_name": "Default" }
    ]
    ```

### 2. 创建/更新配置文件
**POST** `/api/browser/profiles`
*   **Request Body**:
    ```json
    { "name": "Work Chrome", "user_data_dir": "/path/to/data", "profile_name": "Default", "is_default": true }
    ```
*   **Response**: `201 Created`

## 文章内容管理 (Articles)

### 1. 创建文章
**POST** `/api/article`
*   **Request Body**:
    ```json
    { "title": "My Post", "content": "# Hello\nMarkdown here.", "tags": ["tag1", "tag2"], "cover_image": "/path/to/img" }
    ```
*   **Response**: `201 Created`

## 增强型发布任务 (Tasks)

### 1. 发布文章
**POST** `/api/publish/article`
*   **Request Body**:
    ```json
    { "article_id": "uuid", "account_id": "uuid", "platform": "ZHIHU", "browser_profile_id": "uuid", "schedule_time": "2024-05-23T10:00:00Z" }
    ```
*   **Response**: `202 Accepted`
    ```json
    { "task_id": "uuid", "message": "Article publishing task created" }
    ```

### 2. 发布视频 (带浏览器配置选项)
**POST** `/api/publish/postVideo` (更新现有接口)
*   **Request Body**:
    ```json
    { "file_id": "uuid", "account_id": "uuid", "platform": "DOUYIN", "browser_profile_id": "uuid", ... }
    ```
*   **Response**: `202 Accepted`
