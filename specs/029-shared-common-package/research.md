# Phase 0: Research & Clarifications - Shared Common Package

## Decision: Shared Package Location and Integration
**Decision:** Create a new npm workspace package located at `packages/shared`.
**Rationale:** The constitution dictates managing dependencies strictly within their respective workspaces and using `npm workspaces` at the repository root. `packages/*` is already declared in root `package.json` workspaces.
**Alternatives considered:** Using relative paths directly — anti-pattern causing coupling and path resolution fragility.

## Decision: Module Resolution Strategy (Key Technical Decision)
**Decision:** Configure `packages/shared` with `moduleResolution: "bundler"` in its tsconfig to match both consumers.
**Rationale:** Both `apps/backend-node/tsconfig.json` and `apps/frontend/tsconfig.json` use `moduleResolution: "bundler"`. Having `packages/shared` also use `bundler` ensures symmetric resolution semantics. Originally `NodeNext` was considered but it enforces `.js` extension in imports which creates friction when consumers use `bundler` mode.
**Exports strategy:** Single entry point `"exports": { ".": "./src/index.ts" }` with `"types"` field pointing to the same. Since both consumers can resolve TypeScript sources directly (backend via `tsx`/`tsc`, frontend via Vite), we do NOT need a precompiled `dist/` for development. A `build` script producing `dist/` is provided for CI validation only.
**Alternatives considered:** `NodeNext` with precompiled `dist/` — rejected because it conflicts with the `bundler` consumers and adds unnecessary build-step overhead during development.

## Decision: Enforcing Pure Business Logic
**Decision:** Establish ESLint boundaries within `packages/shared` using `no-restricted-globals` (banning `window`, `document`) and `no-restricted-imports` (banning `fs`, `path`, `crypto`). Additionally, tsconfig sets `"lib": ["ES2022"]` (without `DOM`) so TypeScript itself will flag any DOM API access.
**Rationale:** Pure logic guarantees cross-environment portability without shimming.

## Decision: Scope Inventory Extraction Target
**Decision:** Extract `PlatformType` (enum + maps + helpers), `Task`, `UploadOptions`, `UserInfo` (from `db/models.ts`), and `BrowserProfile` (from `models/browser_profile.ts`).
**Rationale:** These are the definitions duplicated or cross-imported between frontend and backend. Frontend-only constants like `PLATFORM_TAG_TYPES`, `PLATFORM_LIST`, and backend-only constants like `TencentZoneTypes`, `VideoZoneTypes` remain in their respective apps.

## Decision: Dependency Management
**Decision:** `packages/shared` will NOT have its own `typescript` or `eslint` devDependency. It inherits from root `package.json` devDependencies which already provide `typescript ^5.7.0` and `eslint ^9.39.2`.
**Rationale:** Avoids version conflicts and reduces `node_modules` duplication across workspaces.
