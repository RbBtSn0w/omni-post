---
description: Diagnostic workflow for identifying and fixing issues
---

# Debug Workflow

This workflow helps diagnose and fix issues in the OmniPost system.

## Step 1: Symptom Analysis
Ask the user to describe the issue.
- What is the expected behavior?
- What is the actual behavior?
- Are there error messages?

## Step 2: Diagnostic Investigation
Gather diagnostic information based on the issue type.

### Backend/Logic Issues
- **Action**: Use `dev-toolkit` (Skill) to check logs.
- **Commands**:
  - `grep ERROR apps/backend/data/logs/app.log`
  - `tail -n 50 apps/backend/data/logs/app.log`

### UI/Browser Automation Issues
- **Action**: Use the **`browser_subagent`** tool to:
  - Verify UI state or element presence on the local dev server.
  - Test browser automation flows (e.g., login, upload) in a visual environment.
  - Capture screenshots or videos to confirm the failure point.

## Step 3: Root Cause Analysis
Analyze the logs and code to find the root cause.
- **Context**: Check `core.md` (Rule) for data flow and architecture.
- **Hypothesis**: Formulate a hypothesis about the bug.

## Step 4: Fix Implementation
Implement the fix.
- **Action**: Edit the code.
- **Guidance**: Follow `style.md` (Rule).

## Step 5: Verification
Verify the fix.
- **Action**: Run tests or reproduction steps.
- **Command**: `npm run test:backend` or specific pytest/vitest command.
