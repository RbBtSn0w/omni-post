# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Node.js 20+, TypeScript 5.x, Vue 3 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., Express, Playwright, Pinia, Element Plus or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., Vitest, frontend Vitest, package tests or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Web frontend, Node.js service, Chromium automation or NEEDS CLARIFICATION]
**Project Type**: [e.g., monorepo web app, backend service, shared package, CLI or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- `Node.js First`: 变更默认必须落在 `apps/backend-node`、`apps/frontend` 或 `packages/shared`；
  若涉及 `apps/backend`，必须写明遗留兼容原因。
- `Layer Boundaries`: 明确受影响代码位于 Routes、Services、Uploaders 的哪一层，
  并说明不会跨层混入职责。
- `SSOT`: 列出是否修改 `@omni-post/shared` 中的平台 ID、类型或公共映射；若否，
  说明现有共享定义已满足需求。
- `Async State`: 若涉及登录、上传、发布、任务查询或取消，说明后台执行与状态反馈路径。
- `Regression Gates`: 列出将新增或更新的测试，以及需同步更新的 README、架构文档或运行指南。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Monorepo web application (DEFAULT for OmniPost)
apps/backend-node/
├── src/
│   ├── routes/
│   ├── services/
│   └── uploader/
└── tests/

apps/frontend/
├── src/
│   ├── components/
│   ├── views/
│   ├── stores/
│   └── api/
└── tests/

packages/shared/
└── src/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
