# Automated Dependency Security Check Configuration Guide

## 📋 Overview

A comprehensive automated dependency checking system has been configured for the OmniPost project, consisting of two core configuration files:

1. **`.github/workflows/dependency-check.yml`** - Periodic automated checking workflow
2. **`.github/dependabot.yml`** - Dependabot automated update configuration

---

## 🚀 Feature Description

### 1. Automated Dependency Check Workflow (dependency-check.yml)

**Trigger Methods:**
- ⏰ **Scheduled Execution** - Every Monday at 9:00 AM UTC (5:00 PM Beijing Time)
- 🎯 **Manual Trigger** - Can be triggered manually via GitHub UI

**Check Contents:**

#### Python Dependency Check
- ✅ Outdated package scanning (pip list --outdated)
- ✅ Security vulnerability check (safety check)
- 📊 Generate check reports and upload as artifacts

#### NPM Dependency Check (Multi-layer Coverage)
- ✅ Root directory dependency audit
- ✅ Frontend application dependency audit
- ✅ Backend script dependency audit
- 📊 Check for outdated and vulnerable packages

#### Critical Dependency Monitoring
- 📦 Playwright version check (browser automation core)
- 📦 Flask version check (web framework)
- 📦 Vue 3 version check (frontend framework)

#### Automated Alerts
- 🚨 Automatically create GitHub Issue when vulnerabilities detected
- 📧 Tag as `🔒 security` for easy filtering

---

### 2. Dependabot Automated Update Configuration (dependabot.yml)

**Automated Features:**
- ⏰ **Weekly Update Checks** (Monday 9:00 AM UTC)
- 🔄 **Auto-Create PRs** - Automatically submit update PRs when new versions are released
- 🧪 **Grouped Management** - Related dependencies consolidated into a single PR
- 🏷️ **Auto-Tagging** - Automatically tagged for easy categorization and filtering

**Coverage:**

```
✓ Python (apps/backend/requirements.txt)
✓ NPM Root (package.json)
✓ NPM Frontend (apps/frontend/package.json)
✓ NPM Backend (apps/backend/package.json)
✓ GitHub Actions
```

**Grouping Strategy:**
- 🔒 **Security Updates** - Prioritize handling security-related packages
- 🛠️ **Development Dependencies** - Grouped separately for batch processing
- 📚 **Vue Ecosystem** - Related packages (Vue, Vite, etc.) consolidated

---

## 📊 Monitoring Metrics

### High Priority Dependencies (Require Immediate Updates)
| Package | Purpose | Reason |
|---------|---------|--------|
| **Playwright** | Browser automation | Needs to keep up with browser version updates |
| **Flask** | Web framework | Security patches and performance improvements |
| **Vue 3** | Frontend framework | Ecosystem updates and optimizations |
| **SQLite3** | Database | Data security and performance |

### Medium Priority Dependencies (Regular Checks)
- Pinia - State management
- Element Plus - UI component library
- Axios - HTTP client
- pytest - Testing framework
- Vite - Build tool

---

## 🔧 Usage Guide

### 1. View Check Results

**Go to Actions Tab:**
```
GitHub Repo → Actions → "Dependency Security Check"
```

**View Detailed Reports:**
- Select the latest workflow run
- View reports under "Artifacts"
- Check "Summary" tab for check results

### 2. Handle Dependabot PRs

**Auto-generated PRs will be marked as:**
- 📦 `dependencies` - All dependency updates
- 🐍 `python` - Python dependencies
- 📱 `npm` - NPM dependencies
- 🔒 `security` - Security-related updates (highest priority)

**Review Steps:**
1. Check PR's release notes/changelog
2. Verify that automated tests pass
3. For major version upgrades, manual testing required
4. Ensure no breaking changes
5. Merge PR

### 3. Manually Run Check

To run a check immediately without waiting for scheduled time:

```bash
# In GitHub UI:
Actions → Dependency Security Check → Run workflow → Run workflow
```

---

## ⚙️ Configuration Adjustments

### Change Check Frequency

Edit `.github/workflows/dependency-check.yml`:
```yaml
schedule:
  # Run daily
  - cron: '0 9 * * *'

  # Run every two weeks
  - cron: '0 9 * * 1/2'
```

Edit `.github/dependabot.yml`:
```yaml
schedule:
  interval: "daily"    # daily, weekly, monthly
```

### Adjust PR Limit

```yaml
# Max 10 concurrent PRs
open-pull-requests-limit: 10

# Change to 5 (more conservative)
open-pull-requests-limit: 5
```

### Ignore Specific Packages

```yaml
ignore:
  # This package requires manual review, no auto-update
  - dependency-name: "package-name"
    versions: [">=2.0.0"]
```

---

## 🚨 Common Scenarios

### Scenario 1: Security Vulnerability Detected

1. **Automated Alert** - Workflow automatically creates Issue
2. **Review Details** - Click Issue to see affected packages
3. **Emergency Update** - Immediately create PR to fix vulnerability
4. **Notify Team** - Tag relevant people for review
5. **Quick Merge** - Expedited handling for security PRs

### Scenario 2: Large Number of Outdated Dependencies

1. **Categorize** - Distinguish between security and feature updates
2. **Prioritize** - Update critical packages first (Playwright, Flask, etc.)
3. **Batch Test** - Consolidated testing time
4. **Gradual Update** - Merge incrementally rather than all at once

### Scenario 3: Breaking Version Changes

1. **Check Release Notes** - Review major changes
2. **Local Testing** - Test in development environment
3. **Create Branch** - Separate branch for upgrade
4. **Adapt Code** - Handle API changes
5. **Complete Testing** - Both frontend and backend tests pass

---

## 📈 Best Practices

### ✅ Recommended Practices

1. **Regular Review** - Check dependency reports weekly
2. **Timely Updates** - Don't delay handling security updates more than 1 month
3. **Small Steps** - Avoid updating large batches of dependencies at once
4. **Thorough Testing** - Run full test suite after updates
5. **Version Pinning** - Use specific version numbers in production

### ❌ Practices to Avoid

1. ❌ Ignore security alerts
2. ❌ Update all dependencies at once
3. ❌ Skip tests before deployment
4. ❌ Close PR immediately after update (wait for verification time)
5. ❌ Delete GitHub Actions alerts

---

## 📧 Notification Setup

### Configure GitHub Notifications

1. **Go to Settings → Notifications**
2. **Select "Custom"**
3. **Check options:**
   - [x] Security alert
   - [x] Dependabot alerts
   - [x] Dependabot pull requests

### Email Alerts

Modify `reviewers` and `assignees` to your GitHub username:

```yaml
reviewers:
  - "RbBtSn0w"  # Change to your username
assignees:
  - "RbBtSn0w"  # Change to your username
```

---

## 🔍 Troubleshooting

### Issue 1: Dependabot PRs Not Created

**Checklist:**
- ✓ `.github/dependabot.yml` file exists
- ✓ All paths are correct
- ✓ GitHub repository settings allow Dependabot
- ✓ Waited 24 hours for first run

**Solution:**
```bash
# Check in GitHub UI
Settings → Code security and analysis → Dependabot
```

### Issue 2: Workflow Not Running Automatically

**Checklist:**
- ✓ `.github/workflows/dependency-check.yml` on main branch
- ✓ GitHub Actions enabled
- ✓ Not ignored by .gitignore

**Manual Trigger:**
```
Actions → Dependency Security Check → Run workflow
```

### Issue 3: Frequent Update PRs

**Adjust Frequency:**
```yaml
schedule:
  interval: "monthly"  # Change to monthly
```

Or adjust limit:
```yaml
open-pull-requests-limit: 3  # Reduce concurrent PRs
```

---

## 📚 Related Resources

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [GitHub Actions Workflows](https://docs.github.com/en/actions/using-workflows)
- [Python Safety Tool](https://github.com/pyupio/safety)
- [NPM Audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)

---

## 📝 Checklist

- [x] Create `.github/workflows/dependency-check.yml`
- [x] Create `.github/dependabot.yml`
- [x] Configure check frequency to weekly
- [x] Set up automated alerts
- [x] Add critical dependency monitoring
- [ ] Push to GitHub to enable Actions
- [ ] Verify first workflow execution
- [ ] Check if Dependabot creates PRs
- [ ] Configure notification settings
- [ ] Establish PR review process

---

**Updated**: 2026-01-17
**Project**: OmniPost
**Maintainer**: RbBtSn0w
