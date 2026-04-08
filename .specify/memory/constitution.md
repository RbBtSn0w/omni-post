<!--
Sync Impact Report:
- Version change: 2.2.0 → 2.3.0
- List of modified principles:
    - Development Workflow: Refactored to focus on high-level mandates (R-S-E, Testing, Commits) while offloading operational "How-to" to AGENTS.md.
- Added sections: None.
- Removed sections: Detailed operational "How-to" from Development Workflow (moved to AGENTS.md).
- Templates requiring updates: ✅ updated / ⚠ pending: AGENTS.md (updated).
- Notes: Structural refactoring into "Two-Layer Governance" (Constitution = Principles, AGENTS.md = Operational Instructions).
-->

# OmniPost Constitution

## Core Principles

### I. Node.js First, Python by Exception
`apps/backend-node` 是 OmniPost 唯一的默认实现和维护目标。所有新功能、缺陷修复、性能优化和架构演进必须优先落在 Node.js/TS 后端。`apps/backend` 仅作为遗留兼容或迁移参考，除非需求明确指向遗留兼容修复，否则不得把 Python 后端作为默认交付路径。

**理由**：项目当前的任务执行、文章发布和浏览器会话能力均以 Node.js 实现为主，继续分散投资会直接增加回归面和维护成本。

### II. Route-Service-Uploader Boundaries
后端实现必须遵循 `Routes -> Services -> Uploaders` 分层。Routes 只负责 HTTP 协议、参数校验和响应格式；Services 负责任务编排、状态流转和业务规则（包括扩展注册与调度）；Uploaders 只负责平台自动化执行（包括 Playwright 浏览器自动化和 OpenCLI 动态桥接）。禁止在路由层写入平台自动化逻辑，禁止在上传器中直接处理 HTTP 请求对象。

**理由**：清晰边界是控制发布流程复杂度、隔离平台波动、保证可测试性的前提。扩展机制（OpenCLI）必须融入这套标准生命周期。

### III. Platform Isolation & Automation Discipline
每个内置平台必须拥有独立上传器入口。上传器必须保持平台内聚、无跨平台直接调用。对于 Playwright 自动化，必须负责自身资源清理，诊断自动化回归时，必须先基于真实页面行为、网络请求或 `opencli-diagnostics` 流程收集证据，再修改选择器或硬编码流程。对于动态扩展平台（OpenCLI Bridge），必须严格遵循 OCS 标准，依赖注册中心进行调用，禁止绕开调度框架直接执行外部脚本。

**理由**：平台 UI 变化频繁，未经统一诊断或管控直接打补丁会把问题从单点失败扩大为系统性脆弱。

### IV. Shared Package SSOT & Monorepo Discipline
平台 ID、共享类型、实体接口和公共映射必须从 `@omni-post/shared` 引入，不得在前后端或工具链中定义本地副本。工作区依赖必须在所属 workspace 中维护，根级脚本必须作为标准开发入口。新增共享约束时，必须同步更新 shared 包并让消费方通过编译或测试验证。

**理由**：Monorepo 的核心收益来自单一事实来源；重复定义会直接导致平台映射、任务结构和接口契约漂移。

### V. Asynchronous Execution & Real-Time State
登录、上传、发布和批处理任务必须以异步后台执行方式运行，不得阻塞请求响应周期。任务状态、进度和取消信号必须通过统一任务服务与实时反馈机制表达；登录流程必须保留 SSE 风格的状态流能力；发布任务必须能够被轮询或查询到明确状态。

**理由**：浏览器自动化是高延迟 IO 过程，只有异步编排和统一状态管理才能保证吞吐、可观测性和前端交互稳定性。

### VI. Test Coverage & Regression Gates (NON-NEGOTIABLE)
所有面向 Node 主路径的功能变更必须附带对应测试或对现有测试进行扩展。涉及平台分发、任务状态、共享类型、数据库迁移或自动化流程的变更，必须补充回归验证。禁止在未通过测试的情况下合并任何核心路径修改。

**理由**：OmniPost 的主要风险来自跨层编排和平台回归，没有测试约束就无法稳定迭代。

## Security & Data Integrity

- **凭据隔离**：Cookie、配置文件、账号凭据必须通过 `.gitignore` 排除，禁止硬编码任何密钥。
- **路径安全**：文件操作必须使用安全路径辅助方法，防止路径穿越。
- **结构稳定**：任务持久化字段（platforms, file_list 等）必须保持结构稳定并严格对齐共享类型。

## Development Workflow Mandates

所有非琐碎修改必须遵循以下硬性流程要求，具体执行细节见 `AGENTS.md`：
1. **研究优先**：必须在修改前确认影响范围。
2. **策略对齐**：必须在执行前对齐架构设计与 Constitution 原则。
3. **分阶段交付**：采用 R-S-E (Research -> Strategy -> Execution) 生命周期。
4. **规范提交**：遵循 Conventional Commits 标准。

## Governance

本宪章是项目的最高治理准则。每次规范制定、计划拆解和代码评审都必须以本宪章原则为依据。

**版本策略**：
- MAJOR：修改核心原则或重新定义交付路径。
- MINOR：新增原则或扩展现有原则适用范围。
- PATCH：排版修正或措辞澄清。

**Version**: 2.3.0 | **Ratified**: 2024-05-22 | **Last Amended**: 2026-04-07
