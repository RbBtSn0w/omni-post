# omni-post Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-16

## Active Technologies
- TypeScript 5.x, Node.js 20+ LTS + Playwright, Express.js, better-sqlite3, commander, unified/remark (Markdown processing) (027-opencli-automation-upgrade)
- SQLite (`database.db`), 本地文件系统 (浏览器配置文件) (027-opencli-automation-upgrade)
- Node.js 20+ LTS, TypeScript 5.x + npm workspaces, husky, lint-staged, eslint, prettier (028-refine-package-management)
- N/A (Build infra only) (028-refine-package-management)

- Python 3.10+, TypeScript 5.x (Node.js 18+) + Playwright, Flask, Express, Pinia, Element Plus, `commander` (用于 CLI) (027-opencli-automation-upgrade)

## Project Structure

```text
src/
tests/
```

## Commands

cd src [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] pytest [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] ruff check .

## Code Style

Python 3.10+, TypeScript 5.x (Node.js 18+): Follow standard conventions

## Recent Changes
- 028-refine-package-management: Added Node.js 20+ LTS, TypeScript 5.x + npm workspaces, husky, lint-staged, eslint, prettier
- 027-opencli-automation-upgrade: Added TypeScript 5.x, Node.js 20+ LTS + Playwright, Express.js, better-sqlite3, commander, unified/remark (Markdown processing)

- 027-opencli-automation-upgrade: Added Python 3.10+, TypeScript 5.x (Node.js 18+) + Playwright, Flask, Express, Pinia, Element Plus, `commander` (用于 CLI)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
