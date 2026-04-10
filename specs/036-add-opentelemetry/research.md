# Phase 0: Research - OpenTelemetry Structured Logging

## OpenTelemetry SDK & Logging Integration

**Context**: The application now uses an OpenTelemetry-native logger facade in `apps/backend-node/src/core/logger.ts` instead of Winston. The goal remains structured logging and performance tracking for local development without external collectors.

**Decision**:
- Integrate `@opentelemetry/api`, `@opentelemetry/sdk-trace-node`, and `@opentelemetry/sdk-node`.
- Use the built-in `ConsoleSpanExporter` and `ConsoleLogRecordExporter` for development environments to output traces and structured logs to standard out.
- Provide a typed logging facade (`logger.info/warn/error/debug`) that emits OpenTelemetry log records and keeps concise console output for local debugging.

**Rationale**:
- **Standardization**: OpenTelemetry is the industry standard for observability. Using its API prevents vendor lock-in.
- **Facade Compatibility**: Keeping the existing `logger.info()` style API minimizes call-site churn while removing the legacy Winston dependency.
- **Zero-Dependency Local Dev**: The `ConsoleSpanExporter` outputs directly to the terminal, fulfilling the requirement of not needing a persistent storage backend or external collector like Jaeger for local development.

**Alternatives Considered**:
- **Pino**: Migrating from Winston to Pino for its native structured logging capabilities. Rejected because it would require changing every logging site across the codebase, which is risky and time-consuming.
- **Custom Winston Formatter**: Writing a custom Winston formatter to manually track execution time and nesting. Rejected because OpenTelemetry provides a robust, standardized span/trace model out-of-the-box, fulfilling the "performance bottleneck" requirement better than a bespoke solution.
