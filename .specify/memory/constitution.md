<!--
Sync Impact Report:
- Version change: 2.2.0 → 2.3.0
- List of modified principles:
    - Governance Refinement: Moved operational "How-to" details to AGENTS.md.
    - Principles I-VI: Refined to focus strictly on high-level mandates (Why/What).
- Added sections: "Two-Tier Governance" explicitly defining the role of constitution vs agents.md.
- Removed sections: Detailed development workflow steps (moved to AGENTS.md).
- Templates requiring updates: ✅ updated
- Follow-up TODOs: None.
-->

# OmniPost Constitution

## Two-Tier Governance Model

OmniPost uses a two-tier governance structure to ensure architectural integrity and operational efficiency:
- **Constitution (`constitution.md`)**: Defines project-level principles, safety mandates, and architectural boundaries (The *Why* and *What must not be broken*).
- **Agent Instructions (`AGENTS.md`)**: Defines agent-level execution protocols, tool usage, and workflows (The *How*).

## Core Principles

### I. Node.js First, Python by Exception
`apps/backend-node` is the primary and default target for all maintenance and new features. Use of the legacy Python backend (`apps/backend`) is strictly limited to explicit compatibility or migration tasks.

**Rationale**: Consolidating on a single runtime reduces regression risk and maintenance overhead for browser automation and task orchestration.

### II. Route-Service-Uploader Boundaries
The backend MUST maintain strict layering: `Routes` (HTTP/Validation) -> `Services` (Orchestration/Rules) -> `Uploaders` (Automation/Bridging). Automation logic MUST NOT exist in routes; HTTP objects MUST NOT reach uploaders.

**Rationale**: Clear boundaries isolate platform volatility and ensure testability across the publishing pipeline.

### III. Platform Isolation & Automation Discipline
Each platform MUST have an isolated uploader. Playwright-based automation MUST be evidence-driven (via logs/diagnostics) before selector updates. OpenCLI dynamic extensions MUST strictly follow OCS standards and registry-based dispatching.

**Rationale**: Direct "patching" of selectors without diagnosis leads to systemic fragility in multi-platform automation.

### IV. Shared Package SSOT & Monorepo Discipline
`@omni-post/shared` is the Single Source of Truth (SSOT) for platform IDs, shared types, and constants. Local duplicates are forbidden. Monorepo workspace boundaries MUST be respected during dependency management.

**Rationale**: Preventing type/ID drift is critical for interface stability between the frontend, backend, and CLI tools.

### V. Asynchronous Execution & Real-Time State
Publishing and login workflows MUST be non-blocking and background-executed. Observable state (SSE for login, polling for tasks) and cancellation signals MUST be preserved throughout the task lifecycle.

**Rationale**: Browser automation is high-latency; asynchronous orchestration is mandatory for system throughput and UX stability.

### VI. Test Coverage & Regression Gates (NON-NEGOTIABLE)
Node.js implementation changes MUST include corresponding tests. Cross-layer changes (schema, task flow, automation) require regression verification. Python tests only serve as gates for legacy fixes.

**Rationale**: OmniPost's primary risks are cross-layer orchestration and platform regression; tests are the only defense.

## Security & Data Integrity

- **Credential Protection**: Hardcoding secrets is strictly forbidden. Managed data (Cookies, profiles) MUST be directory-controlled and git-excluded.
- **SSRF Protection**: All outbound fetcher logic MUST validate DNS and block private/local ranges.
- **Persistence Stability**: Task fields (`platforms`, `file_list`, etc.) MUST maintain structural alignment with shared types during DB operations.

## Governance & Precedence

The Constitution is the highest authority in the repository. Every spec, plan, and PR must be audited against these six core principles.

**Version Strategy (SemVer)**:
- MAJOR: Removal or redefinition of core mandates.
- MINOR: New sections or expanded guidance.
- PATCH: Wording clarifications and non-semantic refinements.

**Version**: 2.3.0 | **Ratified**: 2024-05-22 | **Last Amended**: 2026-05-22
