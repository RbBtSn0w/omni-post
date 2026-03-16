---

description: "Task list for Enhance Automation and Stability using OpenCLI Patterns"
---

# Tasks: Enhance Automation and Stability using OpenCLI Patterns

**Input**: Design documents from `/specs/027-opencli-automation-upgrade/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Included as per Constitution Principle IV (Node.js mandatory testing).

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize `packages/cli` directory and base package.json
- [x] T002 [P] Configure backend-node dependencies (unified, remark, better-sqlite3) in `apps/backend-node/package.json`
- [x] T003 [P] Setup directory structure for article uploaders in `apps/backend-node/src/uploader/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and database schema

- [x] T004 Create database migration for `BrowserProfile` and `Article` tables in `apps/backend-node/src/db/migrations/`
- [x] T005 [P] Create `BrowserProfile` entity in `apps/backend-node/src/models/browser_profile.ts`
- [x] T006 [P] Create `Article` entity in `apps/backend-node/src/models/article.ts`
- [x] T007 Implement shared `BrowserService` base in `apps/backend-node/src/services/browser_service.ts`

**Checkpoint**: Foundation ready - database and base services established.

---

## Phase 3: User Story 1 - Local Chrome Session Reuse (Priority: P1) 🎯 MVP

**Goal**: Link and reuse local browser profiles for authentication

**Independent Test**: Link a profile and access a platform creator studio without login prompt.

### Tests for User Story 1

- [x] T008 [P] [US1] Unit tests for BrowserProfile management in `apps/backend-node/tests/services/browser_service.test.ts`
- [x] T009 [P] [US1] Integration tests for persistent context launching in `apps/backend-node/tests/core/browser.test.ts`

### Implementation for User Story 1

- [x] T010 [P] [US1] Implement Browser Profile routes in `apps/backend-node/src/routes/browser.ts`
- [x] T011 [US1] Implement `launchPersistentContext` logic in `apps/backend-node/src/core/browser.ts`
- [x] T012 [US1] Update `AccountManagement.vue` to support Profile selection and management
- [x] T013 [US1] Update existing video uploaders to support `browser_profile_id` usage

**Checkpoint**: User Story 1 functional - login-free publishing via local sessions enabled.

---

## Phase 4: User Story 2 - Multi-Platform Article Publishing (Priority: P1)

**Goal**: Publish Markdown articles to Zhihu and Juejin

**Independent Test**: Publish one Markdown file to two platforms with correct formatting.

### Tests for User Story 2

- [x] T014 [P] [US2] Unit tests for Markdown to HTML conversion in `apps/backend-node/tests/utils/markdown.test.ts`
- [x] T015 [P] [US2] Mock-based tests for article uploaders in `apps/backend-node/tests/uploader/article_upload.test.ts`

### Implementation for User Story 2

- [x] T016 [P] [US2] Implement Markdown processing utility in `apps/backend-node/src/utils/markdown.ts`
- [x] T017 [P] [US2] Implement Article routes in `apps/backend-node/src/routes/article.ts`
- [x] T018 [US2] Implement `ArticleService` in `apps/backend-node/src/services/article_service.ts`
- [x] T019 [US2] Implement `ZhihuUploader` in `apps/backend-node/src/uploader/zhihu/main.ts`
- [x] T020 [US2] Implement `JuejinUploader` in `apps/backend-node/src/uploader/juejin/main.ts`
- [x] T021 [US2] Create Article Publishing UI in `apps/frontend/src/views/ArticlePublish.vue`

**Checkpoint**: User Story 2 functional - multi-platform article publishing enabled.

---

## Phase 5: User Story 3 - CLI-First Workflow (Priority: P2)

**Goal**: Manage tasks and accounts via terminal

**Independent Test**: List tasks and trigger a publish action via CLI commands.

### Implementation for User Story 3

- [x] T022 [US3] Implement CLI core and command registration in `packages/cli/src/index.ts`
- [x] T023 [P] [US3] Implement API client for CLI in `packages/cli/src/api/client.ts`
- [x] T024 [US3] Implement `omni browser link` command in `packages/cli/src/commands/browser.ts`
- [x] T025 [US3] Implement `omni publish` command in `packages/cli/src/commands/publish.ts`

**Checkpoint**: User Story 3 functional - CLI control available.

---

## Phase 6: User Story 4 - AI-Assisted Platform Exploration (Priority: P3)

**Goal**: Discover interaction points on new websites

**Independent Test**: Generate a YAML adapter draft from a platform URL.

### Implementation for User Story 4

- [x] T026 [US4] Implement Exploration logic in `apps/backend-node/src/services/explorer_service.ts`
- [x] T027 [US4] Implement `omni explore` command in `packages/cli/src/commands/explore.ts`

**Checkpoint**: User Story 4 functional - development tools for new platforms ready.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and final validation

- [x] T028 [P] Documentation updates in `docs/` and `README.md`
- [x] T029 Implement sensitive data masking in CLI logs/outputs
- [x] T030 Run full validation via `quickstart.md` scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Phase 1 (Setup)**: Initial structure.
2. **Phase 2 (Foundational)**: MUST complete before Phase 3 and Phase 4.
3. **Phase 3 (US1)** and **Phase 4 (US2)**: Can run in parallel after Phase 2.
4. **Phase 5 (US3)**: Depends on Phase 3 and Phase 4 API completion.
5. **Phase 6 (US4)**: Depends on CLI infrastructure (Phase 5).
6. **Phase 7 (Polish)**: Final step.

### Parallel Opportunities

- T002, T003 (Setup)
- T005, T006 (Models)
- T008, T009 (US1 Tests)
- T014, T015, T016, T017 (US2 prerequisites)
- T023 (CLI API client)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational (T001-T007)
2. US1 Implementation (T008-T013)
3. Validate session reuse in Douyin/XHS.

### Incremental Delivery

1. Add US2: Article publishing (T014-T021)
2. Add US3: CLI Workflow (T022-T025)
3. Add US4: Platform Explorer (T026-T027)

---

## Notes

- All Node.js backend logic follows Routes → Services → Uploaders pattern.
- Python backend is considered deprecated; all new logic is in Node.js.
- Commits should be made after each task or logical group.
