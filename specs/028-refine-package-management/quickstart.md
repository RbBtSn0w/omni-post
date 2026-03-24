# Quickstart: Workspace Management

## 1. 初始化环境
在根目录下运行以下命令，即可完成所有子应用的依赖安装及 Python 环境初始化。
```bash
npm run setup
```

## 2. 并行执行脚本
在根目录下同时运行所有项目的代码检查：
```bash
npm run lint --workspaces
```

## 3. 指定项目运行
仅运行前端项目：
```bash
npm run dev -w @omni-post/frontend
```

## 4. 清理环境
一键删除所有子项目的 `dist`、`node_modules` 和临时文件：
```bash
npm run clean
```

## 5. 基线测量：安装耗时 (SC-001)
在同一台机器、同一 Node/npm 版本、清空依赖后测量：
```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
time npm install
```
重复三次取平均值作为基线，再在优化后重复测量比较差异。

## 6. 基线测量：新开发者启动耗时 (SC-003)
从干净 clone 到启动前端开发模式：
```bash
time npm run setup
time npm run dev -w @omni-post/frontend
```
记录总耗时是否满足 5 分钟内目标。
