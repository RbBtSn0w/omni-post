# Contracts: OpenCLI Bridge API

## 1. Environment Detection
`GET /opencli/status` (兼容 `GET /api/opencli/status`)
- **Response**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "installed": true,
    "binary_path": "/usr/local/bin/opencli",
    "version": "1.3.0",
    "platforms": [
      { "id": "local-wechat-publisher", "platform_id": 8, "name": "WeChat Official Account", "source_type": "local" }
    ]
  }
}
```

## 2. Sync Capability
`POST /opencli/sync` (兼容 `POST /api/opencli/sync`)
- **Request**: (Empty)
- **Action**: Rescans `$PATH` and `./extensions/`.
- **Response**:
```json
{
  "code": 200,
  "msg": "Sync completed",
  "data": {
    "count": 5
  }
}
```

## 3. Tool Execution (Internal Bridge)
`OpenCLIRunner.execute(cmd, args)`
- **Input**: Command path, Array of strings.
- **Output**: JSON containing stdout lines and exit code.
- **Progress Hook**: Observable stream of percentage strings.
