# Phase 0: Research & Decisions

## Context
The goal is to completely remove the deprecated Python backend (`apps/backend/`) from the OmniPost repository, along with all its associated infrastructure, CI/CD, and documentation references.

## Decisions

### 1. Scope of Removal
- **Decision**: Delete the entire `apps/backend/` directory.
- **Rationale**: The Node.js backend (`apps/backend-node/`) is the sole maintenance target according to Principle I of the OmniPost Constitution. The Python backend is fully deprecated.
- **Alternatives considered**: Keeping the Python backend in a separate branch or archiving it. Rejected because Git history already preserves the code, and keeping it in the working tree adds cognitive load.

### 2. Configuration Updates
- **Decision**: Remove Python-specific scripts and dependencies from the root `package.json`.
- **Rationale**: Scripts like `install:backend`, `dev:backend`, `lint:backend`, `test:backend`, and `install:python` are no longer needed. The `setup` script should be simplified to only install Node.js dependencies.
- **Alternatives considered**: Leaving the scripts but making them no-ops. Rejected because it leaves dead code and confuses developers.

### 3. Documentation Updates
- **Decision**: Update `README.md`, `README_CN.md`, and `CONTRIBUTING.md` to remove instructions for setting up and running the Python backend.
- **Rationale**: Documentation must reflect the current state of the codebase.
- **Alternatives considered**: Adding a "Deprecated" warning to the Python instructions. Rejected because the code itself is being removed, so instructions will be invalid.

### 4. Cross-References in Node.js Code
- **Decision**: Do not strictly mandate the removal of `* Mirrors: apps/backend/...` comments in the Node.js codebase in this specific feature branch, unless explicitly encountered during other cleanups.
- **Rationale**: The primary goal is to remove the executable Python logic and infrastructure. Cleaning up comment references is a low-priority task that can be handled incrementally.

### 5. Script Removal
- **Decision**: Delete `tools/scripts/install-python.mjs`.
- **Rationale**: This script is exclusively used to set up the Python environment, which is no longer needed.
