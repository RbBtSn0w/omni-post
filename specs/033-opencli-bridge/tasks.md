# Tasks: OmniPost OpenCLI Bridge Integration

**Input**: Design documents from `/specs/033-opencli-bridge/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Register the new platform and update shared constants.

- [ ] T001 Register `PlatformType.WX_OFFICIAL_ACCOUNT = 8` in `packages/shared/src/constants/platform.ts`
- [ ] T002 [P] Update `PLATFORM_NAMES` and `PLATFORM_LOGIN_URLS` in `packages/shared/src/constants/platform.ts`
- [ ] T003 Update `apps/frontend/src/core/platformConstants.js` to include the new platform and its tag style

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure needed for discovery and execution.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Create `system_extensions` table in `apps/backend-node/src/db/migrations.ts`
- [ ] T005 [P] Implement `OpenCLIRunner` with `spawn` and log streaming in `apps/backend-node/src/core/opencli-runner.ts`
- [ ] T006 [P] Unit test for `OpenCLIRunner` logic in `apps/backend-node/tests/core/opencli-runner.test.ts`
- [ ] T007 Create `ExtensionService` for registry management in `apps/backend-node/src/services/extension-service.ts`
- [ ] T008 [P] Implement OCS JSON `manifest.ocs.json` parser in `apps/backend-node/src/services/extension-service.ts`
- [ ] T009 [P] Unit test for OCS parsing and dynamic ID assignment in `apps/backend-node/tests/services/extension-service.test.ts`

**Checkpoint**: Foundation ready - OpenCLI discovery and execution bridge are now possible.

---

## Phase 3: User Story 1 - Extension Center (Priority: P1) 🎯 MVP

**Goal**: Provide a UI for environment detection and plugin management.

**Independent Test**: Can be verified by opening the new "Extension Center" page and seeing the status of `opencli`.

### Implementation for User Story 1

- [ ] T010 Create `ExtensionController` with status/sync endpoints in `apps/backend-node/src/routes/extension.ts`
- [ ] T011 [US1] Link `ExtensionController` to `app.ts` in `apps/backend-node/src/app.ts`
- [ ] T012 [US1] Implement `GET /api/opencli/status` endpoint in `apps/backend-node/src/services/extension-service.ts`
- [ ] T013 [P] [US1] Route test for Extension endpoints in `apps/backend-node/tests/routes/extension.test.ts`
- [ ] T014 [US1] Create `Extensions.vue` management page in `apps/frontend/src/views/Extensions.vue`
- [ ] T015 [P] [US1] Add "Extensions" menu item to sidebar in `apps/frontend/src/components/layout/Sidebar.vue`

**Checkpoint**: Extension Center is functional and displays environment status.

---

## Phase 4: User Story 2 - Smart Capability Discovery (Priority: P1)

**Goal**: Automatically find system-wide and local plugins.

**Independent Test**: Can be verified by clicking "Sync" and seeing the platform list populate from `$PATH`.

### Implementation for User Story 2

- [ ] T016 [US2] Implement `$PATH` scanning logic using `which` in `apps/backend-node/src/services/extension-service.ts`
- [ ] T017 [US2] Implement `--ocs` (or `--manifest`) execution to fetch system tool capabilities in `apps/backend-node/src/services/extension-service.ts`
- [ ] T018 [US2] Implement local `apps/backend-node/extensions/` directory scanning in `apps/backend-node/src/services/extension-service.ts`
- [ ] T019 [US2] Implement `POST /api/opencli/sync` endpoint in `apps/backend-node/src/routes/extension.ts`
- [ ] T020 [P] [US2] Integration test for dynamic platform registration in `apps/backend-node/tests/services/extension-service-sync.test.ts`

**Checkpoint**: Syncing successfully discovers and registers both system and local plugins.

---

## Phase 5: User Story 3 - Dynamic Platform Publishing (Priority: P1)

**Goal**: Enable publishing via the OpenCLI bridge and manage credentials.

**Independent Test**: Can be verified by selecting an OpenCLI platform in the publish page and finishing a task.

### Implementation for User Story 3

- [ ] T021 [US3] Create `OpenCLIUploader` bridge class in `apps/backend-node/src/uploader/opencli/main.ts`
- [ ] T022 [US3] Implement dynamic parameter mapping (Options -> Flags) in `apps/backend-node/src/uploader/opencli/main.ts`
- [ ] T023 [US3] Implement (FR-009) creditial retrieval from `user_info` table for dynamic platforms in `apps/backend-node/src/services/extension-service.ts`
- [ ] T024 [US3] Update `PublishService` to dispatch tasks to `OpenCLIUploader` for dynamic IDs (>100) in `apps/backend-node/src/services/publish-service.ts`
- [ ] T025 [P] [US3] Unit test for parameter mapping and credential injection in `apps/backend-node/tests/uploader/opencli-bridge.test.ts`
- [ ] T026 [P] [US3] Security test: Validate parameter escaping to prevent injection in `apps/backend-node/tests/core/security-runner.test.ts`
- [ ] T027 [US3] Update frontend platform stores to merge dynamic platforms in `apps/frontend/src/stores/platform.js`

**Checkpoint**: Users can now publish content via any discovered OpenCLI tool with secure credential handling.

---

## Phase 6: User Story 4 - WeChat Official Account Pilot (Priority: P2)

**Goal**: Integrate the first custom extension for WeChat MP.

**Independent Test**: Can be verified by publishing a Markdown article to the WX Draft Box.

### Implementation for User Story 4

- [ ] T028 [US4] Migrate `wechat-publisher` logic into `apps/backend-node/extensions/wx_official_account/`
- [ ] T029 [US4] Create `manifest.ocs.json` for WeChat Official Account in `apps/backend-node/extensions/wx_official_account/`
- [ ] T030 [US4] End-to-end test publishing Markdown article to WX Draft Box

**Checkpoint**: WeChat Official Account is fully integrated and functional.

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T031 [P] Update `README.md` with OpenCLI extension guide
- [ ] T032 Code cleanup and final security audit
- [ ] T033 Final verification of `quickstart.md` scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational completion.

### Parallel Opportunities

- Unit tests (T006, T009) can be done in parallel once logic is written.
- Frontend (T014, T015) and Backend (T010, T012) for US1 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1-3 Only)

1. Complete Setup + Foundational (inc. tests).
2. Complete Extension Center (US1).
3. Complete Discovery (US2) and Publishing Bridge (US3).
4. **STOP and VALIDATE**: Verify small-scale publish.

### Incremental Delivery

1. Foundation -> Task status reporting.
2. US1 -> UI for extension status.
3. US2/3 -> Dynamic platforms work with credentials.
4. US4 -> Specific WX MP value.
