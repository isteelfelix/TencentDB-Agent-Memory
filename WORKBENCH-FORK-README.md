# Memory Workbench (partial fork branch)

This branch is a **partial** mirror of the full AoE runner implementation.

## Full implementation

- **Runner commit:** `3064c37` on branch `runner/run-1784110225416-2`
- **Worktree:** `/opt/data/work/neon-memory/.aoe-runner/run-1784110225416-2`
- **Tests:** `npm test` — 85/85 green (18 workbench tests)
- **Patch:** available as `git format-patch` from that worktree (`/tmp/workbench.patch` on the runner host)
- **Git bundle:** `/tmp/workbench.bundle` on the runner (requires base `7245bc6`)

## Already on this branch

- `docs/workbench-local.md`
- `src/gateway/workbench/index.ts`
- `src/gateway/workbench/types.ts`
- `src/gateway/workbench/static/index.html`

## To complete the PR for upstream

From a machine with write access to `TencentCloud/TencentDB-Agent-Memory`:

```bash
cd /opt/data/work/neon-memory/.aoe-runner/run-1784110225416-2
git push -u origin HEAD:feat/memory-workbench-readonly
# then open PR against TencentCloud/TencentDB-Agent-Memory main
```

Or apply the local commit / patch onto a branch with credentials.

## Feature summary

Read-only Memory Workbench at `/workbench` + paginated `/workbench/api/*` over existing L0–L3 store; L1 provenance; pipeline health; no second DB; no L3 injection; no production deploy changes.
