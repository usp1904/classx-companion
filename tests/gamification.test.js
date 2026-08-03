const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../lib/gamification');

function d(offsetDays = 0) {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  return g.dayKey(dt);
}

test('baseXp: maps difficulty to base points', () => {
  assert.equal(g.baseXp('EASY'), 10);
  assert.equal(g.baseXp('MEDIUM'), 20);
  assert.equal(g.baseXp('HARD'), 30);
  assert.equal(g.baseXp('COMPETITIVE'), 50);
  assert.equal(g.baseXp('weird'), 20);
  assert.equal(g.baseXp(''), 20);
});

test('nextStreak: first activity starts at 1', () => {
  assert.equal(g.nextStreak(0, null, d(0)), 1);
});

test('nextStreak: consecutive day increments', () => {
  assert.equal(g.nextStreak(2, d(-1), d(0)), 3);
});

test('nextStreak: same-day activity does not grow streak', () => {
  assert.equal(g.nextStreak(3, d(0), d(0)), 3);
});

test('nextStreak: missed day resets to 1', () => {
  assert.equal(g.nextStreak(5, d(-3), d(0)), 1);
});

test('scoreAnswer: wrong answer yields no XP and keeps streak', () => {
  const r = g.scoreAnswer({ correct: false, difficulty: 'HARD', currentStreak: 4, lastActivityDate: d(-1), today: d(0) });
  assert.equal(r.xp, 0);
  assert.equal(r.newStreak, 4);
});

test('scoreAnswer: correct answer awards base XP', () => {
  const r = g.scoreAnswer({ correct: true, difficulty: 'EASY', currentStreak: 0, lastActivityDate: null, today: d(0) });
  assert.equal(r.xp, 10);
  assert.equal(r.newStreak, 1);
});

test('scoreAnswer: streak bonus granted from day 2 and capped', () => {
  const r2 = g.scoreAnswer({ correct: true, difficulty: 'MEDIUM', currentStreak: 1, lastActivityDate: d(-1), today: d(0) });
  assert.equal(r2.newStreak, 2);
  assert.equal(r2.streakBonus, 5);
  assert.equal(r2.xp, 25); // 20 base + 5 bonus

  const rLong = g.scoreAnswer({ correct: true, difficulty: 'MEDIUM', currentStreak: 10, lastActivityDate: d(-1), today: d(0) });
  assert.equal(rLong.streakBonus, g.STREAK_BONUS_CAP);
  assert.equal(rLong.xp, 20 + g.STREAK_BONUS_CAP);
});

test('rankTitle: returns the rank matching XP', () => {
  assert.equal(g.rankTitle(0), 'BEGINNER');
  assert.equal(g.rankTitle(99), 'BEGINNER');
  assert.equal(g.rankTitle(100), 'EXPLORER');
  assert.equal(g.rankTitle(300), 'ORACLE');
  assert.equal(g.rankTitle(2000), 'MASTER');
});

test('evaluateBadges: returns only earned badges', () => {
  const badges = g.evaluateBadges({ totalXp: 60, longestStreak: 4, solvedCount: 2 });
  const ids = badges.map(b => b.id);
  assert.ok(ids.includes('FIRST_STEPS'));
  assert.ok(ids.includes('STREAK_3'));
  assert.ok(!ids.includes('CENTURION'));
  assert.ok(!ids.includes('SOLVED_10'));
});

test('sortLeaderboard: orders by total XP descending', () => {
  const sorted = g.sortLeaderboard([
    { user_id: 'a', total_xp: 10 },
    { user_id: 'b', total_xp: 50 },
    { user_id: 'c', total_xp: 20 }
  ]);
  assert.deepEqual(sorted.map(r => r.total_xp), [50, 20, 10]);
});