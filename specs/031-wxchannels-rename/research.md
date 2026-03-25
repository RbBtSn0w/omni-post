# Research: WeChat Channels Rename (TENCENT -> WXCHANNELS)

## Summary of Occurrences

The rename from "Tencent/视频号" to "WXChannels" affects approximately 350 lines across the monorepo.

### 1. Shared Constants (@omni-post/shared)
- `packages/shared/src/constants/platform.ts`:
  - `PlatformType.TENCENT` (2)
  - `PLATFORM_NAMES[PlatformType.TENCENT]` ('视频号')
  - `PLATFORM_LOGIN_URLS[PlatformType.TENCENT]` ('https://channels.weixin.qq.com')

### 2. Backend Node.js (apps/backend-node)
- **Core/Browser**: `SOCIAL_MEDIA_TENCENT = 'tencent'` in `src/core/browser.ts`.
- **Logger**: `tencentLogger` in `src/core/logger.ts`.
- **Services**:
  - `publish-service.ts`: `postVideoTencent` function and dynamic import of `TencentUploader`.
  - `publish-executor.ts`: Dispatching to `postVideoTencent`.
  - `login-impl.ts`: Success/Failure logs and screenshot directories named 'tencent'.
  - `cookie-service.ts`: `cookieAuthTencent` method and logger usage.
- **Routes**:
  - `dashboard.ts`: Stats mapping for 'channels'.
- **Uploader**:
  - Directory: `src/uploader/tencent/`
  - Class: `TencentUploader`

### 3. Frontend (apps/frontend)
- **Constants**: `src/core/platformConstants.js` - `PlatformType.TENCENT` and name '视频号'.
- **Components**:
  - `AccountManagement.vue`: Tab labels, empty states, and platform ID mapping (2).
  - `PublishCenter.vue`: Tooltips and draft options specifically for '视频号'.
  - `Dashboard.vue`: Counter logic for 'channels'.

### 4. Legacy Backend (apps/backend)
- Similar naming patterns: `tencent_uploader`, `TENCENT` enum, `post_video_tencent`.

## Decisions

- **Platform ID**: Remains FIXED at `2`.
- **Internal Enum**: `TENCENT` -> `WXCHANNELS` (or `WX_CHANNELS` to match `XIAOHONGSHU`? Actually `XIAOHONGSHU` is one word. I'll use `WXCHANNELS`).
- **Internal Keys**: `'tencent'` string keys -> `'wxchannels'`.
- **Uploader Directory**: `tencent` -> `wxchannels`.
- **Display Name**: `"视频号"` -> `"微信视频号"` (to clearly distinguish from `"微信公众号"`/`WXOfficialAccounts`).

## Rationale
- Aligning with the request to "重构下, 换成统一名称, WXChannels".
- Future-proofing for "Official Accounts".

## Alternatives Considered
- Keeping internal names as `tencent`: Rejected because the user specifically requested a rename to `WXChannels` for architectural clarity.
- Changing Platform ID: Rejected because it would break existing database records.
