# Implementation Plan: Rename WeChat Channels to WXChannels

**Branch**: `031-wxchannels-rename` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)

## Summary

The primary requirement is to refactor "WeChat Channels" (current ID 2) to a standardized **WXChannels** nomenclature across all active monorepo layers (Shared, Backend-Node, Frontend). Per the auditor's instructions, this is a "clean refactor" with **no historical baggage**, meaning all legacy aliases (like `TENCENT`) will be completely replaced rather than deprecated. This aligns with the future **OpenCLI Bridge** architecture by establishing a predictable `wx_channels` slug standard.

## Technical Context

**Language/Version**: Node.js 20+, TypeScript 5.x  
**Primary Dependencies**: Playwright (uploaders), Express (API), Vue 3 (FE)  
**Storage**: SQLite (`database.db`), local filesystem (logs/cookies/profiles)  
**Testing**: Vitest (Mandatory 100% pass for refactored components)  
**Target Platform**: Multi-platform Publisher (Desktop/Web)  
**Project Type**: Monorepo Web Application  
**Performance Goals**: Identical to existing system; no performance regression.  
**Constraints**: **Strict No-Aliasing Rule** — all `TENCENT` references must be removed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Node.js First**: Refactor focuses on `apps/backend-node`. Python is excluded per current spec assumptions.
- [x] **SSOT Package**: Updates must originate in `@omni-post/shared` and propagate.
- [x] **Uploader Isolation**: `uploader/tencent/` will be renamed to `uploader/wx_channels/`.
- [x] **Test Coverage**: All existing tests for Platform 2 must be updated to use the new nomenclature.

## Project Structure

### Documentation (this feature)

```text
specs/031-wxchannels-rename/
├── plan.md              # This file
├── research.md          # Global occurrence mapping (TENCENT/tencent/视频号)
├── data-model.md        # WX_CHANNELS Enum and Slug schema
├── quickstart.md        # Post-rename verification runbook
└── tasks.md             # Implementation tasks
```

### Source Code Mapping

```text
packages/shared/src/constants/platform.ts   # PlatformType.TENCENT -> WX_CHANNELS
apps/backend-node/src/
├── core/
│   ├── browser.ts                          # slug 'tencent' -> 'wx_channels'
│   └── logger.ts                           # tencentLogger -> wxChannelsLogger
├── services/
│   ├── publish-service.ts                  # postVideoTencent -> postVideoWxChannels
│   └── publish-executor.ts                 # dispatching logic update
└── uploader/
    └── tencent/ -> wx_channels/           # Directory & class rename
apps/frontend/src/
├── core/platformConstants.js               # Enum-driven tag types
└── views/                                  # Component label updates
```

**Structure Decision**: Standard monorepo refactoring across `packages/shared`, `apps/backend-node`, and `apps/frontend`.

## Complexity Tracking

*No constitution violations identified.*
