# Implementation Plan: Optimize and refine workspace package management

**Branch**: `028-refine-package-management` | **Date**: 2024-05-22 | **Spec**: [/specs/028-refine-package-management/spec.md](./spec.md)
**Input**: Feature specification from `/specs/028-refine-package-management/spec.md`

## Summary

本特性的核心是重构和标准化 OmniPost 的 Monorepo 工作空间管理。通过统一根目录脚本、规范子应用 `package.json` 结构、优化依赖提升（Hoisting）逻辑，解决目前包管理场景混乱的问题，提升开发和构建效率。

## Technical Context

**Language/Version**: Node.js 20+ LTS, TypeScript 5.x  
**Primary Dependencies**: npm workspaces, husky, lint-staged, eslint, prettier  
**Storage**: N/A (Build infra only)  
**Testing**: Vitest (用于验证工作空间配置脚本)  
**Target Platform**: 所有开发及部署环境 (macOS/Linux/Windows)  
**Project Type**: Monorepo Infrastructure / DevOps  
**Performance Goals**: 依赖安装时间减少 20%，本地启动流程简化至 1 条命令  
**Constraints**: 必须兼容现有的 `apps/backend-node` 和 `apps/frontend` 结构，同时优雅处理 `apps/backend` (Python) 的集成  
**Scale/Scope**: 覆盖根目录及 `apps/*`, `packages/*` 下的所有 package

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I (Primary Node.js Architecture)**: 符合。本计划进一步强化了 Node.js 驱动的工作空间管理。
- [x] **Principle II (Pattern)**: N/A (基础设施变更不直接涉及 Routes/Services 模式)。
- [x] **Principle III (Isolation)**: 符合。设计确保各 package 依赖隔离，仅通过 workspace 协议引用。
- [x] **Principle IV (Node.js Testing)**: 符合。将增加对工作空间完整性的自动化检查脚本。
- [x] **Principle V (Concurrency)**: 符合。利用 npm 的并行执行能力优化构建。
- [x] **Principle VI (Monorepo)**: 符合。这是本特性的核心目标，直接响应宪法第六条原则。

## Project Structure

### Documentation (this feature)

```text
specs/028-refine-package-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (Package/Script definition)
├── quickstart.md        # Phase 1 output (Standard command guide)
├── contracts/           # Phase 1 output (Workspace structure contract)
└── tasks.md             # Phase 2 output
```

### Source Code Impact

```text
/
├── package.json         # 核心：重写 scripts 和 workspaces 定义
├── packages/
│   └── shared-config/   # 新增：集中管理 eslint/prettier/tsconfig 配置
├── apps/
│   ├── backend-node/    # 优化：同步 package.json 规范
│   └── frontend/        # 优化：同步 package.json 规范
```

**Structure Decision**: 引入 `packages/shared-config` 来消除各子项目间配置文件的重复，实现真正的配置 Hoisting。

## Complexity Tracking

*(无宪法违规事项)*
