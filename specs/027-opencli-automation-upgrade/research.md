# Research: Enhance Automation and Stability using OpenCLI Patterns

## 调研目标

1.  **浏览器会话复用 (Session Reuse)**: 探究 Playwright 如何在不同操作系统上可靠地加载现有的 Chrome 配置文件，并处理文件锁定问题。
2.  **Markdown 到 HTML 转换**: 确定后端转换库，确保在知乎、掘金等平台发布时格式一致。
3.  **CLI 架构设计**: 确定 CLI 工具的通信方式和输出控制。
4.  **平台自动化发现 (Platform Explorer)**: 借鉴 OpenCLI 的 `explore` 命令，确定在 OmniPost 中的落地方案。

## 调研结果

### 1. 浏览器会话复用 (Session Reuse)

*   **决策**: 使用 Playwright 的 `launchPersistentContext`。
*   **技术细节**:
    *   **路径定位**: 需允许用户在 UI/CLI 中指定 `userDataDir`。
    *   **操作系统默认路径**:
        *   Windows: `%LOCALAPPDATA%\Google\Chrome\User Data`
        *   macOS: `~/Library/Application Support/Google/Chrome`
        *   Linux: `~/.config/google-chrome`
    *   **锁定处理**: 如果 Chrome 已打开，Playwright 无法启动。系统需捕获 `Error: browserType.launchPersistentContext: Profile is in use`，并提示用户关闭浏览器或使用副本。
*   **最佳实践**: 建议引导用户创建一个专门用于自动化的 Chrome 配置文件，或提醒用户在自动化运行时关闭该配置文件的所有窗口。

### 2. Markdown 转换策略

*   **决策**: 使用 `unified` 生态系统 (`remark-parse`, `remark-rehype`, `rehype-stringify`)。
*   **Rationale**:
    *   高度插件化，支持 GFM (GitHub Flavored Markdown)。
    *   能精确控制 HTML 输出，适应不同平台的编辑器。
    *   对于图片路径，需在转换过程中提取并使用各平台的图床 API 进行上传替换。

### 3. CLI 工具架构

*   **决策**: 基于 `commander` 构建，通过 `axios` 调用本地后端 API。
*   **设计**:
    *   **配置管理**: 在用户目录下存储 API 地址和凭据。
    *   **输出控制**: 默认友好文本输出，通过 `--json` 参数支持结构化输出，方便 CI/CD 或脚本调用。
    *   **交互模式**: 使用 `inquirer` 或 `prompts` 处理关键交互（如选择账号、确认发布）。

### 4. 平台探索逻辑 (Platform Explorer)

*   **方案**: 实现一个基础版的 Probe 工具。
*   **步骤**:
    1.  使用 Playwright 打开目标 URL。
    2.  注入探测脚本，自动寻找具有 `type="file"` 的 input、常见的“发布”按钮选择器、标题输入框。
    3.  记录页面上的关键 XHR 请求，识别发布文章/视频的 API 端点。
    4.  输出一个初步的 YAML 格式适配器草案，供开发者进一步调整。

## 结论

所有关键技术路径均已明确。技术选型符合 Node.js 生态标准及项目宪法。
