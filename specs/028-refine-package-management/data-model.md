# Data Model: Workspace & Package Management

## 实体定义

### 1. Workspace (工作空间)
*   **root**: 根目录，包含主 `package.json`。
*   **packages**: 匹配模式数组（如 `apps/*`, `packages/*`）。
*   **global_scripts**: 跨包执行的命令。

### 2. Package (包/子项目)
*   **name**: 唯一标识（如 `@omni-post/frontend`）。
*   **version**: 遵循语义化版本。
*   **dependencies**: 私有或公有依赖。
*   **scripts**: 标准脚本集。

### 3. Script Model (脚本模型)
所有 Package 必须实现以下脚本：
*   `dev`: 启动开发服务器。
*   `build`: 编译产物。
*   `test`: 运行自动化测试。
*   `lint`: 代码风格检查。
*   `clean`: 清理构建目录。

## 状态与流转 (Hoisting)
1. **Detection**: 扫描所有子项目 `package.json`。
2. **Conflict Check**: 检查相同依赖的版本差异。
3. **Lift**: 将公共依赖移动至根目录，并在子项目中保留引用。

## 校验规则
*   所有 `apps/` 目录下的 package 必须设置 `"private": true`。
*   根目录 `package.json` 的 `workspaces` 必须包含 `packages/shared-config`。
