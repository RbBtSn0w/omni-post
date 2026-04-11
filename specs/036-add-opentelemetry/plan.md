# Implementation Plan: 036-add-opentelemetry

**Branch**: `036-add-opentelemetry` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/036-add-opentelemetry/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

The core technology is using the OpenTelemetry framework as the logging system. We will completely replace the legacy logging system with OpenTelemetry for structured logging in the local development environment. This will provide developers with hierarchical trace views of asynchronous publishing tasks and explicit duration metrics to identify performance bottlenecks, outputting directly to the local console without requiring external collectors.

## Technical Context

**Language/Version**: Node.js 20+, TypeScript 5.x
**Primary Dependencies**: `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/api-logs`, `@opentelemetry/sdk-logs`
**Storage**: N/A (Console output only, no persistent storage)
**Testing**: Vitest
**Target Platform**: Local Node.js Backend Console
**Project Type**: Automation Web Service Backend
**Performance Goals**: Negligible latency overhead for tracing locally, high visibility into sub-operation durations
**Constraints**: Must run entirely offline in local dev; no Jaeger, Zipkin, or Datadog instances required
**Scale/Scope**: Local developer tracking of multi-platform task executions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. North Star Compliance**: PASS. Conforms to the structured execution protocol.
- **II. Layer Discipline**: PASS. Telemetry is injected as a cross-cutting concern in `core/` and respects service/uploader boundaries.
- **III. Type Safety**: PASS. Strict TypeScript usage; no `any` types will be added.
- **IV. Async & Task Safety**: PASS. Traces explicitly wrap the async task runner to provide observability for long-running routines.
- **V. Empirical Validation (TDD)**: PASS. Tests will assert that trace spans are generated accurately.
- **VI. Monorepo Integrity**: PASS. Implemented exclusively within `apps/backend-node`.

## Project Structure

### Documentation (this feature)

```text
specs/036-add-opentelemetry/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/backend-node/
├── src/
│   ├── core/
│   │   └── telemetry.ts      # New OpenTelemetry initialization
│   ├── routes/               # Route instrumentation
│   ├── services/             # Task/Business logic instrumentation
│   └── uploader/             # Playwright base uploader instrumentation
└── tests/
    ├── core/                 # Telemetry unit tests
    ├── routes/               # Route span trace tests
    └── uploader/             # Performance span tests
```

**Structure Decision**: Integrated cross-cutting telemetry primarily within `apps/backend-node` `core/` while instrumenting existing `routes/`, `services/`, and `uploader/` layers. Legacy logging configuration in `core/logger.ts` will be deprecated/removed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
