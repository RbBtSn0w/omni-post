# Implementation Plan: OpenTelemetry Structured Logging

**Branch**: `036-add-opentelemetry` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/036-add-opentelemetry/spec.md`

## Summary

Introduce OpenTelemetry structured logging and tracing for local development debugging. The implementation will integrate `@opentelemetry/sdk-trace-node` and `@opentelemetry/instrumentation-winston` into the existing `apps/backend-node` Winston logger, outputting structured traces and performance metrics directly to the console without requiring external collectors.

## Technical Context

**Language/Version**: Node.js 20+ (TypeScript 5.x)
**Primary Dependencies**: `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/instrumentation-winston`, `winston`
**Storage**: N/A (Console output only)
**Testing**: `vitest` (Existing workspace test runner)
**Target Platform**: Local development environments
**Project Type**: Web Service / Background Workers (Express + Playwright)
**Performance Goals**: Negligible overhead during development; ability to track duration of existing operations (like Playwright actions).
**Constraints**: MUST NOT introduce external database or collector requirements (like Jaeger/Datadog) for local execution.
**Scale/Scope**: Backend Node.js application only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. North Star Compliance**: Yes. Aligns with observability goals.
- **II. Layer Discipline (P-II)**: Yes. Telemetry initialization will be in `core/`, and spans will be used across `services/` and `uploader/` without mixing domain logic.
- **III. Type Safety & SSOT (P-IV)**: Yes. OpenTelemetry provides strict TS definitions. No `any` types will be used.
- **IV. Async & Task Safety (P-V)**: Yes. Structured logging will specifically enhance the visibility of the async `task-service`.
- **V. Empirical Validation (TDD)**: Yes. Tests will verify trace generation.
- **VI. Monorepo Integrity**: Yes. Dependencies will be installed in `apps/backend-node`.

## Project Structure

### Documentation (this feature)

```text
specs/036-add-opentelemetry/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/backend-node/
├── src/
│   ├── core/
│   │   ├── telemetry.ts     # NEW: OpenTelemetry initialization
│   │   └── logger.ts        # MODIFIED: Integrate Winston with OTel
│   ├── services/
│   │   └── task-service.ts  # MODIFIED: Add spans to task execution
│   └── uploader/
│       └── base-uploader.ts # MODIFIED: Add spans to platform actions
└── package.json             # MODIFIED: Add OTel dependencies
```

**Structure Decision**: The implementation focuses on `apps/backend-node`. A new `telemetry.ts` file in the `core` layer will handle SDK initialization, which will be imported into the main entry point and existing `logger.ts`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(No violations found. The approach leverages industry-standard SDKs to fulfill the requirement safely.)*