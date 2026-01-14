# OmniPost

## 🚀 Broadcast Everywhere, Manage Once

`OmniPost` 是一个现代化的全能内容发布工具，旨在帮助内容创作者和运营者高效地将视频内容一键发布到多个主流社交媒体平台。项目实现了对 `抖音`、`小红书`、`快手`、`视频号` 等平台的视频上传、定时发布等功能。

## 目录

- [📋 项目概述](#-项目概述)
- [💡 功能特性](#-功能特性)
- [🔧 技术栈](#-技术栈)
- [🚀 支持的平台](#-支持的平台)
- [💾 安装指南](#-安装指南)
- [🏁 快速开始](#-快速开始)
- [📁 项目结构](#-项目结构)
- [🤝 贡献指南](#-贡献指南)
- [🙏 致谢](#-致谢)
- [📜 许可证](#-许可证)

## 📋 项目概述

`OmniPost` 是一个开源的全平台内容发布工具，支持多种主流平台的视频发布自动化。该项目采用 **Monorepo 架构**，提供了专业的 Web 界面和 RESTful API 接口，同时保留了灵活的 CLI 使用方式，并配备完善的测试体系。

主要应用场景：
- 内容创作者批量发布视频到多个平台
- 运营团队管理多账号定时发布任务
- 自动化工作流集成

## 💡 功能特性

- ✅ **多平台支持**：覆盖国内主流社交媒体平台
- ✅ **定时发布**：支持设置精确发布时间
- ✅ **前后端分离**：提供直观的 Web 管理界面
- ✅ **API 封装**：支持与其他系统集成
- ✅ **Cookie 管理**：支持多账号 Cookie 存储与管理

### 平台支持状态

| 平台 | 状态 |
|------|------|
| 抖音 | ✅ |
| 视频号 | ✅ |
| 小红书 | ✅ |
| 快手 | ✅ |

## 🔧 技术栈

### 后端
- **语言**: Python 3.10
- **框架**: Flask (异步支持)
- **浏览器自动化**: Playwright
- **数据库**: SQLite
- **测试框架**: pytest + pytest-asyncio

### 前端
- **框架**: Vue 3 + Vite
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP 客户端**: Axios

## 🚀 支持的平台

本项目通过各平台对应的 `uploader` 模块实现视频上传功能：

| 平台名称 | 上传器模块 |
|---------|------------|
| 抖音 | `src/uploader/douyin_uploader` |
| 视频号 | `src/uploader/tencent_uploader` |
| 小红书 | `src/uploader/xiaohongshu_uploader` |
| 快手 | `src/uploader/ks_uploader` |

## 💾 安装指南

### 环境要求

- Node.js >= 18.0.0
- Python 3.10.x
- npm >= 9.0.0

### 1. 克隆项目

```bash
git clone https://github.com/RbBtSn0w/omni-post.git
cd omni-post
```

### 2. 安装依赖

```bash
# 一键安装所有依赖（推荐）
npm run install:all

# 或者分别安装
npm install                    # 安装根目录依赖
npm run install:backend        # 安装后端依赖
npm run install:frontend       # 安装前端依赖
```

### 3. 安装 Playwright 浏览器驱动

```bash
cd apps/backend
.venv/bin/python -m playwright install chromium
```

### 4. 初始化数据库

```bash
cd apps/backend
.venv/bin/python src/db/createTable.py
```

### 5. 启动服务

```bash
# 同时启动前后端（在根目录）
npm run dev

# 或分别启动
npm run dev:backend    # 后端服务 http://localhost:5409
npm run dev:frontend   # 前端服务 http://localhost:5173
```

## 🏁 快速开始

1. 启动服务后，访问 `http://localhost:5173`
2. 在 Web 界面中添加账号并登录
3. 上传视频文件并填写标题、标签等信息
4. 选择发布平台和发布时间
5. 点击发布，系统将自动执行发布任务

## 📁 项目结构

```
omni-post/
├── apps/
│   ├── backend/                 # Python Flask 后端
│   │   ├── src/
│   │   │   ├── app.py          # Flask 应用入口
│   │   │   ├── cli_main.py     # CLI 入口
│   │   │   ├── routes/         # API 路由
│   │   │   ├── services/       # 业务逻辑
│   │   │   ├── uploader/       # 平台上传器
│   │   │   ├── utils/          # 工具函数
│   │   │   └── db/             # 数据库模型
│   │   └── tests/              # 后端测试
│   │
│   └── frontend/               # Vue.js 前端
│       ├── src/
│       │   ├── views/          # 页面组件
│       │   ├── components/     # 公共组件
│       │   ├── stores/         # Pinia 状态管理
│       │   ├── api/            # API 调用
│       │   └── router/         # 路由配置
│       └── tests/              # 前端测试
│
├── package.json                # Monorepo 根配置
├── ARCHITECTURE.md             # 架构文档
└── CONTRIBUTING.md             # 贡献指南
```

## 🤝 贡献指南

欢迎各种形式的贡献！详细信息请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

### 贡献流程

1. Fork 本仓库
2. 创建分支 (`git checkout -b feature/YourFeature`)
3. 提交更改 (`git commit -m 'Add some feature'`)
4. Push 到分支 (`git push origin feature/YourFeature`)
5. 创建 Pull Request

### 开发规范

- 后端：遵循 PEP 8 编码规范
- 前端：遵循 Vue 3 最佳实践
- 运行测试：`npm test`

## 🙏 致谢

本项目受 [dreammis/social-auto-upload](https://github.com/dreammis/social-auto-upload) 启发，在其基础上进行了完全重构。感谢原项目团队的开创性工作！

## 📜 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

---

> 如果这个项目对您有帮助，请给一个 ⭐ Star 以表示支持！
