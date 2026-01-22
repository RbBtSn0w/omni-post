# Continuous Integration (CI) Documentation

## Overview

OmniPost uses GitHub Actions for automated testing, building, linting, and security scanning. This document describes each workflow, its purpose, triggers, and whether it's a blocking check or reporting-only.

## Workflow Summary

| Workflow | Purpose | Trigger | Blocking? | Schedule |
|----------|---------|---------|-----------|----------|
| [Build](#build-verification) | Verify backend/frontend builds | Push/PR to main/develop | ✅ Yes | On demand |
| [Tests](#test-workflows) | Run unit/integration tests | Push/PR to main/develop | ✅ Yes | On demand |
| [Lint - Backend](#lint-backend) | Python code quality checks | Push/PR to main/develop | ⚠️ Partial* | On demand |
| [Lint - Frontend](#lint-frontend) | JS/Vue code quality checks | Push/PR to main/develop | ✅ Yes | On demand |
| [Dependency Scan](#dependency-scan) | Check for vulnerable dependencies | PR/Schedule/Manual | ✅ Yes** | Weekly (Mon 9am UTC) |
| [Security Analysis](#security-analysis) | Static security analysis | Push/PR/Schedule | ⚠️ Partial* | Weekly (Sun 12am UTC) |
| [CodeQL](#codeql-deprecated) | (Replaced by Security Analysis) | - | - | Deprecated |

*Partial blocking: Some checks are hard gates (black, isort), others are informational (pylint complexity)  
**Blocking on high/critical vulnerabilities only

---

## Detailed Workflow Descriptions

### Build Verification

**File:** `.github/workflows/build.yml`

**Purpose:**
- Verify that the backend Flask application can be instantiated without errors
- Verify that the frontend Vue application builds successfully

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when relevant files change (backend/frontend code, package files)

**Jobs:**
1. **backend-build:** Checks Python imports and Flask app creation
2. **frontend-build:** Builds the Vue app and verifies output

**Blocking:** ✅ Yes - Must pass for PR merge

**Caching:**
- Python pip cache (based on `pyproject.toml`)
- NPM cache (based on `package-lock.json`)

---

### Test Workflows

**File:** `.github/workflows/test.yml`

**Purpose:**
- Run backend unit and integration tests with coverage
- Run frontend unit tests with coverage
- Upload coverage reports to Codecov

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when relevant files change

**Jobs:**
1. **backend-test:** Runs pytest with coverage for Python backend
   - Installs Playwright browsers for automation tests
   - Matrix: Python 3.10
2. **frontend-test:** Runs Vitest with coverage for Vue frontend
   - Matrix: Node.js 18.x

**Blocking:** ✅ Yes - Must pass for PR merge

**Caching:**
- Python pip cache (backend dependencies)
- NPM cache (frontend dependencies)

**Coverage:**
- Reports uploaded to Codecov (non-blocking)
- Separate flags for backend and frontend

---

### Lint Backend

**File:** `.github/workflows/lint-backend.yml`

**Purpose:**
- Enforce Python code formatting and style consistency
- Detect potential code quality issues

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when backend files change

**Checks:**
1. **black** (formatter) - ✅ BLOCKING
2. **isort** (import sorter) - ✅ BLOCKING
3. **flake8** (linter) - ⚠️ WARNING (continue-on-error)
4. **pylint** (linter) - ⚠️ WARNING (continue-on-error)
5. **radon** (complexity analysis) - ℹ️ INFORMATIONAL

**Blocking:** ⚠️ Partial - black and isort must pass; others are warnings

**Caching:**
- Python pip cache for linting tools

**Fix Commands:**
```bash
# Auto-fix formatting issues
cd apps/backend
black src/ --line-length=100
isort src/ --profile black
```

---

### Lint Frontend

**File:** `.github/workflows/lint-frontend.yml`

**Purpose:**
- Enforce JavaScript/Vue code quality and style
- Previously included build check (now moved to build.yml)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when frontend files change

**Checks:**
1. **ESLint** - ✅ BLOCKING

**Blocking:** ✅ Yes - ESLint must pass

**Caching:**
- NPM cache for dependencies

**Fix Commands:**
```bash
# Auto-fix linting issues
npm run lint:frontend
```

**Note:** Build verification is now handled separately in `build.yml` to avoid duplication.

---

### Dependency Scan

**File:** `.github/workflows/dependency-scan.yml`

**Purpose:**
- Detect known security vulnerabilities in dependencies
- Monitor outdated packages
- Consolidates dependency checking previously split across multiple workflows

**Triggers:**
- **Scheduled:** Weekly on Mondays at 9:00 UTC (17:00 Beijing Time)
- **Manual:** workflow_dispatch with configurable severity threshold
- **Pull Requests:** When dependency files change

**Jobs:**
1. **python-dependencies:**
   - Runs `pip-audit` for Python packages
   - Lists outdated packages
   - Uploads JSON report as artifact

2. **npm-dependencies:**
   - Runs `npm audit` for Node.js packages
   - Lists outdated packages
   - Uploads JSON report as artifact

3. **create-issue-on-failure:**
   - Creates/updates GitHub issue when vulnerabilities found
   - Only on scheduled runs (not PRs)
   - Assigns to @RbBtSn0w

4. **summary:**
   - Generates consolidated summary report

**Blocking:** ✅ Yes (on high/critical vulnerabilities)

**Severity Policy:**
- **Fail on:** High and Critical vulnerabilities
- **Warn on:** Moderate and Low vulnerabilities
- Configurable via workflow_dispatch input

**Caching:**
- Python pip cache
- NPM cache

**Manual Run:**
```yaml
# In GitHub UI: Actions > Dependency Scan > Run workflow
# Choose severity threshold: low, moderate, high, or critical
```

---

### Security Analysis

**File:** `.github/workflows/security-analysis.yml`

**Purpose:**
- Perform static security analysis on codebase
- Detect security vulnerabilities and code quality issues
- Consolidates CodeQL and Bandit scanning

**Triggers:**
- **Push:** to `main` or `develop` branches
- **Pull Requests:** to `main` or `develop` branches
- **Scheduled:** Weekly on Sundays at midnight UTC
- **Manual:** workflow_dispatch

**Jobs:**
1. **codeql-analysis:**
   - Matrix: JavaScript and Python
   - Reports findings to Security tab
   - Uses GitHub's security-extended queries
   - Non-blocking (reporting only)

2. **bandit-analysis:**
   - Python-specific security scanner
   - Only runs on Python file changes or scheduled/manual runs
   - Fails on HIGH severity issues
   - Warns on MEDIUM/LOW issues
   - Continue-on-error for PRs

3. **summary:**
   - Generates consolidated summary

**Blocking:** ⚠️ Partial
- CodeQL: Reporting only (Security tab)
- Bandit: Blocks on HIGH severity issues

**Caching:**
- Python pip cache for Bandit dependencies

**View Results:**
- CodeQL: Repository > Security > Code scanning alerts
- Bandit: Workflow run > Artifacts > bandit-security-report

---

### CodeQL (Deprecated)

**File:** `.github/workflows/codeql.yml`

**Status:** ⚠️ Being replaced by `security-analysis.yml`

This workflow is superseded by the consolidated Security Analysis workflow to avoid duplication and provide better integration with Bandit scanning.

---

## Workflow Dependencies and Optimization

### Caching Strategy

All workflows implement intelligent caching to speed up CI runs:

- **Python (pip):** Cached based on `apps/backend/pyproject.toml`
- **Node.js (npm):** Cached based on `package-lock.json`
- Cache keys automatically invalidate when dependency files change

### Avoiding Duplication

**Before refactoring:**
- Frontend was built in both `build.yml` AND `lint-frontend.yml`
- Python dependencies were scanned in both `dependency-check.yml` AND `security.yml`
- CodeQL and security tools ran separately with overlapping scopes

**After refactoring:**
- Each workflow has a single responsibility
- Build verification is ONLY in `build.yml`
- Linting workflows focus on code quality checks
- Dependency scanning is consolidated in `dependency-scan.yml`
- Security analysis combines CodeQL and Bandit in `security-analysis.yml`

### Parallel Execution

Workflows run in parallel when triggered by the same event:
- Build + Lint + Test can all run simultaneously
- Security scans run independently
- Matrix strategies parallelize across versions (Python 3.10, Node 18.x)

---

## Common Tasks

### Running Workflows Locally

**Backend tests:**
```bash
cd apps/backend
python -m pytest tests/ -v
```

**Frontend tests:**
```bash
npm run test:frontend
```

**Linting:**
```bash
# Backend
npm run lint:backend

# Frontend
npm run lint:frontend
```

**Build verification:**
```bash
# Backend
cd apps/backend
python -c "from src.app import create_app; create_app()"

# Frontend
npm run build -w apps/frontend
```

---

### Adding New Workflows

When adding a new workflow:

1. **Choose appropriate triggers:**
   - Use path filters to avoid unnecessary runs
   - Consider using concurrency groups to cancel outdated runs

2. **Implement caching:**
   - Use `cache: 'pip'` for Python workflows
   - Use `cache: 'npm'` for Node.js workflows
   - Set appropriate cache-dependency-path

3. **Set timeouts:**
   - Add `timeout-minutes` to prevent hung jobs
   - Typical values: 10 min (lint), 15 min (test), 20 min (build)

4. **Add step names:**
   - Use descriptive names for all steps
   - Include "Checkout code" instead of just "Checkout"

5. **Configure permissions:**
   - Use least-privilege principle
   - Common: `contents: read` for most workflows
   - Add `security-events: write` for security scans

6. **Update this document:**
   - Add new workflow to summary table
   - Add detailed section with purpose and triggers

---

### Modifying Existing Workflows

**Best Practices:**

1. **Test changes in a feature branch**
2. **Use workflow_dispatch for manual testing**
3. **Monitor workflow run times** - optimize if over 15 minutes
4. **Check caching effectiveness** - should see "Cache restored" logs
5. **Update documentation** when changing behavior

**Common Modifications:**

- **Add new path filter:**
  ```yaml
  on:
    push:
      paths:
        - 'new-directory/**'
        - '.github/workflows/workflow-name.yml'
  ```

- **Change Python version:**
  ```yaml
  strategy:
    matrix:
      python-version: [ '3.10', '3.11' ]  # Add new version
  ```

- **Adjust severity thresholds:**
  Edit the conditional logic in scan jobs

---

## Troubleshooting

### Cache Issues

**Problem:** Dependencies reinstalling every run

**Solution:**
```yaml
# Ensure cache-dependency-path matches your setup
- uses: actions/setup-python@v5
  with:
    cache: 'pip'
    cache-dependency-path: apps/backend/pyproject.toml  # Must be correct path
```

### Timeout Issues

**Problem:** Workflow times out

**Solution:**
1. Increase `timeout-minutes` value
2. Check for network issues or slow package registries
3. Consider splitting into smaller jobs

### Permission Errors

**Problem:** Workflow can't write to Security tab

**Solution:**
```yaml
permissions:
  security-events: write  # Required for CodeQL/Bandit
  contents: read
```

---

## Maintenance Schedule

| Task | Frequency | Responsibility |
|------|-----------|----------------|
| Review security alerts | Weekly | @RbBtSn0w |
| Update action versions | Monthly | Team |
| Review workflow efficiency | Quarterly | Team |
| Update Python/Node versions | As needed | Team |

---

## Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [WORKFLOWS.md](./WORKFLOWS.md) - Workflow usage guide
- [DEPENDENCY_CHECK_GUIDE.md](./DEPENDENCY_CHECK_GUIDE.md) - Dependency management
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines

---

*Last updated: 2026-01-22*
*Maintained by: OmniPost Team*
