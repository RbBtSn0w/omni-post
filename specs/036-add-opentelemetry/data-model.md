# Data Model: OpenTelemetry Structured Logging

*Note: This feature does not introduce any new persistent database entities. All data models represent transient telemetry structures generated during runtime for local observation.*

## Transient Telemetry Structures

### TraceContext
Represents the overarching execution context, automatically attached to logs.
- `traceId`: String (Unique identifier for the entire request/task lifecycle)
- `spanId`: String (Unique identifier for the current operation)
- `traceFlags`: Number (Sampling decision)

### OTelSpan
Represents a timed operation.
- `name`: String (e.g., "Uploader.uploadVideo")
- `startTime`: Timestamp
- `endTime`: Timestamp
- `duration`: Number (Derived performance metric)
- `attributes`: Key-Value map (e.g., `{"platform": "douyin", "taskId": "1234"}`)
- `status`: OK | ERROR

### Structured Log Record
The enriched Winston log output when running in development mode.
- `timestamp`: String (ISO 8601)
- `level`: String (info, warn, error)
- `message`: String
- `trace_id`: String (from TraceContext)
- `span_id`: String (from TraceContext)
- `metadata`: Key-Value map (custom attributes passed to the logger)