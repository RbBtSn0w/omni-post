# Feature Specification: OmniPost OpenCLI Bridge Integration

**Feature Branch**: `033-opencli-bridge`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "OmniPost 与 OpenCLI 集成方案：在 OmniPost 中引入插件化扩展能力，通过 OpenCLI 规范 (OCS) 标准化接入外部发布工具（如小红书、微信公众号等），实现“核心调度 + 动态执行”的解耦架构。"

## Clarifications

### Session 2026-03-25
- Q: How to populate the extension directory? -> A: Multi-source. Self-introspecting from tool path (e.g., `opencli --ocs`) and local manual drop directory (`./extensions`).
- Q: How to handle the "chicken and egg" problem of initial setup? -> A: Dedicated "Extension Center" page for detection, installation guidance, and manual sync.
- Q: Which platform to use for initial pilot? -> A: Xiaohongshu (via `jackwener/opencli`) and WeChat Official Account (via migrated custom project).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Environment Onboarding & Extension Center (Priority: P1)

As a new user, I want a dedicated management page to detect my OpenCLI environment so that I can easily install missing tools and see which platforms are ready for use.

**Why this priority**: Essential for the initial user experience and solving the discovery problem. Without this, the system remains a "black box" to the user.

**Independent Test**: Can be fully tested by opening the "Extension Center" and seeing the status of the local `opencli` binary.

**Acceptance Scenarios**:

1. **Given** `opencli` is not installed, **When** I open the Extension Center, **Then** I see an "Environment Not Found" status with installation instructions.
2. **Given** `opencli` is installed, **When** I click "Reload & Sync", **Then** the system status updates to "Ready" and lists the detected platforms (e.g., Xiaohongshu).

---

### User Story 2 - Dynamic Platform Publishing (Priority: P1)

As a creator, I want to see platforms discovered via OpenCLI (like Xiaohongshu) in my main publishing dropdown so that I can use them just like native platforms.

**Why this priority**: This is the core functional value of the feature—enabling multi-platform publishing via the bridge.

**Independent Test**: Can be fully tested by selecting "Xiaohongshu (OpenCLI)" in the publish page and submitting a test article.

**Acceptance Scenarios**:

1. **Given** a successfully synced Xiaohongshu platform, **When** I go to the Publish page, **Then** I see "Xiaohongshu (OpenCLI)" in the platform selection.
2. **Given** a selected OpenCLI platform, **When** I input title and content, **Then** the system correctly maps these to CLI arguments and triggers the external tool.

---

### User Story 3 - Custom Extension via Local Directory (Priority: P2)

As a power user, I want to add my own custom scripts (like `wechat-publisher`) to a specific folder so that OmniPost can register them without needing them to be globally installed.

**Why this priority**: Critical for supporting niche or customized platforms that aren't part of the official OpenCLI distribution.

**Independent Test**: Can be tested by dropping a folder with a valid `.ocs.json` and a script into `extensions/` and clicking "Sync".

**Acceptance Scenarios**:

1. **Given** a valid `wechat-mp` folder in `extensions/`, **When** I click sync, **Then** "WeChat Official Account" appears in the platform list.
2. **Given** a conflicting ID between a system tool and a local tool, **Then** the local tool takes precedence.

---

### Edge Cases

- **CLI Timeout**: What happens when the external CLI hangs? (System should have a configurable timeout, e.g., 5 minutes, and forcefully kill the child process).
- **Environment Variance**: How to handle case where `opencli` exists but `python3` (dependency) is missing? (Validation phase in Extension Center should check for sub-dependencies if defined in OCS).
- **Parameter Injection**: How to prevent malicious shell injection via title or content? (All parameters MUST be escaped before being passed to the shell).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Extension Center" UI page for environment detection and plugin management.
- **FR-002**: System MUST scan the system `$PATH` for the `opencli` binary on demand.
- **FR-003**: System MUST provide a manual "Sync" button to trigger the capability discovery process.
- **FR-004**: System MUST parse `.ocs.json` (OpenCLI Spec) manifests to understand tool capabilities and argument mapping.
- **FR-005**: System MUST support a local `apps/backend-node/extensions/` directory for manual plugin installation.
- **FR-006**: System MUST map internal `UploadOptions` (Title, Content, Files, Metadata) to CLI flags based on OCS rules.
- **FR-007**: System MUST provide a generic `OpenCLIRunner` that executes child processes and streams stdout/stderr to the OmniPost logger.
- **FR-008**: System MUST support real-time progress parsing from CLI stdout using regex patterns defined in OCS.
- **FR-009**: System MUST persist and manage platform-specific credentials (like AppID/Secret) in the `user_info` table for dynamic platforms, with an API for the bridge to safely retrieve them.

### Key Entities *(include if feature involves data)*

- **ExtensionManifest (OCS)**: The JSON structure defining the tool name, command, available actions (publish_video, publish_article), and argument mappings.
- **DynamicPlatform**: A virtual platform registered in the system memory/DB based on an OCS manifest, appearing alongside native platforms in the UI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% success rate in detecting a globally installed `opencli` tool during the onboarding flow.
- **SC-002**: "Sync" process for up to 10 extensions completes in under 5 seconds.
- **SC-003**: ZERO successful shell injection attacks achieved through manipulated task metadata (verified via automated security unit tests).
- **SC-004**: 95% of CLI-reported progress messages (e.g., "Progress: 50%") are correctly captured and reflected in the frontend progress bar.
-   **SC-001**: 100% success rate in detecting a globally installed `opencli` tool during the onboarding flow.
-   **SC-002**: "Sync" process for up to 10 extensions completes in under 5 seconds.
-   **SC-003**: ZERO successful shell injection attacks achieved through manipulated task metadata (verified via automated security unit tests).
-   **SC-004**: 95% of CLI-reported progress messages (e.g., "Progress: 50%") are correctly captured and reflected in the frontend progress bar.

## Assumptions

-   **[Installation Ownership]**: The user is responsible for the initial global installation of `opencli` (via npm/pip) if prompted by the instructions.
-   **[Shell Compatibility]**: Initial support is focused on Unix-like shells (macOS/Linux); Windows CMD/PowerShell support is a secondary priority.
-   **[Credential Format]**: We assume most OpenCLI tools can accept credentials via flags or environment variables.
-   **[Dynamic IDs]**: We assume dynamic platforms will be assigned IDs in the 100-999 range; the specific ID for WX Official Account (8) is a special case that follows the same bridge logic.
