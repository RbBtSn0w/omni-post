# 快速入门指南 (Quickstart)

## 运行 Node.js 开发服务器

1. 进入节点后端目录
```bash
cd apps/backend-node
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器（带热重载）
```bash
npm run dev
```

该命令将使用 `tsx` 监听并在 `http://localhost:3000` 启动 Express 服务器。

## 本地存储依赖
请确保在 `apps/backend-node/` 下存在 `data/` 目录结构：
- `data/data.db` (SQLite 数据库文件，可以直接用 python 里的拷贝过来)
- `data/cookies/` (用于存储 Playwright 会话 JSON)
- `data/videos/` (用于存储上传的视频文件)
- `data/stealth.min.js` (必须从 python 后端的 `src/utils/` 下复制过来，用于规避反爬)

## 运行测试

执行 Vitest 测试套件：
```bash
npm run test
```

或使用 UI 模式查看结果：
```bash
npx vitest --ui
```
