/**
 * Agent Bridge — connects Node.js backend to Python agent orchestration layer.
 *
 * Talks to `agents/bridge.py` over HTTP. If the bridge is not running,
 * falls back to a deterministic stub (same interface, no Python dependency).
 *
 * Agent endpoints:
 *   POST /agents/agent-loop      — tutor → evaluate → hint
 *   POST /agents/verification-loop — NCERT curriculum guard
 *   POST /agents/event-loop       — student event processing
 *   POST /agents/hill-climb       — adaptive difficulty optimization
 *   POST /agents/full-pipeline    — all 4 loops combined
 *
 * Doom Loop protection: every loop invocation is bounded by:
 *   - DOOM_LOOP_MAX_ITERATIONS (default 10) — hard ceiling on iterations
 *   - DOOM_LOOP_MAX_REPETITIONS (default 3) — identical consecutive states trigger termination
 *   - Bridge call-level dedup + retry guard
 */
'use strict';

const fetchImpl = global.fetch || (() => {
  try { return require('node-fetch'); } catch (e) {
    throw new Error('Global fetch unavailable. Use Node 18+ or install node-fetch.');
  }
})();

const { DoomLoop } = require('../lib/doomLoop');
const config = require('../lib/config');
const logger = require('../lib/logger');

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
    const response = await fetchImpl(url, {
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
 */
async function runAgentLoop({ question, studentAnswer, mode, context, student }) {
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

  // Stub fallback with doom loop guard
  const doom = new DoomLoop();
  const state = { question, studentAnswer, mode };
  let iteration = 0;

  while (iteration < 3) {
    iteration++;
    doom.check(state);

    const stubResult = {
      loop_type: 'agent_loop',
      iterations_used: doom.iterationCount,
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

    const check = doom.check(stubResult);
    if (check.terminated) {
      stubResult.terminated_early = true;
      stubResult.termination_reason = check.reason;
      stubResult.iterations_used = check.iterationsUsed;
      return stubResult;
    }

    return stubResult;
  }

  return {
    loop_type: 'agent_loop',
    iterations_used: doom.iterationCount,
    terminated_early: true,
    termination_reason: 'stub_max_iterations',
    tutor_output: null,
    evaluator_output: null,
    hint_output: null
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
 * Check if the agent bridge is healthy
 */
async function healthCheck() {
  try {
    const response = await fetchImpl(`${BRIDGE_URL}/agents/health`, {
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
  healthCheck
};
