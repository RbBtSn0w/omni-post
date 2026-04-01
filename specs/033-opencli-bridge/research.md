# Research Report: OpenCLI Bridge Integration

## R-001: Robust Environment Detection (T-001)
- **Problem**: Finding the `opencli` binary path across macOS/Linux.
- **Decision**: Use a combination of `which` (via `child_process.execSync`) and common known paths.
- **Rationale**: `execSync('which opencli')` is the most reliable way to find global binaries provided the user's `$PATH` is active in the Node environment.
- **Alternatives**: Manually scanning `/usr/local/bin`, `/opt/homebrew/bin`, etc. (Error-prone and hard to maintain).

## R-002: Parameter Escaping & Security (T-003)
- **Problem**: Preventing shell injection via title/content fields.
- **Decision**: Use `child_process.spawn` with the **array of arguments** format and `shell: false` (default).
- **Rationale**: Passing arguments as an array to `spawn` bypasses the shell's command parsing, making it inherently resistant to most typical shell injection attacks.
- **Alternatives**: `exec` with shell escaping (vulnerable if not done perfectly).

## R-003: OCS 1.0 vs Omni-Post Extension (T-002)
- **Problem**: Does OCS 1.0 support "Progress Regex"?
- **Decision**: Define a standard `progress_regex` field in the OCS manifest if not present in the standard (as a common extension).
- **Rationale**: Standard OCS focuses on command interface; Omni-Post needs real-time UI updates. By using `progress_regex`, we enable needed UI features in a way compatible with our current implementation.

## R-004: Dynamic UI Payload (T-004)
- **Decision**: Use a dedicated `publish_data` field in the Task entity to store OCS-specific parameters.
- **Rationale**: This allows us to scale to any number of custom flags defined in an OCS without breaking the core `UploadOptions` TypeScript interface.
