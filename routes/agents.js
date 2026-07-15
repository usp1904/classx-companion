/**
 * Agent orchestration routes.
 *
 * Exposes the Python multi-agent layer to the frontend and external callers.
 * Each endpoint maps to one of the 4 agent loop types.
 */
'use strict';

const express = require('express');
const router = express.Router();
const agentBridge = require('../services/agentBridge');

// POST /api/agents/tutor — Agent Loop
router.post('/tutor', async (req, res, next) => {
  try {
    const { question, studentAnswer, mode, context, student } = req.body || {};
    if (!question) {
      return res.status(400).json({
        ok: false, error: 'question is required',
        code: 'VALIDATION_ERROR'
      });
    }
    const result = await agentBridge.runAgentLoop({
      question,
      studentAnswer,
      mode,
      context,
      student
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/agents/verify — Verification Loop
router.post('/verify', async (req, res, next) => {
  try {
    const { content, context } = req.body || {};
    if (!content) {
      return res.status(400).json({
        ok: false, error: 'content is required',
        code: 'VALIDATION_ERROR'
      });
    }
    const result = await agentBridge.runVerificationLoop({ content, context });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/agents/event — Event-driven Loop
router.post('/event', async (req, res, next) => {
  try {
    const { eventType, studentId, payload, student } = req.body || {};
    if (!eventType || !studentId) {
      return res.status(400).json({
        ok: false, error: 'eventType and studentId are required',
        code: 'VALIDATION_ERROR'
      });
    }
    const result = await agentBridge.runEventLoop({
      eventType, studentId, payload, student
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/agents/adapt — Hill Climbing Loop
router.post('/adapt', async (req, res, next) => {
  try {
    const { student } = req.body || {};
    if (!student || !student.student_id) {
      return res.status(400).json({
        ok: false, error: 'student with student_id is required',
        code: 'VALIDATION_ERROR'
      });
    }
    const result = await agentBridge.runHillClimb({ student });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/agents/pipeline — Full Pipeline (all 4 loops)
router.post('/pipeline', async (req, res, next) => {
  try {
    const { question, studentAnswer, mode, context, student } = req.body || {};
    if (!question) {
      return res.status(400).json({
        ok: false, error: 'question is required',
        code: 'VALIDATION_ERROR'
      });
    }
    const result = await agentBridge.runFullPipeline({
      question, studentAnswer, mode, context, student
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/agents/health — Bridge health check
router.get('/health', async (req, res) => {
  const bridge = await agentBridge.healthCheck();
  res.json({
    ok: true,
    bridge: bridge.ok ? 'connected' : 'disconnected',
    bridgeError: bridge.error || null,
    loops: ['agent_loop', 'verification_loop', 'event_loop', 'hill_climb', 'full_pipeline'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
