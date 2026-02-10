---
name: dev-toolkit
description: OmniPost development toolkit - Setup, Diagnostics, and Analysis
---

# OmniPost Dev Toolkit

This skill provides automated tools for checking system health, analyzing logs, and inspecting the database.

## 🛠️ Automated Tools

### System Health Check
Check environment dependencies (Node, Python), port availability, and database integrity.
```bash
./.agent/skills/dev-toolkit/scripts/health-check.sh
```

### Log Analysis
Analyze backend logs for errors and warnings. You can specify the number of lines to check (default: 100).
```bash
./.agent/skills/dev-toolkit/scripts/analyze-logs.sh 200
```

### Database Inspection
Quickly view task statistics and recent failures without manual SQL queries.
```bash
./.agent/skills/dev-toolkit/scripts/inspect-db.sh
```

---

## 📦 Manual Operations (Reference)

### Development Server
```bash
npm run dev:frontend          # Frontend (localhost:5173)
npm run dev:backend           # Backend (localhost:5409)
```

### Testing
```bash
npm run test:frontend         # Vitest
npm run test:backend          # Pytest
```

### Database
```bash
npm run db:init -w apps/backend
sqlite3 apps/backend/data/database.db
```

### Debugging
- **Frontend**: `VITE_DEBUG=* npm run dev:frontend`
- **Backend**: `export DEBUG_MODE=True; tail -f apps/backend/data/logs/app.log`
- **Playwright**: `playwright show-trace trace.zip`

### Deployment
```bash
npm run build:frontend
pip freeze > requirements.txt
```
