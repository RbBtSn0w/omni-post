# OmniPost AI Agent Entry Point

Please refer to [**AGENTS.md**](./AGENTS.md) for the authoritative and comprehensive system instructions, architecture patterns, and conventions for the OmniPost monorepo.

## Key Project Memories

- **Architecture & Governance**: All actions must comply with the [OmniPost Constitution](.specify/memory/constitution.md).
- **Workflow**: Non-trivial tasks follow the iterative **Research -> Strategy -> Execution** lifecycle.
- **Strict Type Safety**: Mandatory "No New Any" policy. NEVER introduce `explicit any` or `as any`. Use `unknown` with type guards or specific union types. Always run `node tools/scripts/check-no-new-any.mjs` before completion.
- **Mandatory Quality Gates**: Before declaring a task "Complete", run:
    - `npm run typecheck -w apps/backend-node`
    - `npm run check:workspace`
    - `npm run lint` & `npm run test`
- **Security & I/O**: Use `utils/path.ts` for all filesystem I/O and `ExplorerService.validateUrl` for external URLs.
- **Async Safety**: Use `task-service` for long-running tasks.
