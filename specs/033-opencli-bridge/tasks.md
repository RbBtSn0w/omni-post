# Tasks: OmniPost OpenCLI Bridge Integration

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Register PlatformType.WX_OFFICIAL_ACCOUNT = 8
- [X] T002 [P] Update PLATFORM_NAMES and PLATFORM_LOGIN_URLS
- [X] T003 Update platformConstants.js

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T004 Create system_extensions table
- [X] T005 [P] Implement OpenCLIRunner
- [X] T006 [P] Unit test for OpenCLIRunner
- [X] T007 Create ExtensionService
- [X] T008 [P] Implement OCS JSON parser
- [X] T009 [P] Unit test for OCS parsing

---

## Phase 3: User Story 1 - Extension Center (P1)

- [X] T010 Create ExtensionController
- [X] T011 [US1] Link to app.ts
- [X] T012 [US1] GET /api/opencli/status endpoint
- [X] T013 [P] [US1] Route test for Extension endpoints
- [X] T014 [US1] Create Extensions.vue page
- [X] T015 [P] [US1] Add Extensions menu item

---

## Phase 4: User Story 2 - Smart Capability Discovery (P1)

- [X] T016 [US2] PATH scanning logic
- [X] T017 [US2] --ocs execution for system tools
- [X] T018 [US2] Local extensions/ directory scanning
- [X] T019 [US2] POST /api/opencli/sync endpoint
- [X] T020 [P] [US2] Integration test for dynamic registration

---

## Phase 5: User Story 3 - Dynamic Platform Publishing (P1)

- [X] T021 [US3] Create OpenCLIUploader bridge class
- [X] T022 [US3] Dynamic parameter mapping
- [X] T023 [US3] Credential retrieval from user_info
- [X] T024 [US3] Update PublishService dispatch
- [X] T025 [P] [US3] Unit test for parameter mapping
- [X] T026 [P] [US3] Security test for parameter escaping
- [X] T027 [US3] Frontend platform stores merge

---

## Phase 6: User Story 4 - WeChat Official Account Pilot (P2)

- [X] T028 [US4] Migrate wechat-publisher logic
- [X] T029 [US4] Create manifest.ocs.json
- [X] T030 [US4] E2E test for WeChat publishing

---

## Phase N: Polish

- [X] T031 [P] Update README.md with extension guide
- [X] T032 Code cleanup and final security audit
- [X] T033 Final verification of quickstart.md
