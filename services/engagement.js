/**
 * Engagement service (VSS VidyaSethu MVP).
 *
 * Persists users, cumulative progress and practice events in SQLite, and
 * applies the pure gamification rules from lib/gamification.js. Exposes the
 * building blocks behind the routes/engagement.js API.
 */
'use strict';

const crypto = require('crypto');
const { db, initDatabase } = require('../lib/database');
const auth = require('../lib/auth');
const g = require('../lib/gamification');

// Ensure the engagement tables exist before preparing statements against them.
initDatabase();

const uuid = () => crypto.randomUUID();

/* Prepared statements are safe to reuse on the shared synchronous connection. */
const stmt = {
  insertUser: db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'),
  findByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  findById: db.prepare('SELECT * FROM users WHERE id = ?'),
  insertProgress: db.prepare('INSERT INTO user_progress (user_id, total_xp, solved_count, current_streak, longest_streak, last_activity_date) VALUES (?, ?, ?, ?, ?, ?)'),
  updateProgress: db.prepare(`UPDATE user_progress
    SET total_xp = ?, solved_count = ?, current_streak = ?, longest_streak = ?, last_activity_date = ?, updated_at = datetime('now')
    WHERE user_id = ?`),
  getProgress: db.prepare('SELECT * FROM user_progress WHERE user_id = ?'),
  insertEvent: db.prepare('INSERT INTO practice_events (user_id, problem_id, difficulty, correct, xp_awarded) VALUES (?, ?, ?, ?, ?)'),
  getEvents: db.prepare('SELECT * FROM practice_events WHERE user_id = ? ORDER BY created_at DESC, id DESC'),
  solvedToday: db.prepare("SELECT COUNT(*) AS n FROM practice_events WHERE user_id = ? AND correct = 1 AND substr(created_at, 1, 10) = ?"),
  getProblemDef: db.prepare('SELECT difficulty FROM problems WHERE id = ?'),
  leaderboard: db.prepare('SELECT user_id, total_xp, solved_count, longest_streak FROM user_progress ORDER BY total_xp DESC, longest_streak DESC')
};

const EMPTY_PROGRESS = () => ({ total_xp: 0, solved_count: 0, current_streak: 0, longest_streak: 0, last_activity_date: null });

function toState(p) {
  return {
    totalXp: Number(p.total_xp) || 0,
    longestStreak: Number(p.longest_streak) || 0,
    solvedCount: Number(p.solved_count) || 0
  };
}

function register({ name, email, password, role }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(name || '').trim();
  if (!cleanName) return { ok: false, status: 400, error: 'name is required' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) return { ok: false, status: 400, error: 'a valid email is required' };
  if (!password || String(password).length < 6) return { ok: false, status: 400, error: 'password must be at least 6 characters' };
  if (stmt.findByEmail.get(cleanEmail)) return { ok: false, status: 409, error: 'email already registered' };

  const id = uuid();
  stmt.insertUser.run(id, cleanName, cleanEmail, auth.hashPassword(String(password)), role || 'student');
  stmt.insertProgress.run(id, 0, 0, 0, 0, null);
  return { ok: true, data: sanitize(stmt.findById.get(id)) };
}

function login({ email, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const user = stmt.findByEmail.get(cleanEmail);
  if (!user || !auth.verifyPassword(String(password || ''), user.password_hash)) {
    return { ok: false, status: 401, error: 'invalid email or password' };
  }
  return { ok: true, data: sanitize(user) };
}

function resolveToken(token, secret) {
  if (!token) return null;
  const payload = auth.verifyToken(token, secret);
  if (!payload || !payload.userId) return null;
  return payload.userId;
}

function recordPractice({ userId, problemId, correct, today }) {
  const user = stmt.findById.get(userId);
  if (!user) return { ok: false, status: 404, error: 'user not found' };

  const day = today || g.dayKey();
  const prob = problemId ? stmt.getProblemDef.get(problemId) : null;
  const difficulty = (prob && prob.difficulty) || 'MEDIUM';
  const correctFlag = Boolean(correct);

  const existing = stmt.getProgress.get(userId) || EMPTY_PROGRESS();
  const snap = g.scoreAnswer({
    correct: correctFlag,
    difficulty,
    currentStreak: existing.current_streak,
    lastActivityDate: existing.last_activity_date,
    today: day
  });

  let newStreak = existing.current_streak;
  let lastActivity = existing.last_activity_date;
  if (correctFlag) {
    newStreak = snap.newStreak;
    lastActivity = day;
  }
  const newTotalXp = (existing.total_xp || 0) + snap.xp;
  const newSolved = (existing.solved_count || 0) + (correctFlag ? 1 : 0);
  const longest = Math.max(existing.longest_streak || 0, newStreak);

  if (stmt.getProgress.get(userId)) {
    stmt.updateProgress.run(newTotalXp, newSolved, newStreak, longest, lastActivity, userId);
  } else {
    stmt.insertProgress.run(userId, newTotalXp, newSolved, newStreak, longest, lastActivity);
  }
  stmt.insertEvent.run(userId, problemId || null, difficulty, correctFlag ? 1 : 0, snap.xp);

  return {
    ok: true,
    data: {
      correct: correctFlag, difficulty, xpAwarded: snap.xp, streakBonus: snap.streakBonus,
      currentStreak: newStreak, longestStreak: longest, totalXp: newTotalXp,
      solvedCount: newSolved, rank: g.rankTitle(newTotalXp),
      badges: g.evaluateBadges(toState({ total_xp: newTotalXp, longest_streak: longest, solved_count: newSolved }))
    }
  };
}

function grantXp({ userId, amount }) {
  const user = stmt.findById.get(userId);
  if (!user) return { ok: false, status: 404, error: 'user not found' };
  const add = Number(amount);
  if (!Number.isFinite(add) || add < 0) return { ok: false, status: 400, error: 'amount must be a non-negative number' };

  const p = stmt.getProgress.get(userId) || EMPTY_PROGRESS();
  const newTotal = (p.total_xp || 0) + add;
  if (stmt.getProgress.get(userId)) {
    stmt.updateProgress.run(newTotal, p.solved_count, p.current_streak, p.longest_streak, p.last_activity_date, userId);
  } else {
    stmt.insertProgress.run(userId, newTotal, p.solved_count, p.current_streak, p.longest_streak, p.last_activity_date);
  }
  return { ok: true, data: { userId, totalXp: newTotal, rank: g.rankTitle(newTotal) } };
}

function getProfile(userId) {
  const user = stmt.findById.get(userId);
  if (!user) return { ok: false, status: 404, error: 'user not found' };
  const p = stmt.getProgress.get(userId) || EMPTY_PROGRESS();
  return {
    ok: true,
    data: {
      user: sanitize(user),
      progress: {
        totalXp: p.total_xp, solvedCount: p.solved_count,
        currentStreak: p.current_streak, longestStreak: p.longest_streak,
        lastActivityDate: p.last_activity_date
      },
      rank: g.rankTitle(p.total_xp),
      rankPosition: leaderboardPosition(userId),
      badges: g.evaluateBadges(toState(p))
    }
  };
}

function getAnalytics(userId) {
  const user = stmt.findById.get(userId);
  if (!user) return { ok: false, status: 404, error: 'user not found' };
  const p = stmt.getProgress.get(userId);
  const events = stmt.getEvents.all(userId);
  const attempts = events.length;
  const correct = events.filter(e => e.correct).length;
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
  return {
    ok: true,
    data: {
      userId,
      attempts, correct, accuracy,
      totalXp: p ? p.total_xp : 0,
      currentStreak: p ? p.current_streak : 0,
      longestStreak: p ? p.longest_streak : 0,
      badges: g.evaluateBadges(toState(p || EMPTY_PROGRESS())),
      recent: events.slice(0, 10).map(e => ({
        problemId: e.problem_id, difficulty: e.difficulty, correct: Boolean(e.correct),
        xpAwarded: e.xp_awarded, createdAt: e.created_at
      }))
    }
  };
}

function getLeaderboard() {
  const rows = stmt.leaderboard.all();
  return { ok: true, data: rows.map((r, i) => ({
    position: i + 1, userId: r.user_id, totalXp: r.total_xp,
    solvedCount: r.solved_count, longestStreak: r.longest_streak
  })) };
}

/**
 * Daily-goal widget data (VidyaSethu §5 Home Dashboard). `target` problems
 * solved-correct per day; progress counts today's correct practice_events.
 */
function getDailyGoal(userId, { target = 5, today = g.dayKey() } = {}) {
  const user = stmt.findById.get(userId);
  if (!user) return { ok: false, status: 404, error: 'user not found' };
  const solvedToday = Number(stmt.solvedToday.get(userId, today).n) || 0;
  const p = stmt.getProgress.get(userId);
  return {
    ok: true,
    data: {
      userId,
      target,
      solvedToday,
      remaining: Math.max(0, target - solvedToday),
      done: solvedToday >= target,
      progressPct: Math.min(100, Math.round((solvedToday / target) * 100)),
      currentStreak: p ? p.current_streak : 0,
      totalXp: p ? p.total_xp : 0
    }
  };
}

/** Shareable one-liner for the Profile "social sharing" action. */
function shareSummary(userId) {
  const profile = getProfile(userId);
  if (!profile.ok) return profile;
  const { progress, rank } = profile.data;
  const text =
    `🔥 I earned ${progress.totalXp} XP (${rank} rank) on ClassX Companion — ` +
    `${progress.currentStreak}-day streak, ${progress.solvedCount} problems solved. ` +
    `Join me: https://classx.example/app`;
  return { ok: true, data: { text } };
}

function leaderboardPosition(userId) {
  const idx = stmt.leaderboard.all().findIndex(r => r.user_id === userId);
  return idx === -1 ? null : idx + 1;
}

function sanitize(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

module.exports = {
  register, login, resolveToken,
  recordPractice, grantXp, getProfile, getAnalytics, getLeaderboard,
  getDailyGoal, shareSummary
};