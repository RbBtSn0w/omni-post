<!--
Sync Impact Report:
- Version change: 2.3.0 → 2.4.0
- List of modified principles:
    - Entire document refactored to strictly adhere to the "Why/What" governance layer.
    - Workflow section now only defines "Requirements for Change" (What must be declared), delegating the "How" to AGENTS.md.
- Added sections: None.
- Removed sections: Detailed operational steps and tool usage.
- Notes: This file is the "North Star" for project integrity.
-->

# OmniPost Constitution

## Core Principles

### I. Node.js First, Python by Exception
`apps/backend-node` 是 OmniPost 唯一的默认实现和维护目标。
**约束**：除非显式指向遗留兼容性，否则所有新逻辑必须在 Node.js 环境中实现。
**理由**：维持单一技术栈以降低长期维护成本和回归风险。

### II. Strict Layer Boundaries
系统架构必须遵循 `Routes -> Services -> Uploaders` 的严格分层。
**约束**：路由层严禁包含业务逻辑；上传层严禁处理 HTTP 协议细节；跨层调用必须单向。
**理由**：解耦协议、业务与执行，确保系统在平台波动下的稳健性。

### III. Platform Isolation & Automation Discipline
每个平台必须逻辑隔离，位于独立目录。
**约束**：禁止跨平台直接调用。自动化诊断必须基于证据而非猜测。
**理由**：防止平台特定的修复演变为系统性的回归。

### IV. Single Source of Truth (SSOT)
所有共享定义（ID、类型、契约）必须存储在 `@omni-post/shared`。
**约束**：严禁在各包内维护本地副本。
**理由**：Monorepo 的完整性依赖于协议的一致性。

### V. Asynchronous Safety & Real-Time State
所有高延迟 I/O（登录、上传）必须采用异步后台模式。
**约束**：禁止阻塞请求周期。必须提供实时状态流或轮询能力。
**理由**：确保系统吞吐量和用户交互的流畅性。

### VI. Mandatory Test Coverage
功能变更必须伴随对应的回归测试。
**约束**：涉及核心链路（分发、状态、契约）的变更若无测试，则视为“未完成”。
**理由**：测试是防止架构衰退的唯一物理屏障。

## Data Integrity & Security

Cookie 和凭据必须存放在受控的安全目录中。严禁将任何敏感信息提交至版本控制系统。所有文件 I/O 必须通过经过验证的安全路径辅助方法。

## Governance & Precedence

1. **最高权威**：本宪章是项目的最高准则。任何文档（包括 `AGENTS.md`）如与本宪章冲突，以本宪章为准。
2. **两层治理**：
   - **Constitution** (Why/What): 定义不可违反的原则与硬性约束。
   - **AGENTS.md** (How): 定义代理的操作规程、工具链和协作协议。
3. **合规性检查**：所有 AI 代理在执行任务前必须通过宪章原则的自检。

**Version**: 2.4.0 | **Ratified**: 2024-05-22 | **Last Amended**: 2026-04-07
