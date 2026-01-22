# 自动批准工作流程设置指南

本指南说明如何配置 GitHub Actions 工作流程，以便自动批准来自可信来源（Copilot、Dependabot 等）的 PR 工作流程运行。

## 📋 概述

默认情况下，GitHub 对以下情况触发的工作流程需要手动批准：
- 来自 fork 的 Pull Request
- 来自首次贡献者的 Pull Request  
- **来自 GitHub Copilot 的 Pull Request**（2025年新安全策略）

`auto-approve-workflows.yml` 工作流程会尝试自动批准这些来自可信机器人账户的工作流程运行，在保持安全性的同时减少人工操作。

## 🔒 安全考虑

**重要：** 此工作流程包含安全检查：
- ✅ 仅批准来自明确可信的机器人账户的 PR
- ✅ 如果修改了任何 `.github/workflows/` 文件，**跳过批准**
- ✅ 工作流程更改需要手动审查

**可信账户：**
- `copilot-autofix[bot]`
- `github-copilot[bot]`
- `dependabot[bot]`

要添加更多可信账户，请编辑工作流程的 `if` 条件。

## ⚙️ 配置选项

### 选项 1：使用默认 GITHUB_TOKEN（功能有限）

工作流程默认配置为使用 `GITHUB_TOKEN`，但此令牌具有**有限权限**，在大多数情况下**无法批准工作流程运行**。

**结果：** 工作流程将运行并尝试批准，但会因权限错误而失败。您将在工作流程日志中看到提示信息。

**何时使用：** 用于测试或您希望稍后启用工作流程而无需立即更改。

### 选项 2：配置 GitHub App 令牌（推荐）

GitHub App 提供细粒度权限，是最安全的选项。

#### 步骤：

1. **创建 GitHub App：**
   - 转到 Settings → Developer settings → GitHub Apps → New GitHub App
   - **名称：** `Workflow Auto-Approver`（或您选择的名称）
   - **Webhook：** 禁用（取消选中"Active"）
   - **权限：**
     - Repository permissions:
       - Actions: Read and write
       - Pull requests: Read-only
       - Contents: Read-only
   - **安装位置：** Only on this account
   - 点击 "Create GitHub App"

2. **安装应用：**
   - 创建后，点击 "Install App"
   - 选择您的仓库
   - 点击 "Install"

3. **创建私钥：**
   - 在应用设置中，滚动到 "Private keys"
   - 点击 "Generate a private key"
   - 安全保存下载的 `.pem` 文件

4. **获取 App ID：**
   - 记下应用设置中显示的 App ID（页面顶部）

5. **添加密钥到仓库：**
   - 转到您的仓库 → Settings → Secrets and variables → Actions
   - 添加两个密钥：
     - `APP_ID`: 您的 GitHub App ID
     - `APP_PRIVATE_KEY`: `.pem` 文件的内容

6. **更新工作流程：**
   - 修改 `.github/workflows/auto-approve-workflows.yml`
   - 将 `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` 行替换为：
     ```yaml
     - name: Generate GitHub App Token
       id: generate-token
       uses: actions/create-github-app-token@v1
       with:
         app-id: ${{ secrets.APP_ID }}
         private-key: ${{ secrets.APP_PRIVATE_KEY }}
     
     # 然后在后续步骤中使用：
     env:
       GH_TOKEN: ${{ steps.generate-token.outputs.token }}
     ```

### 选项 3：使用个人访问令牌（PAT）

如果您不想创建 GitHub App，可以使用具有写入权限的用户的 PAT。

⚠️ **警告：** PAT 与用户账户绑定，具有更广泛的权限。请谨慎使用。

#### 步骤：

1. **创建细粒度 PAT：**
   - 转到 Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - 点击 "Generate new token"
   - **仓库访问：** Only select repositories → 选择您的仓库
   - **权限：**
     - Actions: Read and write
     - Pull requests: Read-only
     - Contents: Read-only
   - **过期时间：** 设置为 1 年或更短（必须轮换）
   - 点击 "Generate token" 并复制令牌

2. **添加密钥到仓库：**
   - 转到您的仓库 → Settings → Secrets and variables → Actions
   - 添加密钥：
     - 名称: `WORKFLOW_APPROVER_TOKEN`
     - 值: 您的 PAT

3. **更新工作流程：**
   - 修改 `.github/workflows/auto-approve-workflows.yml`
   - 将 `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` 替换为：
     ```yaml
     GH_TOKEN: ${{ secrets.WORKFLOW_APPROVER_TOKEN }}
     ```

## 🧪 测试

配置后，测试工作流程：

1. 从 GitHub Copilot 创建测试 PR 或手动触发 dependabot
2. 在 Actions 标签页中检查 "Auto-Approve Workflows" 运行
3. 查看工作流程日志以确认批准成功
4. 验证其他工作流程自动开始运行

## 🔍 故障排除

### 工作流程运行但不批准

**症状：** 工作流程完成，但其他工作流程仍需要批准。

**解决方案：** 
- 检查您是否配置了 GitHub App 令牌或 PAT（选项 2 或 3）
- 验证令牌具有 `actions: write` 权限
- 查看工作流程日志以获取具体错误消息

### 工作流程未触发

**症状：** 创建 PR 时自动批准工作流程不运行。

**解决方案：**
- 确保 PR 来自可信账户（copilot、dependabot）
- 检查 `pull_request_target` 事件是否被分支保护阻止
- 验证工作流程文件语法有效

### 关于工作流程文件更改的安全警告

**症状：** 工作流程跳过批准，显示关于工作流程文件的消息。

**解决方案：** 
- 这是出于安全考虑的预期行为
- 手动审查工作流程更改
- 手动批准工作流程运行

## 📚 其他资源

- 完整的英文文档：`.github/docs/AUTO_APPROVE_SETUP.md`
- [GitHub 文档：批准来自 fork 的工作流程运行](https://docs.github.com/zh/actions/managing-workflow-runs/approving-workflow-runs-from-public-forks)
- [GitHub Apps 文档](https://docs.github.com/zh/apps)

## 💡 最佳实践

1. **定期审查已批准的运行** - 定期检查 Actions 标签页
2. **保持可信账户列表最小** - 仅添加完全信任的账户
3. **监控异常活动** - 为工作流程失败设置通知
4. **轮换令牌** - 如果使用 PAT，在过期前轮换
5. **先在 fork 中测试** - 在部署到主仓库之前验证配置

---

**最后更新：** 2026-01-22  
**维护者：** 项目贡献者
