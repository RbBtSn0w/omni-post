# Quickstart: WeChat Channels Rename (WX_CHANNELS)

## Summary of Verification

The rename from `TENCENT` to `WX_CHANNELS` must be verified by ensuring that the platform constant in the shared package is correctly updated to `WX_CHANNELS` and that all dependencies (backend/frontend) pass their respective tests using the new nomenclature.

### 1. Verification of Shared Package

Run the shared package tests to verify the constant update:

```bash
npm run test -w packages/shared
```

**Verify following assertions**:
- `PlatformType.WX_CHANNELS` is `2`.
- `TENCENT` is explicitly REMOVED from the enum.
- `PLATFORM_NAMES[PlatformType.WX_CHANNELS]` is `微信视频号`.

### 2. Verification of Backend-Node

Run the backend-node tests specifically targeting the `WX_CHANNELS` refactor:

```bash
npm run test:node -- -t "WX_CHANNELS"
```

**Confirm the following components**:
- `publish-service.ts`: `postVideoWxChannels` is correctly called and imports the `WxChannelsUploader`.
- `publish-executor.ts`: Dispatching logic for platform `2` correctly calls the new function.
- `cookie-service.ts`: Cookie validation results for platform `2` still work.
- `uploader/`: The directory is renamed to `wx_channels/` and exports a `WxChannelsUploader` class.

### 3. Verification of Frontend UI

The following UI elements should reflect the new naming standard and styled tag:

- **Account Management**: Tab labeled "微信视频号" should present successfully.
- **Platform Tags**: Verify that the platform tag displays with the correct color (driven by `PlatformType` Enum key mapping).
- **Dashboard**: Counter logic for WeChat Channels must correctly reflect the account count using the new constant mapping.

### 4. Regression Check

Check for any legacy hardcoded `'tencent'` strings in the codebase:

```bash
grep -rn "tencent" apps/*/src apps/*/tests packages/*/src
```

*Expected output: zero hits for active Node.js and Frontend code (excluding legacy Python or build artifacts).*
