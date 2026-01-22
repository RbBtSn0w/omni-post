# GitHub Actions CI/CD Documentation

This document describes the continuous integration and deployment workflows for the OmniPost project.

## Overview

OmniPost uses GitHub Actions for automated testing, linting, building, and security scanning. The workflows are designed to:
- Run efficiently with minimal duplication
- Provide fast feedback on pull requests
- Ensure code quality and security
- Generate comprehensive reports

## Workflow Files

### Core Quality Checks

#### 1. `build.yml` - Build Verification
**Triggers:** Push/PR to main/develop (on backend/frontend changes)  
**Purpose:** Verify that the application can be built successfully  
**Blocking:** ✅ Yes - Must pass before merge  
**Jobs:**
- `backend-build`: Validates Python imports and Flask app creation
- `frontend-build`: Builds Vue.js application and verifies output

**Key Features:**
- Uses pip caching for Python dependencies
- Uses npm caching for Node.js dependencies
- Validates both backend and frontend can build
- Checks Flask app instantiation

---

#### 2. `test.yml` - Test Suite
**Triggers:** Push/PR to main/develop (on code/config changes)  
**Purpose:** Run automated tests for backend and frontend  
**Blocking:** ✅ Yes - Must pass before merge  
**Jobs:**
- `backend-test`: Runs pytest with coverage for Python code
- `frontend-test`: Runs Vitest with coverage for Vue.js code

**Key Features:**
- Matrix strategy for Python 3.10
- Installs Playwright for browser automation tests
- Uploads coverage reports to Codecov
- Uses pip and npm caching

---

#### 3. `lint-backend.yml` - Backend Code Quality
**Triggers:** Push/PR to main/develop (on backend changes)  
**Purpose:** Enforce Python code quality standards  
**Blocking:** ✅ Yes (black, isort), ⚠️ Partial (flake8, pylint)  
**Jobs:**
- `lint`: Runs black, isort, flake8, pylint, radon

**Key Features:**
- **Hard gates:** black (formatting), isort (import sorting) - must pass
- **Soft checks:** flake8, pylint - report but don't block
- Code complexity analysis with radon
- Duplicate code detection
- Uses pip caching for dependencies

---

#### 4. `lint-frontend.yml` - Frontend Code Quality
**Triggers:** Push/PR to main/develop (on frontend changes)  
**Purpose:** Enforce JavaScript/Vue code quality standards  
**Blocking:** ✅ Yes - ESLint must pass  
**Jobs:**
- `lint`: Runs ESLint on Vue.js and JavaScript files

**Key Features:**
- ESLint is a hard gate (blocking)
- Build step removed (now in build.yml)
- Uses npm caching

---

### Security & Dependencies

#### 5. `dependency-scan.yml` - Dependency Security Scan
**Triggers:**
- Weekly schedule (Monday 9:00 UTC)
- Manual dispatch with severity threshold option
- Pull requests modifying dependency files

**Purpose:** Scan dependencies for known security vulnerabilities  
**Blocking:** ✅ Yes - Fails on high/critical vulnerabilities  
**Jobs:**
- `python-dependencies`: Uses pip-audit to scan Python packages
- `npm-dependencies`: Uses npm audit to scan NPM packages
- `create-issue-if-vulnerable`: Auto-creates GitHub issue if vulnerabilities found (scheduled runs only)
- `summary`: Generates consolidated scan summary

**Key Features:**
- Configurable severity threshold (default: high)
- Scans production dependencies only for NPM
- Creates/updates GitHub issues for scheduled scans
- Uploads audit reports as artifacts (90-day retention)
- Lists outdated packages
- Uses pip and npm caching

**Severity Thresholds:**
- **Default:** Fail on `high` and `critical` vulnerabilities
- **Configurable:** Can be set to `low`, `moderate`, `high`, or `critical` via workflow_dispatch

---

#### 6. `security-analysis.yml` - Static Security Analysis
**Triggers:**
- Push/PR to main/develop (on Python/JS/Vue file changes)
- Weekly schedule (Sunday 01:30 UTC)
- Manual dispatch

**Purpose:** Perform static code analysis for security issues  
**Blocking:** ✅ Yes - CodeQL and high-severity Bandit issues block  
**Jobs:**
- `codeql`: GitHub's CodeQL analysis for Python and JavaScript
- `bandit`: Python-specific security scanner (fails on high severity only)
- `summary`: Consolidated security analysis summary

**Key Features:**
- CodeQL scans both Python and JavaScript code
- Bandit provides Python-specific security checks
- Only runs Bandit when Python files change (optimized)
- Fails only on high-severity Bandit findings
- Medium/low Bandit issues are reported but don't block
- Results appear in GitHub Security tab
- Uploads Bandit reports as artifacts

---

#### 7. `codeql.yml` - Legacy CodeQL Workflow (DEPRECATED)
**Status:** ⚠️ Replaced by `security-analysis.yml`  
**Action:** This workflow is kept for compatibility but new security scans use `security-analysis.yml`

---

### Utility Workflows

#### 8. `changelog.yml` - Changelog Generator
**Triggers:** Push to main (on code/config changes)  
**Purpose:** Generate changelog from git commits  
**Blocking:** ❌ No - Informational only  

---

#### 9. `reusable-setup.yml` - Reusable Setup Workflow
**Type:** Reusable workflow (called by other workflows)  
**Purpose:** Centralize common setup steps  
**Parameters:**
- `setup-type`: python, node, or both
- `python-version`: Python version (default: 3.10)
- `node-version`: Node.js version (default: 18.x)
- `working-directory`: Installation directory
- `install-backend-dev`: Include dev dependencies
- `install-playwright`: Install Playwright browsers
- `cache-key-suffix`: Custom cache key suffix

**Features:**
- Unified Python and Node.js setup
- Automatic dependency caching (pip, npm)
- Conditional Playwright browser installation
- Single source of truth for environment setup

---

## Deprecated/Replaced Workflows

### `dependency-check.yml` (REPLACED)
**Replaced by:** `dependency-scan.yml`  
**Reason:** Consolidated with security.yml to reduce duplication

### `security.yml` (REPLACED)
**Replaced by:** `dependency-scan.yml` (dependency checks) and `security-analysis.yml` (static analysis)  
**Reason:** Split into focused workflows - dependency scanning vs. code analysis

---

## Caching Strategy

### Python (pip)
- **Cache key:** Based on `apps/backend/pyproject.toml`
- **Cached items:** pip packages
- **Implementation:** `actions/setup-python@v5` with `cache: 'pip'`

### Node.js (npm)
- **Cache key:** Based on `package-lock.json`
- **Cached items:** npm packages
- **Implementation:** `actions/setup-node@v4` with `cache: 'npm'`

### Benefits
- Faster workflow execution (30-50% time reduction)
- Reduced network usage
- More reliable builds (less prone to registry issues)

---

## Blocking vs. Reporting Checks

### Blocking (Must Pass for PR Merge)
✅ **These checks will prevent merging if they fail:**
- Build verification (backend + frontend)
- Test suite (backend + frontend)
- ESLint (frontend)
- Black formatting (backend)
- isort import sorting (backend)
- Dependency vulnerabilities (high/critical severity)
- CodeQL security analysis
- Bandit high-severity findings

### Reporting Only (Advisory)
⚠️ **These checks provide information but don't block:**
- flake8 linting warnings (backend)
- pylint warnings (backend)
- Radon complexity metrics
- Bandit medium/low severity findings
- Outdated package notifications
- Changelog generation

---

## How to Add or Modify Workflows

### Adding a New Workflow

1. Create a new `.yml` file in `.github/workflows/`
2. Define clear triggers (`on:` section)
3. Set appropriate permissions (principle of least privilege)
4. Use concurrency groups to cancel outdated runs
5. Add timeout limits to prevent hung jobs
6. Consider using `reusable-setup.yml` for Python/Node setup
7. Generate step summaries for key findings
8. Update this documentation

**Template:**
```yaml
name: Your Workflow Name

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

on:
  pull_request:
    paths:
      - 'relevant/path/**'

permissions:
  contents: read

jobs:
  your-job:
    name: Job Name
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
    - uses: actions/checkout@v4
    # Add your steps
```

### Modifying Existing Workflows

1. **For setup changes:** Modify `reusable-setup.yml` if it affects multiple workflows
2. **For triggers:** Update the `on:` section and paths carefully
3. **For blocking behavior:** Adjust `continue-on-error:` settings
4. **For caching:** Ensure cache keys match dependency files
5. **Test locally:** Use `act` or similar tools when possible
6. **Update documentation:** Reflect changes in this file

### Best Practices

1. **Use concurrency groups** to cancel outdated workflow runs
2. **Add timeout-minutes** to prevent runaway jobs
3. **Cache dependencies** to speed up execution
4. **Use `continue-on-error`** wisely - only for non-critical checks
5. **Generate summaries** with `$GITHUB_STEP_SUMMARY` for important findings
6. **Upload artifacts** for reports that need review
7. **Use path filters** to trigger only when relevant files change
8. **Set minimal permissions** required for the workflow
9. **Add job names** that are descriptive and clear
10. **Comment complex logic** inline in YAML

---

## Troubleshooting

### Workflow Not Triggering
- Check path filters match changed files
- Verify branch names in triggers
- Ensure workflow file is on the correct branch

### Cache Not Working
- Verify cache key matches dependency file path
- Check if cache size exceeds GitHub limits (10GB per repo)
- Ensure dependency files haven't changed

### Job Failing Unexpectedly
- Check timeout settings (default is 360 minutes)
- Review step logs in Actions tab
- Verify dependencies are correctly installed
- Check for environment-specific issues

### Security Scans False Positives
- For Bandit: Add `# nosec` comment with justification
- For CodeQL: Use `.github/codeql/codeql-config.yml` to configure queries
- For dependency scans: May need to wait for upstream fixes or use exclusions

---

## Workflow Execution Times (Approximate)

| Workflow | Typical Duration | With Cache | Notes |
|----------|------------------|------------|-------|
| build.yml | 3-5 min | 2-3 min | Both jobs run in parallel |
| test.yml | 5-10 min | 3-6 min | Includes coverage upload |
| lint-backend.yml | 2-4 min | 1-2 min | Fast feedback |
| lint-frontend.yml | 2-3 min | 1-2 min | ESLint only |
| dependency-scan.yml | 5-8 min | 3-5 min | Two parallel scans |
| security-analysis.yml | 8-15 min | 6-12 min | CodeQL can be slow |

---

## Maintenance Schedule

### Weekly Tasks (Automated)
- Monday 09:00 UTC: Dependency security scan
- Sunday 01:30 UTC: Full security analysis (CodeQL + Bandit)

### Monthly Tasks (Manual)
- Review and close resolved security issues
- Update workflow actions to latest versions
- Review and update severity thresholds if needed

### Quarterly Tasks (Manual)
- Review workflow efficiency and optimization opportunities
- Update this documentation with any changes
- Audit permissions and security settings

---

## Contact & Support

For questions or issues with CI/CD workflows:
- **Repository Owner:** [@RbBtSn0w](https://github.com/RbBtSn0w)
- **Issues:** [GitHub Issues](https://github.com/RbBtSn0w/omni-post/issues)
- **Discussions:** Use GitHub Discussions for workflow improvements

---

*Last Updated: 2026-01-22*  
*Maintained by: OmniPost Development Team*
