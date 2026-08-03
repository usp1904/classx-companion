# AGENTS.md — ClassX Companion

CRS operating rules: **Caveman + RTK + Supermemory**. Read once, persist, reuse. Spend tokens on fixes, not chatter.

## Command core
- `npm test` — run whole suite (node --test). Do NOT re-read test files before/after if they pass.
- `npm start` — `node server.js` (binds `0.0.0.0`, CORS `*` → globally reachable).
- Verify server with `GET /health`, then `Invoke-RestMethod http://localhost:3000/<endpoint>`.

## Hard rules (minimize tokens)
- **Terse replies.** No greetings, no "I'll now", no restating the task, no summaries unless asked.
- **Never re-read files you already have in context.** Read once, keep, edit from memory.
- **Lint/typecheck only after a code change has failing tests or obvious risk.** All-green → stop.
- Spawn subagents ONLY for parallel independent searches. Never delegate a single quick lookup.
- Fix bugs one at a time. Re-run JUST the affected test file first (`node --test tests/<file>.test.js`), then full suite once.
- Never `git` anything unless explicitly asked.

## Architecture (fast context)
- `server.js` Express app. Binds `config.server.host` (default `0.0.0.0`), CORS `*`.
- `lib/config.js` — SINGLE config source, env-overridable, frozen.
- `lib/database.js` — sqlite `node:sqlite` sync, `data/classx.db`, WAL + busy_timeout. **Reads prod DB in tests.**
- `services/*balance tier` layer; `routes/*` HTTP only; `lib/*` pure helpers.
- Feature-flag EVERY subsystem in `lib/featureFlags.js`; global `isEnabled()`.
- Engagement (auth+gamify): `lib/auth.js`, `lib/gamification.js` (pure), `services/engagement.js` (persists), `routes/engagement.js`.

## Supertypes (persistent state — resume here next session)
1. **Engagement MVP tables added** in `schemas/schema.sql` (`users`, `user_progress`, `practice_events`). Route `/api/auth/*`, `/api/practice/:userId`, `/api/gamify/*`, `/api/analytics/:userId`, `/api/leaderboard` all live in `routes/engagement.js`. Verified booting + register returns token.
2. **Open defect — test→prod DB leak.** Tests import `lib/database.js` directly => write real `data/classx.db`. Fix by env `CLASSX_DB_PATH` override in `lib/database.js`; set it in a shared test bootstrap so tests use a temp/throwaway DB and never touch prod.
3. **Blocks done but uncommitted** (12 files + 9 new). Clean up `*.db-wal`/`*.db-shm` from `git status` via `.gitignore`.
4. `lib/aiTutor.js` and `services/agentBridge.js` were refactored to shared `lib/httpClient.js` (`fetchWithTimeout`). Respect that: don't re-introduce per-file fetch helpers.
5. **Streaming FIXED**: `/api/ai/tutor` now emits SSE (`data:` chunks) when `{stream:true}` / `?stream=1`; `streamingResponses` flag ON. `aiTutor.withRetry()` (exponential backoff+jitter on 503/429) + graceful `fallback` answer suppresses gateway queue-full errors. Tests now run on throwaway temp DB via `scripts/run-tests.js` (`CLASSX_DB_PATH`); `database.test.js` is schema-contract only (no seeded-content coupling).
6. **Social Studies SPLIT**: `data/syllabus.json` now has 8 subjects — History, Geography, Civics, Economics replace `social-studies` (4 chapters distributed 1 each, via `scripts/splitSocial.js`). Source for `/api/syllabus/*` is `data/syllabus.json` ONLY (`lib/syllabus.js` caches it; restart server after edits). DB subjects table still says `social-studies` — used only by `/api/db/syllabus` board tree, which is unaffected. Frontend dropdown is dynamic. **Zombie `node` processes on :3000 serve stale cache — always kill first.**