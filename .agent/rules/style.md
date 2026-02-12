---
trigger: glob
description: OmniPost Code Style Guide
globs: {py,js,vue,md}
---

# OmniPost Code Style Guide

> **Scope**: Applies to all Python (`.py`) and Vue (`.vue`) files in the project.



## Core Architecture

**3-Layer Pattern**: `Route` → `Service` → `Uploader`
- Routes handle HTTP requests
- Services contain business logic
- Uploaders execute platform automation

## Python Backend

### Naming
```python
class PublishService:        # PascalCase
def create_task():           # snake_case
BASE_DIR = Path(...)         # UPPER_SNAKE_CASE
def _get_full_paths():       # private with _
```

### Async Pattern
```python
async def upload(self, playwright: Playwright) -> None:
    browser = None
    context = None
    try:
        browser = await launch_browser(playwright, headless=self.headless)
        context = await browser.new_context(storage_state=self.account_file)
        # Business logic
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise
    finally:
        if context: await context.close()
        if browser: await browser.close()
```

### Database
```python
from src.db.db_manager import db_manager

def create_task(self, ...):
    conn = sqlite3.connect(db_manager.get_db_path())
    try:
        cursor.execute("INSERT INTO tasks ...")
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()
```

## Frontend (Vue3)
- **Stack**: Vue3 + Vite + Pinia + ElementPlus.
- **Store**: Composition API `defineStore`.
- **API**: `src/api/` (no axios in components).

```javascript
// Store
export const useStore = defineStore('id', () => {
  const data = ref([]);
  const act = async () => { data.value = await api.get() };
  return { data, act };
})
```
