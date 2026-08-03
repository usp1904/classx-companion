/**
 * Gamification engine (VST VidyaSethu MVP).
 *
 * Pure, deterministic business rules kept free of any I/O so they can be unit
 * tested in isolation. Persistence is handled by services/engagement.js, which
 * combines these rules with the SQLite user_progress rows.
 *
 * "Next Day" math: streak is derived from the gap between the last activity
 * date and today. Consecutive active days grow the streak; a missed day resets
 * it to 1; doing more work on the same day does not grow it further.
 */
'use strict';

const XP_TABLE = { EASY: 10, MEDIUM: 20, HARD: 30, COMPETITIVE: 50 };
const DEFAULT_XP = XP_TABLE.MEDIUM;
const STREAK_BONUS_RATE = 5;   // +5 per consecutive day, capped
const STREAK_BONUS_CAP = 20;

const RANKS = [
  { id: 'BEGINNER', minXp: 0 },
  { id: 'EXPLORER',  minXp: 100 },
  { id: 'ORACLE',    minXp: 300 },
  { id: 'SCHOLAR',   minXp: 600 },
  { id: 'MENTOR',    minXp: 1000 },
  { id: 'MASTER',    minXp: 2000 }
];

const BADGES = [
  { id: 'FIRST_STEPS',   name: 'First Steps',   test: s => s.totalXp >= 50 },
  { id: 'STREAK_3',      name: '3-Day Streak',  test: s => s.longestStreak >= 3 },
  { id: 'STREAK_7',      name: 'Week Warrior',  test: s => s.longestStreak >= 7 },
  { id: 'SOLVED_10',     name: 'Problem Solver',test: s => s.solvedCount >= 10 },
  { id: 'SOLVED_50',     name: 'Marksman',      test: s => s.solvedCount >= 50 },
  { id: 'CENTURION',     name: 'Centurion',     test: s => s.totalXp >= 500 }
];

/** Local 'YYYY-MM-DD' key (timezone-safe for streak math). */
function dayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function diffDays(a, b) {
  const ms = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.round(ms / 86400000);
}

function baseXp(difficulty) {
  return XP_TABLE[String(difficulty || 'MEDIUM').toUpperCase()] || DEFAULT_XP;
}

/**
 * Compute the streak that results from attempting an answer today.
 * `currentStreak` is the stored streak; `lastActivityDate` is 'YYYY-MM-DD'.
 */
function nextStreak(currentStreak, lastActivityDate, today = dayKey()) {
  const cur = Number(currentStreak) || 0;
  if (!lastActivityDate) return cur + 1;        // first active day
  if (lastActivityDate === today) return cur;  // already active today
  if (diffDays(lastActivityDate, today) === 1) return cur + 1; // consecutive
  return 1;                                    // gap → restart
}

/**
 * Score a single practice attempt.
 * Returns: { xp, newStreak, streakBonus, base } — on a wrong answer XP is 0
 * and streak is left untouched (we only break streaks on a missed day).
 */
function scoreAnswer({ correct, difficulty, currentStreak, lastActivityDate, today = dayKey() }) {
  if (!correct) {
    return { xp: 0, newStreak: Number(currentStreak) || 0, streakBonus: 0, base: 0 };
  }
  const newStreak = nextStreak(currentStreak, lastActivityDate, today);
  const bonus = newStreak >= 2 ? Math.min((newStreak - 1) * STREAK_BONUS_RATE, STREAK_BONUS_CAP) : 0;
  return { xp: baseXp(difficulty) + bonus, newStreak, streakBonus: bonus, base: baseXp(difficulty) };
}

function rankTitle(xp) {
  const value = Number(xp) || 0;
  let title = RANKS[0].id;
  for (const r of RANKS) if (value >= r.minXp) title = r.id;
  return title;
}

function evaluateBadges({ totalXp, longestStreak, solvedCount }) {
  const state = {
    totalXp: Number(totalXp) || 0,
    longestStreak: Number(longestStreak) || 0,
    solvedCount: Number(solvedCount) || 0
  };
  return BADGES.filter(b => b.test(state)).map(b => ({ id: b.id, name: b.name }));
}

function sortLeaderboard(rows) {
  return rows.slice().sort((a, b) => (Number(b.total_xp) || 0) - (Number(a.total_xp) || 0));
}

module.exports = {
  XP_TABLE, RANKS, BADGES, STREAK_BONUS_RATE, STREAK_BONUS_CAP,
  dayKey, diffDays, baseXp, nextStreak, scoreAnswer, rankTitle, evaluateBadges, sortLeaderboard
};