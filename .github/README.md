# GitHub Actions 快速参考

## 📊 所有工作流一览

```
✅ test.yml              → 运行所有测试（必须通过）
✅ lint-backend.yml      → Python 代码质量检查
✅ lint-frontend.yml     → JavaScript/Vue 代码质量检查
✅ build.yml             → 构建验证
✅ coverage.yml          → 代码覆盖率报告
✅ security.yml          → 依赖安全检查
✅ changelog.yml         → 自动生成变更日志
✅ quality.yml           → 代码复杂度分析
```

## 🚀 快速开始

### 1. 创建 Pull Request 时
- GitHub 自动运行所有工作流
- 等待所有 checks 通过（绿色 ✓）
- 查看 PR 页面的「Checks」标签

### 2. 如果有失败的 checks

**后端 lint 失败**：
```bash
cd apps/backend
black src/          # 自动格式化
isort src/          # 整理导入
npm run lint:backend  # 再检查一次
```

**前端 lint 失败**：
```bash
cd apps/frontend
npm run lint        # 自动修复
```

**测试失败**：
```bash
npm run test        # 本地运行测试
npm run test:backend  # 仅后端
npm run test:frontend  # 仅前端
```

### 3. 合并 PR 前
- ✓ 所有 checks 都是绿色
- ✓ 代码审查已批准
- ✓ 没有冲突

## 📍 在哪里查看结果

### PR 页面
- 最直观的地方
- 显示所有 checks 状态
- 点击「Details」看详细日志

### Actions 页面
- 访问：GitHub 仓库 → Actions
- 查看所有工作流执行历史
- 导出日志用于调试

### 邮件通知
- 工作流失败时自动通知
- 订阅或取消订阅通知

## 🔧 本地快速检查

提交前运行（相当于 GitHub Actions）：

```bash
# 后端检查
cd apps/backend
black src/
isort src/
flake8 src/
python -m pytest

# 前端检查
cd apps/frontend
npm run lint
npm run test
npm run build

# 或在根目录一键检查
npm run lint
npm run test
```

## ⚡ 加速工作流

### 缓存依赖
工作流已配置自动缓存：
- Python venv
- npm node_modules

### 跳过工作流（仅文档更新）
```bash
git commit -m "docs: update readme [skip ci]"
```

## 📈 监控项目健康度

| 指标 | 来源 | 含义 |
|-----|------|------|
| Tests | test.yml | 功能是否正常 |
| Lint | lint-*.yml | 代码是否规范 |
| Coverage | coverage.yml | 测试覆盖程度 |
| Security | security.yml | 依赖是否安全 |
| Build | build.yml | 能否正确编译 |

## 💬 常见 commit message 例子

```bash
# 新功能
git commit -m "feat: Add user authentication"

# Bug 修复
git commit -m "fix: Resolve login timeout issue"

# 文档
git commit -m "docs: Update API documentation"

# 测试
git commit -m "test: Add integration tests"

# 重构
git commit -m "refactor: Simplify database queries"
```

## ✅ PR 检查清单

提交 PR 前确认：
- [ ] 本地 `npm test` 通过
- [ ] 本地 `npm run lint` 通过
- [ ] 代码遵循规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 没有 console.log / print 调试语句

## 🆘 遇到问题？

1. **查看工作流日志** → PR 的 Checks 标签
2. **本地复现错误** → 运行相同的命令
3. **检查依赖版本** → 确保与工作流一致
4. **查看 GitHub Status** → 工作流可能出现故障

---

**更多详情见** → [.github/WORKFLOWS.md](.github/WORKFLOWS.md)
