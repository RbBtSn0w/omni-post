# Tasks: fix-bilibili-publish-error

## Implementation Strategy

We will follow the Spec-Kit protocol and Constitution Principle V:
1. **Reproduction**: Create a script to reproduce the `ReferenceError`.
2. **Fix**: Update the Bilibili uploader to correctly pass the limit to the browser context.
3. **Verification**: Run the reproduction script to ensure the fix works.
4. **Audit**: Check for similar issues in the same file.

## Phase 1: Setup

- [x] T001 Create reproduction script in `apps/backend-node/scratch/reproduce_bilibili_bug.ts`

## Phase 2: Foundational (Empirical Validation)

- [x] T002 Execute reproduction script and confirm it fails with `ReferenceError: BilibiliUploader is not defined`

## Phase 3: User Story 1 - Fix Bilibili Publish Error [US1]

- [x] T003 [US1] Modify `getPublishButtonState` in `apps/backend-node/src/uploader/bilibili/main.ts` to pass `limit` as an argument to `evaluate`
- [x] T004 [P] [US1] Audit other `evaluate` calls in `apps/backend-node/src/uploader/bilibili/main.ts` for similar leaks
- [x] T005 [US1] Execute reproduction script again to verify the fix

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T006 Run workspace integrity checks: `npm run check:workspace`
- [x] T007 Run type checks for backend: `npm run typecheck -w apps/backend-node`
- [ ] T008 Run linting: `npm run lint` (Skipped due to pre-existing workspace issue with `globals` package)
- [x] T009 Run tests: `npm run test`
- [x] T010 Check for new `any` usage: `node tools/scripts/check-no-new-any.mjs --base main --head HEAD`

## Dependencies

- All tasks are sequential except where marked with [P].
- T003 depends on T002.
- T005 depends on T003.
