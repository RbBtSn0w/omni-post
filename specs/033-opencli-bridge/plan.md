# Implementation Plan: OmniPost OpenCLI Bridge

**Branch**: `033-opencli-bridge` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `./spec.md`

## Summary
Implement a plugin-driven extension system for OmniPost using the OpenCLI Specification (OCS). This will allow users to discover, register, and execute external publishing tools (CLI-based) as dynamic platforms within the OmniPost UI. The architecture revolves around a dynamic registry that scans the system path and local extension folders, and a generic execution bridge that handles parameter mapping and real-time status streaming.

## Technical Context

### Core Technologies
- **Language**: TypeScript 5.x (Node.js 20+ LTS)
- **Framework**: Express.js
- **Execution**: `child_process` (spawn) for CLI execution
- **Manifest**: JSON-based OCS (OpenCLI Specification)
- **Database**: Better-sqlite3 for platform/capability caching

### Key Technical Dependencies
- `packages/shared`: For `PlatformType` and `PLATFORM_NAMES`
- `apps/backend-node/src/services/task-service.ts`: To report progress/status
- `apps/backend-node/src/core/logger.ts`: For log streaming

### Unknowns & Resolved Decisions
- **Environment Detection**: **Resolved**. Use `child_process.execSync('which opencli')` for robustness.
- **OCS Schema Specifics**: **Resolved**. Use standard OCS 1.0 but add a proprietary `x-omni-progress-regex` field for progress tracking.
- **Dynamic UI Payload**: **Resolved**. Use the `publish_data` field in the Task entity to store metadata.
- **Dynamic Platform ID Strategy**: **Resolved**. Use the 100-999 range for all dynamic platforms discovered via OpenCLI.

## Constitution Check

| Principle | Assessment | Rationale |
|-----------|------------|-----------|
| I. Node.js First | PASS | Implementation is strictly in `apps/backend-node`. |
| II. Layers | PASS | Following `BridgeService` (Business) -> `OpenCLIUploader` (Automation). |
| III. Isolation | PASS | OpenCLI extensions reside in their own folders or system commands. |
| IV. SSOT | PASS | Dynamic platforms will be assigned IDs in the 100+ range to avoid enum conflicts. |
| V. Async State | PASS | Bridge uses `spawn` and streams status via SSE/Logger. |
| VI. Testing | PASS | Plan includes unit and integration tests for all layers. |

## Development Gates

| Gate | Status | Rationale |
|------|--------|-----------|
| **I. Node Logic** | REQUIRED | ALL logic must be in `apps/backend-node`. |
| **II. Shared SSOT**| REQUIRED | Dynamic platform IDs (100+) must not overlap with official ones. |
| **III. Security** | CRITICAL | All CLI arguments MUST be escaped/sanitized to prevent injection. |
| **IV. Async Flow** | REQUIRED | Scanning and Publishing must not block the main event loop. |

## Phase 0: Outline & Research (COMPLETE)
Decisions documented in `research.md`.

## Phase 1: Design & Contracts

### Data Model (`data-model.md`)
- `system_extensions`: Table to store discovered OCS manifests and paths.
- `PlatformType`: Reserved range (100+) for dynamic platforms.

### Interface Contracts (`contracts/`)
- `POST /api/opencli/sync`: Trigger capability scan.
- `GET /api/opencli/status`: Get environment and detected platform list.

### Quickstart (`quickstart.md`)
- Template for a minimal `manifest.ocs.json`.

## Phase 2: Implementation Sequence

### 1. Backend: Detection & Registry
- Implement `ExtensionManager` to scan `$PATH` and `./extensions`.
- Implement OCS Parser to build the `DynamicPlatform` registry.

### 2. Backend: Bridge Execution
- Implement `OpenCLIRunner` with log interceptors and timeout.
- Create `OpenCLIUploader` as the generic bridge uploader.

### 3. Frontend: Extension Center
- Create `views/Extensions.vue` management page.
- Update platform stores to merge dynamic platforms into the UI.

### 4. Pilot Implementation: WX Official Account
- Migrate `wechat-publisher` logic.
- Create `manifest.ocs.json` for the pilot.

## Project Structure (Target)

```text
apps/backend-node/src/
├── core/
│   └── opencli-runner.ts     # Generic CLI executor
├── services/
│   └── extension-service.ts  # Discovery and registry logic
└── uploader/
    └── opencli/              # Generic bridge uploader
        └── main.ts

apps/frontend/src/
├── views/
│   └── Extensions.vue        # New management page
└── stores/
    └── extension.ts          # State for dynamic platforms
```
