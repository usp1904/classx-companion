/**
 * TODO / RESUME LOG — ClassX Companion
 *
 * Continue from where the previous session stopped. Read this file first.
 * Current suite: 175 tests, 0 fail (`npm test` uses a throwaway temp DB).
 */

/* ──────────────────────────────────────────────────────────────────────── *
 *  DONE (verified, 175/175 green)
 * ──────────────────────────────────────────────────────────────────────── */

// 1. Subject-specific dashboard config  -> lib/subjectFeatures.js
//    - Universal: ragHybridSearch, metadataTagging, formulaeOnlyWhenRelevant,
//      interactive:false, videos:true, video_limit=20, youtube_shorts,
//      ads_blocked, goi_compliant, step_by_step, foundation_to_frontier,
//      modelPapers(10y), mindmaps, quizzes(+simple/medium/complex tiers),
//      media_overview_links, streaks, qna_* flags, ai_tutor_all_subjects.
//    - Mathematics keeps theorems/exercises/vedic/rd/rs/formulae/graphs/charts.
//    - Physics/Chem/Bio: formulae+topicWise+experiments (chem adds balancing).
//    - History/Geo/Civics: no formulae, socialVideos+infographics+maps+caseStudies.
//    - Economics: formulae+graphs+charts+calculators+caseStudies.
//    - enforceVideoLimit() hard-caps at 20s for ANY subject (never exceeded).
//    - Tests: tests/subjectFeatures.test.js (19).

// 2. Frontend consumes it (fragile bundle, minimal touching) -> frontend/app.js
//    - Boot fetch of /api/dashboard/subject-features -> subjectFeatures state.
//    - NAV_FEATURE_GATE + visibleNavItems(): hides theorems/exercises/vedic-math/
//      rd-sharma/rs-aggarwal/interactive for non-math subjects in sidebar.
//    - Overview stats + NCERT/RD/RS line + sidebar footer adapt per subject.
//    - Fallback {} (pre-load) hides nothing -> no regression.

// 3. Scaffold base content for EVERY subject/chapter -> lib/tutorScaffold.js
//    - Deterministic (no LLM), ADDS to existing authored lessons.
//    - Subject-FAMILY profiles (mathematics/science/social/economics), so
//      Social/History never inherit Engineering/Maths prose or careers.
//    - Concepts carry foundation->intermediate->advanced->frontier ladder.
//    - Q&A from real syllabus exercises + DB problems (Graph-RAG-ready).
//    - Model papers (10y patterns + detailed solutions), mind maps w/ concept
//      maps, quizzes s/m/c, Media Overview (20s reels, whitelist-only IDs
//      from content/videos.json, ad-free embed rel=0&modestbranding=1).
//    - Tests: tests/tutorScaffold.test.js (12).

// 4. Content fallback FIX (math-wash bug) -> routes/api.js
//    - GET /api/content/lessons/:id -> authored lesson, else DB-scaffold via
//      ragService.getChapterById() (lib/ragService.js) using getScaffoldForDbChapter.
//    - Fixes "Sense of Collective Belonging"(history) showing AI/DataScience +
//      Aerospace Mathematician careers; now shows social-aligned content.
//    - Authored files (real-numbers, electricity, ...) still take priority.
//    - Tests: tests/api.integration.test.js (DB-fallback seed) + scenario.

// 5. Feature flag -> lib/featureFlags.js
//    - tutorScaffold (FEATURE_TUTOR_SCAFFOLD, default true). 404's when off.

/* ──────────────────────────────────────────────────────────────────────── *
 *  ENDPOINTS ADDED (all additive, `ok:true` JSON)
 * ──────────────────────────────────────────────────────────────────────── */
//  GET /api/dashboard/subject-features             (per-subject flags map)
//  GET /api/dashboard/subject-features/:subjectId  (single subject)
//  GET /api/scaffold/subjects                      (subjects that scaffold)
//  GET /api/scaffold/:subjectId/:chapterId         (full scaffolded lesson)
//  GET /api/scaffold/:subjectId/:chapterId/media   (reels URL list)

/* ──────────────────────────────────────────────────────────────────────── *
 *  NEXT / PENDING WORK (pick up here)
 * ──────────────────────────────────────────────────────────────────────── */

// [ ] Wire scaffold INTO the AI tutor (services/aiTutor.js) so /api/ai/tutor
//     answers any subject/chapter question with scaffold-grounded content,
//     foundation->frontier + model-paper patterns (flag-gated, add test).
//     Rule: tutor surfaces scaffold ONLY when asked; base content exists via
//     /api/scaffold + /api/content fallback already.

// [ ] Offline Graph-RAG enrichment: query concept_nodes/concept_edges
//     (lib/ragService.resolveConceptGraph) inside tutorScaffold Q&A so non-math
//     related concepts appear (currently only DB problems + syllabus exercises).

// [ ] Non-math Q&A coverage is thin: DB has only 23 non-math problems and
//     syllabus.json has 5 exercises/subject for science, 1 for social/econ.
//     Seed more per chapter (scripts/seedScienceNotes.js pattern) and verify
//     media_overview.reels non-empty per chapter (videos.json is sparse).

// [ ] Frontend Media Overview already consumes /content/videos.json; ensure it
//     ALSO lists URLs returned by /api/scaffold/:id/media (quick refresh list).

// [ ] Board lessons (AP_BOARD/TS_BOARD) resolve via DB tree; scaffold covers
//     them too (getChapterById). Verify ap-/ts- prefixed ids return ok.

// [ ] Subject dropdown -> directly load scaffold when no autoresolved lesson:
//     currently frontend picks first lesson per subject; confirm 404 fallback
//     path uses scaffold endpoint for board chapters.

// NOTE (AGENTS.md):
//  - Frontend = fragile single-file bundle: extend server-side unless asked.
//  - Never `git` unless asked. Lint/typecheck only after failing tests.
//  - Kill zombie `node` on :3000 before booting server (stale cache).