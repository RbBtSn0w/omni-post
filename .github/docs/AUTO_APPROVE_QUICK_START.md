# 自动批准工作流程 - 快速指南

## 问题
每次 Copilot 或其他机器人创建 PR 时，工作流程都需要手动批准，这很繁琐。

## 解决方案
我们添加了一个新的工作流程 `auto-approve-workflows.yml`，它可以自动批准来自可信机器人（Copilot、Dependabot）的工作流程运行。

## 快速开始

### 当前状态（默认配置）
- ✅ 工作流程已创建并会运行
- ⚠️ 使用默认 `GITHUB_TOKEN`，**权限不足，无法实际批准工作流程**
- ℹ️ 您会在日志中看到提示信息，但工作流程仍需手动批准

### 启用自动批准（需要额外配置）

要使自动批准真正工作，您需要配置一个具有足够权限的令牌：

**推荐方式：GitHub App（最安全）**
1. 创建 GitHub App（Actions: Read/Write 权限）
2. 安装到仓库
3. 添加 `APP_ID` 和 `APP_PRIVATE_KEY` 密钥
4. 更新工作流程使用 App 令牌

**备选方式：个人访问令牌（PAT）**
1. 创建细粒度 PAT（Actions: Read/Write 权限）
2. 添加 `WORKFLOW_APPROVER_TOKEN` 密钥
3. 更新工作流程使用 PAT

📖 **详细配置说明：**
- 英文：[.github/docs/AUTO_APPROVE_SETUP.md](.github/docs/AUTO_APPROVE_SETUP.md)
- 中文：[.github/docs/AUTO_APPROVE_SETUP_CN.md](.github/docs/AUTO_APPROVE_SETUP_CN.md)

## 安全特性

✅ **安全检查：**
- 仅批准来自可信机器人的 PR（`copilot-autofix[bot]`、`github-copilot[bot]`、`dependabot[bot]`）
- 如果 PR 修改了工作流程文件（`.github/workflows/`），**自动跳过批准**
- 需要手动审查所有工作流程更改

## 工作原理

1. 当可信机器人创建 PR 时，触发 `auto-approve-workflows.yml`
2. 检查是否修改了工作流程文件
3. 如果安全，等待工作流程运行被创建
4. 自动批准所有待批准的工作流程运行
5. 其他工作流程开始自动运行

## 测试

创建一个来自 Copilot 的测试 PR，然后：
1. 检查 Actions 标签页中的 "Auto-Approve Workflows" 运行
2. 查看日志确认是否尝试批准
3. 如果配置了令牌，其他工作流程应该自动开始运行

## 故障排除

**工作流程运行但其他工作流程仍需批准？**
→ 您需要配置 GitHub App 或 PAT 令牌（见上文）

**工作流程没有运行？**
→ 确保 PR 来自可信机器人账户

**显示"跳过批准"消息？**
→ PR 修改了工作流程文件，需要手动审查（这是安全功能）

## 文件说明

- `.github/workflows/auto-approve-workflows.yml` - 自动批准工作流程
- `.github/docs/AUTO_APPROVE_SETUP.md` - 详细配置指南（英文）
- `.github/docs/AUTO_APPROVE_SETUP_CN.md` - 详细配置指南（中文）
- `.github/WORKFLOWS.md` - 所有工作流程的完整文档

---

**注意：** 这是一个可选功能。如果您不配置令牌，工作流程仍会运行但不会实际批准，您仍需手动批准。但工作流程已准备就绪，当您准备启用自动批准时，只需添加令牌即可。
