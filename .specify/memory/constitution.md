<!--
Sync Impact Report:
- Version change: 2.2.0 → 2.3.0
- List of modified principles:
    - Development Workflow & Quality Gates: Refactored to delegate operational "How-to" (Research/Strategy/Execution) to AGENTS.md while keeping high-level governance requirements.
- Added sections: Governance now explicitly references AGENTS.md as the operational layer.
- Removed sections: Detailed operational steps in the workflow section.
- Notes: Aligned with the "Two-Layer Governance" principle.
-->

# OmniPost Constitution

## Core Principles

### I. Node.js First, Python by Exception
`apps/backend-node` 是 OmniPost 唯一的默认实现和维护目标。所有新功能、缺陷修复、
性能优化和架构演进必须优先落在 Node.js/TS 后端。`apps/backend`
仅作为遗留兼容或迁移参考，除非需求明确指向遗留兼容修复，否则不得把 Python
后端作为默认交付路径。

理由：项目当前的任务执行、文章发布和浏览器会话能力均以 Node.js
实现为主，继续分散投资会直接增加回归面和维护成本。

### II. Route-Service-Uploader Boundaries
后端实现必须遵循 `Routes -> Services -> Uploaders` 分层。Routes 只负责 HTTP
协议、参数校验和响应格式；Services 负责任务编排、状态流转和业务规则（包括扩展注册与调度）；
Uploaders 只负责平台自动化执行（包括 Playwright 浏览器自动化和 OpenCLI 动态桥接）。禁止在路由层写入平台自动化逻辑，禁止在上传器中
直接处理 HTTP 请求对象。

理由：清晰边界是控制发布流程复杂度、隔离平台波动、保证可测试性的前提。扩展机制（OpenCLI）必须融入这套标准生命周期。

### III. Platform Isolation & Automation Discipline
每个内置平台必须拥有独立上传器入口，位于
`apps/backend-node/src/uploader/<platform>/main.ts`。上传器必须保持平台内聚、
无跨平台直接调用。对于 Playwright 自动化，必须负责自身资源清理，诊断自动化回归时，必须先
基于真实页面行为、网络请求或 `opencli-diagnostics` 流程收集证据，再修改选择器
或硬编码流程。对于动态扩展平台（OpenCLI Bridge），必须严格遵循 OCS 标准，依赖注册中心进行调用，禁止绕开调度框架直接执行外部脚本。

理由：平台 UI 变化频繁，无论是 UI 自动化还是外部 CLI 调用，未经统一诊断或管控直接打补丁会把问题从单点失败扩大为系统性脆弱。

### IV. Shared Package SSOT & Monorepo Discipline
平台 ID、共享类型、实体接口和公共映射必须从 `@omni-post/shared` 引入，
不得在前后端或工具链中定义本地副本。工作区依赖必须在所属 workspace 中维护，
根级脚本必须作为标准开发入口。新增共享约束时，必须同步更新 shared 包并让消费方
通过编译或测试验证。

理由：Monorepo 的核心收益来自单一事实来源；重复定义会直接导致平台映射、
任务结构和接口契约漂移。

### V. Asynchronous Execution & Real-Time State
登录、上传、发布和批处理任务必须以异步后台执行方式运行，不得阻塞请求响应周期。
任务状态、进度和取消信号必须通过统一任务服务与实时反馈机制表达；登录流程必须保留
SSE 风格的状态流能力；发布任务必须能够被轮询或查询到明确状态。

理由：浏览器自动化是高延迟 IO 过程，只有异步编排和统一状态管理才能保证吞吐、
可观测性和前端交互稳定性。

### VI. Test Coverage & Regression Gates (NON-NEGOTIABLE)
所有面向 Node 主路径的功能变更必须附带对应测试或对现有测试进行扩展，至少覆盖受影响的
路由、服务或前端状态流之一。涉及平台分发、任务状态、共享类型、数据库迁移或自动化流程的
变更，必须补充回归验证。只有在需求明确为遗留 Python 修复时，才可以将 Python 测试作为主质量门。

理由：OmniPost 的主要风险来自跨层编排和平台回归，没有测试约束就无法稳定迭代。

## Security & Data Integrity

Cookie、浏览器配置文件、账号凭据和本地数据文件必须存放在受控目录中，并通过
`.gitignore` 排除。任何密钥、令牌或个人凭据都不得硬编码到仓库。文件系统操作必须优先使用
安全路径辅助方法。任务持久化字段如 `platforms`、`file_list`、`account_list`、
`schedule_data` 和 `publish_data` 在读写时必须保持结构稳定并与共享类型一致。

## Development Workflow & Quality Gates

所有非琐碎修改必须采用“文档先行”的 Spec-Kit 开发模式。代理必须在执行前通过规范 (Spec)、计划 (Plan) 和任务 (Tasks) 文档显式声明：

- **目标合规性**：验证改动是否符合 Node.js 优先原则及各层级边界。
- **影响评估**：识别对共享类型、平台映射、数据库结构或自动化诊断的潜在影响。
- **验证方案**：声明如何满足 Principle VI 的测试与回归义务。

质量门禁要求：
1. **宪章自检**：所有交付物必须通过宪章原则的符合性检查。
2. **文档同步**：代码变更必须伴随相关的 README 或架构文档更新。
3. **标准化提交**：必须遵循 Conventional Commits 规范。

具体的执行流程（Research/Strategy/Execution）和工具使用请参考 `AGENTS.md`。

## Governance

本宪章作为项目的最高治理准则，定义了“不可违反”的原则。`AGENTS.md` 继承本宪章，负责定义代理的运行细节与协作协议。

版本策略采用语义化版本：

- MAJOR：删除原则、重新定义既有强制约束，或引入会改变默认交付路径的治理变更。
- MINOR：新增原则、增加新强制章节，或显著扩展现有原则的适用范围（包括治理结构重组）。
- PATCH：仅做措辞澄清、排版修正或不改变执行含义的补充说明。

修订流程必须包含：

- 对变更原因、影响范围和版本升级理由的书面说明。
- 对 `.specify/templates/` 与相关运行文档的同步检查。
- 在宪章顶部维护 Sync Impact Report，记录已更新与待跟进项。

**Version**: 2.3.0 | **Ratified**: 2024-05-22 | **Last Amended**: 2026-04-07
