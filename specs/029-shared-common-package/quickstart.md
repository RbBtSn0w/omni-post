# Integration Quickstart: Shared Common Package

This document explains how to consume the `@omni-post/shared` package within the monorepo.

## Step 1: Link the Workspace Package

From the root directory:
```bash
npm install @omni-post/shared -w apps/backend-node
npm install @omni-post/shared -w apps/frontend
```

Since `packages/*` is already in root `package.json` workspaces, npm will create a symlink — no registry download required.

## Step 2: Import Shared Definitions

The package uses a single entry point. Import everything from `'@omni-post/shared'`:

```typescript
// Backend example: apps/backend-node/src/services/publish-executor.ts
import { PlatformType, getPlatformName } from '@omni-post/shared';
import type { UploadOptions } from '@omni-post/shared';

// Frontend example: apps/frontend/src/core/platformConstants.js
import {
  PlatformType,
  PLATFORM_NAMES,
  PLATFORM_NAME_TO_TYPE,
  getPlatformName,
  getPlatformType,
  isValidPlatform,
} from '@omni-post/shared';
```

## Step 3: Module Resolution

Both consumer tsconfigs use `moduleResolution: "bundler"`. The shared package matches this:
- `packages/shared/tsconfig.json` → `"moduleResolution": "bundler"`
- `packages/shared/package.json` → `"exports": { ".": "./src/index.ts" }`

No `dist/` precompilation is needed during development. The `build` script exists for CI validation only.

## Step 4: Verify Integration

```bash
# Shared package tests
npm run test -w packages/shared

# Backend type check
cd apps/backend-node && npx tsc --noEmit

# Frontend build
npm run build -w apps/frontend

# ESLint safety check
npm run lint -w packages/shared
```
