# Data Model: WeChat Channels Rename (WX_CHANNELS)

## Summary of Changes

To prepare for the future **OpenCLI Bridge** architecture, we are adopting a standardized `wx_channels` identifier. All remnants of `TENCENT` and older naming will be completely removed (no deprecations).

### 1. Platform Enum (@omni-post/shared)

Rename in `packages/shared/src/constants/platform.ts`:

- Old: `TENCENT = 2`
- New: `WX_CHANNELS = 2`

**Metadata Refinement**:

- Display Name: `PLATFORM_NAMES[PlatformType.WX_CHANNELS] = '微信视频号'`
- Login URL: `PLATFORM_LOGIN_URLS[PlatformType.WX_CHANNELS] = 'https://channels.weixin.qq.com'`
- Slug (Internal): `wx_channels` (Lowercase snake_case)

### 2. Browser & Logger Constants (Node.js)

Consolidate in `apps/backend-node/src/core/`:

- Browser Slug: `SOCIAL_MEDIA_WX_CHANNELS = 'wx_channels'`
- Logger Name: `wxChannelsLogger`
- Log Filename: `wx_channels.log`

### 3. Frontend Unified Styling (Vue 3)

Refactor `PLATFORM_TAG_TYPES` in `apps/frontend/src/core/platformConstants.js` to use **Enum-driven keys**:

- Old: `'视频号': 'warning'`
- New: `[PlatformType.WX_CHANNELS]: 'warning'`

This ensures that the UI styling remains consistent regardless of localized platform name changes.

### 4. Database JSON Audit (`tasks` table)

An automated migration script or execution check will be required to audit the `tasks` table's `publish_data` column.

- **Audited Fields**: Any platform-specific key or nested value containing `'tencent'` should be renamed to `'wx_channels'`.
- **Platform ID**: The stable integer `2` remains the primary identifier in relational fields.

## State Transitions

- **Uploader Class**: `WxChannelsUploader`
- **Uploader File Path**: `apps/backend-node/src/uploader/wx_channels/main.ts`
- **Plugin Identifier (Future)**: `wx_channels` (to match `wx_channels.ocs.json` metadata).
