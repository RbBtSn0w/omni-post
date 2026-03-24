---
name: fail-fast-loud
description: Enforce strict fail-fast-and-loud engineering behavior for implementation, refactoring, bug fixing, and code review tasks. Use when writing or changing production code/tests where hidden fallbacks, silent exception swallowing, weak assertions, or non-red-first bug fixes could mask real failures.
---

# Fail Fast Loud

Execute all coding work with explicit failure surfaces. Do not hide invalid state,
do not blur failure modes, and do not claim correctness without strong tests.

## Rules

1. Fail on missing or invalid state at first detection.
2. Do not add silent fallbacks (`??`, `||`, default-return branches) for required inputs.
3. Do not use broad catch blocks in business logic; catch only at boundaries or per known failure mode.
4. Keep debug logs during bug investigation unless user explicitly asks to remove them.
5. Require tests with concrete expected outcomes (exact values/states), not existence-only assertions.
6. Use varied and boundary-focused test inputs (empty, null, 0, max, negative, abnormal but plausible).
7. Follow Red-Green-Refactor for bug fixes: write failing test first, then fix, then verify pass.

## Required Workflow For Bug Fixes

1. Reproduce the bug with a new or updated test that fails on current code.
2. Implement the smallest fix that makes that test pass.
3. Run related tests and static checks.
4. Keep or improve observability logs tied to the failure path.
5. Report what failed before, what changed, and which assertions now pass.

## Implementation Guardrails

1. Validate all external inputs (request payloads, file paths, parsed responses) before use.
2. Raise explicit errors with actionable messages when validation fails.
3. Do not continue after partial critical-step failure unless caller explicitly supports partial success.
4. Prefer explicit branches over defensive defaults that conceal data issues.

## Test Guardrails

1. Assert concrete business outputs, persisted state, or emitted side effects.
2. Include at least one boundary case and one non-happy-path case per critical logic branch.
3. Reject tests that only assert "not null", "defined", or "truthy" as sole proof.
4. If test setup requires mocks, assert interaction semantics that matter to behavior.

## Review Checklist

1. Can any required field become silently defaulted?
2. Can any exception path be swallowed without signal?
3. Can progress/state math emit NaN, Infinity, or out-of-range values?
4. Does the fix include a test that was red before code change?
5. Are logs for diagnosis preserved?
