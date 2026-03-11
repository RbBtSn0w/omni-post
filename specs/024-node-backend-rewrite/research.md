# Research: Node.js Backend Async Implementation

## Decision: Concurrency Model (IO-bound)

- **Decision**: Use Node.js **Async Event Loop** with `setImmediate` and `Promises` instead of `worker_threads`.
- **Rationale**:
    - OmniPost's backend tasks (uploading, auth) are primarily IO-bound (browser automation, network requests).
    - Node.js is optimized for high-concurrency IO.
    - Using `worker_threads` adds significant overhead (V8 context creation) and messaging complexity.
    - `setImmediate` allows offloading task initiation to the next tick, preventing blocking of the REST API's response.
- **Alternatives Considered**:
    - **worker_threads**: Rejected. Heavy overhead, complex memory sharing.
    - **Manual Thread Pool**: Rejected. Node's internal libuv thread pool handles IO fine.

## Decision: Database Client

- **Decision**: Use `better-sqlite3`.
- **Rationale**:
    - Provides a synchronous API which aligns with our local, file-based SQLite usage and matches Python's synchronous pattern.
    - Higher performance than the asynchronous `sqlite3` library for simple operations.
- **Alternatives Considered**:
    - **sqlite3 (npm)**: Rejected. Asynchronous API adds overhead without significant benefits for local SQLite.

## Decision: Playwright Integration

- **Decision**: Reuse `stealth.min.js`.
- **Rationale**: Proven effective in the Python implementation for avoiding bot detection.
- **Pattern**: Inject into browser context on initialization.
