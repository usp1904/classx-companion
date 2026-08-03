/**
 * Engagement routes (VidyaSethu MVP): auth, practice scoring, gamification,
 * analytics, and the leaderboard. Mounted under `/api`.
 *
 * Endpoints (map to VidyaSethu §API Endpoints):
 *   POST /auth/register     → create a student/teacher account
 *   POST /auth/login         → verify credentials, return a bearer token
 *   POST /practice/:id       → score an attempt (problem id in the RAG DB)
 *   POST /gamify/:userId/xp  → grant XP to a user
 *   GET  /gamify/:userId     → XP, streak, badges, rank, leaderboard position
 *   GET  /analytics/:userId  → progress statistics + recent activity
 *   GET  /leaderboard        → ranked by total XP
 */
'use strict';

const express = require('express');
const router = express.Router();
const service = require('../services/engagement');
const auth = require('../lib/auth');
const flags = require('../lib/featureFlags');
const config = require('../lib/config');

const TOKEN_SECRET = config.security.tokenSecret;

function enabled() {
  return flags.isEnabled('engagement');
}

function guardEnabled(req, res, next) {
  if (!enabled()) return res.status(404).json({ ok: false, error: 'engagement feature is disabled' });
  next();
}

function issueToken(userId) {
  return auth.createToken(userId, TOKEN_SECRET);
}

// POST /api/auth/register
router.post('/auth/register', guardEnabled, (req, res) => {
  const r = service.register(req.body || {});
  if (!r.ok) return res.status(r.status || 400).json(r);
  return res.json({ ok: true, data: r.data, token: issueToken(r.data.id) });
});

// POST /api/auth/login
router.post('/auth/login', guardEnabled, (req, res) => {
  const r = service.login(req.body || {});
  if (!r.ok) return res.status(r.status || 401).json(r);
  return res.json({ ok: true, data: r.data, token: issueToken(r.data.id) });
});

// POST /api/practice/:userId
router.post('/practice/:userId', guardEnabled, (req, res) => {
  const userId = req.params.userId;
  const body = req.body || {};
  const r = service.recordPractice({
    userId,
    problemId: body.problemId,
    correct: body.correct
  });
  if (!r.ok) return res.status(r.status || 400).json(r);
  return res.json(r);
});

// POST /api/gamify/:userId/xp
router.post('/gamify/:userId/xp', guardEnabled, (req, res) => {
  const r = service.grantXp({ userId: req.params.userId, amount: (req.body || {}).amount });
  if (!r.ok) return res.status(r.status || 400).json(r);
  return res.json(r);
});

// GET /api/gamify/:userId
router.get('/gamify/:userId', guardEnabled, (req, res) => {
  const r = service.getProfile(req.params.userId);
  if (!r.ok) return res.status(r.status || 404).json(r);
  return res.json(r);
});

// GET /api/gamify/:userId/goal -> daily-goal widget data
router.get('/gamify/:userId/goal', guardEnabled, (req, res) => {
  const target = Number(req.query.target) || 5;
  const r = service.getDailyGoal(req.params.userId, { target });
  if (!r.ok) return res.status(r.status || 404).json(r);
  return res.json(r);
});

// GET /api/profile/:userId -> profile + shareable summary
router.get('/profile/:userId', guardEnabled, (req, res) => {
  const profile = service.getProfile(req.params.userId);
  if (!profile.ok) return res.status(profile.status || 404).json(profile);
  const share = service.shareSummary(req.params.userId);
  return res.json({ ok: true, data: { ...profile.data, share: share.data.text } });
});

// GET /api/analytics/:userId
router.get('/analytics/:userId', guardEnabled, (req, res) => {
  const r = service.getAnalytics(req.params.userId);
  if (!r.ok) return res.status(r.status || 404).json(r);
  return res.json(r);
});

// GET /api/leaderboard
router.get('/leaderboard', guardEnabled, (req, res) => {
  return res.json(service.getLeaderboard());
});

module.exports = router;