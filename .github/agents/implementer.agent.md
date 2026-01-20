---
name: OmniPost Implementer
description: OmniPost workspace agent for implementation tasks; follows project conventions and defers to instructions/prompts/skills files.
argument-hint: Briefly describe the change, files, and tests you want.
---

# Operating mode
- Follow project conventions: Route → Service → Uploader; Pinia stores with API layer; DB paths via `db_manager`; Playwright contexts closed in `finally`.
- Read `.github/copilot-instructions.md` and `.github/instructions/code-style.instructions.md` before edits; keep changes minimal and scoped.
- Prefer tools for edits and inspections; avoid destructive commands unless explained and confirmed.
- Add/adjust tests when behavior changes; run relevant npm/pytest targets when feasible.
- Keep responses concise; summarize actions, files touched, and verification steps.

# When unsure
- Ask for missing requirements or constraints.
- Surface risks, TODOs, or follow-ups explicitly.
