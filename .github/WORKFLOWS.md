# GitHub Automation Workflows Configuration Guide

This project is fully equipped with GitHub Actions automation workflows, covering CI/CD, code quality, security checks, and more.

## 📋 Architecture Overview

```
.github/
├── actions/                          # Reusable Composite Actions
│   ├── setup-python-backend/         # Python 3.10 + pip cache + deps
│   │   └── action.yml
│   └── setup-node-frontend/          # Node 18 + npm cache + deps
│       └── action.yml
└── workflows/                        # CI/CD Workflows (7 total)
    ├── build.yml                     # Build verification
    ├── test.yml                      # Unit tests + coverage
    ├── lint-backend.yml              # Python code quality
    ├── lint-frontend.yml             # JS/Vue code quality
    ├── security.yml                  # Security scanning
    ├── codeql.yml                    # Advanced security analysis
    └── changelog.yml                 # Changelog generation
```

---

## 🔧 Composite Actions

### `setup-python-backend`
Reusable action for Python backend environment setup.

**Usage:**
```yaml
- uses: ./.github/actions/setup-python-backend
  with:
    install-dev: 'true'    # Optional: install dev dependencies
    python-version: '3.10' # Optional: Python version
```

**What it does:**
- Sets up Python with specified version
- Configures pip caching using `pyproject.toml`
- Installs backend dependencies

### `setup-node-frontend`
Reusable action for Node.js frontend environment setup.

**Usage:**
```yaml
- uses: ./.github/actions/setup-node-frontend
  with:
    node-version: '18.x'  # Optional: Node version
```

**What it does:**
- Sets up Node.js with specified version
- Configures npm caching using root `package-lock.json`
- Runs `npm ci` to install dependencies

---

## 📋 Workflows (13 Total)

### Core CI/CD Workflows

#### 1. **test.yml** - Automated Testing & Coverage
- **Triggers**: Push and PR to `main` / `develop` branches
- **Timeout**: Backend 20min, Frontend 15min
- **Tasks**:
  - Run backend unit tests (pytest)
  - Run frontend unit tests (vitest)
  - Upload coverage reports to Codecov

#### 2. **build.yml** - Build Verification
- **Triggers**: Push and PR when app code changes
- **Timeout**: 15min
- **Verification**:
  - Backend: Dependency import and Flask app creation
  - Frontend: Full production build

---

### Code Quality Workflows

#### 3. **lint-backend.yml** - Backend Code Quality
- **Triggers**: Backend code changes
- **Timeout**: 10min
- **Hard Gates** (must pass):
  - ❌ Black: Code formatting
  - ❌ isort: Import sorting
- **Soft Checks** (warnings only):
  - ⚠️ flake8: PEP8 compliance
  - ⚠️ pylint: Static analysis
- **Info Only**:
  - ℹ️ radon: Complexity metrics
  - ℹ️ LoC: Lines of code

#### 4. **lint-frontend.yml** - Frontend Code Quality
- **Triggers**: Frontend code changes
- **Timeout**: 10min
- **Hard Gates**:
  - ❌ ESLint: Code linting

---

### Security & Maintenance Workflows

#### 5. **security.yml** - Unified Security Analysis
- **Triggers**:
  - Weekly on Monday at 9:00 UTC
  - Push/PR when dependency files change
  - Manual trigger
- **Timeout**: 20min
- **Python Security**:
  - pip-audit: Vulnerability scanning (hard gate for high/critical)
  - Bandit: Static security analysis (soft check)
- **NPM Security**:
  - npm audit: High/critical vulnerabilities only (hard gate)
- **Additional Features**:
  - Outdated package detection
  - Critical dependency monitoring
  - Automatic issue creation on vulnerabilities

#### 6. **codeql.yml** - CodeQL Advanced Security
- **Triggers**: Push to `main`/`develop`, PR to `main`, weekly
- **Timeout**: 30min
- **Languages**: JavaScript, Python

#### 7. **changelog.yml** - Automatic Changelog Generation
- **Triggers**: Push to `main`, Release creation
- **Timeout**: 5min
- **Features**:
  - Generates changelog from commits
  - Updates CHANGELOG.md on release

#### 8. **dependabot-auto-merge.yml** - Dependabot Auto-Merge
- **Triggers**: Dependabot PR events
- **Timeout**: 5min
- **Auto-merge Rules**:
  - ✅ Patch updates (all dependencies)
  - ✅ Minor updates for dev dependencies
  - ✅ GitHub Actions patch/minor updates
  - ✅ Security updates (non-major)
  - ⏸️ Major updates → Manual review required
  - ⏸️ Production minor updates → Manual review required

#### 9. **release.yml** - Auto Release 🆕
- **Triggers**: Push version tags (`v*.*.*`)
- **Timeout**: 10min
- **Features**:
  - Automatically creates GitHub Release
  - Generates changelog from commits
  - Categorizes changes (Features, Bug Fixes, etc.)
  - Detects pre-releases (e.g., `v1.0.0-beta.1`)
- **Usage**: `git tag v1.0.0 && git push origin v1.0.0`

---

### Automation Workflows (Reduce Maintenance) 🆕

#### 9. **stale.yml** - Stale Issues & PRs
- **Triggers**: Daily at 1:00 UTC, manual
- **Issues**: Marked stale after 30 days, closed after 7 more days
- **PRs**: Marked stale after 30 days, closed after 14 more days
- **Exempt Labels**: `pinned`, `security`, `bug`, `work-in-progress`
- **Exempt Authors**: `dependabot[bot]`

#### 10. **auto-label.yml** - Automatic PR Labels
- **Triggers**: PR opened/synchronized/reopened
- **Configuration**: `.github/labeler.yml`
- **Labels Applied**:
  - `⚛️ frontend` - Frontend changes
  - `🐍 backend` - Backend changes
  - `📝 documentation` - Doc changes
  - `⚙️ ci/cd` - CI/CD changes
  - `🧪 tests` - Test changes
  - `📦 dependencies` - Dependency changes
  - `🚀 uploader` - Uploader changes
  - `🌐 api` - API changes

#### 11. **pr-size.yml** - PR Size Check
- **Triggers**: PR opened/synchronized/reopened
- **Size Labels**:
  - `size/XS`: 0-10 lines
  - `size/S`: 11-100 lines
  - `size/M`: 101-300 lines
  - `size/L`: 301-500 lines
  - `size/XL`: 500+ lines (shows warning message)

#### 12. **auto-approve-workflows.yml** - Auto-Approve Bot Workflows 🆕
- **Triggers**: PR opened/synchronized/reopened from trusted bots
- **Timeout**: 5min
- **Trusted Accounts**: `copilot-autofix[bot]`, `github-copilot[bot]`, `dependabot[bot]`
- **Features**:
  - Automatically approves pending workflow runs from trusted bots
  - **Security**: Skips approval if `.github/workflows/` files are modified
  - Reduces manual overhead for Copilot and Dependabot PRs
- **Setup Required**: Needs GitHub App token or PAT for full functionality
  - See `.github/docs/AUTO_APPROVE_SETUP.md` for configuration instructions
- **Note**: Default `GITHUB_TOKEN` has limited permissions and won't approve workflows

## 🚦 Error Handling Policy

| Category | Policy | Examples |
|----------|--------|----------|
| **Formatters** | ❌ Hard fail | black, isort, ESLint |
| **Security Critical** | ❌ Hard fail | High/critical vulnerabilities |
| **Static Analysis** | ⚠️ Warning | flake8, pylint, bandit |
| **Metrics** | ℹ️ Info only | radon, LoC |

---

## ⏱️ Timeout Summary

| Workflow | Timeout | Rationale |
|----------|---------|-----------|
| build.yml | 15 min | Frontend build can be slow |
| test.yml (backend) | 20 min | Tests + Playwright |
| test.yml (frontend) | 15 min | Standard test run |
| lint-*.yml | 10 min | Quick checks |
| security.yml | 20 min | pip-audit can be slow |
| codeql.yml | 30 min | Deep analysis |
| changelog.yml | 5 min | Simple script |

---

## 🚀 Usage Guide

### Viewing Workflow Status

1. **In PR Page**: All checks displayed at bottom, click "Details" for logs
2. **In Actions Tab**: Full workflow history and logs

### Common Scenarios

#### Fix a failed Lint check
```bash
# Backend
cd apps/backend
black src/ && isort src/
git add . && git commit -m "style: fix formatting"

# Frontend
npm run lint:frontend -- --fix
git add . && git commit -m "style: fix eslint issues"
```

#### Security vulnerability detected
```bash
# Python
pip-audit                    # View vulnerabilities
pip install package==x.y.z   # Update to fixed version

# NPM
npm audit                    # View vulnerabilities
npm audit fix                # Auto-fix compatible issues
```

---

## 🔧 Maintenance

### Updating Versions

Thanks to composite actions, version updates are centralized:

| Component | Update Location |
|-----------|-----------------|
| Python version | `.github/actions/setup-python-backend/action.yml` |
| Node version | `.github/actions/setup-node-frontend/action.yml` |

### Adding New Workflows

1. Create workflow in `.github/workflows/`
2. Use composite actions for setup:
   ```yaml
   - uses: ./.github/actions/setup-python-backend
   - uses: ./.github/actions/setup-node-frontend
   ```
3. Update this documentation

---

**Last Updated**: 2026-01-22
**Version**: 4.0 (Optimized with Composite Actions)
**Maintainers**: Project Contributors
