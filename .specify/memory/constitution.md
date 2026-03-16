<!--
Sync Impact Report:
- Version change: 1.2.0 → 2.0.0
- List of modified principles:
    - I. Dual-Backend Architecture Parity → I. Primary Node.js Architecture (Python Deprecated)
    - III. Platform Uploader Isolation (Removed Python paths)
    - IV. Comprehensive Multi-Stack Testing (Python tests now optional/deprecated)
    - V. Concurrency & Real-Time Feedback (Removed Python threading details)
    - VI. Monorepo Consistency & Dependency Discipline (Removed Python pip details)
- Added sections: None.
- Removed sections: None.
- Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ updated (Removed dual-backend parity check)
    - .specify/templates/tasks-template.md: ✅ updated (Removed Python path conventions)
- Follow-up TODOs: None.
-->

# OmniPost Constitution

注意: 所有回答和内容都用中文.

## Core Principles

### I. Primary Node.js Architecture (Python Deprecated)
OmniPost 正在向单一的 Node.js/TypeScript 架构演进。原有的 Python Flask 后端 (`apps/backend`) 已被标注为 **过时 (Deprecated)**，将不再获得功能更新或积极维护。所有新功能、错误修复和性能改进必须优先在 Node.js 后端 (`apps/backend-node`) 中实现。Node.js 版本必须作为项目的标准生产版本。

### II. Unified Three-Layer Backend Pattern
所有后端服务（特别是 Node.js）必须遵循 Routes → Services → Uploaders 模式。Routes 处理 HTTP 请求和响应格式；Services 编排业务逻辑和状态；Uploaders 管理平台特定的 Playwright 自动化。这种分离确保了核心业务逻辑的清晰和可维护性。

### III. Platform Uploader Isolation
每个社交平台必须拥有其独立的上传器实现。在 Node.js 中，这位于 `apps/backend-node/src/uploader/`。上传器必须是无状态的，并负责其自身的 Playwright 上下文清理。共享的自动化逻辑必须抽象到 `utils` 或基类中，绝不允许在上传器之间直接调用。

### IV. Comprehensive Node.js Testing (NON-NEGOTIABLE)
由于 Python 后端已过时，所有新功能和平台更新**必须**包含针对 Node.js 后端的完整自动化测试（使用 `Vitest`）。Python 后端的测试不再作为强制要求，除非涉及对现有遗留代码的紧急修复。CI/CD 流体必须优先确保 Node.js 后端的所有测试通过。

### V. Concurrency & Real-Time Feedback
长运行的发布任务必须异步运行，以避免阻塞 API 请求-响应周期。Node.js 必须利用其 **异步事件循环编排**（通过 `setImmediate` 或 Promises）来处理浏览器自动化和上传等 IO 密集型任务，从而以最小的开销最大化吞吐量。实时状态更新必须通过服务器发送事件 (SSE) 交付。

### VI. Monorepo Consistency & Dependency Discipline
依赖项必须严格在其各自的工作空间内管理。`apps/frontend` 和 `apps/backend-node` 使用 npm。项目结构应保持一致，并共享通用的资产（如 `stealth.min.js`）。根级别的 `package.json` 脚本应作为开发、测试和部署的主要接口。

## Security & Data Integrity

Cookies 和敏感的账号凭据必须安全地存储在对应后端的 `data/cookies` 目录中，并必须通过 `.gitignore` 排除在版本控制之外。代码库中不允许出现硬编码的秘密或个人访问令牌。所有特定于环境的配置必须存在于 `.env` 文件中。

## Development Workflow

所有开发必须遵循 "Research -> Strategy -> Execution" 生命周期。每一项非琐碎的更改都需要一份规范 (Specification) 和一份实现计划 (Implementation Plan)。必须激活 `husky` 预提交钩子以确保符合 linting 和格式化规范。所有拉取请求必须遵守 Conventional Commits 规范。

## Governance

本宪法是 OmniPost 开发的基础文件，优于所有其他项目特定的实践。对本文档的修订需要 MAJOR 版本提升。所有架构决策，特别是涉及后端演进的决策，必须根据这些原则进行验证。

**Version**: 2.0.0 | **Ratified**: 2024-05-22 | **Last Amended**: 2024-05-22
