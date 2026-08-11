/**
 * Subject-specific dashboard features.
 *
 * Pure data + resolver: maps every subject id to its dashboard feature set.
 * ADDITIVE ONLY - existing lesson/content/syllabus endpoints are untouched.
 * Unknown subjects fall back to a safe default that keeps all currently-visible
 * functionality enabled, so nothing regresses (Mathematics unchanged).
 *
 * Universal rules (applied across all subjects via RAG):
 *  - ragHybridSearch: explore concepts/topics/chapters across every subject.
 *  - metadataTagging: subject-scoped filtering during search.
 *  - formulaeOnlyWhenRelevant: formulae surfaced only when the subject uses them.
 *  - interactive: false for ALL subjects (excluded).
 *
 * Video rules (media, ALL subjects):
 *  - hard cap: video_limit = 20s. Never exceeded (enforceVideoLimit).
 *  - video_source: YouTube Shorts/Reels only.
 *  - ads_blocked: true, goi_compliant: true (GOI edtech norms on ad exclusion).
 *  - foundation_to_frontier: concept visualization goes basic -> intermediate ->
 *    advanced -> exam-level mastery.
 *
 * Model papers: every subject ships past 10 years (pastPapersYears) with
 * step_by_step solutions aligned to IIT/JEE standards (modelPapers, alignedIITJEE).
 */
'use strict';

const HARD_VIDEO_LIMIT = 20;

// Applied to every configured subject and the safe fallback.
const UNIVERSAL = Object.freeze({
  ragHybridSearch: true,
  metadataTagging: true,
  formulaeOnlyWhenRelevant: true,
  interactive: false,
  videos: true,
  video_limit: HARD_VIDEO_LIMIT,
  video_source: 'youtube_shorts',
  ads_blocked: true,
  goi_compliant: true,
  step_by_step: true,
  foundation_to_frontier: true,
  modelPapers: true,
  pastPapersYears: 10,
  alignedIITJEE: true,
  solvedExamples: true,
  mindmaps: true,
  quizzes: true,
  quiz_tiers: Object.freeze(['simple', 'medium', 'complex']),
  media_overview_links: true,
  streaks: true,
  model_paper_patterns: true,
  qna_bullet_based: true,
  qna_10y_patterns: true,
  qna_with_examples: true,
  ai_tutor_all_subjects: true
});

const FAMILY = Object.freeze({
  mathematics: 'mathematics',
  physics: 'science',
  chemistry: 'science',
  biology: 'science',
  history: 'social',
  geography: 'social',
  civics: 'social',
  economics: 'economics',
  'social-studies': 'social'
});

// Safe default: preserves prior behavior for unconfigured subjects while still
// honoring the universal video/interactive/model-paper rules.
const DEFAULT = Object.freeze(Object.assign({}, UNIVERSAL, {
  family: 'generic',
  theorems: true,
  exercises: true,
  vedicMaths: true,
  rdSharma: true,
  rsAggarwal: true,
  formulae: true,
  scienceExperiments: false,
  socialVideos: false,
  chemicalEquationBalancing: false,
  topicWiseFormulae: false,
  infographics: false,
  maps: false,
  caseStudies: false,
  graphs: false,
  charts: false,
  calculators: false
}));

// Subject-dashboard config, keyed by the real subject ids in data/syllabus.json.
const NO_MATH_REFS = Object.freeze({
  theorems: false,
  exercises: false,
  vedicMaths: false,
  rdSharma: false,
  rsAggarwal: false
});

const CONFIG = Object.freeze({
  mathematics: Object.freeze(Object.assign({}, DEFAULT, {
    family: 'mathematics',
    theorems: true,
    exercises: true,
    vedicMaths: true,
    rdSharma: true,
    rsAggarwal: true,
    formulae: true,
    graphs: true,
    charts: true
  })),
  physics: Object.freeze(Object.assign({}, DEFAULT, NO_MATH_REFS, {
    family: 'science',
    formulae: true,
    scienceExperiments: true,
    topicWiseFormulae: true
  })),
  chemistry: Object.freeze(Object.assign({}, DEFAULT, NO_MATH_REFS, {
    family: 'science',
    formulae: true,
    scienceExperiments: true,
    chemicalEquationBalancing: true,
    topicWiseFormulae: true
  })),
  biology: Object.freeze(Object.assign({}, DEFAULT, NO_MATH_REFS, {
    family: 'science',
    formulae: true,
    scienceExperiments: true,
    topicWiseFormulae: true
  })),
  history: Object.freeze(Object.assign({}, DEFAULT, NO_MATH_REFS, {
    family: 'social',
    formulae: false,
    socialVideos: true,
    infographics: true,
    maps: true,
    caseStudies: true
  })),
  geography: Object.freeze(Object.assign({}, DEFAULT, NO_MATH_REFS, {
    family: 'social',
    formulae: false,
    socialVideos: true,
    infographics: true,
    maps: true,
    caseStudies: true
  })),
  civics: Object.freeze(Object.assign({}, DEFAULT, NO_MATH_REFS, {
    family: 'social',
    formulae: false,
    socialVideos: true,
    infographics: true,
    maps: true,
    caseStudies: true
  })),
  economics: Object.freeze(Object.assign({}, DEFAULT, NO_MATH_REFS, {
    family: 'economics',
    formulae: true,
    graphs: true,
    charts: true,
    calculators: true,
    caseStudies: true
  }))
});

function get(subjectId) {
  const id = subjectId ? String(subjectId).toLowerCase() : null;
  if (!id) return DEFAULT;
  return CONFIG[id] || Object.assign({}, DEFAULT, { subject: id });
}

function getFamily(subjectId) {
  const id = subjectId ? String(subjectId).toLowerCase() : null;
  return FAMILY[id] || 'generic';
}

function getAll() {
  return Object.keys(CONFIG).reduce((acc, id) => {
    acc[id] = get(id);
    return acc;
  }, {});
}

// Hard cap: no video ever exceeds HARD_VIDEO_LIMIT (20s), regardless of subject.
function enforceVideoLimit(subjectId, seconds) {
  const cfg = get(subjectId);
  if (!cfg.videos) return null;
  const s = Number(seconds);
  if (!Number.isFinite(s) || s < 0) return false;
  return s <= HARD_VIDEO_LIMIT;
}

module.exports = { get, getAll, getFamily, enforceVideoLimit, HARD_VIDEO_LIMIT, DEFAULT, CONFIG };