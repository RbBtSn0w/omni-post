# Tasks: Rename WeChat Channels to WXChannels

**Input**: Design documents from `specs/031-wxchannels-rename/`
**Prerequisites**: [plan.md](file:///Users/snow/Documents/GitHub/omni-post/specs/031-wxchannels-rename/plan.md), [spec.md](file:///Users/snow/Documents/GitHub/omni-post/specs/031-wxchannels-rename/spec.md), [data-model.md](file:///Users/snow/Documents/GitHub/omni-post/specs/031-wxchannels-rename/data-model.md)

**Tests**: 100% of existing tests for platform 2 (Tencent/WXChannels) must pass using the new nomenclature.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Update the Single Source of Truth (SSOT) and prepare file structure.

- [X] T001 Rename `PlatformType.TENCENT` to `PlatformType.WX_CHANNELS` in `packages/shared/src/constants/platform.ts`
- [X] T002 Update `PLATFORM_NAMES` mapping for `WX_CHANNELS` in `packages/shared/src/constants/platform.ts`
- [X] T003 [P] Rename uploader directory from `tencent` to `wx_channels` in `apps/backend-node/src/uploader/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure updates that MUST be complete before UI or bulk cleanup.

- [X] T004 Update `WxChannelsUploader` class name and exports in `apps/backend-node/src/uploader/wx_channels/main.ts`
- [X] T005 Update `SOCIAL_MEDIA_TENCENT` to `SOCIAL_MEDIA_WX_CHANNELS = 'wx_channels'` in `apps/backend-node/src/core/browser.ts`
- [X] T006 Update `tencentLogger` to `wxChannelsLogger` and filename to `wx_channels.log` in `apps/backend-node/src/core/logger.ts`
- [X] T007 [P] Rename `postVideoTencent` to `postVideoWxChannels` in `apps/backend-node/src/services/publish-service.ts`
- [X] T008 Update platform dispatching logic in `apps/backend-node/src/services/publish-executor.ts`

**Checkpoint**: Foundation ready - backend can run with the new naming scheme for Platform 2.

---

## Phase 3: User Story 1 - Standardized Architecture (Priority: P1) 🎯 MVP

**Goal**: Align platform identifiers with the "Extension/Plugin" standard (`wx_channels`) and establish Enum-driven UI styling.

**Independent Test**: Verify that platform ID 2 correctly resolves to the `wx_channels` slug and that frontend tags display with the correct color using Enum keys.

### Implementation for User Story 1

- [X] T009 [US1] Refactor `PLATFORM_TAG_TYPES` to use `PlatformType` Enum keys in `apps/frontend/src/core/platformConstants.js`
- [X] T010 [US1] Update all UI labels from "视频号" to "微信视频号" in `apps/frontend/src/` (Views and Components)
- [X] T011 [P] [US1] Update `AccountRecord` interface and account validation logic in `apps/backend-node/src/routes/account.ts`
- [X] T012 [US1] Sync frontend platform mapping to match `packages/shared` in `apps/frontend/src/core/platformConstants.js`

**Checkpoint**: User Story 1 is fully functional; UI is correctly styled and backend uses standardized naming.

---

## Phase 4: User Story 2 - Complete Cleanup (Priority: P1)

**Goal**: Remove all "historical baggage" by replacing all remaining `TENCENT`/`tencent` references globally.

**Independent Test**: `grep -rn "tencent" apps/*/src apps/*/tests packages/*/src` returns zero hits for active Node.js/Frontend code.

### Implementation for User Story 2

- [X] T013 [P] [US2] Update all backend unit tests for platform 2 in `apps/backend-node/tests/`
- [X] T014 [P] [US2] Update all frontend unit tests for platform 2 in `apps/frontend/tests/`
- [X] T015 [US2] Perform global replacement of `TENCENT` with `WX_CHANNELS` in source files (excluding legacy Python).
- [X] T016 [US2] Update CLI command definitions and argument parsing in `packages/cli/` to use `wx_channels`.

**Checkpoint**: User Stories 1 AND 2 are complete; codebase is fully sanitized.

---

## Phase 5: Polish & Data Audit

**Purpose**: Final data integrity checks and documentation verification.

- [X] T017 Audit `tasks` table `publish_data` JSON for legacy `'tencent'` keys and update to `'wx_channels'` via a one-off script.
- [X] T018 [P] Update `ARCHITECTURE.md` and monorepo documentation to reflect the new WeChat ecosystem naming standard.
- [X] T019 Run full verification suite per `quickstart.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Must complete T001 and T002 first as they are the SSOT.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion.
- **User Story 2 (Phase 4)**: Can run in parallel with US1 work for different folders, but depends on Phase 2.
- **Polish (Final Phase)**: Depends on all user stories being complete.

### Parallel Opportunities

- T003 (Backend) can run alongside T001/T002.
- T013 (Backend tests) and T014 (Frontend tests) can run in parallel.
- Once Phase 2 is done, US1 and US2 implementation can proceed in parallel for their respective modules.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2 (Backend Foundation).
2. Complete Phase 3 (Frontend & Architecture Standard).
3. **STOP and VALIDATE**: Verify UI styling and backend dispatching work for WXChannels.

### Incremental Delivery

1. Foundation ready (SSOT + Services).
2. Add US1 (Styled Tags + Standardized Identifiers).
3. Add US2 (Global Cleanup + Updated Tests).
4. Data Audit (Database Migration).

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label for US1/US2 ensures traceability.
- **Strict Rule**: No aliases. Rename only.
- Commit after each task group.
