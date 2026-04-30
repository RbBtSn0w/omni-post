# Research: Bilibili Publish ReferenceError

## Unknowns & Investigations

### Investigation 1: ReferenceError in evaluate
- **Question**: Why does `BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT` cause a `ReferenceError`?
- **Finding**: Playwright's `evaluate` function runs the provided code in the browser context. Node.js classes and variables are not accessible in that context unless explicitly passed as arguments.
- **Root Cause**: At `apps/backend-node/src/uploader/bilibili/main.ts:281`, the code `if (textResult.length > BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT)` tries to access `BilibiliUploader` which is a Node.js class.
- **Solution**: Pass `BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT` as an argument to `evaluate`.

## Decisions

- **Decision**: Update `getPublishButtonState` to pass the text limit as an argument.
- **Rationale**: Standard Playwright practice for sharing data between Node.js and browser contexts.
- **Alternatives considered**: Hardcoding the value in the string (bad for maintenance) or defining the limit as a global in the browser (overkill).

## Empirical Validation Plan

- **Reproduction Script**: Create a script `apps/backend-node/scratch/reproduce_bilibili_bug.ts` that mocks a Playwright Page and calls `getPublishButtonState` with a mocked Locator, expecting it to fail with `ReferenceError`.
- **Verification**: Run the script after the fix to ensure it passes.
