# Implementation Plan: Node Backend Refine & Security Hardening

**Branch**: `025-node-backend-refine` | **Date**: 2026-03-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/025-node-backend-refine/spec.md`

## Summary

This plan addresses the critical bugs, security vulnerabilities, and architectural gaps identified in the initial Node.js backend rewrite (PR #142). The primary goal is to ensure 1:1 functional parity with the original Python backend while hardening security against path traversal, stabilizing ESM module resolution with mandatory `.js` extensions, and implementing robust account-level locking. Furthermore, a comprehensive CI/CD pipeline will be established to automate quality and security gates for the Node.js stack.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ (ESM mandatory)  
**Primary Dependencies**: Express.js, Playwright, better-sqlite3, Vitest, eslint-plugin-import  
**Storage**: SQLite (database.db)  
**Testing**: Vitest (matching Python's pytest coverage)  
**Target Platform**: Node.js Runtime (Ubuntu-latest for CI)
**Project Type**: Web-service (Backend REST API)  
**Performance Goals**: 1:1 parity with Python latency; optimized browser context reuse; fast CI feedback (<5 mins).  
**Constraints**: MUST use .js extensions for ESM; MUST prevent path traversal for file/cookie access; MUST enforce account locks.  
**Scale/Scope**: Refactoring all 25+ REST endpoints, 5 platform uploaders, and implementing GitHub Actions CI.

## Constitution Check

*GATE: Passed.*

- **Principle I (Architecture Parity)**: ✅ Ensures 1:1 functional and API parity with the Python implementation.
- **Principle II (Pattern)**: ✅ Strictly follows the Routes → Services → Uploaders pattern.
- **Principle III (Isolation)**: ✅ Each platform uploader is isolated and manages its own context.
- **Principle IV (Testing)**: ✅ Fixes and completes the Vitest suite to match Python's testing rigor.
- **Principle V (Concurrency)**: ✅ Uses async event loop for IO-bound browser automation tasks.
- **Principle VI (Monorepo)**: ✅ Correctly managed within the `apps/backend-node` workspace.

## Project Structure

### Documentation (this feature)

```text
specs/025-node-backend-refine/
├── spec.md              # Requirements and decisions
├── plan.md              # This file
├── research.md          # Phase 0: ESM, Security, and CI research
├── data-model.md        # Phase 1: Lock and DB schema refinements
├── quickstart.md        # Phase 1: Local validation steps
├── checklists/          # Validation artifacts
├── contracts/           # Phase 1: Refined API envelopes
└── tasks.md             # Phase 2: Implementation tasks
```

### Source Code (OmniPost Monorepo)

```text
apps/
├── backend/             # Reference Python Backend
├── backend-node/        # Target Node.js Backend
│   ├── src/
│   │   ├── routes/      # Refined Express routes
│   │   ├── services/    # Business logic (LockManager, PublishExecutor)
│   │   └── uploader/    # Optimized uploaders
│   └── tests/           # Fixed Vitest suite
└── frontend/            # Vue 3 Frontend
```

**Structure Decision**: Standard OmniPost Monorepo layout with dual-backend support.

## Complexity Tracking

> **No violations identified.**
