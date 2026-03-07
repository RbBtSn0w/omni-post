<!--
Sync Impact Report:
- Version change: v1.0.0 → v1.1.0
- List of modified principles:
    - I. Three-Layer Backend Architecture (Expanded to include Node.js)
    - II. Platform Uploader Isolation (Expanded to cover backend-node)
    - III. Comprehensive Automated Testing (Unified for Python and TypeScript)
    - IV. Async/Sync Concurrency (Unified for Threads and Worker Threads)
    - V. Monorepo Dependency Discipline (Updated to include backend-node)
- Added sections: None.
- Removed sections: None.
- Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ updated (Added backend-node structure and Dual-Stack Gates)
    - .specify/templates/tasks-template.md: ✅ updated (Added backend-node Path Conventions)
- Follow-up TODOs: None.
-->

# OmniPost Constitution

## Core Principles

### I. Dual-Backend Architecture Parity
OmniPost maintains a dual-stack architecture (Python Flask and Node.js/TypeScript). Both backends MUST maintain 1:1 functional and API parity. The Node.js rewrite (`apps/backend-node`) MUST be a drop-in replacement for the original Python backend (`apps/backend`), ensuring that the frontend and data storage remain compatible across both implementations.

### II. Unified Three-Layer Backend Pattern
All backend services MUST follow the Routes → Services → Uploaders pattern. Routes handle HTTP requests and response formatting; Services orchestrate business logic and state; Uploaders manage platform-specific Playwright automation. This separation ensures that core business logic (e.g., scheduling algorithms) is identical regardless of the underlying programming language.

### III. Platform Uploader Isolation
Each social platform MUST have its own isolated uploader implementation. For Python, this is in `apps/backend/src/uploader/`; for Node.js, this is in `apps/backend-node/src/uploader/`. Uploaders MUST be stateless and handle their own Playwright context cleanup. Shared automation logic MUST be abstracted into `utils` or base classes, never directly between uploaders.

### IV. Comprehensive Multi-Stack Testing (NON-NEGOTIABLE)
Every new feature, bug fix, or platform uploader update MUST include automated tests for BOTH backends if both are maintained. Python changes require `pytest` suites; Node.js changes require `Vitest` suites. Functional parity MUST be verified by running equivalent test cases across both stacks. CI/CD pipelines MUST pass all tests for all active backends before merging.

### V. Concurrency & Real-Time Feedback
Long-running publishing tasks MUST run asynchronously to avoid blocking the API request-response cycle. Python uses `threading.Thread` (daemon threads), while Node.js uses `worker_threads`. Communication between API handlers and background workers MUST use thread-safe queues. Real-time status updates MUST be delivered via Server-Sent Events (SSE).

### VI. Monorepo Consistency & Dependency Discipline
Dependencies MUST be managed strictly within their respective workspace. `apps/frontend` and `apps/backend-node` use npm; `apps/backend` uses pip. All backends MUST use consistent directory structures and share common assets like `stealth.min.js`. Root-level scripts in `package.json` MUST be the primary interface for multi-stack development and testing.

## Security & Data Integrity

Cookies and sensitive account credentials MUST be stored securely in the `data/cookies` directory of the respective backend and MUST be excluded from version control via `.gitignore`. No hardcoded secrets or personal access tokens are permitted in the codebase. All environment-specific configuration MUST reside in `.env` files.

## Development Workflow

All development MUST follow the "Research -> Strategy -> Execution" lifecycle. Every non-trivial change requires a Specification and an Implementation Plan. `husky` pre-commit hooks MUST be active to ensure linting and formatting compliance. All pull requests MUST adhere to the Conventional Commits specification.

## Governance

This Constitution is the foundational document for OmniPost development and supersedes all other project-specific practices. Amendments to this document require a MINOR or MAJOR version bump. All architectural decisions, especially those involving cross-backend parity, MUST be validated against these principles.

**Version**: 1.1.0 | **Ratified**: 2026-03-06 | **Last Amended**: 2026-03-07
