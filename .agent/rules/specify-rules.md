# omni-post Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-25

## Active Technologies
- Node.js 20+, TypeScript 5.x (backend), Vue 3 + JavaScript (frontend) + Express, Playwright, Pinia, Element Plus, Axios, Vites (030-harden-refresh-flow)
- SQLite (`user_info` account metadata, validation timestamps) + in-memory frontend cache (`dataCache`) (030-harden-refresh-flow)
- SQLite (backend account/task metadata), in-memory data cache (frontend) (030-harden-refresh-flow)
- Node.js 20+, TypeScript 5.x + Playwright, Express, Vue 3, Element Plus (031-wxchannels-rename)
- SQLite (`database.db`), local filesystem (cookies/browser profiles) (031-wxchannels-rename)
- Node.js 20+, TypeScript 5.x + Playwright (uploaders), Express (API), Vue 3 (FE) (031-wxchannels-rename)
- SQLite (`database.db`), local filesystem (logs/cookies/profiles) (031-wxchannels-rename)

- TypeScript 5.x, Node.js 20+ LTS + TypeScript, npm workspaces (029-shared-common-package)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Node.js 20+ LTS: Follow standard conventions

## Recent Changes
- 031-wxchannels-rename: Added Node.js 20+, TypeScript 5.x + Playwright (uploaders), Express (API), Vue 3 (FE)
- 031-wxchannels-rename: Added Node.js 20+, TypeScript 5.x + Playwright, Express, Vue 3, Element Plus


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
