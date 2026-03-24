# Data Model: Shared Common Package

The `packages/shared/` module introduces the unified constant and typing entities to eliminate the hard-split copies across `backend-node` and `frontend`.

## Shared Entities

### 1. Platform Type Mapping (Unified `PlatformType`)
Unifies the discrepancies between `db/models.ts` (`XHS`, `Channels`) and `core/constants.ts` (`XIAOHONGSHU`, `TENCENT`). Uses the expanded names from `constants.ts` as the canonical form.
- **Name**: `PlatformType`
- **Type**: Enum
- **Fields**:
  - `XIAOHONGSHU = 1`
  - `TENCENT = 2` (视频号)
  - `DOUYIN = 3`
  - `KUAISHOU = 4`
  - `BILIBILI = 5`
  - `ZHIHU = 6`
  - `JUEJIN = 7`
- **Auxiliary Constants**: `PLATFORM_NAMES` map (number -> Chinese Name), `PLATFORM_NAME_TO_TYPE` reverse map, `PLATFORM_LOGIN_URLS`.
- **Helper Functions**: `getPlatformName(typeId)`, `getPlatformType(name)`, `isValidPlatform(typeId)`.

### 2. Task Interface
Aligned directly with `apps/backend-node/src/db/models.ts`:
- **Name**: `Task`
- **Type**: Interface
- **Core Fields**:
  - `id`: `string`
  - `title`: `string | null`
  - `status`: `'waiting' | 'uploading' | 'processing' | 'completed' | 'failed'`
  - `progress`: `number`
  - `priority`: `number`
  - `content_type`: `'video' | 'article'`
  - `content_id`: `string | null`
  - `platforms`: `number[]`
  - `file_list`: `string[]`
  - `account_list`: `string[]`
  - `browser_profile_id`: `string | null`
  - `schedule_data`: `any`
  - `error_msg`: `string | null`
  - `publish_data`: `any`
  - `created_at`: `string`
  - `updated_at`: `string`

### 3. UploadOptions Interface
Aligned directly with `apps/backend-node/src/db/models.ts`:
- **Name**: `UploadOptions`
- **Type**: Interface
- **Core Fields**:
  - `title`: `string`
  - `fileList`: `string[]`
  - `tags`: `string[]`
  - `accountList`: `string[]`
  - `article?`: `{ title, content, tags, cover_image? }`
  - `category?`: `number | null`
  - `enableTimer?`: `boolean`
  - `videosPerDay?`: `number`
  - `dailyTimes?`: `number[]`
  - `startDays?`: `number`
  - `thumbnailPath?`: `string`
  - `productLink?`: `string`
  - `productTitle?`: `string`
  - `isDraft?`: `boolean`
  - `publishDatetimes?`: `(Date | number | 0)[]`
  - `browser_profile_id?`: `string | null`

### 4. UserInfo Interface
Aligned directly with `apps/backend-node/src/db/models.ts`:
- **Name**: `UserInfo`
- **Type**: Interface
- **Core Fields**:
  - `id`: `number`
  - `type`: `PlatformType`
  - `filePath`: `string`
  - `userName`: `string`
  - `status`: `number`
  - `group_id`: `number | null`
  - `session_source`: `'managed' | 'local'`
  - `browser_profile_id`: `string | null`
  - `created_at`: `string`
  - `last_validated_at`: `string | null`

### 5. Browser Profile Interface
Aligned directly with `apps/backend-node/src/models/browser_profile.ts`:
- **Name**: `BrowserProfile`
- **Type**: Interface
- **Core Fields**:
  - `id`: `string`
  - `name`: `string`
  - `browser_type`: `'chrome' | 'edge' | 'brave'`
  - `user_data_dir`: `string`
  - `profile_name`: `string`
  - `is_default`: `boolean`
  - `created_at`: `string`
  - `updated_at`: `string`

## Explicitly Out-of-Scope Entities

| Entity | Reason |
|--------|--------|
| `TencentZoneTypes` | Backend-only upload parameter |
| `VideoZoneTypes` | Backend-only Bilibili zone config |
| `PLATFORM_TAG_TYPES` | Frontend-only Element Plus UI styling |
| `PLATFORM_LIST` | Frontend-only dropdown display order |
| `Article` | Backend-only, defined in `models/article.ts`, no frontend counterpart |
