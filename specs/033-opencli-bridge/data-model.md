# Data Model: OpenCLI Bridge Integration

## New Table: `system_extensions` (SQLite)
| Field | Type | Description |
|-------|------|-------------|
| id | TEXT (PK) | Unique uploader ID (e.g., `opencli-xhs`) |
| platform_id | INTEGER | Dynamic ID (100+ for local, 10000+ for system) |
| name | TEXT | Display name (e.g., "Xiaohongshu (OpenCLI)") |
| manifest | TEXT | Full JSON of the OCS manifest |
| executable | TEXT | Command string (e.g., `opencli xhs`) |
| source_type | TEXT | `system` or `local` |
| last_synced | DATETIME | Timestamp of last OCS parse |

## Shared Types Model (`@omni-post/shared`)

### `ExtensionCapability` (Interface)
- `type`: 'video' | 'article'
- `args`: Record<string, string> (maps OmniPost fields to CLI flags)
- `progressRegex`: string (optional)

### `PlatformType` (Extension)
- Reserved Range: 100+ for local, 10000+ for system platforms.

## State Transitions (Task Status)
- `waiting` -> `executing (OpenCLIRunner)` -> `success`/`failed`.
- `progress` updates (real-time stdout regex matching).
