# Tasks: Remove Python Backend Logic

**Input**: Design documents from `/specs/034-remove-python-backend/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Phase 1: Setup & Foundational

**Purpose**: Project initialization and basic structure

- [X] T001 Verify the Node.js backend tests pass before starting removal (`npm run test:node`)

---

## Phase 2: User Story 1 - Clean Codebase and Maintainability (Priority: P1) 🎯 MVP

**Goal**: Remove the deprecated Python backend logic and its associated infrastructure to simplify the codebase and reduce maintenance overhead.

**Independent Test**: The repository no longer contains the `apps/backend/` directory, Python-specific scripts are gone, and the Node.js backend tests still pass.

### Implementation for User Story 1

- [X] T002 [P] [US1] Delete the entire `apps/backend` directory
- [X] T003 [P] [US1] Delete the Python environment setup script at `tools/scripts/install-python.mjs`
- [X] T004 [P] [US1] Update root `package.json` to remove Python-specific scripts (`install:backend`, `install:python`, `dev:backend`, `lint:backend`, `test:backend`) and adjust the `setup` script to only install workspace dependencies
- [X] T005 [P] [US1] Update root `package.json` to remove Python linting/formatting rules (`apps/backend/**/*.py`) from `lint-staged` and clean up `engines` / `comments` fields referencing Python
- [X] T006 [P] [US1] Remove Python setup and execution instructions from `README.md`
- [X] T007 [P] [US1] Remove Python setup and execution instructions from `README_CN.md`
- [X] T008 [P] [US1] Remove Python style guide and legacy setup steps from `CONTRIBUTING.md`
- [X] T008a [P] [US1] Delete `.github/actions/setup-python-backend` action directory
- [X] T008b [P] [US1] Update `.github/QUICK_REFERENCE.md` to remove all Python-related quick references

**Checkpoint**: At this point, the Python backend and its direct configuration are fully removed.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, final validation, and cleanup.

- [X] T009 Run `npm install` at the root to ensure `package-lock.json` is updated and clean
- [X] T010 Run `npm run test -w apps/backend-node` to verify no regressions in the active backend
- [X] T011 Run `npm run lint` and `npm run check:workspace` to ensure overall repository health and formatting

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 2)**: Depends on the initial validation passing.
- **Polish (Phase 3)**: Depends on the completion of the removal tasks in User Story 1.

### Parallel Opportunities

- All documentation and configuration updates (T003 - T008) can be performed in parallel, as they touch different files and have no mutual dependencies.
