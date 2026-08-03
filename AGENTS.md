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
7. **Spec-gap endpoints added (VidyaSethu §5)**: `GET /api/content/flashcards/:lessonId` (derives cards via `lib/content.js buildFlashcards`), `GET /api/gamify/:userId/goal` (daily-goal widget), `GET /api/profile/:userId` (profile + `share` one-liner). Sample users `student01/teacher01/admin01@classx.com` seeded via `npm run seed:users`. Scheduled sync: `npm run sync:syllabus` + `.github/workflows/syllabus-sync.yml`. Frontend is a fragile single-file bundle — extend server-side only unless explicitly asked.
8. **Board organization (no overlap)**: DB now has 3 board trees — `CBSE_NCERT` (35), `AP_BOARD` (33), `TS_BOARD` (33) — zero id collisions, all 8 subjects per board. Seeded by `npm run seed:boards` (`scripts/seedBoards.js`): mirrors NCERT chapters under board-prefixed ids (`ap-`, `ts-`), migrates social chapters off `social-studies` onto branch subjects, removes duplicate branch-named chapters AND subject-colliding aggregate chapters (`physics`/`chemistry`/`biology` were whole-subject aggregates titled "Light - Reflection and Refraction" etc. → leaked subject ids into the chapter dropdown). **Board→subject→chapter navigation is verified correct** (AP+Physics+"Light - Reflection and Refraction" → physics lesson). AP/TS content files are empty shells (`content/social/{ap_state,telangana_state}/` = `{subject,board_source,chapters:[]}`) — real board content is a TODO. RAG stack (OKF-style): document tree = `subjects→chapters→topics` with `document_tree_path`; Vector RAG = `ragService.searchHybrid` + `vectors`; Graph RAG = `concept_nodes/edges` + `/api/kg/resolve`; caching = semanticCache + SuperMemory.
9. **Board syllabi are LEARNABLE**: `npm run ingest:boards` (`scripts/ingestBoardTopics.js`) resolves AP_BOARD/TS_BOARD topics from the NCERT tree (or `SYLLABUS_WEB_URL` JSON feed when set) — both boards now carry the full `subjects→chapters→topics` doc tree (438 topics each, 0 collisions), so board lessons resolve like CBSE (mock lessons from topics, RAG-searchable). Verified AP Physics Light (7 topics), TS Math Real Numbers (30 topics).