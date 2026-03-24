---
description: "Task list for workspace package management refinement"
---

# Tasks: Optimize and refine workspace package management

**Input**: Design documents from `/specs/028-refine-package-management/`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md  
**Tests**: Required by constitution for Node.js changes (Vitest)  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared config package skeleton for workspace-wide reuse

- [x] T001 Create shared config package scaffolding in packages/shared-config/package.json and packages/shared-config/README.md
- [x] T002 [P] Add shared ESLint/Prettier/TS base configs in packages/shared-config/eslint.config.js, packages/shared-config/prettier.cjs, packages/shared-config/tsconfig.base.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Root workspace scripts and tooling that block all user stories

- [x] T003 Update root workspace definitions and core scripts in package.json (setup/install/dev/build/test/lint/clean and :all variants)
- [x] T004 [P] Add workspace validation script in tools/scripts/check-workspace.mjs and wire to root package.json script (contract enforcement: names, scripts, private)
- [x] T005 [P] Add cross-platform Python install helper in tools/scripts/install-python.mjs and wire to root package.json script install:python
- [x] T006 [P] Add workspace cleanup script in tools/scripts/clean-workspaces.mjs and wire to root package.json script clean
- [x] T007 [P] Add workspace lint/test run task spec in docs or scripts to satisfy Vitest coverage expectations (root npm test fan-out)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 统一的开发入口 (Priority: P1) 🎯 MVP

**Goal**: Root command bootstraps all workspace dependencies including Python legacy backend

**Independent Test**: Fresh clone → run `npm run setup` at repo root → all workspace installs succeed (including Python deps)

### Implementation for User Story 1

- [x] T008 [US1] Wire root setup flow in package.json to run workspace installs and install:python in sequence
- [x] T009 [US1] Ensure Python legacy path is isolated and optional in tools/scripts/install-python.mjs (guard missing python/pip)

**Checkpoint**: User Story 1 setup flow works end-to-end

---

## Phase 4: User Story 2 - 多场景下的脚本一致性 (Priority: P1)

**Goal**: Standardize dev/build/test/lint/clean scripts across all Node workspaces

**Independent Test**: Run `npm run lint --workspaces` and `npm run test --workspaces` from root and all packages execute their own scripts

### Implementation for User Story 2

- [x] T010 [P] [US2] Normalize scripts and naming in apps/frontend/package.json (dev/build/test/lint/clean)
- [x] T011 [P] [US2] Normalize scripts and naming in apps/backend-node/package.json (dev/build/test/lint/clean)
- [x] T012 [P] [US2] Normalize scripts and naming in packages/cli/package.json (dev/build/test/lint/clean)
- [x] T013 [US2] Enforce package naming and private flags per contract in apps/*/package.json and packages/*/package.json

**Checkpoint**: Root workspace scripts fan out consistently across all packages

---

## Phase 5: User Story 3 - 依赖项冲突与冗余清理 (Priority: P2)

**Goal**: Hoist common tooling deps to root and ensure local packages use workspace protocol

**Independent Test**: `npm install` results in shared toolchain deps hoisted to root; package.jsons are minimal and consistent

### Implementation for User Story 3

- [x] T014 [US3] Hoist shared toolchain deps to root package.json and remove duplicates from apps/frontend/package.json, apps/backend-node/package.json, packages/cli/package.json
- [x] T015 [P] [US3] Update apps/frontend/eslint.config.js and apps/backend-node/eslint.config.js to extend shared-config
- [x] T016 [P] [US3] Update apps/frontend/prettier config to reference packages/shared-config/prettier.cjs
- [x] T017 [P] [US3] Update apps/frontend/tsconfig.json and apps/backend-node/tsconfig.json to extend packages/shared-config/tsconfig.base.json
- [x] T018 [US3] Ensure local package references use workspace protocol in package.json (workspace:*)

**Checkpoint**: Dependency hoisting and shared config reuse are in effect

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and validation alignment

- [x] T019 [P] Update workspace command docs in README.md and README_CN.md (setup, lint/test all, clean, measure install time)
- [x] T020 Add measurable baselines for SC-001/SC-003 in specs/028-refine-package-management/quickstart.md
- [x] T021 Run quickstart validation by following specs/028-refine-package-management/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational, no dependency on other stories
- **User Story 2 (P1)**: Starts after Foundational, independent of US1
- **User Story 3 (P2)**: Starts after Foundational, can proceed after US1/US2

### Parallel Opportunities

- T002, T004, T005, T006 can run in parallel after T001/T003 as needed
- T009, T010, T011 can run in parallel (separate package.json files)
- T014, T015 can run in parallel (separate config files)
- Documentation updates can run in parallel with final validation

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate with `npm run setup` on a clean checkout

### Incremental Delivery

1. Add User Story 2 → validate `npm run lint --workspaces` and `npm run test --workspaces`
2. Add User Story 3 → validate hoisting and shared-config usage
3. Update docs and run quickstart validation
