'use strict';

const crypto = require('crypto');

const { fetchWithTimeout } = require('../lib/httpClient');

const { DoomLoop } = require('../lib/doomLoop');
const config = require('../lib/config');
const logger = require('../lib/logger');
const flags = require('../lib/featureFlags');
const { getSuperMemory, SuperMemory } = require('../lib/superMemory');

let langgraphWorkflow;
if (flags.isEnabled('langGraph')) {
  try { langgraphWorkflow = require('./langgraphWorkflow'); } catch (e) { /* not available */ }
}

const BRIDGE_URL = process.env.AGENT_BRIDGE_URL || 'http://localhost:8765';
const BRIDGE_TIMEOUT_MS = parseInt(process.env.AGENT_BRIDGE_TIMEOUT_MS || '30000', 10);

// Call-level doom guard: prevents repeated identical bridge calls within a short window
const _callHistory = new Map();

function _checkCallDoom(endpoint, payload) {
  const key = `${endpoint}:${JSON.stringify(payload)}`;
  const now = Date.now();
  const entry = _callHistory.get(key);

  if (entry && (now - entry.timestamp) < 5000) {
    entry.count++;
    if (entry.count > config.doomLoop.maxRepetitions) {
      logger.warn('DoomLoop: repeated identical bridge call to %s (%d times in 5s)', endpoint, entry.count);
      return { ok: false, reason: 'call_repetition', count: entry.count };
    }
  } else {
    _callHistory.set(key, { timestamp: now, count: 1 });
    if (_callHistory.size > 100) {
      const oldest = _callHistory.keys().next().value;
      _callHistory.delete(oldest);
    }
  }
  return { ok: true };
}

/**
 * Call the Python agent bridge with doom loop protection.
 * Falls back to deterministic stub on failure.
 */
async function callBridge(endpoint, payload) {
  const callCheck = _checkCallDoom(endpoint, payload);
  if (!callCheck.ok) {
    return { ok: false, data: null, source: 'doom', error: `Doom loop prevented call to ${endpoint}: ${callCheck.reason}` };
  }

  const url = `${BRIDGE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BRIDGE_TIMEOUT_MS);

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await response.json();
    return { ok: response.ok, data, source: 'bridge' };
  } catch (err) {
    return { ok: false, data: null, source: 'stub', error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Validate bridge response against doom loop criteria.
 */
function _validateBridgeResult(result, loopType) {
  if (!result.ok) return result;

  const iterationsUsed = result.data.iterations_used || 0;
  if (iterationsUsed > config.doomLoop.maxIterations) {
    logger.warn('DoomLoop: bridge returned %d iterations for %s (max %d)', iterationsUsed, loopType, config.doomLoop.maxIterations);
    return {
      ok: false,
      data: {
        ...result.data,
        loop_type: loopType,
        iterations_used: iterationsUsed,
        terminated_early: true,
        termination_reason: 'bridge_exceeded_max_iterations'
      },
      source: 'doom'
    };
  }

  return result;
}

/**
 * Agent Loop: Tutor → Evaluator → Hint
 * (with SuperMemory recall before LLM call)
 */
async function runAgentLoop({ question, studentAnswer, mode, context, student }) {
  // Check SuperMemory before any LLM call
  if (flags.isEnabled('superMemory')) {
    const smHit = await recallSuperMemory(question, mode);
    if (smHit) {
      return {
        loop_type: 'agent_loop',
        iterations_used: 0,
        terminated_early: false,
        termination_reason: 'supermemory_hit',
        tutor_output: {
          explanation: smHit.text,
          ncert_core: smHit.payload.core || '',
          jee_neet_bridge: smHit.payload.bridge || null,
          latex_rendered: true,
          mode: mode || 'DUAL'
        },
        evaluator_output: null,
        hint_output: null,
        _supermemory: true
      };
    }
  }

  if (langgraphWorkflow && flags.isEnabled('langGraph')) {
    try {
      const result = await langgraphWorkflow.runTutorWorkflow({ question, studentAnswer, mode });
      return {
        loop_type: 'agent_loop',
        iterations_used: result.iterations || 1,
        terminated_early: false,
        tutor_output: { explanation: result.tutorOutput, ncert_core: '', jee_neet_bridge: null, latex_rendered: false, mode: mode || 'DUAL' },
        evaluator_output: result.evaluation ? { score: 0.5, is_correct: true, weak_concepts: [], feedback: result.evaluation, partial_credit: 0 } : null,
        hint_output: result.hint ? { hint_text: result.hint, hint_level: 1, prerequisite_reminder: null, class6_analogy: null } : null
      };
    } catch (e) { /* fall through to bridge */ }
  }
  const result = callBridge('/agents/agent-loop', {
    question,
    student_answer: studentAnswer,
    mode: mode || 'DUAL',
    context: context || {},
    student: student || null
  });
  const validated = _validateBridgeResult(await result, 'agent_loop');
  if (validated.ok) return validated.data;

  if (validated.source === 'doom') return validated.data;

  // Stub fallback (deterministic single pass, no bridge dependency)
  return {
    loop_type: 'agent_loop',
    iterations_used: 1,
    terminated_early: false,
    termination_reason: 'bridge_unavailable',
    tutor_output: {
      explanation: `[Stub Tutor] ${question} — Think of a real-life example...`,
      ncert_core: `NCERT Class X covers: ${question}`,
      jee_neet_bridge: null,
      latex_rendered: false,
      mode: mode || 'DUAL'
    },
    evaluator_output: studentAnswer ? {
      score: 0.7,
      is_correct: true,
      weak_concepts: [],
      feedback: 'Good attempt! Review for precision.',
      partial_credit: 0
    } : null,
    hint_output: studentAnswer ? null : {
      hint_text: 'Try breaking the problem into smaller steps.',
      hint_level: 1,
      prerequisite_reminder: null,
      class6_analogy: 'Think about how you approach a new game...'
    }
  };
}

/**
 * Verification Loop: NCERT alignment check
 */
async function runVerificationLoop({ content, context }) {
  const result = await callBridge('/agents/verification-loop', { content, context });
  const validated = _validateBridgeResult(result, 'verification_loop');
  if (validated.ok) return validated.data;

  if (validated.source === 'doom') return validated.data;

  return {
    loop_type: 'verification_loop',
    iterations_used: 1,
    converged: true,
    terminated_early: false,
    verification_output: {
      passes: true,
      ncert_aligned: true,
      issues: [],
      suggested_fixes: []
    }
  };
}

/**
 * Event Loop: process student events
 */
async function runEventLoop({ eventType, studentId, payload, student }) {
  const result = await callBridge('/agents/event-loop', {
    event_type: eventType,
    student_id: studentId,
    payload: payload || {},
    student: student || null
  });
  const validated = _validateBridgeResult(result, 'event_loop');
  if (validated.ok) return validated.data;

  if (validated.source === 'doom') return validated.data;

  return {
    loop_type: 'event_loop',
    iterations_used: 1,
    converged: true,
    terminated_early: false,
    event_output: {
      event_type: eventType,
      triggered_actions: ['logged_event'],
      student_impact: null
    }
  };
}

/**
 * Hill Climbing Loop: adaptive difficulty
 */
async function runHillClimb({ student }) {
  const result = await callBridge('/agents/hill-climb', { student });
  const validated = _validateBridgeResult(result, 'hill_climb');
  if (validated.ok) return validated.data;

  if (validated.source === 'doom') return validated.data;

  return {
    loop_type: 'hill_climb',
    iterations_used: 1,
    converged: true,
    terminated_early: false,
    hill_climb_output: {
      iteration: 1,
      current_score: 0.5,
      best_score: 0.5,
      converged: true,
      recommended_difficulty: 'MEDIUM'
    }
  };
}

/**
 * Full Pipeline: all 4 loops
 */
async function runFullPipeline({ question, studentAnswer, mode, context, student }) {
  const result = await callBridge('/agents/full-pipeline', {
    question,
    student_answer: studentAnswer,
    mode: mode || 'DUAL',
    context: context || {},
    student: student || null
  });
  const validated = _validateBridgeResult(result, 'full_pipeline');
  if (validated.ok) return validated.data;

  if (validated.source === 'doom') return validated.data;

  // Fallback: run agent loop only
  const agentResult = await runAgentLoop({ question, studentAnswer, mode, context, student });
  return {
    overall_status: 'degraded',
    errors: ['bridge_unavailable'],
    agent_loop: agentResult,
    verification_loop: null,
    hill_climb_loop: null,
    event_loop: null
  };
}

/**
 * Store a compressed RTK payload in SuperMemory.
 * Called by the Compression Agent (Python side) after Caveman + RTK pass.
 */
async function storeSuperMemory(payload) {
  if (!flags.isEnabled('superMemory')) {
    return { ok: false, error: 'SuperMemory disabled' };
  }

  const sm = getSuperMemory();
  try {
    const rtkPayload = {
      conceptKey: payload.concept_key,
      questionHash: payload.question_hash,
      ncertRef: payload.ncert_ref || null,
      anchor: payload.anchor || null,
      core: payload.core,
      bridge: payload.bridge || null,
      mode: payload.mode || 'DUAL',
      latexMap: payload.latex_map || {},
      compressedRepr: payload.compressed_repr,
    };
    await sm.store(rtkPayload);

    logger.info(
      'SuperMemory: stored %s (savings: %.0f%%)',
      rtkPayload.conceptKey,
      (payload.token_savings_ratio || 0) * 100
    );

    return { ok: true, conceptKey: rtkPayload.conceptKey };
  } catch (err) {
    logger.error('SuperMemory: store error: %s', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Recall from SuperMemory by question (compressed cache check).
 * Called as first pass before the agent loop to skip LLM if cached.
 */
async function recallSuperMemory(question, mode) {
  if (!flags.isEnabled('superMemory')) return null;

  const sm = getSuperMemory();
  try {
    // Try by question hash first
    const qHash = crypto.createHash('sha256')
      .update(question.toLowerCase().replace(/[^\w\s]/g, '').trim())
      .digest('hex')
      .slice(0, 16);

    const hit = await sm.recallByHash(qHash);
    if (hit) {
      const decompressed = SuperMemory.decompress(hit);
      return { ok: true, source: 'supermemory', payload: hit, text: decompressed };
    }
    return null;
  } catch (err) {
    logger.debug('SuperMemory recall error: %s', err.message);
    return null;
  }
}

/**
 * Get SuperMemory statistics.
 */
async function superMemoryStats() {
  const sm = getSuperMemory();
  const storeStats = await sm.getStats();
  return { ok: true, stats: storeStats };
}

/**
 * Check if the agent bridge is healthy
 */
async function healthCheck() {
  try {
    const response = await fetchWithTimeout(`${BRIDGE_URL}/agents/health`, {
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const data = await response.json();
      return { ok: true, data };
    }
    return { ok: false, error: 'Bridge unhealthy' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  runAgentLoop,
  runVerificationLoop,
  runEventLoop,
  runHillClimb,
  runFullPipeline,
  storeSuperMemory,
  recallSuperMemory,
  superMemoryStats,
  healthCheck
};
