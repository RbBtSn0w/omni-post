<!--
Sync Impact Report:
- Version change: N/A → v1.0.0
- List of modified principles: Initial set defined for OmniPost.
- Added sections: Core Principles, Security & Data Integrity, Development Workflow, Governance.
- Removed sections: None.
- Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ updated (Added OmniPost structure and Constitution Gates)
    - .specify/templates/spec-template.md: ✅ verified (Generic structure remains valid)
    - .specify/templates/tasks-template.md: ✅ updated (Updated Path Conventions for Monorepo)
- Follow-up TODOs: None.
-->

# OmniPost Constitution

## Core Principles

### I. Three-Layer Backend Architecture
The backend MUST follow the Routes → Services → Uploaders pattern. Routes handle HTTP requests and response formatting; Services orchestrate business logic and state; Uploaders manage platform-specific Playwright automation. This separation ensures that business logic is independent of both the delivery mechanism (API) and the automation target (Platform).

### II. Platform Uploader Isolation
Each social platform MUST have its own isolated uploader implementation in `apps/backend/src/uploader/<platform>_uploader/main.py`. Uploaders MUST be stateless and handle their own Playwright context cleanup. Shared automation logic MUST be abstracted into `utils` or base classes, never directly between uploaders.

### III. Comprehensive Automated Testing (NON-NEGOTIABLE)
Every new feature, bug fix, or platform uploader update MUST include automated tests. Backend changes require `pytest` suites (unit and integration); Frontend changes require `Vitest` coverage. CI/CD pipelines MUST pass all tests before any code is merged into the main branch.

### IV. Async/Sync Thread Safety
Long-running publishing tasks MUST run in background threads to avoid blocking the Flask request-response cycle. Communication between sync Flask handlers and async workers MUST use thread-safe Queues. Status updates MUST be delivered via Server-Sent Events (SSE) to ensure real-time frontend feedback without polling overhead.

### V. Monorepo Dependency Discipline
Dependencies MUST be managed strictly within their respective workspace. `apps/frontend` uses npm/package.json for web-related assets; `apps/backend` uses pip/requirements.txt for Python services. Cross-app automation scripts in the root `package.json` MUST be the primary entry point for development and CI tasks.

## Security & Data Integrity

Cookies and sensitive account credentials MUST be stored securely in the `apps/backend/data/cookies` directory and MUST be excluded from version control via `.gitignore`. No hardcoded secrets or personal access tokens are permitted in the codebase. All environment-specific configuration MUST reside in `.env` files.

## Development Workflow

All development MUST follow the "Research -> Strategy -> Execution" lifecycle. Every non-trivial change requires a Specification and an Implementation Plan. `husky` pre-commit hooks MUST be active to ensure linting and formatting compliance. All pull requests MUST adhere to the Conventional Commits specification.

## Governance

This Constitution is the foundational document for OmniPost development and supersedes all other project-specific practices. Amendments to this document require a MINOR or MAJOR version bump. All architectural decisions and code reviews MUST be validated against these principles.

**Version**: 1.0.0 | **Ratified**: 2026-03-06 | **Last Amended**: 2026-03-06
