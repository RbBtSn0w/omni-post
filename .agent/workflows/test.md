---
description: Workflow for running test suites
---

# Test Workflow

Guide for running tests and verifying code quality.

## Step 1: Select Test Scope
Determine which tests to run based on the changes.
- Frontend? (`npm run test:frontend`)
- Backend? (`npm run test:backend`)
- Specific file? (`pytest tests/test_foo.py`)

## Step 2: Execution
Run the tests using the `dev-toolkit` (Skill).
- **Action**: Execute the command.

## Step 3: Analysis
Analyze the test results.
- **Pass**: Proceed.
- **Fail**: Diagnose the failure (call `/debug` workflow if needed).

## Step 4: Coverage Check (Optional)
If extensive changes were made, check coverage.
- **Command**: `npm run test:backend -- --cov=src`
