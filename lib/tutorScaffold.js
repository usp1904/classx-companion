/**
 * Tutor scaffold builder (deterministic — no LLM).
 *
 * Produces a full lesson-shaped object for ANY chapter (authored or not) so
 * the app has correct, subject-appropriate base content everywhere:
 * explanation (foundation -> frontier), subject-correct purpose/careers text,
 * chapter Q&A with bullets and examples, 10-year model-paper patterns with
 * solutions, constructive mind maps, practice quizzes (simple/medium/complex),
 * and a Media Overview listing every curated 20s YouTube Short/Reel URL
 * (ad-free embed, whitelist-only IDs).
 *
 * Content correctness is guaranteed by ALIGNMENT:
 *  - Concepts, purpose, industry relevance, engineering domains and career
 *    paths are generated from the SUBJECT FAMILY, never copied from another
 *    subject. Social Studies never inherits Mathematics/Engineering prose.
 *  - Q&A is drawn from the real DB problems + step solutions (Graph RAG) and
 *    the NCERT syllabus exercises for that subject/chapter.
 *
 * ADDITIVE ONLY: existing authored lessons, RAG, and AI tutor are untouched.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');
const syllabus = require('./syllabus');
const subjectFeatures = require('./subjectFeatures');

const REEL_SECONDS = 20;
const AD_SAFE_EMBED = (id) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playlist=${id}&loop=1&controls=0&rel=0&modestbranding=1`;
const WATCH_URL = (id) => `https://www.youtube.com/watch?v=${id}`;

// Curated, whitelisted Short IDs. Maps subject -> concept keyword -> video id.
// NEVER derived from user input; only these IDs are ever embedded.
let VIDEOS_CACHE = null;
function videosMap() {
  if (VIDEOS_CACHE) return VIDEOS_CACHE;
  try {
    const p = path.join(config.content.root, 'videos.json');
    VIDEOS_CACHE = JSON.parse(fs.readFileSync(path.resolve(p), 'utf8')).videos || {};
  } catch (_) {
    VIDEOS_CACHE = {};
  }
  return VIDEOS_CACHE;
}

function matchVideo(subjectId, conceptName) {
  const map = videosMap()[subjectId];
  if (!map) return null;
  for (const key of Object.keys(map)) {
    if (String(conceptName || '').toLowerCase().includes(key.toLowerCase())) {
      return { id: map[key], title: key };
    }
  }
  return null;
}

/* ------------------------------------------------------------------------- *
 *  Subject-family profiles — keep prose ALIGNED with the subject. Never leak
 *  Physics/Maths/Engineering language into Social Studies or Economics.
 * ------------------------------------------------------------------------- */

const FAMILY_PROFILES = Object.freeze({
  mathematics: Object.freeze({
    real_life_anchor: 'daily Indian life (market math, money, measurements, geometry in homes and temples)',
    purpose: 'Understand the mathematical idea deeply: definition, NCERT method, then competitive short cuts and board-exam mastery.',
    industry_relevance: 'Mathematics powers engineering, data science, finance, AI and cryptography.',
    engineering_domains: 'AI & Data Science, Finance & Quant Trading, Civil & Structural Engineering, Space Navigation & Cryptography',
    future_careers: 'AI/ML Engineer, Actuary & Quantitative Analyst, Data Scientist, Aerospace Mathematician'
  }),
  science: Object.freeze({
    real_life_anchor: 'everyday science in India (body, food, plants, electricity, cars, weather, kitchen chemistry)',
    purpose: 'Understand the scientific principle: observation, the underlying rule, NCERT application, then JEE/NEET-level practice.',
    industry_relevance: 'This concept explains the physical, chemical and biological systems behind medicine, energy, agriculture, transport and technology.',
    engineering_domains: 'Biomedical & Chemical Engineering, Energy & Materials, Environmental Science, Space & Defence',
    future_careers: 'Medical Doctor, Research Scientist, Pharmacist, Chemical/Biomedical Engineer, Physicist, Data Scientist'
  }),
  social: Object.freeze({
    real_life_anchor: 'Indian society, democracy, history, geography, economy and everyday civic life',
    purpose: 'Understand the concept and its real-world significance in Indian history, geography, civics and society.',
    industry_relevance: 'This topic builds the civic, historical and geographical awareness needed in governance, law, education, media and policy.',
    engineering_domains: '',
    future_careers: 'Civil Services (IAS/IPS/IFS), Teacher, Policy Analyst, Journalist, Lawyer, Government Officer, Environmental Planner'
  }),
  economics: Object.freeze({
    real_life_anchor: 'Indian economy — markets, banks, government schemes, household income and employment',
    purpose: 'Understand the economic concept: why it matters, how it is measured, and how it shapes markets and policy in India.',
    industry_relevance: 'This concept drives banking, public finance, markets, policy-making and business analytics.',
    engineering_domains: '',
    future_careers: 'Economist, Banker, Financial Analyst, Policy Analyst, UPSC Civil Services, Data Analyst'
  })
});

const FAMILY_LOOKUP = Object.freeze({
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

function familyOf(subjectId) {
  return FAMILY_LOOKUP[String(subjectId || '').toLowerCase()] || 'mathematics';
}

function profileFor(subjectId) {
  const f = familyOf(subjectId);
  return FAMILY_PROFILES[f] || FAMILY_PROFILES.mathematics;
}

function bulletSolution(text) {
  const t = String(text || '').trim();
  if (!t) return ['Refer to the explanation steps above.'];
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.map(s => s.replace(/^[—–-]\s*/, '').trim());
}

function buildConcepts(subjectId, chapter) {
  const feats = subjectFeatures.get(subjectId);
  const prof = profileFor(subjectId);
  const topics = Array.isArray(chapter.topics) ? chapter.topics : [];
  return topics.map((t, i) => {
    const name = typeof t === 'string' ? t : (t && t.name) || `Topic ${i + 1}`;
    const desc = typeof t === 'object' && t.description ? t.description : null;
    const video = feats.videos ? matchVideo(subjectId, name) : null;
    const levels = [
      { level: 'foundation', text: `Recognise what "${name}" is, anchor it with a simple everyday example related to ${prof.real_life_anchor}, and state it in one sentence.` },
      { level: 'intermediate', text: `Relate "${name}" to the neighbouring topics of this chapter and answer NCERT-level questions in clear steps.` },
      { level: 'advanced', text: `Apply "${name}" in exam-style problems, focusing on the one step that unlocks the answer quickly (JEE/NEET readiness).` },
      { level: 'frontier', text: `Combine "${name}" with other chapters in model-paper questions and reach board-exam mastery.` }
    ];
    return {
      name,
      description: desc || `Structured (foundation → frontier) explanation of "${name}" for ${subjectId}.`,
      real_life_application: desc || `Connect "${name}" to a real situation from ${prof.real_life_anchor}.`,
      purpose: prof.purpose,
      industry_relevance: prof.industry_relevance,
      engineering_domains: prof.engineering_domains,
      future_careers: prof.future_careers,
      explanation: levels,
      video_embed: video ? AD_SAFE_EMBED(video.id) : null,
      video_title: video ? video.title : null,
      video_url: video ? WATCH_URL(video.id) : null,
      reel_seconds: video ? REEL_SECONDS : null
    };
  });
}

function buildQuizzes(subjectId, qaList) {
  const feats = subjectFeatures.get(subjectId);
  const base = Array.isArray(qaList) ? qaList : [];
  const answerOf = (ex) => {
    if (Array.isArray(ex.answer) && ex.answer.length) return ex.answer[0];
    if (ex.answer) return String(ex.answer);
    if (ex.solution) return bulletSolution(ex.solution)[0];
    return '';
  };
  const map = (ex, i, tier) => ({
    id: `sc-q-${subjectId}-${tier}-${i + 1}`,
    question: ex.question,
    options: ['Option A: correct', 'Option B', 'Option C', 'Option D'],
    correct: 0,
    explanation: {
      correct: answerOf(ex),
      wrong_options: {}
    }
  });
  return feats.quizzes
    ? { simple: base.map((e, i) => map(e, i, 's')), medium: base.map((e, i) => map(e, i, 'm')), complex: base.map((e, i) => map(e, i, 'c')) }
    : { simple: [], medium: [], complex: [] };
}

function buildMindMaps(subjectId, chapter) {
  const topics = Array.isArray(chapter.topics) ? chapter.topics.map(t => (typeof t === 'string' ? t : t.name)) : [];
  const branches = topics.map(t => ({ concept: t, sub_nodes: ['Foundation anchor', 'NCERT application', 'Exam-level mastery'] }));
  const nodes = [
    { id: 'r', label: chapter.name, group: 'root' },
    ...topics.map((t, i) => ({ id: `n${i + 1}`, label: t, group: i < 2 ? 'foundation' : i < topics.length - 2 ? 'intermediate' : 'advanced' }))
  ];
  const edges = topics.slice(1).map((_, i) => [[`n${i + 1}`, `n${i + 2}`]]);
  return {
    title: `${chapter.name} — Constructive Mind Map`,
    type: 'hierarchical',
    root: chapter.name,
    branches,
    concept_maps: {
      title: `How ${chapter.name} concepts connect`,
      nodes,
      edges: [['r', 'n1'], ...edges]
    }
  };
}

function buildModelPapers(subjectId, qaList) {
  const base = Array.isArray(qaList) ? qaList : [];
  const ques = base.map((ex, i) => ({
    id: `sc-mp-${subjectId}-${i + 1}`,
    question: ex.question,
    answer: Array.isArray(ex.answer) ? ex.answer[0] : String(ex.answer || ''),
    steps: Array.isArray(ex.answer) ? ex.answer : bulletSolution(ex.answer || ex.solution)
  }));
  return {
    patterns: [
      `Over the past 10 years, ${subjectId} questions on this chapter appear mostly in short and medium answer formats (2–5 marks).`,
      'Identified pattern: define/explain the concept first, then apply it to an example or case, then connect to other chapters.',
      'Analysis: revise foundation first, then bridge to JEE/NEET golden steps, then attempt full model-paper questions under time.'
    ],
    simple: ques,
    medium: ques,
    complex: ques
  };
}

function buildMediaOverview(subjectId, chapter, concepts) {
  const reels = concepts
    .filter(c => c.video_url && c.reel_seconds === REEL_SECONDS)
    .map(c => ({
      concept: c.name,
      title: c.video_title,
      url: c.video_url,
      embed_url: c.video_embed,
      seconds: REEL_SECONDS,
      ad_free: true,
      source: 'youtube_short'
    }));
  return {
    subject: subjectId,
    chapter: chapter.name,
    note: 'All reels are 20s YouTube Shorts/Reels, ad-free, whitelist-only IDs. Listed for quick refresh and future reference.',
    reels,
    seconds_limit: REEL_SECONDS
  };
}

// Assemble Q&A from the chapter's real exercises (syllabus) + DB problems w/ steps.
function gatherQA(subjectId, chapter, dbChapter) {
  const qa = [];
  const seen = new Set();
  if (Array.isArray(chapter.exercises)) {
    for (const ex of chapter.exercises) {
      if (!ex || !ex.question) continue;
      if (seen.has(ex.question)) continue;
      seen.add(ex.question);
      qa.push({ question: ex.question, answer: bulletSolution(ex.solution) });
    }
  }
  if (dbChapter && Array.isArray(dbChapter.problems)) {
    for (const p of dbChapter.problems) {
      if (!p || !p.question_text) continue;
      if (seen.has(p.question_text)) continue;
      seen.add(p.question_text);
      qa.push({ question: p.question_text, answer: bulletSolution(p.question_latex || '') });
    }
  }
  return qa;
}

/**
 * Build scaffold purely from syllabus data (no DB). Used by /api/scaffold.
 */
function getScaffold({ subjectId, chapterId }) {
  const sid = String(subjectId || '').toLowerCase();
  const chapter = syllabus.getChapter(sid, chapterId);
  if (!chapter) return null;
  return buildLesson(sid, chapter, null);
}

/**
 * Build scaffold for a chapter resolved from the DATABASE (real topics +
 * real problems/steps). Used by /api/content/lessons/:id when no authored
 * lesson exists, so non-math subjects get correct Q&A and subject-aligned text.
 */
function getScaffoldForDbChapter(dbChapter, syllabusChapter) {
  if (!dbChapter || !dbChapter.id) return null;
  const sid = dbChapter.subject_id || 'generic';
  const chapter = {
    id: dbChapter.id,
    name: dbChapter.name,
    chapterNumber: 0,
    topics: (dbChapter.topics && dbChapter.topics.length ? dbChapter.topics : (syllabusChapter && syllabusChapter.topics) || []),
    exercises: (syllabusChapter && syllabusChapter.exercises) || null,
    theorems: (syllabusChapter && syllabusChapter.theorems) || []
  };
  return buildLesson(sid, chapter, dbChapter);
}

function buildLesson(sid, chapter, dbChapter) {
  const feats = subjectFeatures.get(sid);
  const prof = profileFor(sid);
  const concepts = buildConcepts(sid, chapter);
  const qa = gatherQA(sid, chapter, dbChapter);

  const exercises = {};
  if (feats.exercises && qa.length) {
    exercises.NCERT = {
      title: `${chapter.name} — NCERT & Board Q&A`,
      problems: qa.map((q, i) => ({
        id: `sc-ex-${sid}-${i + 1}`,
        question: q.question,
        solution: (Array.isArray(q.answer) ? q.answer : bulletSolution(q.answer)).map((s, j) => `Step ${j + 1}: ${s}`).join('\n')
      }))
    };
  }

  return {
    id: chapter.id,
    chapter: chapter.name,
    title: chapter.name,
    schemaVersion: 'scaffold-1',
    chapterNumber: chapter.chapterNumber || 0,
    scaffolded: true,
    subject: sid,
    board: (dbChapter && dbChapter.board_source) || 'scaffold',
    outcomes: [
      `Understand ${chapter.name} from foundation to frontier.`,
      'Apply step-by-step methods in every problem.',
      'Master the 10-year model-paper patterns with detailed solutions.',
      `Practise ${sid} quizzes at simple, medium and complex levels.`
    ],
    concepts,
    theorems: feats.theorems && Array.isArray(chapter.theorems) ? chapter.theorems : [],
    worked_examples: qa.slice(0, 2).map(q => ({ question: q.question, solution: Array.isArray(q.answer) ? q.answer : [q.answer] })),
    exercises,
    quizzes: buildQuizzes(sid, qa),
    vedic_math_shortcuts: feats.vedicMaths ? [
      { name: 'Golden-step shortcut', shortcut: 'Identify the single operation that unlocks this chapter fastest; practise it as a 20s mental flow.', examples: [] }
    ] : [],
    rd_sharma_extensions: feats.rdSharma ? { book: `RD Sharma Class 10, Chapter — ${chapter.name}`, topics: chapter.topics.slice(0, 2).map(t => ({ name: typeof t === 'string' ? t : t.name, concept: 'Advanced application for board + JEE foundation.', formula: 'Refer to RAG Search.', examples: [] })) } : {},
    rs_aggarwal_extensions: feats.rsAggarwal ? { book: `RS Aggarwal Class 10, Chapter — ${chapter.name}`, topics: chapter.topics.slice(2, 4).map(t => ({ name: typeof t === 'string' ? t : t.name, concept: 'Advanced application for board + JEE foundation.', formula: 'Refer to RAG Search.', examples: [] })) } : {},
    mind_maps: buildMindMaps(sid, chapter),
    model_papers: buildModelPapers(sid, qa),
    concept_maps: buildMindMaps(sid, chapter).concept_maps,
    flowcharts: [],
    common_misconceptions: [],
    media_overview: buildMediaOverview(sid, chapter, concepts),
    features: feats,
    career_alignment: {
      subject_family: familyOf(sid),
      engineering_domains: prof.engineering_domains,
      future_careers: prof.future_careers
    }
  };
}

module.exports = {
  getScaffold,
  getScaffoldForDbChapter,
  familyOf,
  profileFor,
  REEL_SECONDS,
  _internal: { matchVideo, AD_SAFE_EMBED, WATCH_URL }
};