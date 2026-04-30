# Implementation Plan: fix-bilibili-publish-error

**Feature Branch**: `037-fix-bilibili-publish-error`  
**Spec**: [spec.md](./spec.md)  
**Status**: Draft  

## Technical Context

- **Target Files**: `apps/backend-node/src/uploader/bilibili/main.ts`
- **Error**: `ReferenceError: BilibiliUploader is not defined`
- **Location**: `getPublishButtonState` method, inside `evaluate` call.

## Constitution Check

| Principle | Status | Rationale |
| :--- | :--- | :--- |
| **I. North Star** | ✅ Pass | Fixes a critical production bug. |
| **II. Layer Discipline** | ✅ Pass | Fix is localized to the Bilibili uploader. |
| **III. Type Safety** | ✅ Pass | Will ensure proper types for passed arguments. |
| **IV. Async Safety** | ✅ Pass | Does not change async lifecycle. |
| **V. Empirical Validation** | ✅ Pass | Reproduction script planned in research.md. |
| **VI. Monorepo Integrity** | ✅ Pass | Follows existing patterns. |

## Proposed Design

### 1. Fix ReferenceError in `getPublishButtonState`

Modify the `evaluate` call to accept the limit as an argument:

```typescript
// From
return normalizedLocator.evaluate((el: any) => {
    // ...
    if (textResult.length > BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT) {
    // ...
});

// To
return normalizedLocator.evaluate((el: any, limit: number) => {
    // ...
    if (textResult.length > limit) {
    // ...
}, BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT);
```

### 2. Verify other `evaluate` calls

Audit other `evaluate` calls in the same file to ensure no other Node.js-side variables are being leaked.

## Tasks

Tasks are managed in [tasks.md](./tasks.md).
