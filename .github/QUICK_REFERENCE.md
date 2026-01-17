# 🔧 Quick Reference - Dependency Check System

## 📁 File Checklist

```
.github/
├── workflows/
│   ├── dependency-check.yml          ✨ New - Periodic automated checks
│   ├── build.yml
│   ├── lint-*.yml
│   ├── security.yml
│   └── test.yml
├── dependabot.yml                    ✨ New - Automated updates
└── DEPENDENCY_CHECK_GUIDE.md         ✨ New - Complete guide
```

---

## ⏰ Execution Schedule

| Task | Time | Frequency | Purpose |
|------|------|-----------|---------|
| **Automated Dependency Check** | Mon 9:00 UTC | Weekly | Scan for vulnerabilities & outdated packages |
| **Dependabot PR** | Mon 9:00 UTC | Weekly | Auto-create update PRs |
| **Issue Alert** | When vulnerabilities found | Real-time | Immediate notification |

---

## 🎯 Core Features Overview

### 1️⃣ dependency-check.yml Workflow

**Automated Checks:**
- ✅ Python outdated package scan (pip list --outdated)
- ✅ Security vulnerability check (safety check)
- ✅ NPM multi-layer audit (root, frontend, backend)
- ✅ Critical dependency monitoring (Playwright, Flask, Vue)
- ✅ Automated alerts on vulnerabilities found

### 2️⃣ dependabot.yml Automated Updates

**Covered Package Managers:**
- ✓ Python (pip) - apps/backend/requirements.txt
- ✓ NPM Root - package.json
- ✓ NPM Frontend - apps/frontend/package.json
- ✓ NPM Backend - apps/backend/package.json
- ✓ GitHub Actions - .github/workflows/*.yml

**Configuration Features:**
- Weekly check (every Monday 9:00 UTC)
- Auto-create PRs (max 10 concurrent)
- Smart grouping (Vue, security updates, etc.)
- Auto-tagging (easy filtering)
- Assigned reviewers (RbBtSn0w)

---

## 🚀 Quick Start

### Step 1: Push Configuration to GitHub
```bash
cd /Users/snow/Documents/GitHub/omni-post
git add .github/workflows/dependency-check.yml
git add .github/dependabot.yml
git add .github/DEPENDENCY_CHECK_GUIDE.md
git commit -m "chore: add automated dependency check system"
git push origin main
```

### Step 2: Verify Enablement
- Go to GitHub repository → **Settings**
- Find **Code security and analysis**
- Confirm **Dependabot alerts** ✅ enabled
- Confirm **Dependabot security updates** ✅ enabled

### Step 3: Wait for First Execution
- ⏳ Dependabot's first execution takes 24 hours
- 🎯 Periodic checks run automatically every Monday 9:00 UTC

### Step 4: Configure Notifications
- GitHub → Settings → Notifications
- Check in Custom notifications:
  - [x] Security alert
  - [x] Dependabot alerts
  - [x] Dependabot pull requests

---

## 📊 Dependency Priority

| Package | Priority | Check Frequency |
|---------|----------|-----------------|
| Playwright | 🔴 High | Weekly |
| Flask | 🔴 High | Weekly |
| Vue 3 | 🟡 Medium | Weekly |
| Axios | 🟡 Medium | Weekly |
| pytest | 🟢 Low | Monthly |

---

## 💡 Key Metrics

- **Check Frequency**: 1 time per week
- **Concurrent PRs**: Max 10
- **Critical Dependencies**: 4 (Playwright, Flask, Vue, SQLite)
- **Coverage**: 4 package managers (pip, npm×3, github-actions)
- **Automated Alerts**: Real-time on vulnerability detection
- **Report Retention**: 30 days

---

## 🎮 Common Commands

### Manually Trigger Check
```
Actions → Dependency Security Check → Run workflow → Run workflow
```

### View Check Results
```
Actions → Dependency Security Check → Latest run → Summary
```

### Download Dependency Report
```
Actions → Latest run → Artifacts → python-dependency-report
```

---

## ⚠️ Important Notes

1. **First-time activation requires 24 hours** - Dependabot needs time to initialize
2. **Manual push triggers Actions** - Actions run automatically after code push
3. **All PRs require human review** - All Dependabot PRs need approval before merging
4. **Testing is critical** - Full test suite must pass after updates
5. **Security first** - Updates with 🔒 label need priority handling

---

## 🔗 Related Links

- 📖 [Complete Guide](./DEPENDENCY_CHECK_GUIDE.md)
- 🐍 [Python Safety Tool](https://github.com/pyupio/safety)
- 📦 [NPM Audit Docs](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- 🤖 [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)

---

## ✅ Verification Checklist

- [x] `.github/workflows/dependency-check.yml` exists
- [x] `.github/dependabot.yml` exists
- [x] `.github/DEPENDENCY_CHECK_GUIDE.md` exists
- [ ] Pushed to GitHub main branch
- [ ] Dependabot enabled in GitHub settings
- [ ] Notification options configured
- [ ] First check completed (wait 24 hours)
- [ ] First batch of Dependabot PRs received

---

**Deployment Time**: 2026-01-17 14:11 UTC+8
**Version**: v1.0
**Status**: ✨ Ready for Deployment
