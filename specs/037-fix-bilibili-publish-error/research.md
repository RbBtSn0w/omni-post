# Research: Bilibili Publish ReferenceError

## Unknowns & Investigations

### Investigation 1: ReferenceError in evaluate
- **Question**: Why does `BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT` cause a `ReferenceError`?
- **Finding**: Playwright's `evaluate` function runs the provided code in the browser context. Node.js classes and variables are not accessible in that context unless explicitly passed as arguments.
- **Root Cause**: The original failure came from code inside `evaluate` trying to access the Node.js class constant directly. In the current implementation, the browser callback should use the passed `limit` argument instead of referencing `BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT` in the page context.
- **Solution**: Pass `BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT` into `evaluate` from Node.js and compare against the callback parameter `limit` inside the evaluated function.

## Decisions

- **Decision**: Update `getPublishButtonState` to pass the text limit as an argument.
- **Rationale**: Standard Playwright practice for sharing data between Node.js and browser contexts.
- **Alternatives considered**: Hardcoding the value in the string (bad for maintenance) or defining the limit as a global in the browser (overkill).

## Empirical Validation Plan

- **Reproduction Script**: Use `apps/backend-node/scratch/reproduce_bilibili_bug.ts` to verify the evaluate argument-passing pattern: the script captures `BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT` in Node.js scope and passes it into `page.evaluate` as an argument, demonstrating that values must be passed as arguments rather than read from Node.js class scope inside the browser callback.
- **Verification**: Run the script to confirm the argument-passing pattern works, and verify that `getPublishButtonState` follows the same pattern by using the callback's `limit` parameter inside `evaluate` instead of referencing `BilibiliUploader.DIAGNOSTIC_TEXT_LIMIT` in the page context.
