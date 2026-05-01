# Feature Specification: fix-bilibili-publish-error

**Feature Branch**: `037-fix-bilibili-publish-error`  
**Created**: 2026-04-30  
**Status**: Draft  
**Input**: User description: "排查并修复 B 站视频发布过程中 ReferenceError: BilibiliUploader is not defined 导致页面关闭的问题"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 成功重试并完成 B 站视频发布 (Priority: P1)

作为一名创作者，当我发现 B 站发布失败并点击“重试”时，系统应该能够正确执行发布流程，而不是因为内部错误（如 ReferenceError）而意外关闭页面。

**Why this priority**: 核心功能修复，直接影响用户发布体验，防止发布流程中断。

**Independent Test**: 在 B 站发布页面，点击“重试”按钮，观察系统是否能正常进行“立即投稿”并进入管理页面。

**Acceptance Scenarios**:

1. **Given** 一个失败的 B 站发布任务, **When** 点击重试按钮, **Then** 任务状态变为“上传中/进行中”，且不会因为 `BilibiliUploader is not defined` 报错而关闭页面。
2. **Given** 任务进入投稿阶段, **When** 点击“立即投稿”按钮, **Then** 能够正常读取按钮状态，触发投稿请求，并最终跳转到稿件管理页。

---

### Edge Cases

- **浏览器上下文环境**: 在 Playwright 的 `evaluate` 函数中，必须确保所有外部变量和常量都通过参数传递，否则会报 `ReferenceError`。
- **发布按钮不可点击**: 如果“立即投稿”按钮处于禁用状态（如上传未完成或参数缺失），系统应能正确诊断原因并重试，而不是崩溃。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须能够正确读取 B 站发布按钮的状态（TagName, Text, ClassName, Disabled 等）。
- **FR-002**: 在浏览器上下文执行代码时，严禁直接引用 Node.js 端的类名（如 `BilibiliUploader`）。
- **FR-003**: 诊断信息中的文本长度限制（DIAGNOSTIC_TEXT_LIMIT）必须通过参数安全传递给浏览器环境。
- **FR-004**: 发生非预期错误时，应记录详细的诊断日志后再进行后续处理（如关闭页面）。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 消除 `ReferenceError: BilibiliUploader is not defined` 报错。
- **SC-002**: B 站发布任务重试成功率提升至预期水平（排除网络和平台风控因素）。
- **SC-003**: 投稿阶段的按钮诊断日志能够正常输出，不包含 ReferenceError。

## Assumptions

- **Playwright 环境**: 假设 Playwright 能够正常驱动浏览器并执行注入的 JS 代码。
- **B 站页面结构**: 假设 B 站“立即投稿”按钮的相关 DOM 结构没有发生破坏性的变更，现有的选择器依然有效。
