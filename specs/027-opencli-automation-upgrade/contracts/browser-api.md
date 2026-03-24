# API Contract: Browser Profile Management

## 配置文件列表
**GET** `/api/browser/profiles`
*   **Response**: `200 OK`
    ```json
    [
      {
        "id": "uuid",
        "name": "Personal Chrome",
        "user_data_dir": "...",
        "profile_name": "Default"
      }
    ]
    ```

## 添加/关联配置文件
**POST** `/api/browser/profiles/add`
*   **Request Body**:
    ```json
    {
      "name": "String",
      "user_data_dir": "String (Absolute Path)",
      "profile_name": "String",
      "browser_type": "Enum (CHROME/EDGE/BRAVE)"
    }
    ```
*   **Response**: `201 Created`

## 验证配置文件是否可用
**POST** `/api/browser/profiles/verify`
*   **Request Body**: `{ "id": "uuid" }`
*   **Response**: `200 OK`
    ```json
    { "is_valid": true, "message": "Success" }
    ```
    *   **Error 409**: `Profile is currently in use by another application`
