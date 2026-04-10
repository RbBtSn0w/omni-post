# omni-post Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-09

## Active Technologies

- Node.js 20+, TypeScript 5.x + `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/sdk-trace-node`, OpenTelemetry logger facade in `apps/backend-node/src/core/logger.ts` (036-add-opentelemetry)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

Node.js 20+, TypeScript 5.x: Follow standard conventions

## Recent Changes

- 036-add-opentelemetry: Added OpenTelemetry tracing + logs with a typed logger facade and removed Winston dependency from backend-node

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
