# GitHub Actions CI/CD Documentation

This document describes the continuous integration and continuous deployment workflows for the OmniPost project.

## Overview

OmniPost uses GitHub Actions for automated testing, building, linting, and security scanning. The workflows are designed to:

- Minimize duplication through reusable workflows and caching
- Provide fast feedback on pull requests
- Ensure code quality and security
- Automatically detect and report vulnerabilities

## Workflow Structure

### Core Workflows

#### 1. Build Verification (`build.yml`)
**Purpose:** Verify that backend and frontend code can be built successfully.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when relevant files change (apps/backend/**, apps/frontend/**, package*.json)

**Jobs:**
- `backend-build`: Checks Python imports and Flask app creation
- `frontend-build`: Builds Vue.js application and verifies output

**Blocking:** ✅ Yes - Must pass for PR merge

**Caching:** 
- Python pip packages
- NPM packages

---

#### 2. Linting Workflows

##### Backend Lint (`lint-backend.yml`)
**Purpose:** Enforce Python code quality standards.

**Triggers:**
- Push/PR to `main` or `develop` with Python file changes

**Tools:**
- `black` - Code formatting (blocking)
- `isort` - Import sorting (blocking)
- `flake8` - Linting (reporting)
- `pylint` - Advanced linting (reporting)
- `radon` - Complexity analysis (reporting)

**Blocking:** ✅ Partially - black and isort are hard gates

**Caching:** 
- Python pip packages
- Linting tools

##### Frontend Lint (`lint-frontend.yml`)
**Purpose:** Enforce JavaScript/Vue code quality standards.

**Triggers:**
- Push/PR to `main` or `develop` with frontend file changes

**Tools:**
- `ESLint` - JavaScript/Vue linting (blocking)

**Blocking:** ✅ Yes - ESLint failures block merge

**Caching:**
- NPM packages

**Note:** Build step removed - linting only focuses on code quality, not buildability (handled by build.yml)

---

#### 3. Test Workflows (`test.yml`)

**Purpose:** Run automated test suites for backend and frontend.

**Triggers:**
- Push/PR to `main` or `develop` with code changes

**Jobs:**
- `backend-test`: Runs pytest with coverage for Python code
- `frontend-test`: Runs Vitest with coverage for Vue.js code

**Blocking:** ✅ Yes - Test failures block merge

**Caching:**
- Python pip packages
- NPM packages
- Playwright browsers

**Coverage:** Results uploaded to Codecov (non-blocking)

---

### Security Workflows

#### 4. Dependency Security Scan (`dependency-scan.yml`)
**Purpose:** Scan project dependencies for known security vulnerabilities.

**Triggers:**
- **Schedule:** Weekly on Mondays at 9:00 UTC
- **Manual:** workflow_dispatch with configurable severity threshold
- **PR:** When dependency files change

**Jobs:**
- `python-dependencies`: Uses `pip-audit` to scan Python packages
- `npm-dependencies`: Uses `npm audit` to scan NPM packages
- `create-issue`: Automatically creates/updates GitHub issue on vulnerability detection (scheduled runs only)
- `summary`: Generates comprehensive scan summary

**Severity Thresholds:**
- Default: Fail on `high` or `critical` vulnerabilities
- Configurable via manual trigger: `low`, `moderate`, `high`, `critical`

**Blocking:** ✅ On PRs - High/critical vulnerabilities block merge

**Artifacts:**
- Python audit report (JSON, 90-day retention)
- NPM audit report (JSON, 90-day retention)

**Auto-remediation:**
- Creates GitHub issues assigned to @RbBtSn0w
- Provides detailed remediation steps in issue body

---

#### 5. Security Analysis (`security-analysis.yml`)
**Purpose:** Static security analysis of source code.

**Triggers:**
- **Push/PR:** Code changes in Python or JavaScript/Vue files
- **Schedule:** Weekly on Sundays at midnight UTC
- **Manual:** workflow_dispatch

**Jobs:**
- `codeql-analysis`: GitHub CodeQL scanning for JavaScript and Python
  - Matrix strategy for multi-language support
  - Extended security queries enabled
- `bandit-analysis`: Supplemental Python security checks
  - Only runs when Python files change or on schedule
  - Fails on high-severity issues
  - Medium/low severity are reported but non-blocking

**Blocking:** 
- ✅ CodeQL: Yes - Critical issues block merge
- ⚠️ Bandit: Partial - Only high-severity issues block

**Artifacts:**
- Bandit security report (JSON, 90-day retention)

**Integration:** Results appear in repository Security tab

---

#### 6. CodeQL (`codeql.yml`) - Legacy
**Status:** ⚠️ This workflow is superseded by `security-analysis.yml`

**Note:** The standalone CodeQL workflow has been consolidated into `security-analysis.yml` to avoid duplication. This file may be deprecated in the future.

---

### Deprecated Workflows

#### `dependency-check.yml` - ⛔ Deprecated
**Replaced by:** `dependency-scan.yml`

**Reason:** Consolidated with npm security checks from security.yml into a single comprehensive dependency scanning workflow.

#### `security.yml` - ⛔ Deprecated  
**Replaced by:** Functionality split between `dependency-scan.yml` and `security-analysis.yml`

**Reason:** 
- NPM auditing moved to `dependency-scan.yml`
- Safety tool deprecated (pip-audit is more actively maintained)
- Bandit moved to `security-analysis.yml` with CodeQL

---

### Utility Workflows

#### 7. Reusable Setup (`reusable-setup.yml`)
**Purpose:** Centralize environment setup to reduce duplication.

**Type:** Reusable workflow (called by other workflows)

**Features:**
- Supports Python, Node.js, or both
- Configurable versions and working directory
- Optional dependency installation
- Integrated caching for pip and npm
- Optional Playwright browser installation

**Benefits:**
- DRY principle - setup logic defined once
- Consistent caching strategy across workflows
- Easier maintenance and updates

---

#### 8. Changelog Generation (`changelog.yml`)
**Purpose:** Automatically generate changelog on releases.

**Triggers:** Release events

**Note:** Not part of the refactoring scope - unchanged.

---

## Caching Strategy

All workflows implement intelligent caching to speed up builds:

### Python Caching
```yaml
- uses: actions/setup-python@v5
  with:
    cache: 'pip'
    cache-dependency-path: apps/backend/pyproject.toml

- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-3.10-<context>-${{ hashFiles('...') }}
```

### Node.js Caching
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

**Benefits:**
- Faster workflow execution (30-60% time reduction)
- Reduced network usage
- More reliable builds (less susceptible to registry outages)

---

## Blocking vs. Reporting Policies

### Blocking Checks (Must Pass for Merge)
- ✅ Build verification (both backend and frontend)
- ✅ Black formatting
- ✅ isort import sorting
- ✅ ESLint
- ✅ All tests (backend and frontend)
- ✅ High/critical dependency vulnerabilities (on PRs)
- ✅ CodeQL critical security issues
- ✅ Bandit high-severity issues

### Reporting Checks (Informational)
- ℹ️ flake8 warnings
- ℹ️ pylint warnings
- ℹ️ Code complexity metrics (radon)
- ℹ️ Bandit medium/low severity
- ℹ️ Code coverage (uploaded but doesn't block)
- ℹ️ Outdated dependency lists

### Scheduled Checks (Non-blocking)
- ℹ️ Weekly dependency scans (creates issues instead of failing)
- ℹ️ Weekly security scans

---

## How to Add or Modify Workflows

### Adding a New Workflow

1. Create a new YAML file in `.github/workflows/`
2. Define appropriate triggers (push, pull_request, schedule, etc.)
3. Use the reusable-setup.yml workflow for environment setup when possible
4. Add caching for dependencies
5. Set appropriate timeout-minutes (default: 10-15 minutes)
6. Use concurrency groups to cancel outdated runs
7. Set proper permissions (least privilege principle)
8. Add job summaries using `$GITHUB_STEP_SUMMARY`
9. Update this documentation

### Modifying Existing Workflows

1. Always use the reusable-setup workflow instead of duplicating setup steps
2. Maintain caching configuration
3. Preserve blocking vs. reporting behavior unless explicitly changing policy
4. Test changes in a PR before merging to main
5. Update this documentation if behavior changes

### Best Practices

- **DRY Principle:** Use reusable workflows and actions
- **Fast Feedback:** Optimize for quick failure detection
- **Clear Summaries:** Use GitHub step summaries for actionable feedback
- **Fail Fast:** Use `fail-fast: false` in matrices only when all combinations must run
- **Caching:** Always cache dependencies to speed up workflows
- **Timeouts:** Set reasonable timeouts to prevent hanging workflows
- **Artifacts:** Upload reports with appropriate retention periods
- **Permissions:** Use least privilege - only request needed permissions

---

## Workflow Execution Times

Approximate execution times (with caching):

| Workflow | Duration | Notes |
|----------|----------|-------|
| lint-backend | 2-3 min | Fast with cached deps |
| lint-frontend | 1-2 min | Fast with cached deps |
| build | 3-5 min | Both jobs in parallel |
| test | 5-8 min | Includes coverage upload |
| dependency-scan | 5-10 min | Both jobs in parallel |
| security-analysis | 10-20 min | CodeQL analysis is slower |

**Total PR check time:** ~10-15 minutes (workflows run in parallel)

---

## Troubleshooting

### Common Issues

**Cache misses:**
- Verify cache key includes all dependency files
- Check if dependencies were updated (invalidates cache)

**Workflow timeouts:**
- Increase timeout-minutes
- Check for network issues or hanging processes

**Dependency conflicts:**
- Review dependency updates
- Check for incompatible version combinations

**False positives in security scans:**
- Review Bandit/CodeQL reports for context
- Add suppression comments if truly false positive
- Document reason for suppression

### Getting Help

For workflow issues:
1. Check workflow run logs in Actions tab
2. Review this documentation
3. Check for similar issues in GitHub repository
4. Contact @RbBtSn0w for repository-specific questions

---

## Maintenance Schedule

- **Weekly:** Dependency and security scans (automated)
- **Monthly:** Review and update GitHub Actions versions
- **Quarterly:** Review and optimize caching strategy
- **Yearly:** Review and update blocking policies

---

## Related Documentation

- [WORKFLOWS.md](WORKFLOWS.md) - Legacy workflow documentation
- [DEPENDENCY_CHECK_GUIDE.md](DEPENDENCY_CHECK_GUIDE.md) - Dependency management
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Last Updated:** 2026-01-22  
**Maintained By:** @RbBtSn0w
