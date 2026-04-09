# Phase 0: Research - OpenTelemetry Structured Logging

## OpenTelemetry SDK & Logging Integration

**Context**: The application currently uses `winston` for logging within the `apps/backend-node` package (e.g., `src/core/logger.ts`). The goal is to introduce structured logging and performance tracking for local development without external collectors.

**Decision**:
- Integrate `@opentelemetry/api`, `@opentelemetry/sdk-trace-node`, and `@opentelemetry/sdk-node`.
- Use the built-in `ConsoleSpanExporter` and `ConsoleLogRecordExporter` for development environments to output traces and structured logs to standard out.
- Utilize `@opentelemetry/instrumentation-winston` to automatically inject trace context (TraceId, SpanId) into existing Winston logs, ensuring a graceful transition and linking legacy logs to the new OpenTelemetry spans.

**Rationale**:
- **Standardization**: OpenTelemetry is the industry standard for observability. Using its API prevents vendor lock-in.
- **Graceful Integration**: Winston instrumentation allows us to keep the existing `logger.info()` calls while automatically enriching them with trace metadata, avoiding a massive rewrite of every logging site.
- **Zero-Dependency Local Dev**: The `ConsoleSpanExporter` outputs directly to the terminal, fulfilling the requirement of not needing a persistent storage backend or external collector like Jaeger for local development.

**Alternatives Considered**:
- **Pino**: Migrating from Winston to Pino for its native structured logging capabilities. Rejected because it would require changing every logging site across the codebase, which is risky and time-consuming.
- **Custom Winston Formatter**: Writing a custom Winston formatter to manually track execution time and nesting. Rejected because OpenTelemetry provides a robust, standardized span/trace model out-of-the-box, fulfilling the "performance bottleneck" requirement better than a bespoke solution.