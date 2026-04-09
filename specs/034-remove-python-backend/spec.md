# Feature Specification: Remove Python Backend Logic

**Feature Branch**: `034-remove-python-backend`
**Created**: 2026-04-09
**Status**: completed
**Input**: User description: "删除所有python 后端逻辑"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean Codebase and Maintainability (Priority: P1)

As a developer and maintainer of the project, I want the codebase to be free of the deprecated Python backend logic, so that the project structure is simplified, maintenance overhead is reduced, and new developers are not confused by unused code.

**Why this priority**: Removing deprecated code reduces technical debt and cognitive load for the team, making future development faster and safer.

**Independent Test**: Can be fully tested by verifying the absence of Python backend files and successfully running the build and test suites for the active (Node.js) backend.

**Acceptance Scenarios**:

1. **Given** the repository contains deprecated Python backend code alongside the active Node.js backend, **When** the Python code and its related configurations are removed, **Then** a global search for Python backend files returns no results.
2. **Given** the codebase is cleaned of Python backend logic, **When** the project's test suite and CI pipelines are executed, **Then** all tests pass and the pipeline completes successfully without errors related to missing Python dependencies.

### Edge Cases

- What happens when shared configuration files (e.g., environment variables, Docker compose setups) reference both Node.js and Python backends? The references to the Python backend must be carefully extracted and removed without breaking the active Node.js setup.
- How does the system handle documentation that references the Python backend? The documentation should be updated to reflect that the Python backend has been removed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST have all Python source files (`.py`) specifically related to the backend service deleted from the repository.
- **FR-002**: System MUST have all Python dependency management files (e.g., `requirements.txt`, `Pipfile`, `pyproject.toml`) associated with the backend removed.
- **FR-003**: System MUST have any Dockerfiles, `docker-compose.yml` services, or CI/CD workflow steps that exclusively build, test, or deploy the Python backend removed.
- **FR-004**: System MUST NOT experience any regressions in the active Node.js backend functionality due to this removal.
- **FR-005**: System MUST have any cross-references to the Python backend in shared configuration files or reverse proxies (e.g., Nginx, Traefik) removed or rerouted to the active backend.

### Key Entities

- **Python Backend Codebase**: The directory structure and files comprising the deprecated Python service.
- **Infrastructure Configurations**: CI/CD pipelines, Docker configurations, and reverse proxy settings that manage the deployment and routing of the application.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The repository size is reduced by the total size of the Python backend codebase and its dependencies.
- **SC-002**: 100% of the active Node.js backend tests pass successfully after the removal.
- **SC-003**: 0 instances of Python backend startup commands or build steps remain in the active CI/CD pipelines.

## Assumptions

- The Python backend is fully deprecated and no longer receives production traffic or serves any active user functionality.
- The Node.js backend has achieved complete feature parity with the deprecated Python backend.
- Any necessary data migrations from the Python backend's data stores to the Node.js backend's data stores have already been completed.
