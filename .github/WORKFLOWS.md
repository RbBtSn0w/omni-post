# GitHub Automation Workflows Configuration Guide

> **📚 For detailed CI/CD documentation, see [CI.md](./CI.md)**

This project is fully equipped with GitHub Actions automation workflows, covering CI/CD, code quality, security checks, and more.

## Quick Reference

For comprehensive information about all workflows, their triggers, blocking policies, and troubleshooting guides, please refer to **[CI.md](./CI.md)**.

This document provides a high-level overview of the configured workflows.

## 📋 Configured Workflows

### Phase 1: Core Automation ✅

#### 1. **test.yml** - Automated Testing & Coverage
- **Triggers**: Push and PR to `main` / `develop` branches.
- **Tasks**:
  - Run backend unit tests (pytest).
  - Run frontend unit tests (vitest).
  - Calculate test coverage for both backend and frontend.
  - Upload coverage reports to Codecov.
- **Status Display**: Test results and coverage are directly displayed in the PR.

#### 2. **lint-backend.yml** - Backend Code Quality (Consolidated)
- **Triggers**: Modifications in `apps/backend/` directory.
- **Checks**:
  - Black: Code formatting.
  - isort: Import sorting.
  - Flake8: PEP8 compliance.
  - Pylint: Static analysis and code duplication check.
  - Radon: Cyclomatic complexity and maintainability index analysis.
  - LoC: Line of code statistics.
- **Note**: Allows execution to continue even if some checks fail (non-blocking).

#### 3. **lint-frontend.yml** - Frontend Code Quality
- **Triggers**: Modifications in `apps/frontend/` directory.
- **Checks**:
  - ESLint: Code linting.
  - Vue: Component validation.
  - Build Check: Project build integrity.

---

### Phase 2: Workflow Optimization ✅

#### 4. **PR Template** - Submission Checklist
- **Location**: `.github/pull_request_template.md`
- **Content**:
  - PR type categorization (Bug, Feature, Docs, etc.).
  - Detailed submission checklist.
  - Code quality and testing requirements.
  - Document update verification.
- **Effect**: Standardized template automatically appears for every new PR.

---

### Phase 3: Advanced Automation ✅

#### 5. **build.yml** - Build Verification
- **Triggers**: Every Push and PR.
- **Verification**:
  - Backend: Dependency import verification and Flask app initialization check.
  - Frontend: Full production build process.
- **Purpose**: Ensures the code can be built correctly across environments.

#### 6. **security.yml** - Security Analysis
- **Triggers**: Changes to dependency files or scheduled weekly checks.
- **Tools**:
  - Python: Safety & Bandit (vulnerability scanning).
  - Frontend: npm audit (dependency security).
- **Scope**:
  - Detection of known vulnerabilities.
  - Code-level security risk analysis.

#### 7. **changelog.yml** - Automatic Changelog Generation
- **Triggers**: Push to `main` branch or release tags.
- **Functionality**:
  - Automatically generates change logs from Git commit messages.
  - Supports version tag management.
- **Output**: Used for Release notes and GitHub Releases.

---

## 🚀 Usage Guide

### Viewing Workflow Status

1. **In PR Page**:
   - All checks are displayed at the bottom of the PR page.
   - Click "Details" to view logs.
   - ✓ indicates success, ✗ indicates failure.

2. **In Actions Tab**:
   - Navigate to the "Actions" tab in the GitHub repository.
   - Select a specific workflow to see execution history and logs.

### Common Scenarios

#### Scenario 1: Checking status after pushing code
```bash
1. Create a PR or push to develop.
2. Wait for GitHub Actions to complete (usually 2-5 minutes).
3. Review status in the PR page.
4. Merge only after all required checks pass.
```

#### Scenario 2: Fix a failed Lint check
```bash
Backend style error:
1. Review results in the lint-backend workflow logs.
2. Run `pip install black isort flake8` locally.
3. Run `black .` and `isort .` locally to fix.
4. Commit and push again.
```

#### Scenario 3: Security vulnerability detected
```bash
1. security.yml will list outdated or vulnerable packages.
2. Update the specific dependency version in requirements.txt or package.json.
3. Run local tests to ensure compatibility.
4. Push to trigger a re-check.
```

---

## 🔧 Maintenance

### Periodic Review
- Monthly check of overall workflow health.
- Monitor `security.yml` for new vulnerability alerts.
- Track coverage trends in Codecov.

### Updates
When project dependencies or structure change:
1. Update Python versions in `test.yml` and `lint-backend.yml`.
2. Update Node version in JS-related workflows.
3. Update directory paths if folders are restructured.

---

**Last Updated**: 2026-01-16
**Version**: 2.0 (Consolidated)
**Maintainers**: Project Contributors
