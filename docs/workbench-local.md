# Memory Workbench — local run guide

Read-only browser UI + paginated gateway APIs for inspecting Neon / TencentDB Agent Memory (L0–L3 + pipeline checkpoint). **Does not** create a second memory store, mutate SQLite/JSONL, trigger extraction, or enable L3 injection.

## What you get

| View | Path | Data source |
|------|------|-------------|
| Overview | `/workbench` | counts from `vectors.db` + files + checkpoint |
| L0 Conversations | UI tab / `GET /workbench/api/l0` | `vectors.db` → `l0_conversations` |
| L1 Memories + provenance | UI tab / `GET /workbench/api/l1/:id` | SQLite + `records/*.jsonl` → `conversations/*.jsonl` |
| L2 Scenes | UI tab / `GET /workbench/api/l2` | `scene_blocks/*.md` + related L1 |
| L3 Persona | UI tab / `GET /workbench/api/l3` | `persona.md` + `.backup/persona/*` |
| Pipeline health | UI tab / `GET /workbench/api/pipeline` | `.metadata/recall_checkpoint.json` (+ live queues if scheduler is up) |

All list endpoints support **pagination** (`offset`, `limit` ≤ 200) and filters (layer-specific: type, scene, priority, session, role, date, subject/actor, pipeline status, free-text `q`).

## Prerequisites

- Node.js ≥ 22.16
- An existing memory data directory (Hermes/OpenClaw), typically:
  - Hermes: `~/.memory-tencentdb/memory-tdai/`
  - OpenClaw: `~/.openclaw/memory-tdai/`
- Optional: `vectors.db` for L0/L1; without it, L2/L3/pipeline still work from files.

## Start gateway with Workbench

From the plugin repo root:

```bash
# Point at your real data dir (read path only — workbench never writes)
export TDAI_DATA_DIR="$HOME/.memory-tencentdb/memory-tdai"

# Recommended for any non-loopback or multi-user machine
export TDAI_GATEWAY_API_KEY="dev-secret-change-me"

# Optional bind
export TDAI_GATEWAY_HOST=127.0.0.1
export TDAI_GATEWAY_PORT=8420

# LLM keys are required by gateway startup for capture/seed/recall,
# but Workbench itself never calls the LLM.
export TDAI_LLM_API_KEY="${TDAI_LLM_API_KEY:-sk-not-used-by-workbench}"
export TDAI_LLM_BASE_URL="${TDAI_LLM_BASE_URL:-https://api.openai.com/v1}"
export TDAI_LLM_MODEL="${TDAI_LLM_MODEL:-gpt-4o}"

npx tsx src/gateway/server.ts
```

Open:

```
http://127.0.0.1:8420/workbench
```

If `TDAI_GATEWAY_API_KEY` is set, paste the same value into the **Bearer token** field in the UI (stored only in `localStorage` of that browser).

## API examples

```bash
KEY=dev-secret-change-me
H="Authorization: Bearer $KEY"

# Overview
curl -sS -H "$H" "http://127.0.0.1:8420/workbench/api/overview" | jq .

# L1 page 2, persona only
curl -sS -H "$H" \
  "http://127.0.0.1:8420/workbench/api/l1?type=persona&limit=25&offset=25&sort=desc" | jq .

# L1 provenance chain
curl -sS -H "$H" "http://127.0.0.1:8420/workbench/api/l1/<record_id>" | jq '.provenance'

# L0 filter
curl -sS -H "$H" \
  "http://127.0.0.1:8420/workbench/api/l0?role=user&q=coffee&since=7d&limit=20" | jq .

# Pipeline sessions
curl -sS -H "$H" \
  "http://127.0.0.1:8420/workbench/api/pipeline?status=pending_l1" | jq .
```

### Common query params

| Param | Applies to | Notes |
|-------|------------|--------|
| `offset`, `limit` | all lists | default limit 50, max 200 |
| `q` | L0, L1, L2, pipeline | substring search |
| `since`, `until` | L0, L1, L2 | ISO-8601 or relative `7d` / `24h` / `30m` |
| `sort` | L0, L1, L2 | `asc` \| `desc` |
| `type`, `scene`, `priority_min`, `priority_max` | L1 | |
| `subject`, `actor` | L1 | if present in metadata/content |
| `session_key`, `session_id`, `role` | L0 / L1 | |
| `status` | pipeline | `idle` \| `pending_l1` \| `pending_l2` \| `warmup` \| `stale` |

## Provenance notes

- L1 `source_message_ids` are dual-written to **JSONL** (`records/*.jsonl`) today; SQLite `metadata_json` usually holds episodic metadata only.
- Workbench therefore enriches list/detail from JSONL and resolves each id against `conversations/*.jsonl` (`msg_*` ids). SQLite `l0_conversations` is a secondary lookup (different id scheme `l0_*` from vector indexing).
- Missing source ids are listed under `provenance.missing_ids` — they are not invented.

## Safety guarantees

- HTTP methods other than GET/HEAD on `/workbench*` → **405**.
- SQLite opened with `PRAGMA query_only = ON` (separate connection from the write path).
- No delete / edit / approve UI or API.
- No production deployment changes; L3 injection is untouched.
- Auth: same optional Bearer gate as the rest of the gateway (`TDAI_GATEWAY_API_KEY`).

## Tests

```bash
npm test -- src/gateway/workbench
```

Covers pagination, filters, L1→L0 provenance, pipeline status, HTTP 405 read-only, and “bytes unchanged” smoke checks on the fixture store.

## YAML snippet (optional)

```yaml
# tdai-gateway.yaml
server:
  host: 127.0.0.1
  port: 8420
  apiKey: ${TDAI_GATEWAY_API_KEY}
data:
  baseDir: ~/.memory-tencentdb/memory-tdai
llm:
  baseUrl: https://api.openai.com/v1
  apiKey: ${TDAI_LLM_API_KEY}
  model: gpt-4o
```

Then:

```bash
export TDAI_GATEWAY_CONFIG=./tdai-gateway.yaml
npx tsx src/gateway/server.ts
```
