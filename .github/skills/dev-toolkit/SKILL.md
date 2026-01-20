---
description: OmniPost development skills - Environment, DB, Testing, Debugging
---

# OmniPost Essential Skills

Comprehensive guide for development, debugging, and operations.

## 📦 Environment Management

### Development Server
```bash
# Start Dev Environment
npm run dev:frontend          # Vue 3 Vite Server (localhost:5173)
npm run dev:backend           # Flask Server (localhost:5409)

# Health Check
curl http://localhost:5409/api/health
curl http://localhost:5173
```

### Dependencies
```bash
npm install                              # Root + Workspaces
npm install -w apps/frontend             # Frontend only
npm install -w apps/backend              # Backend only

# Python Environment
cd apps/backend
source .venv/bin/activate
pip install -r requirements.txt
```

### Database
```bash
npm run db:init -w apps/backend

# Inspect Database
sqlite3 apps/backend/data/database.db
.tables                                   # List tables
SELECT * FROM tasks LIMIT 10;            # Query tasks
.quit
```

## 🧪 Testing & Quality

```bash
# Testing
npm run test:frontend                     # Vitest
npm run test:frontend -- --coverage       # Frontend Coverage
npm run test:backend                      # Pytest
pytest tests/ --cov=src --cov-report=html # Backend Coverage

# Linting
npm run lint:frontend                     # ESLint
npm run lint:frontend -- --fix            # Auto-fix
npm run lint:backend                      # Flake8
```

## 🐛 Debugging Skills

### Frontend Debugging
```bash
# DevTools: F12 or Cmd+Option+I
VITE_DEBUG=* npm run dev:frontend        # Debug Mode
npx vite-bundle-analyzer                  # Bundle Analysis
```

### Backend Debugging
```bash
export DEBUG_MODE=True
tail -f apps/backend/data/logs/app.log    # Live Logs
grep ERROR apps/backend/data/logs/*.log   # Find Errors

# Python Debugger: import pdb; pdb.set_trace()
# Commands: n(next), s(step), c(continue), p(print), q(quit)
```

### Playwright Debugging
```bash
# Visualization: LOCAL_CHROME_HEADLESS=False
# Recording: await context.tracing.start(...)
playwright show-trace trace.zip
# Screenshot: await page.screenshot(path="debug.png")
```

## 🔍 Diagnostics

```bash
# Port Check
lsof -i :5409                             # Backend
lsof -i :5173                             # Frontend

# Log Analysis
tail -n 100 apps/backend/data/logs/app.log
grep -c ERROR apps/backend/data/logs/app.log
grep "2026-01-20" apps/backend/data/logs/app.log

# Database Integrity
sqlite3 apps/backend/data/database.db "PRAGMA integrity_check;"
```

## 🔧 Dev Tools

```bash
# Code Search
grep -r "PublishService" apps/backend/src/
find apps/ -name "*.py" | xargs wc -l    # Line count

# Git Workflow
git checkout -b feature/new-feature
git add .
# Commit conventions: feat|fix|docs|style|refactor|test|chore
git commit -m "feat(backend): add feature"
git push origin feature/new-feature
gh pr create

# Sync Main
git checkout main && git pull
git checkout feature/new-feature
git rebase main
```

## 📊 Performance Analysis

```bash
# Frontend
npm run build:frontend -- --mode analyze
lighthouse http://localhost:5173 --view

# Backend
ab -n 1000 -c 10 http://localhost:5409/api/publish/get_tasks
wrk -t4 -c100 -d30s http://localhost:5409/api/tasks
```

## 🚀 Deployment

```bash
# Build
npm run build:frontend
pip freeze > requirements.txt

# Environment Vars
export DEBUG_MODE=False
export LOCAL_CHROME_HEADLESS=True
```

## 🔐 Security

```bash
# Dependency Scan
npm audit                                 # Frontend
pip-audit                                 # Backend

# Secrets Check
grep -r "password\|api_key\|secret" apps/ --include="*.py" --include="*.js"
```
