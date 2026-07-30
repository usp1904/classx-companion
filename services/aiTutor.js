/**
 * AI tutor service.
 *
 * Architecture (see ARCHITECTURE.md §15.2):
 *  - Pluggable provider: today "stub" (deterministic, no LLM), tomorrow
 *    "ollama" or "openrouter". The provider interface is the ONLY contract
 *    the route handler knows about. Add a new provider by writing a class
 *    that implements `async generate({prompt, tier})` and registering it.
 *  - Prompt cascade: classify the question into SIMPLE/MEDIUM/HARD, then
 *    route to the smallest model that can handle it. Saves 30-40% on
 *    AI cost. Toggleable via FEATURE_PROMPT_CASCADE.
 *  - Semantic cache: see lib/semanticCache.js. Toggleable.
 *
 * Future tweaks:
 *  - Add a new provider: create a file under services/aiProviders/, register
 *    in PROVIDERS below, set AI_PROVIDER env var.
 *  - Add a new tier: extend the difficulty classifier and add an ollama
 *    model name in config.
 */
'use strict';

const crypto = require('crypto');
const config = require('../lib/config');
const flags = require('../lib/featureFlags');
const cache = require('../lib/semanticCache');
const { getSuperMemory, SuperMemory } = require('../lib/superMemory');

/* ------------------------------------------------------------------------- *
 *  Difficulty classifier (very lightweight — keyword-based for now)
 * ------------------------------------------------------------------------- */

const HARD_KEYWORDS = [
  'why', 'derive', 'prove', 'integrate', 'differentiate', 'mechanism',
  'compare', 'analyse', 'analyze', 'evaluate', 'synthesis', 'predict',
  'what is the difference', 'how does', 'in terms of', 'optimize'
];
const SIMPLE_KEYWORDS = [
  'define', 'what is', 'name', 'list', 'state', 'recall', 'give an example of',
  'true or false', 'fill in the blank', 'mcq'
];

function classifyDifficulty(question) {
  const q = String(question || '').toLowerCase();
  if (HARD_KEYWORDS.some(k => q.includes(k))) return 'HARD';
  if (SIMPLE_KEYWORDS.some(k => q.includes(k))) return 'SIMPLE';
  return 'MEDIUM';
}

/* ------------------------------------------------------------------------- *
 *  Providers
 * ------------------------------------------------------------------------- */

/**
 * Deterministic stub provider. Doesn't call any LLM. Useful for dev,
 * tests, and the "no money, no GPU" early days. It returns a structured
 * answer that respects our pedagogy contract.
 */
class StubProvider {
  constructor() {
    this.name = 'stub';
  }
  async generate({ prompt, tier, context }) {
    const ragService = require('../lib/ragService');
    const safe = String(prompt || '').trim();
    
    // Perform hybrid RAG search
    const searchResults = ragService.searchHybrid(safe);
    let matchedProblem = null;
    let details = null;

    if (searchResults.problems && searchResults.problems.length > 0) {
      matchedProblem = searchResults.problems[0];
      details = ragService.getProblemDetails(matchedProblem.id);
    }

    if (details) {
      const prob = details.problem;
      const stepsText = details.steps.map(s => {
        let stepStr = `**Step ${s.step_number}**: ${s.step_explanation}`;
        if (s.step_latex) {
          stepStr += `\n$$${s.step_latex}$$`;
        }
        if (s.vedic_shortcut_applied && s.vedic_shortcut_applied !== 'None') {
          stepStr += `\n*⚡ Vedic Shortcut (${s.vedic_shortcut_applied})*`;
        }
        return stepStr;
      }).join('\n\n');

      const conceptsResolved = ragService.resolveConceptGraph(prob.concept_id || 'c-lin-eq-2var');
      const relatedConcepts = conceptsResolved ? conceptsResolved.nodes.map(n => n.name).join(', ') : '';

      return {
        provider: this.name,
        tier,
        text: 
          `### 📚 RAG Resolved Question (${prob.book_source} - ${prob.exercise_label})\n` +
          `**Question**: ${prob.question_text}\n\n` +
          `#### 🏠 Everyday Analogy & Concept\n` +
          `This problem relates to the concept of **${prob.topic_name}**. ${conceptsResolved?.concept?.description || ''}\n\n` +
          `#### 📋 NCERT Step-by-Step Board Solution\n` +
          `${stepsText}\n\n` +
          `#### 🏆 JEE/NEET Bridge & Knowledge Graph\n` +
          `*   **Prerequisite Concepts**: ${relatedConcepts}\n` +
          `*   **Golden Formula**: ${conceptsResolved?.concept?.formulas || 'None'}\n`,
        usedContext: true
      };
    }

    // Default fallback stub if no database match
    return {
      provider: this.name,
      tier,
      text:
        `[${this.name} | ${tier}]\n` +
        `Question: ${safe.slice(0, 500)}\n\n` +
        `Class 6 Anchor: Think of something you see every day that this idea reminds you of (like dividing mangoes or sharing pocket money).\n\n` +
        `NCERT Core: This concept is covered in the Class X syllabus. Refer to the chapter for the exact mathematical rule.\n\n` +
        `JEE/NEET Bridge: Try to identify the single "golden step" that unlocks the answer in 30 seconds.\n\n` +
        (context && context.lessonId ? `(Refer to lesson: ${context.lessonId})` : ''),
      usedContext: Boolean(context && context.lessonId)
    };
  }
}


const PROVIDERS = {
  stub: new StubProvider(),
  get langchain() {
    const { LangChainProvider } = require('./aiProviders/langchainProvider');
    return new LangChainProvider();
  },
  get gemini() {
    const { GeminiProvider } = require('./aiProviders/geminiProvider');
    return new GeminiProvider();
  }
};

function getProvider() {
  if (process.env.GEMINI_API_KEY || config.ai.aliases.gemini) {
    return PROVIDERS.gemini;
  }
  const name = config.ai.provider;
  const provider = PROVIDERS[name];
  if (!provider) return PROVIDERS.stub;
  return provider;
}


/* ------------------------------------------------------------------------- *
 *  Public API
 * ------------------------------------------------------------------------- */

async function askTutor({ question, mode, context }) {
  if (!flags.isEnabled('aiTutor')) {
    return { ok: false, error: 'AI tutor is disabled (FEATURE_AI_TUTOR=false)' };
  }
  if (!question || typeof question !== 'string') {
    return { ok: false, error: 'question string is required' };
  }

  // 1) Difficulty classification (cascade on/off) - needed for cache and tutor responses
  const tier = flags.isEnabled('promptCascade') ? classifyDifficulty(question) : 'MEDIUM';

  // 2) SuperMemory check (compressed semantic cache — checked first)
  if (flags.isEnabled('superMemory')) {
    const sm = getSuperMemory();
    const qHash = crypto.createHash('sha256')
      .update(question.toLowerCase().replace(/[^\w\s]/g, '').trim())
      .digest('hex')
      .slice(0, 16);

    const smHit = await sm.recallByHash(qHash);
    if (smHit) {
      const decompressed = SuperMemory.decompress(smHit);
      return {
        ok: true,
        source: 'supermemory',
        tier,
        answer: {
          provider: 'supermemory',
          tier,
          text: decompressed,
          usedContext: false
        }
      };
    }
  }

  // 3) Legacy semantic cache check
  if (flags.isEnabled('semanticCache')) {
    const hit = cache.get(question);
    if (hit) {
      return { ok: true, source: 'cache', score: hit.score, answer: hit.answer };
    }
  }

  // 3) Provider call
  const provider = getProvider();
  const systemPrompt = buildSystemPrompt({ mode, context });
  const userPrompt = String(question);

  let result;
  try {
    result = await provider.generate({ prompt: userPrompt, systemPrompt, tier, context });
  } catch (err) {
    return { ok: false, error: 'provider failed', details: err.message };
  }

  // 4) Store in cache
  if (flags.isEnabled('semanticCache') && result && result.text) {
    cache.set(question, result);
  }

  return { ok: true, source: provider.name, tier, answer: result };
}

function buildSystemPrompt({ mode, context }) {
  // Compressed system prompt (see ARCHITECTURE.md §15.2.E)
  const base =
    'You are a friendly Class X tutor for an Indian student preparing for school + JEE/NEET. ' +
    'Always: 1) anchor with a Class-6 everyday analogy, 2) give the NCERT 2026-27 rule, ' +
    '3) extend to JEE/NEET if relevant. Render math in LaTeX with $...$ for inline and $$...$$ for blocks. ' +
    'Never use plaintext fractions like 1/2 or caret powers like x^2.';
  const modeClause = mode === 'BOARD'
    ? ' Use Board presentation: Given/To Find/Steps.'
    : mode === 'COMPETITIVE'
      ? ' Use competitive mode: lead with the golden step + elimination tricks.'
      : ' Use dual mode: present both Board step-by-step and competitive golden step.';
  const contextClause = context && context.lessonId
    ? ` Lesson context: ${context.lessonId}.`
    : '';
  return base + modeClause + contextClause;
}

module.exports = {
  askTutor,
  classifyDifficulty,
  getProvider,
  PROVIDERS,
  // exposed for tests
  _internal: { StubProvider }
};

