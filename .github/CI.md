# Continuous Integration (CI) Documentation

## Overview

OmniPost uses GitHub Actions for continuous integration and continuous deployment (CI/CD). This document describes all workflows, their triggers, purposes, and blocking policies.

## Workflow Architecture

### Design Principles

1. **DRY (Don't Repeat Yourself)**: Common setup steps are centralized in composite actions
2. **Separation of Concerns**: Each workflow has a single, clear purpose
3. **Fast Feedback**: Workflows run in parallel when possible
4. **Clear Blocking Policy**: Developers know which checks must pass before merge

### Composite Actions

To reduce duplication, we use composite actions for common setup tasks:

#### `.github/actions/setup-python`
Reusable Python environment setup with caching and dependency installation.

**Inputs:**
- `python-version` (default: '3.10'): Python version to install
- `install-deps` (default: 'true'): Whether to install backend dependencies
- `extras` (default: ''): Optional extras like 'dev' for development dependencies
- `install-playwright` (default: 'false'): Whether to install Playwright browsers

**Usage:**
```yaml
- name: Setup Python environment
  uses: ./.github/actions/setup-python
  with:
    python-version: '3.10'
    install-deps: 'true'
    extras: 'dev'
```

#### `.github/actions/setup-node`
Reusable Node.js environment setup with npm caching and dependency installation.

**Inputs:**
- `node-version` (default: '18.x'): Node.js version to install
- `install-deps` (default: 'true'): Whether to install npm dependencies

**Usage:**
```yaml
- name: Setup Node.js environment
  uses: ./.github/actions/setup-node
  with:
    node-version: '18.x'
    install-deps: 'true'
```

## Core CI Workflows

### 1. Build Verification (`build.yml`)

**Purpose**: Verify that the application can be built successfully in a clean environment.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when relevant files change (backend/frontend code, package files)

**Jobs:**
- `backend-build`: Verify Python imports and Flask app creation
- `frontend-build`: Build production frontend assets with Vite

**Blocking**: ✅ **YES** - Failures block PR merges

**Performance:**
- Uses caching for pip and npm
- Parallel execution of backend and frontend checks
- Typical runtime: 3-5 minutes

### 2. Testing (`test.yml`)

**Purpose**: Run comprehensive test suites for backend and frontend with coverage reporting.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when relevant files change

**Jobs:**
- `backend-test`: Run pytest with coverage for Python code
- `frontend-test`: Run Vitest with coverage for Vue/JavaScript code

**Coverage:**
- Reports uploaded to Codecov (non-blocking)
- Coverage badges available in README

**Blocking**: ✅ **YES** - Test failures block PR merges

**Performance:**
- Uses composite actions for setup
- Caching for dependencies and Playwright browsers
- Typical runtime: 5-8 minutes

### 3. Linting Workflows

#### Backend Lint (`lint-backend.yml`)

**Purpose**: Ensure Python code quality and style consistency.

**Triggers:**
- Push/PR to `main` or `develop` when backend files change

**Checks:**
- **Black** (blocking): Code formatting
- **isort** (blocking): Import sorting
- **Flake8** (informational): PEP8 compliance
- **Pylint** (informational): Static analysis and duplicate code detection
- **Radon** (informational): Complexity and maintainability metrics

**Blocking**: ✅ **PARTIAL** - Black and isort failures block merges; others are informational

**Fix Locally:**
```bash
cd apps/backend
black src/
isort src/
flake8 src/
```

#### Frontend Lint (`lint-frontend.yml`)

**Purpose**: Ensure JavaScript/Vue code quality and style consistency.

**Triggers:**
- Push/PR to `main` or `develop` when frontend files change

**Checks:**
- **ESLint**: JavaScript/Vue linting with project rules

**Blocking**: ✅ **YES** - ESLint failures block PR merges

**Fix Locally:**
```bash
npm run lint:frontend
# Auto-fix issues:
npm run lint:frontend -- --fix
```

**Note**: Build checking is done in `build.yml`, not in lint workflow.

## Security & Dependency Workflows

### 4. Dependency Security Scan (`dependency-scan.yml`)

**Purpose**: Consolidated dependency vulnerability scanning for Python and NPM packages.

**Triggers:**
- Pull requests modifying dependency files
- Weekly schedule: Mondays at 9:00 UTC (17:00 Beijing Time)
- Manual workflow dispatch

**Jobs:**
- `python-audit`: Run pip-audit on Python dependencies
- `npm-audit`: Run npm audit on NPM dependencies (production only)
- `create-issue`: Auto-create GitHub issue if vulnerabilities found
- `summary`: Generate comprehensive scan summary

**Severity Thresholds:**
- **Python**: All vulnerabilities reported by pip-audit
- **NPM**: High and Critical vulnerabilities only (production dependencies)

**Blocking**: ⚠️ **CONDITIONAL** - Blocks on high/critical vulnerabilities in PRs

**Artifacts:**
- Audit reports stored for 90 days
- Downloadable from workflow run

**Fix Locally:**
```bash
# Python
pip install pip-audit
pip-audit

# NPM
npm audit
npm audit fix  # Auto-fix compatible issues
```

### 5. Security Analysis (`security-analysis.yml`)

**Purpose**: Static security analysis using CodeQL and Bandit.

**Triggers:**
- Push/PR to `main` or `develop` when code files change
- Weekly schedule: Sundays at 01:30 UTC

**Jobs:**
- `codeql-analysis`: Comprehensive code scanning for JavaScript and Python
- `bandit-analysis`: Python-specific security pattern detection
- `summary`: Combined security analysis summary

**CodeQL Queries**: Uses `security-extended` query pack for thorough analysis

**Blocking**: ⚠️ **CONDITIONAL**
- CodeQL high/critical findings: **Blocking**
- Bandit high severity: **Review required**
- All other findings: **Informational**

**Results Location:**
- CodeQL: Security tab > Code scanning alerts
- Bandit: Job output and artifacts

### 6. CodeQL Advanced (`codeql.yml`)

**Purpose**: GitHub's native CodeQL scanning (legacy workflow, superseded by security-analysis.yml).

**Status**: ⚠️ **DEPRECATED** - This workflow is being replaced by `security-analysis.yml`

**Migration Note**: Once `security-analysis.yml` is stable, this workflow will be removed.

## Deprecated Workflows

### 7. Dependency Check (`dependency-check.yml`) - ⚠️ DEPRECATED

**Status**: Being replaced by `dependency-scan.yml`

**Migration**: All functionality moved to the new consolidated `dependency-scan.yml` workflow with improved:
- Clearer severity thresholds
- Better reporting
- Consistent trigger configuration
- Single source of truth

**Removal Timeline**: Will be removed after `dependency-scan.yml` is validated in production.

### 8. Security Check (`security.yml`) - ⚠️ DEPRECATED

**Status**: Being replaced by `security-analysis.yml`

**Migration**: Functionality split between:
- `security-analysis.yml`: Static code analysis (CodeQL + Bandit)
- `dependency-scan.yml`: Dependency vulnerability scanning (pip-audit + npm audit)

**Removal Timeline**: Will be removed after new workflows are validated.

## Supporting Workflows

### 9. Changelog Generation (`changelog.yml`)

**Purpose**: Automatically generate changelogs from Git commits.

**Triggers:**
- Push to `main` branch
- Release tags

**Blocking**: ❌ **NO** - Informational only

## Workflow Execution Matrix

| Workflow | Push (main/develop) | Pull Request | Schedule | Manual | Blocking |
|----------|-------------------|--------------|----------|--------|----------|
| Build | ✅ | ✅ | ❌ | ❌ | ✅ Yes |
| Test | ✅ | ✅ | ❌ | ❌ | ✅ Yes |
| Lint Backend | ✅ | ✅ | ❌ | ❌ | ⚠️ Partial |
| Lint Frontend | ✅ | ✅ | ❌ | ❌ | ✅ Yes |
| Dependency Scan | ❌ | ✅* | ✅ Weekly | ✅ | ⚠️ Conditional |
| Security Analysis | ✅ | ✅ | ✅ Weekly | ❌ | ⚠️ Conditional |
| Changelog | ✅* | ❌ | ❌ | ❌ | ❌ No |

*Only on specific file changes

## Developer Guide

### Before Pushing Code

1. **Run linters locally:**
   ```bash
   # Backend
   npm run lint:backend
   
   # Frontend
   npm run lint:frontend
   ```

2. **Run tests locally:**
   ```bash
   # Backend
   npm run test:backend
   
   # Frontend
   npm run test:frontend
   ```

3. **Build locally:**
   ```bash
   # Both
   npm run build
   ```

### Understanding CI Results

**In Pull Request:**
- All required checks appear at the bottom of the PR
- ✅ = Passed, ❌ = Failed, 🟡 = In Progress
- Click "Details" to view full logs

**Required Checks (Must Pass):**
- Build Verification (backend + frontend)
- Tests (backend + frontend)
- Backend Lint (Black + isort only)
- Frontend Lint (ESLint)

**Informational Checks:**
- Bandit security analysis (unless high severity)
- Pylint/Radon metrics
- Coverage reports (tracked but not blocking)

### Fixing Common Issues

#### Black Formatting Errors
```bash
cd apps/backend
black src/
git add .
git commit -m "fix: apply black formatting"
```

#### Import Sorting Errors
```bash
cd apps/backend
isort src/
git add .
git commit -m "fix: sort imports with isort"
```

#### ESLint Errors
```bash
npm run lint:frontend -- --fix
git add .
git commit -m "fix: resolve eslint issues"
```

#### Build Failures
- Review the build log for specific errors
- Check for syntax errors or missing dependencies
- Verify imports and module exports
- Test build locally: `npm run build`

#### Test Failures
- Review test output for failing tests
- Run specific test locally to debug
- Check for environment-specific issues
- Verify test data and mocks

#### Dependency Vulnerabilities
- Review the security audit report
- Update vulnerable dependencies
- Test thoroughly after updates
- Consider alternative packages if needed

### Performance Optimization

All workflows use:
- **Dependency Caching**: pip and npm caches reduce install time by 50-70%
- **Concurrency Groups**: Prevents redundant runs on rapid pushes
- **Path Filters**: Only run when relevant files change
- **Parallel Jobs**: Backend and frontend checks run simultaneously

**Typical CI Duration:**
- Fastest path (only lint): 2-3 minutes
- Full pipeline (all checks): 8-12 minutes
- With cache cold start: 15-20 minutes

## Monitoring and Maintenance

### Weekly Tasks
- Review security scan results from scheduled runs
- Check for outdated dependencies
- Monitor CI performance metrics

### Monthly Tasks
- Review and update dependency versions
- Audit workflow configurations
- Check for GitHub Actions updates
- Review security policies

### Quarterly Tasks
- Evaluate new security tools and practices
- Update CI documentation
- Review blocking policy effectiveness
- Plan workflow optimizations

## Troubleshooting

### CI Stuck or Slow?
- Check GitHub Actions status page
- Review concurrency settings
- Verify cache is working (look for cache hit messages)
- Consider increasing timeout values if legitimate

### False Positives in Security Scans?
- Review the specific finding in detail
- Consult security documentation for the tool
- If confirmed false positive, document in code comments
- Consider tool-specific suppression mechanisms

### Cache Issues?
- Clear cache by updating cache key
- Check cache size limits
- Verify cache-dependency-path is correct
- Monitor cache hit rates in logs

## Support

For CI/CD issues:
1. Check this documentation
2. Review workflow run logs
3. Search existing GitHub issues
4. Create new issue with `ci` label if needed
5. Tag `@RbBtSn0w` for urgent CI problems

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Bandit Documentation](https://bandit.readthedocs.io/)
- [pip-audit Documentation](https://pypi.org/project/pip-audit/)
- [Black Code Style](https://black.readthedocs.io/)
- [ESLint Documentation](https://eslint.org/docs/latest/)

---

**Last Updated**: 2026-01-22  
**Version**: 3.0 (Consolidated & Refactored)  
**Maintainer**: [@RbBtSn0w](https://github.com/RbBtSn0w)
