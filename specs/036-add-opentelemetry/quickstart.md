# Quickstart: OpenTelemetry Structured Logging

This guide explains how to view and interact with the new OpenTelemetry structured logs during local development.

## Setup

The OpenTelemetry setup is designed for zero-friction local development. You do not need to start any external services (like Jaeger or Zipkin). 

1. Ensure your workspace dependencies are installed:
   ```bash
   npm install
   ```

## Running the Application

1. Start the backend in development mode:
   ```bash
   npm run dev:node
   ```
   
2. *Configuration Note*: OpenTelemetry console exporters are enabled in `development` by default.  
   You can override via environment variable:
   - `OTEL_ENABLED=true` to force-enable
   - `OTEL_ENABLED=false` (or unset outside development) to disable

## Understanding the Output

When you perform actions (like starting a publishing task), you will see two types of output in your terminal:

1. **Logger Facade Console Output**: Calls via `core/logger.ts` emit OpenTelemetry log records and print readable console lines.
   ```json
   {
     "severityText": "INFO",
     "body": "Task started",
     "attributes": {
       "task.id": "publish-123",
       "task.platform": "douyin"
     },
     "traceId": "d4cda95b652f4a1592b449d5929fda1b",
     "spanId": "6e0c63257de34c92",
     "timestamp": "2026-04-09T10:00:00.000Z"
   }
   ```

2. **OpenTelemetry Spans**: At the end of an operation, a summary span is printed with duration and status.
   ```json
   {
     "traceId": "d4cda95b652f4a1592b449d5929fda1b",
     "parentId": "6e0c63257de34c92",
     "name": "Playwright.LaunchBrowser",
     "id": "1b2c3d4e5f6a7b8c",
     "kind": 0,
     "timestamp": 1678886400000000,
     "duration": 1500000, // Duration in microseconds (1.5s)
     "attributes": {
       "platform": "douyin"
     },
     "status": { "code": 1 } // 1 = OK, 2 = Error
   }
   ```

## How to add custom Spans

To track the performance of a specific block of code, wrap it in a span:

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('omnipost-backend');

export async function myHeavyFunction() {
  return await tracer.startActiveSpan('MyService.heavyOperation', async (span) => {
    try {
      // Your code here...
      const result = await doWork();
      
      // Add custom metadata
      span.setAttribute('work.items_processed', result.length);
      
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end(); // CRITICAL: Always end the span to record duration
    }
  });
}
```
