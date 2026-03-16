# Workspace Contract: Package Compliance

## 1. 结构契约 (Structure Contract)
每个子项目必须包含：
- `package.json`
- `README.md`
- 针对 TS 项目的 `tsconfig.json`（继承自共享配置）。

## 2. 命名规范 (Naming Convention)
- `apps/*`: 命名格式为 `@omni-post/[name]`。
- `packages/*`: 命名格式为 `@omni-post/shared-[name]`。

## 3. 依赖限制 (Dependency Rules)
- **禁止** 在子项目中手动安装 `typescript`、`eslint`、`prettier`（除非有版本特殊需求）。
- **必须** 通过 `workspace:*` 协议引用本地包。

## 4. 接口契约 (Interface Contract)
子项目向根目录暴露的统一接口即为 `scripts` 字段中的标准命令。
如果运行 `npm run build -w @omni-post/frontend` 失败，则视为违反契约。
