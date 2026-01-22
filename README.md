# OmniPost

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
- ✅ **Scheduled Publishing**: Support for precise publication timing
- ✅ **Separated Frontend & Backend**: Intuitive web management interface
- ✅ **API Encapsulation**: Support for integration with other systems
- ✅ **Cookie Management**: Multi-account cookie storage and management
- ✅ **Comprehensive Testing**: Extensive test suite for reliability
- ✅ **Automated CI/CD**: GitHub Actions workflows for continuous integration
- 🆕 **AI Agent Integration**: Natural language driven publishing with GitHub Copilot SDK

### Platform Support Status

| Platform | Status |
|----------|--------|
| Douyin (TikTok) | ✅ |
| WeChat Channels | ✅ |
| Xiaohongshu (Little Red Book) | ✅ |
| Kuaishou | ✅ |

## 🔧 Tech Stack

### Backend
- **Language**: Python 3.10
- **Framework**: Flask (with async support)
- **Browser Automation**: Playwright
- **Database**: SQLite
- **Testing Framework**: pytest + pytest-asyncio
- **Code Quality**: Black, isort, flake8, pylint, radon

### Frontend
- **Framework**: Vue 3 + Vite
- **UI Component Library**: Element Plus
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **Testing Framework**: Vitest

## 🚀 Supported Platforms

This project implements video upload functionality through platform-specific `uploader` modules:

| Platform Name | Uploader Module |
|--------------|-----------------|
| Douyin | `src/uploader/douyin_uploader/main.py` |
| WeChat Channels | `src/uploader/tencent_uploader/main.py` |
| Xiaohongshu | `src/uploader/xiaohongshu_uploader/main.py` |
| Kuaishou | `src/uploader/ks_uploader/main.py` |

## 💾 Installation Guide

### System Requirements

- Node.js >= 18.0.0
- Python 3.10.x
- npm >= 9.0.0
- Modern browser (Chrome, Firefox, Safari, or Edge)

### 1. Clone the Repository

```bash
git clone https://github.com/RbBtSn0w/omni-post.git
cd omni-post
```

### 2. Install Dependencies

```bash
# Install all dependencies at once (recommended)
npm run install:all

# Or install separately
npm install                    # Install root dependencies
npm run install:backend        # Install backend dependencies
npm run install:frontend       # Install frontend dependencies
```

### 3. Install Playwright Browser Driver

```bash
cd apps/backend
.venv/bin/python -m playwright install chromium
```

### 4. Initialize Database

```bash
cd apps/backend
.venv/bin/python src/db/createTable.py
```

### 5. Start the Services

```bash
# Start both frontend and backend simultaneously (from root directory)
npm run dev

# Or start separately
npm run dev:backend    # Backend service http://localhost:5409
npm run dev:frontend   # Frontend service http://localhost:5173
```

## 🏁 Quick Start

1. After starting the services, navigate to `http://localhost:5173`
2. Add account credentials and log in within the web interface
3. Upload video files and fill in metadata (title, tags, etc.)
4. Select target platforms and publishing time
5. Click publish, and the system will automatically execute the publishing task

### Using the AI Agent CLI (New!)

You can also publish videos using natural language commands:

```bash
# Publish with AI-driven instructions (Chinese or English)
python -m tools.omni_cli post "发布视频到抖音" --title "我的第一个视频"

# Preview mode (dry run)
python -m tools.omni_cli post "分享到小红书" --title "日常分享" --dry-run

# List available agent tools
python -m tools.omni_cli list-tools
```

For more details on AI agent features, see [docs/agent.md](docs/agent.md).

## 📁 Project Structure

```
omni-post/
├── apps/
│   ├── backend/                 # Python Flask Backend
│   │   ├── src/
│   │   │   ├── app.py          # Flask application entry point
│   │   │   ├── core/           # Core configuration and logging
│   │   │   ├── routes/         # API endpoints (account, publish, etc.)
│   │   │   ├── services/       # Business logic (auth, task, publish)
│   │   │   ├── uploader/       # Platform uploaders
│   │   │   │   ├── douyin_uploader/
│   │   │   │   ├── tencent_uploader/
│   │   │   │   ├── xiaohongshu_uploader/
│   │   │   │   └── ks_uploader/
│   │   │   ├── utils/          # Utility functions
│   │   │   └── db/             # Database management
│   │   ├── tests/              # Backend test suite
│   │   ├── requirements.txt    # Python dependencies
│   │   └── pytest.ini          # Pytest configuration
│   │
│   └── frontend/               # Vue.js Frontend
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

### Backend Structure

- **routes/**: API endpoint definitions (`account.py`, `publish.py`, `dashboard.py`, `group.py`)
- **services/**: Business logic layers (`auth_service.py`, `task_service.py`, `publish_service.py`, `login_service.py`)
- **uploader/**: Platform-specific upload implementations (`main.py` entry points)
- **utils/**: Network utilities and time helpers
- **db/**: Database management and table creation

### Frontend Structure

- **views/**: Main pages (`Dashboard`, `AccountManagement`, `PublishCenter`, `TaskManagement`, `MaterialManagement`)
- **components/**: UI components (`GroupSelector`)
- **stores/**: Pinia stores (`user`, `account`, `task`, `group`, `app`)
- **api/**: specific API clients (`account.js`, `task.js`, `material.js`, `user.js`)

## Development & Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Frontend tests with coverage
npm run test:frontend:coverage
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

Last Updated: January 2026
