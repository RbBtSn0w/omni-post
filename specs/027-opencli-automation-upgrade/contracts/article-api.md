# API Contract: Article Content Management

## 文章列表
**GET** `/api/article/list`
*   **Response**: `200 OK`
    ```json
    [
      {
        "id": "uuid",
        "title": "My First Article",
        "created_at": "2024-05-22T10:00:00Z"
      }
    ]
    ```

## 上传/创建文章
**POST** `/api/article/create`
*   **Request Body**:
    ```json
    {
      "title": "String",
      "content": "Markdown String",
      "tags": ["tag1", "tag2"],
      "cover_image_path": "String (optional)"
    }
    ```
*   **Response**: `201 Created`

## 发布文章任务
**POST** `/api/article/publish`
*   **Request Body**:
    ```json
    {
      "article_id": "uuid",
      "platform_accounts": [
        { "platform": "ZHIHU", "account_id": "uuid" },
        { "platform": "JUEJIN", "account_id": "uuid" }
      ],
      "browser_profile_id": "uuid (optional)",
      "schedule_time": "DateTime (optional)"
    }
    ```
*   **Response**: `202 Accepted`
