# Implementation Plan: Remove Python Backend Logic

**Branch**: `034-remove-python-backend` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/034-remove-python-backend/spec.md`

## Summary

The goal of this feature is to completely remove the deprecated Python backend logic (`apps/backend/`) from the OmniPost repository, along with all associated infrastructure, configuration, and documentation references. This will simplify the codebase, reduce maintenance overhead, and eliminate technical debt.

## Technical Context

**Language/Version**: N/A (Removing Python code)
**Primary Dependencies**: Removing Python dependencies (pip, pytest, Flask, etc.)
**Storage**: N/A
**Testing**: Active testing remains in Node.js (vitest/jest)
**Target Platform**: Node.js environments
**Project Type**: Monorepo cleanup
**Performance Goals**: N/A
**Constraints**: Node.js backend (`apps/backend-node/`) must not suffer any regressions or missing configuration.
**Scale/Scope**: Removing a significant portion of the repository (all Python logic).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*   **I. Node.js First, Python by Exception**: **PASS**. This feature completely aligns with the principle by removing the deprecated Python implementation and standardizing on Node.js.
*   **II. Strict Layer Boundaries**: **PASS** (Not applicable to removal).
*   **III. Platform Isolation & Automation Discipline**: **PASS** (Not applicable to removal).
*   **IV. Single Source of Truth (SSOT)**: **PASS** (Not applicable to removal).
*   **V. Asynchronous Safety & Real-Time State**: **PASS** (Not applicable to removal).
*   **VI. Mandatory Test Coverage**: **PASS**. The removal process must ensure that the Node.js test suite (`npm run test -w apps/backend-node`) still passes completely.

## Project Structure

### Documentation (this feature)

```text
specs/034-remove-python-backend/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── backend-node/        # The only remaining backend (Node.js)
│   ├── src/
│   ├── tests/
│   └── package.json
└── frontend/            # Vue.js frontend
```

**Structure Decision**: The primary structural change is the outright deletion of the `apps/backend/` directory, transitioning the repository to purely a Node.js monorepo (`apps/backend-node` and `apps/frontend`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
