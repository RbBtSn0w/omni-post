# GitHub 自动化工作流配置指南

本项目已完整配置 GitHub Actions 自动化工作流，涵盖 CI/CD、代码质量、安全检查等方面。

## 📋 已配置的工作流

### 第一阶段：核心自动化 ✅

#### 1. **test.yml** - 自动化测试
- **触发条件**：Push 和 PR 到 main/develop 分支
- **任务**：
  - 运行后端单元测试 (pytest)
  - 运行前端单元测试 (vitest)
- **状态显示**：PR 中直接显示测试结果 ✓/✗

#### 2. **lint-backend.yml** - 后端代码质量
- **触发条件**：修改 `apps/backend/` 目录
- **检查项**：
  - Black 代码格式化
  - isort 导入排序
  - Flake8 PEP8 检查
  - Pylint 静态检查
- **特点**：允许继续执行，不阻断 PR

#### 3. **lint-frontend.yml** - 前端代码质量
- **触发条件**：修改 `apps/frontend/` 目录
- **检查项**：
  - ESLint 代码检查
  - Vue 组件验证
  - 构建完整性检查

---

### 第二阶段：开发流程优化 ✅

#### 4. **PR Template** - 提交清单
- **位置**：`.github/pull_request_template.md`
- **内容**：
  - PR 类型分类（Bug、Feature、Docs 等）
  - 变更检查清单
  - 代码质量要求
  - 测试覆盖要求
  - 文档更新要求
- **效果**：每个 PR 自动显示标准化模板

#### 5. **coverage.yml** - 代码覆盖率报告
- **触发条件**：修改代码
- **功能**：
  - 计算后端测试覆盖率
  - 计算前端测试覆盖率
  - 上传到 Codecov（可选）
  - PR 中显示覆盖率指标
- **集成**：可关联 Codecov 获得历史趋势图

---

### 第三阶段：进阶自动化 ✅

#### 6. **build.yml** - 构建验证
- **触发条件**：每次提交和 PR
- **验证内容**：
  - 后端导入验证
  - Flask 应用创建验证
  - 前端完整构建
  - 构建输出验证
- **用途**：确保代码能正确构建

#### 7. **security.yml** - 安全检查
- **触发条件**：修改依赖文件、周期性检查
- **检查工具**：
  - Python: Safety + Bandit
  - npm: npm audit + outdated 检查
- **扫描范围**：
  - 已知漏洞检测
  - 代码安全隐患
  - 过期依赖提示

#### 8. **changelog.yml** - 变更日志自动生成
- **触发条件**：Push 到 main 分支
- **功能**：
  - 自动从 Git 提交生成变更记录
  - 支持版本标签管理
- **输出**：可用于 Release 说明

#### 9. **quality.yml** - 代码质量分析
- **触发条件**：Push 和 PR
- **分析项**：
  - 圈复杂度 (Cyclomatic Complexity)
  - 可维护性指数 (Maintainability Index)
  - 代码行数统计
  - 重复代码检测

---

## 🚀 使用指南

### 查看工作流状态

1. **在 PR 页面查看**
   - 所有 checks 会在 PR 页面显示
   - 点击「Details」查看详细结果
   - 标记 ✓ 表示通过，✗ 表示失败

2. **在 Actions 页面查看**
   - 访问 GitHub 仓库 → Actions
   - 选择具体工作流查看执行历史
   - 点击具体 Run 查看日志

### 常见场景

#### 场景 1：Push 代码后检查状态
```
1. 创建 PR 或 Push 到 develop
2. 等待 GitHub Actions 执行（通常 2-5 分钟）
3. PR 页面会显示各工作流的执行状态
4. 所有 checks 通过后才能合并
```

#### 场景 2：PR 有不通过的检查
```
后端代码风格错误：
1. 查看 lint-backend 的详细输出
2. 本地运行 `npm run lint:backend` 修复
3. 或手动运行 `black src/` 和 `isort src/`
4. 重新 Push，GitHub Actions 自动重新运行

前端测试失败：
1. 查看 test 工作流的详细输出
2. 本地运行 `npm run test:frontend` 调试
3. 修复后重新 Push
```

#### 场景 3：依赖有安全漏洞
```
1. security 工作流会列出有问题的包
2. 更新依赖版本
3. 运行本地测试确保兼容
4. Push 触发自动检查
```

---

## 🔧 工作流自定义

### 禁用某个工作流

编辑 `on:` 部分或添加条件：

```yaml
on:
  push:
    branches: [ main, develop ]
    # 排除某些文件
    paths-ignore:
      - 'docs/**'
      - '**.md'
```

### 修改触发分支

```yaml
on:
  push:
    branches: [ main, develop, feature/* ]
```

### 添加计划执行

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 每天 2:00 UTC 执行
```

---

## 📊 工作流概览

| 工作流 | 触发时机 | 执行时间 | 优先级 |
|------|--------|--------|------|
| test.yml | Push/PR | 3-5 分钟 | 🔴 必须 |
| lint-backend.yml | 后端改动 | 2-3 分钟 | 🟠 推荐 |
| lint-frontend.yml | 前端改动 | 2-3 分钟 | 🟠 推荐 |
| build.yml | Push/PR | 2-3 分钟 | 🟠 推荐 |
| coverage.yml | 代码改动 | 3-5 分钟 | 🟡 可选 |
| security.yml | 依赖改动 | 2-3 分钟 | 🟠 推荐 |
| changelog.yml | Push 到 main | 1 分钟 | 🟡 可选 |
| quality.yml | Push/PR | 2-3 分钟 | 🟡 可选 |

---

## 💡 最佳实践

### 1. 本地先检查再 Push

```bash
# 提交前本地运行
npm test              # 运行所有测试
npm run lint          # 运行 lint
npm run build         # 构建验证
```

### 2. 编写清晰的 Commit Message

工作流会使用 commit message 生成变更日志：
```
feat: Add new feature description
fix: Fix bug description
docs: Update documentation
test: Add test cases
refactor: Code refactor description
```

### 3. PR 使用提供的模板

- 按模板逐项填写
- 使用 check boxes 标记完成项
- 附加相关的 Issue 号

### 4. 定期检查依赖更新

- security.yml 会定期检查
- 及时更新有漏洞的依赖
- 合并安全补丁

### 5. 监控覆盖率趋势

- 关注 coverage.yml 报告
- 新功能应提供测试覆盖
- 尽量不降低整体覆盖率

---

## 🆘 常见问题

### Q: 工作流总是失败怎么办？
A:
1. 检查 GitHub Actions 的详细日志
2. 尝试在本地复现错误
3. 查看是否有环境依赖问题
4. 提交 Issue 讨论

### Q: 如何跳过某个工作流？
A: 在 commit message 中添加：
```
[skip ci]  # 跳过所有工作流
[skip test]  # 仅用于紧急情况，不推荐
```

### Q: 工作流执行时间太长？
A:
- 检查是否有网络超时
- 考虑优化依赖安装缓存
- 并行多个任务

### Q: 如何在本地模拟 GitHub Actions？
A: 使用 act 工具：
```bash
# 安装 act
brew install act

# 运行特定工作流
act -j backend-test
```

---

## 📚 相关资源

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [工作流语法参考](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Act - 本地运行 Actions](https://github.com/nektos/act)
- [Codecov 集成](https://docs.codecov.io/docs/github)

---

## 📝 维护说明

### 定期检查

- 每月检查一次工作流执行状态
- 关注 security 工作流的警告
- 监控 coverage 趋势

### 更新工作流

当项目依赖或结构变化时：
1. 更新 Python 版本 → test.yml
2. 更新 Node 版本 → 所有 JS 工作流
3. 添加新测试框架 → 相应工作流
4. 修改目录结构 → 更新 paths 条件

---

**最后更新**：2025-01-14
**版本**：1.0
**维护者**：项目贡献者
