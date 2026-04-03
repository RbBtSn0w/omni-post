# Feature Specification: Rename WeChat Channels to WXChannels

**Feature Branch**: `031-wxchannels-rename`
**Created**: 2026-03-25
**Status**: completed
**Input**: User description: "当前微信的视频号 (WeChat Channels)需要重构下, 换成统一名称, WXChannels , 因为下个需求需要新增功能公众号 (Official Accounts)."

## Clarifications

### Session 2026-03-25
- Q: Should the `PLATFORM_TAG_TYPES` correction be a mandatory requirement? → A: Yes, update frontend tag mapping to use Enum-driven keys.
- Q: For the internal string key (slug), should we adopt a standardized format? → A: Yes, adopt `wx_channels` as the lowercase snake_case slug across all layers.
- Q: Should the directory and uploader class follow a unified nomenclature pattern? → A: Yes, use `uploader/wx_channels/` directory and `WxChannelsUploader` class to align with future OpenCLI Bridge discovery.
- Q: Should we keep legacy aliases or @deprecated markers? → A: No, perform a complete refactor with "no historical baggage."
- Q: Is legacy Python refactoring in scope? → A: No, ignore the Python backend refactoring.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Standardized Architecture for WeChat Ecosystem (Priority: P1)

As a maintainer/operator, I want the system to use standardized identifiers for "WeChat Channels" (WXChannels) so that it follows the "Extension/Plugin" nomenclature required for the upcoming "Official Accounts" and OpenCLI Bridge integration.

**Why this priority**: Essential for the long-term architectural goal of moving towards a dynamic platform registry (OpenCLI Bridge).

**Independent Test**: Verify that the internal slug `wx_channels` is used consistently in directories, log filenames, and database-ready JSON keys.

**Acceptance Scenarios**:

1. **Given** the backend uploader directory, **When** I inspect the structure, **Then** I see `apps/backend-node/src/uploader/wx_channels/main.ts`.
2. **Given** a platform tag in the frontend, **When** the platform name changes (e.g., to "微信视频号"), **Then** the UI styling (tag color) persists correctly because it is driven by the Enum key `PlatformType.WX_CHANNELS`.

---

### User Story 2 - Complete Cleanup of Legacy Nomemclature (Priority: P1)

As an auditor, I want a complete refactoring of all "Tencent" or "视频号" hardcoded strings into the new "WXChannels" standard, so that no "historical baggage" remains in the core codebase.

**Why this priority**: Required for code quality and clarity before significant platform additions.

**Independent Test**: Perform a global search for `TENCENT` and `tencent` (ignoring legacy code) and ensure zero hits remain in the active codebase.

**Acceptance Scenarios**:

1. **Given** the shared package, **When** I view `platform.ts`, **Then** the enum is `PlatformType.WX_CHANNELS` and there are no `TENCENT` aliases.
2. **Given** the test suite, **When** I run existing tests, **Then** they pass using the new `WX_CHANNELS` identifiers and functions (e.g., `postVideoWxChannels`).

---

### Edge Cases

- **Existing Task Payloads**: The `publish_data` or `metadata` JSON fields in the `tasks` table must be audited and updated if they contain `'tencent'` strings as keys.
- **CLI Compatibility**: The CLI should be updated to accept `wx_channels` as the primary identifier; no legacy alias required.
- **Log Migration**: Old log files (`tencent.log`) and screenshot directories (`tencent/`) will effectively be archived; new operations will exclusively use `wx_channels.log` and `wx_channels/`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST rename `PlatformType.TENCENT` (2) to `PlatformType.WX_CHANNELS` (2) in `@omni-post/shared`.
- **FR-002**: System MUST update the internal slug to `wx_channels` consistently in `apps/backend-node/src/core/browser.ts` and `logger.ts`.
- **FR-003**: System MUST refactor `apps/frontend/src/core/platformConstants.js` to use `PlatformType` Enum keys for `PLATFORM_TAG_TYPES` instead of Chinese string keys.
- **FR-004**: System MUST rename uploader directory to `wx_channels` and class name to `WxChannelsUploader`.
- **FR-005**: System MUST rename backend service methods (e.g., `postVideoTencent` -> `postVideoWxChannels`).
- **FR-006**: System MUST perform a complete refactoring: REMOVE all legacy `TENCENT`/`tencent` references from the active codebase (no `@deprecated` markers).
- **FR-007**: System MUST audit and update internal JSON keys in the `tasks` table to ensure consistent platform identification.

### Key Entities *(include if feature involves data)*

- **Platform**: Identified by `PlatformType.WX_CHANNELS` (ID 2), with slug `wx_channels`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% removal of `TENCENT` and `tencent` from `packages/shared`, `apps/backend-node`, and `apps/frontend`.
- **SC-002**: UI platform tags correctly display colors using Enum-driven mapping.
- **SC-003**: 100% of existing tests in the Node.js backend and frontend pass after refactoring.

## Assumptions

- [Legacy Exclusion]: Legacy Python backend (`apps/backend`) refactoring is intentionally out of scope.
- [ID Stability]: The platform integer ID `2` remains stable.
- [OpenCLI Alignment]: This naming convention is intended to serve as the future "Plugin Extension ID" for the OpenCLI Discovery scanner.
