# Data Model: Enhance Automation and Stability using OpenCLI Patterns

## 实体定义

### 1. BrowserProfile (浏览器配置文件)
*   **id**: `UUID` (PK)
*   **name**: `String` (用户可自定义的名称)
*   **user_data_dir**: `String` (Chrome 用户数据目录的绝对路径)
*   **profile_name**: `String` (特定配置文件文件夹名称，如 "Default", "Profile 1")
*   **is_default**: `Boolean` (是否作为默认自动化配置)
*   **created_at**: `DateTime`
*   **updated_at**: `DateTime`

### 2. Article (文章)
*   **id**: `UUID` (PK)
*   **title**: `String` (标题)
*   **content**: `Text` (Markdown 格式的正文)
*   **tags**: `JSON` (关键词/标签列表)
*   **cover_image**: `String` (本地图片路径)
*   **created_at**: `DateTime`
*   **updated_at**: `DateTime`

### 3. Task (增强型任务)
*   **id**: `UUID` (PK)
*   **content_id**: `UUID` (关联的视频或文章 ID)
*   **content_type**: `Enum` (VIDEO, ARTICLE)
*   **platform**: `Enum` (DOUYIN, KUAISHOU, XHS, TENCENT, BILIBILI, ZHIHU, JUEJIN)
*   **account_id**: `UUID` (执行发布的账号 ID)
*   **browser_profile_id**: `UUID` (可选，执行任务时关联的浏览器配置 ID)
*   **status**: `Enum` (WAITING, RUNNING, SUCCESS, FAILED)
*   **error_msg**: `String` (失败原因)
*   **schedule_time**: `DateTime` (计划发布时间)
*   **platform_result**: `JSON` (平台返回的原始结果)

## 校验规则
*   `BrowserProfile.user_data_dir` 必须是有效的物理路径。
*   `Article.title` 长度在 2-100 字符之间。
*   `Task` 必须关联一个有效的账号和内容项。
