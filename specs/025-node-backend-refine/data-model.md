# Data Model: Node Backend Refine & Security Hardening

## 1. 账号锁定状态 (In-Memory Account Lock)

由 `LockManager` 在内存中维护，防止并发冲突。非持久化。

| 属性 | 类型 | 说明 |
|------|------|------|
| filePath | string | 账号 Cookie 文件的相对路径 (主键/唯一标识) |
| status | 'locked' \| 'available' | 锁定状态 |
| taskId | string \| null | 持有该锁的任务 ID |

## 2. 账号信息 (user_info - SQLite)

扩充原有的 `user_info` 表，支持实时校验冷却逻辑。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| type | INTEGER | 平台类型 |
| filePath | TEXT | Cookie JSON 文件路径 |
| userName | TEXT | 账号名称 |
| status | INTEGER | 状态 (1: 正常, 0: 异常) |
| last_validated_at | DATETIME | 上次 Playwright 校验成功的 UTC 时间 |

## 3. 路径校验逻辑模型 (Path Validation)

- **根目录定义**: 
    - `COOKIES_DIR`: 存储账号凭证的绝对路径
    - `VIDEOS_DIR`: 存储待上传视频的绝对路径
- **校验规则**: `path.resolve(ROOT, INPUT).startsWith(ROOT + path.sep)`
