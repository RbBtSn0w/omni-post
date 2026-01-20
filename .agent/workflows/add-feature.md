---
description: Interactive workflow for planning and implementing new features
---

# Add New Feature Workflow

This workflow guides you through the process of adding a new feature to OmniPost, from requirements gathering to verification.

## Step 1: Requirements Gathering
Ask the user for the feature requirements. Ensure you understand:
- What is the goal?
- Which platforms are affected?
- Are there UI changes or just backend logic?

## Step 2: Implementation Plan
Create a brief implementation plan.
- Identify files to create or modify.
- Outline the logic flow (Route -> Service -> Uploader).
- **Tool**: Use `core.md` (Rule) context to ensure architectural alignment.

## Step 3: Implementation
Execute the changes.
- **Context**: Activate the `Implementer Persona` (via system prompt or rule).
- **Action**: Create/Edit files.
- **Guidance**: Check `style.md` (Rule) for conventions.

## Step 4: Verification
Verify the changes.
- **Action**: Run relevant tests using `dev-toolkit` (Skill).
- **Prompt**: "Run tests for the modified components."
- **Example**: `npm run test:backend` or `pytest tests/test_new_feature.py`.

## Step 5: Final Review
Ask the user to review the changes and potential side effects.
