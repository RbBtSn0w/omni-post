# Quickstart: Node Backend Refine & Security Hardening

## 1. 环境准备 (Environment Setup)

确保安装了 Node.js 20+，并安装 backend-node 依赖：

```bash
cd apps/backend-node
npm install
```

## 2. 验证路径穿越防护 (Validate Path Traversal)

尝试通过 API 请求访问根目录外的文件：

```bash
curl "http://127.0.0.1:5409/downloadCookie?filePath=../../package.json"
```

- **预期结果**: 返回 HTTP 400，提示“非法的文件路径”。

## 3. 验证账号锁定 (Validate Account Lock)

使用同一账号并发启动两个发布任务：

- **第一个任务**: 成功启动。
- **第二个任务**: 返回 HTTP 423，提示“账号正在使用中，请稍后再试”。

## 4. 验证 ESM 模块解析 (Validate ESM Stability)

启动后端应用并检查日志是否因导入路径报错：

```bash
npm run dev
```

- **预期结果**: 应用能正常运行，无 `ERR_MODULE_NOT_FOUND` 错误。

## 5. 运行自动化测试 (Run Tests)

执行所有 Vitest 测试套件：

```bash
npm run test
```

- **预期结果**: 所有测试通过，且 `data/` 目录下无临时测试数据库残留。
