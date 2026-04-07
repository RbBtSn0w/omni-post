# <p align="center"><img src="assets/logo.png" width="128" alt="OmniPost Logo"></p>

<h1 align="center">OmniPost</h1>


## 🚀 Broadcast Everywhere, Manage Once

`OmniPost` is a modern, all-in-one content publishing tool designed to help content creators and operators efficiently publish video content to multiple mainstream social media platforms with a single click. The project implements video upload and scheduled publishing functionality for platforms such as `Douyin (TikTok)`, `Xiaohongshu (Little Red Book)`, `Kuaishou`, and `WeChat Channels`.

## Table of Contents

- [📋 Project Overview](#-project-overview)
- [💡 Features](#-features)
- [🔧 Tech Stack](#-tech-stack)
- [🚀 Supported Platforms](#-supported-platforms)
- [💾 Installation Guide](#-installation-guide)
- [🏁 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🤝 Contributing Guidelines](#-contributing-guidelines)
- [🙏 Acknowledgments](#-acknowledgments)
- [📜 License](#-license)

## 📋 Project Overview

`OmniPost` is an open-source, multi-platform content publishing tool that supports video publishing automation across various mainstream platforms. The project adopts a **Monorepo architecture**, providing a professional web interface and RESTful API endpoints, while maintaining a flexible CLI approach and comprehensive testing infrastructure.

### Primary Use Cases

- Content creators batch-publishing videos to multiple platforms
- Operations teams managing multi-account scheduled publishing tasks
- Workflow automation integration with other systems

## 💡 Features

- ✅ **Multi-Platform Support**: Covers major Chinese social media platforms
- ✅ **Article Publishing**: Support for Markdown publishing to Zhihu and Juejin (New!)
- ✅ **Browser Session Reuse**: Direct use of local Chrome sessions for zero-friction login (New!)
- ✅ **Unified CLI**: Powerful command-line tool for developers (New!)
- ✅ **Scheduled Publishing**: Support for precise publication timing
- ✅ **Separated Frontend & Backend**: Intuitive web management interface
- ✅ **API Encapsulation**: Support for integration with other systems
- ✅ **Cookie Management**: Multi-account cookie storage and management
- ✅ **Comprehensive Testing**: Extensive test suite for reliability
- ✅ **Automated CI/CD**: GitHub Actions workflows for continuous integration
- ✅ **OpenCLI Extensions**: Plug-in architecture for adding new platforms via CLI tools (New!)

### Platform Support Status

| Platform | Status |
|----------|--------|
| Douyin (TikTok) | ✅ |
| WeChat Channels | ✅ |
| Xiaohongshu (Little Red Book) | ✅ |
| Kuaishou | ✅ |

## 🔧 Tech Stack

### Frontend
- **Framework**: Vue 3 + Vite
- **UI Component Library**: Element Plus
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios

### Backend

#### Primary Backend: Node.js (Maintained)
- **Language**: Node.js 20+ (TypeScript 5.x)
- **Framework**: Express.js (ESM)
- **Browser Automation**: Playwright (Node.js version)
- **Database**: SQLite
- **Testing Framework**: Vitest

#### Legacy Backend: Python (Deprecated)
- **Language**: Python 3.10
- **Framework**: Flask
- **Purpose**: Compatibility and migration reference only
- **Testing Framework**: pytest + pytest-asyncio

## 🚀 Supported Platforms

This project implements video upload functionality through platform-specific `uploader` modules:

| Platform Name | Primary Uploader Module |
|--------------|--------------------------|
| Douyin | `apps/backend-node/src/uploader/douyin/main.ts` |
| WXChannels (WeChat Channels) | `apps/backend-node/src/uploader/wx_channels/main.ts` |
| Xiaohongshu | `apps/backend-node/src/uploader/xiaohongshu/main.ts` |
| Kuaishou | `apps/backend-node/src/uploader/kuaishou/main.ts` |
| Bilibili | `apps/backend-node/src/uploader/bilibili/main.ts` |

## 🔌 OpenCLI Extensions

OmniPost supports dynamically adding new platform uploaders through **OpenCLI extensions**. Each extension is a self-contained CLI tool with a JSON manifest that declares its capabilities.

### Extension Structure

```
apps/backend-node/extensions/<platform_slug>/
├── cli.js              # CLI entry point (Commander-based)
└── manifest.ocs.json   # OCS capability manifest
```

### Creating an Extension

1. **Create the directory** under `apps/backend-node/extensions/` using the platform slug (e.g., `wx_official_account`)
2. **Write `manifest.ocs.json`** declaring the platform ID, supported actions, and required arguments:
   ```json
   {
     "ocs_version": "1.0",
     "name": "my-platform",
     "version": "1.0.0",
     "platform_id": 101, // Use 100+ for dynamic local extensions
     "actions": {
       "publish_article": {
         "command": "publish",
         "args": {
           "title": "--title",
           "content": "--content"
         }
       }
     }
   }
   ```
3. **Write `cli.js`** implementing the declared actions. The runner invokes it with `node cli.js <action> --<arg> <value>`.
4. **Sync extensions** via the API: `POST /api/opencli/sync`

The backend will automatically discover the extension and make it available for publishing through the standard task pipeline.

## 💾 Installation Guide

### System Requirements

- Node.js >= 20.0.0
- Python 3.10.x (only if you need the legacy backend)
- npm >= 9.0.0
- Modern browser (Chrome, Firefox, Safari, or Edge)

### 1. Clone the Repository

```bash
git clone https://github.com/RbBtSn0w/omni-post.git
cd omni-post
```

### 2. Install Dependencies

**Important**: The maintained development path is the Node.js monorepo workspace. Use the root workspace scripts rather than ad-hoc installs inside subdirectories.

```bash
# Recommended Node.js workspace setup
npm install
npx playwright install chromium
```

### 🎯 Developer Workflow (New Monorepo Setup)

Starting from v1.2.0, OmniPost uses a strict monorepo workspace configuration. Here are the core commands you should use:

- **Initialize project**: `npm install` (Installs workspace dependencies)
- **Run dev servers**: `npm run dev:node` and `npm run dev:frontend`
- **Run all tests**: `npm run test` (Primarily Vitest across maintained packages)
- **Lint all code**: `npm run lint`
- **Check workspace integrity**: `npm run check:workspace` (Validates package naming and scripts)
- **Clean build artifacts**: `npm run clean` (Safely removes `dist/` and `coverage/`, preserving `data/` and `.env`)

### 2.1 Workspace Commands

```bash
# Run lint/test across all workspaces
npm run lint
npm run test

# Clean workspace artifacts
npm run clean

# Validate workspace contract
npm run check:workspace

# Measure install time (SC-001 baseline)
time npm install
```

### 3. Install Playwright Browser Driver

```bash
# For legacy Python backend
cd apps/backend
.venv/bin/python -m playwright install chromium

# For maintained Node.js backend
npx playwright install chromium
```

### 5. 🛠 Upgrade Notice (v1->v2)

If you are upgrading from a version older than v1.3.1, please run the one-time data migration script to sync your historical WeChat Channels (Tencent) tasks to the new **WXChannels** standard:

```bash
cd apps/backend-node
node scripts/migrate-wx-channels.mjs
```

### 6. Start the Services

```bash
# Start the maintained backend and frontend
npm run dev:node
npm run dev:frontend

# Legacy Python backend only when explicitly needed
npm run dev:backend

# Or individually
npm run dev:node          # Node.js Backend (http://localhost:5409)
npm run dev:frontend      # Vue 3 Frontend (http://localhost:5173)
```

## 🏁 Quick Start

1. After starting the services, navigate to `http://localhost:5173`
2. Add account credentials and log in within the web interface
3. Upload video files and fill in metadata (title, tags, etc.)
4. Select target platforms and publishing time
5. Click publish, and the system will automatically execute the publishing task

## 📁 Project Structure

```
omni-post/
├── apps/
│   ├── backend/                 # Python Flask Backend (Legacy/Deprecated)
│   │   ├── src/
│   │   │   ├── app.py          # Entry point
│   │   │   ├── core/           # Config & Logging
│   │   │   ├── routes/         # API Endpoints
│   │   │   ├── services/       # Business Logic
│   │   │   └── uploader/       # Playwright Uploaders
│   │   └── tests/              # Pytest suite
│   │
│   ├── backend-node/            # Node.js TypeScript Backend (Primary)
│   │   ├── src/
│   │   │   ├── app.ts          # Express Application
│   │   │   ├── routes/         # HTTP Route Layer
│   │   │   ├── services/       # Business Logic & Task Execution
│   │   │   └── uploader/       # TS Playwright Uploaders
│   │   ├── extensions/         # OpenCLI extension plugins
│   │   └── tests/              # Vitest suite
│   │
│   └── frontend/               # Vue.js 3 Frontend (Shared)
│       ├── src/
│       │   ├── views/          # Page components (Dashboard, Publish, etc.)
│       │   ├── components/     # Reusable components
│       │   ├── stores/         # Pinia state management
│       │   ├── api/            # API service layer
│       │   ├── router/         # Vue Router configuration
│       │   ├── composables/    # Composition API utilities
│       │   ├── utils/          # Helper functions
│       │   └── assets/         # Static assets
│       ├── tests/              # Frontend test suite
│       ├── vite.config.js      # Vite configuration
│       └── vitest.config.js    # Vitest configuration
│
├── packages/
│   ├── shared/                 # Shared logic (SSOT for types/constants)
│   ├── shared-config/          # Standardized lint/TS configs
│   └── cli/                    # Node-based CLI automation tool
│
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│       ├── test.yml           # Automated testing
│       └── lint-backend.yml   # Backend code quality
│
├── package.json                # Monorepo root configuration
├── ARCHITECTURE.md             # Architecture documentation
├── CONTRIBUTING.md             # Contribution guidelines
├── README_CN.md                # Chinese README
├── README.md                   # English README (this file)
└── LICENSE                     # MIT License
```

## Key Directories

### Backend Structure (Node.js Primary)

- **routes/**: API endpoint definitions (`account.ts`, `publish.ts`, `article.ts`, `browser.ts`, `file.ts`)
- **services/**: Business logic layers (`task-service.ts`, `publish-service.ts`, `publish-executor.ts`, `login-service.ts`, `cookie-service.ts`)
- **uploader/**: Platform-specific upload implementations (`main.ts` entry points)
- **utils/**: Network utilities and file helpers (`path.ts`, `response.ts`)
- **db/**: Database management and migrations (`migrations.ts`)

### Frontend Structure

- **views/**: Main pages (`Dashboard`, `AccountManagement`, `PublishCenter`, `TaskManagement`, `MaterialManagement`)
- **components/**: UI components (`GroupSelector`)
- **stores/**: Pinia stores (`user`, `account`, `task`, `group`, `app`)
- **api/**: specific API clients (`account.js`, `task.js`, `material.js`, `user.js`)
- **Shared Package (@omni-post/shared)**:
  - **SSOT**: Single Source of Truth for platform IDs, task interfaces, and enum mappings.
  - **logic/**: Common validation and transformation utilities.
  - **tests/**: Vitest suite ensures cross-platform logic consistency.

## Development & Testing

### Running Tests

```bash
```

### Code Quality & Linting

```bash
# Run all linters
npm run lint

# Lint backend
npm run lint:backend

# Lint frontend
npm run lint:frontend

# Clean build artifacts
npm run clean
```

### Available Commands

```bash
# Development
npm run dev              # Start both backend and frontend

# Building
npm run build            # Build frontend for production
npm run preview          # Preview production build

# Information
npm run info            # Display project information
```

## 🤝 Contributing Guidelines

We welcome contributions in all forms! For detailed information, please refer to [CONTRIBUTING.md](CONTRIBUTING.md).

### Contribution Workflow

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a Pull Request

### Development Standards

- **Backend**: Follow PEP 8 coding standards
- **Frontend**: Follow Vue 3 best practices and ES6+ conventions
- **Testing**: Ensure tests pass with `npm test`
- **Code Quality**: Run linters before committing with `npm run lint`

### Commit Message Convention

Use clear, descriptive commit messages following this pattern:
```
<type>(<scope>): <subject>

<body>
```

Types: feat, fix, docs, style, refactor, test, chore

## 📊 Project Statistics

- **Language**: Python (Backend), JavaScript/Vue (Frontend)
- **Test Coverage**: Extensive unit and integration tests
- **Architecture**: Monorepo with Workspaces
- **License**: MIT
- **Status**: Active Development

## 🙏 Acknowledgments

This project is inspired by [dreammis/social-auto-upload](https://github.com/dreammis/social-auto-upload) and has been completely redesigned and rewritten. Thanks to the original project team for their pioneering work!

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## Getting Help

- **Documentation**: Check [CONTRIBUTING.md](CONTRIBUTING.md) and [ARCHITECTURE.md](ARCHITECTURE.md)
- **Issues**: Use [GitHub Issues](https://github.com/RbBtSn0w/omni-post/issues) for bug reports and feature requests
- **Discussions**: Start a discussion for questions and ideas

---

> If this project has been helpful to you, please give it a ⭐ Star to show your support!

Last Updated: March 2026
has been helpful to you, please give it a ⭐ Star to show your support!

Last Updated: March 2026
