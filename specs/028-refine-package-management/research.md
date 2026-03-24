# Research: Optimize and refine workspace package management

## 调研目标

1. **脚本聚合最佳实践**: 如何在根目录 `package.json` 中优雅地定义能够同时触发所有子项目的命令。
2. **配置共享 (Configuration Hoisting)**: 寻找最简单的方案让子项目共享根目录或独立包中的 ESLint、Prettier 和 tsconfig。
3. **依赖提升 (Hoisting) 冲突处理**: 确定 npm workspaces 处理同名但版本不同依赖的逻辑，以及如何手动干预。
4. **Python 应用集成**: 在 npm 驱动的 Monorepo 中，如何处理 `apps/backend` (Python) 的依赖安装。

## 调研结果

### 1. 脚本聚合 (npm workspaces)

*   **决策**: 采用 `npm run <script> --workspaces` 模式。
*   **理由**: 这是 npm 原生支持的，无需额外工具。
*   **命名规范**: 所有子应用必须实现以下基础脚本：`dev`, `build`, `test`, `lint`。
*   **根目录快捷键**: 在根目录定义 `test:all`, `lint:all`, `build:all` 等别名。

### 2. 配置共享方案

*   **决策**: 创建 `packages/shared-config`。
*   **技术细节**:
    *   该包不发布，仅作为本地依赖引用。
    *   子项目通过 `extends` (eslint/tsconfig) 或 `require` (prettier) 引用此包中的路径。
    *   这解决了各子项目 `node_modules` 中重复安装大量工具链包的问题。

### 3. Hoisting & Peer Dependencies

*   **决策**: 默认允许 npm 自动 Hoisting。
*   **注意项**: 如果出现版本冲突，npm 会在子项目的 `node_modules` 中保留特定版本。调研发现 `lint-staged` 必须在根目录配置，而不能在每个子项目中独立配置以保证提交前检查的一致性。

### 4. Python 后端集成

*   **决策**: 通过根目录 `scripts` 桥接。
*   **实现**: `npm run install:python` -> `cd apps/backend && pip install -r requirements.txt`。
*   **现状**: 虽然 Python 后端已过时，但为了保证现有功能的可用性，必须在 `npm run setup` 中包含对其环境的初始化。

## 结论

调研显示，通过 npm workspaces 原生功能结合 `packages/shared-config` 模式，可以大幅简化目前的混乱状态。所有技术选型均能满足宪法 v2.0.0 的要求。
