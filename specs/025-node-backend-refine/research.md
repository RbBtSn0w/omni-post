# Research: Node Backend Refine & Security Hardening

## 1. ESM 模块后缀强制 (ESM Module Suffix Enforcement)

### 决策 (Decision)
在 TypeScript 源代码中手动补全 `.js` 后缀，并配置 ESLint 规则 `import/extensions` (通过 `eslint-plugin-import`) 进行强制检查。

### 理由 (Rationale)
Node.js 在 ESM 模式 (`type: module`) 下运行编译后的代码时，不会像 CommonJS 那样自动尝试补全文件扩展名。虽然 TypeScript 支持在导出时自动添加后缀，但在源代码中显式编写 `.js`（即使物理文件是 `.ts`）是目前社区公认且最稳定的跨平台 ESM 兼容方案。

### 替代方案 (Alternatives considered)
- **tsc-alias**: 主要解决路径别名，无法完美补全所有内部导入的扩展名。
- **ts-node/esm**: 仅适用于开发运行，生产环境部署后的编译产物仍需后缀。

---

## 2. 路径穿越防护 (Path Traversal Protection)

### 决策 (Decision)
在所有文件操作路由中，统一使用 `path.resolve(baseDir, inputPath)` 获取解析后的绝对路径，并验证该路径是否以 `baseDir` 开头。

### 理由 (Rationale)
单纯使用 `path.join` 无法防御 `..` 逃逸攻击。通过 `path.resolve` 规范化物理路径后，利用 `startsWith` 进行白名单目录校验是最健壮的防御手段。

### 替代方案 (Alternatives considered)
- **正则校验**: 容易遗漏编码绕过或特定系统的路径分隔符差异。
- **chroot**: 过于重型且不适合单机桌面级应用。

---

## 3. SQLite 测试环境隔离与清理

### 决策 (Decision)
在 Vitest 的 `setup` 和 `teardown` 钩子中，使用 `fs.rmSync(tempDir, { recursive: true, force: true })` 递归删除包含数据库文件的整个临时目录。

### 理由 (Rationale)
SQLite 在开启 WAL 模式后会产生 `-wal` 和 `-shm` 辅助文件。如果仅删除 `.db` 文件，辅助文件残留会导致后续测试因文件锁定而失败。递归删除整个目录是确保测试原子性的最佳实践。

---

## 4. GitHub Actions CI 优化与门禁

### 决策 (Decision)
在 CI 中集成 `npm audit` 高级别拦截，并配置 `actions/cache` 缓存 `~/.npm` 目录。同时确保 Coverage 报告以 JSON/LCOV 格式生成以供分析。

### 理由 (Rationale)
当前的 CI 未能有效拦截安全风险。通过增加 npm 审计和强制 Lint/TSC 检查，可以确保代码质量不因重构而退化。
