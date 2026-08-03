const test = require('node:test');
const assert = require('node:assert/strict');
const { db } = require('../lib/database');

const service = require('../services/engagement');
const auth = require('../lib/auth');
const g = require('../lib/gamification');

const SECRET = 'unit-test-secret';
const created = [];

test.after(() => {
  const delUser = db.prepare('DELETE FROM users WHERE id = ?');
  const delProg = db.prepare('DELETE FROM user_progress WHERE user_id = ?');
  const delEvents = db.prepare('DELETE FROM practice_events WHERE user_id = ?');
  for (const id of created) {
    delEvents.run(id);
    delProg.run(id);
    delUser.run(id);
  }
});

function makeUser() {
  const r = service.register({
    name: 'Riya',
    email: `riya_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@classx.test`,
    password: 'Test@123'
  });
  created.push(r.data.id);
  return r;
}

test('register: creates a user without exposing the password hash', () => {
  const r = makeUser();
  assert.equal(r.ok, true);
  assert.ok(r.data.id);
  assert.equal(r.data.email, r.data.email);
  assert.equal(r.data.password_hash, undefined);
});

test('register: rejects a duplicate email', () => {
  const first = makeUser();
  const dup = service.register({ name: 'X', email: first.data.email, password: 'Test@123' });
  assert.equal(dup.ok, false);
  assert.equal(dup.status, 409);
});

test('register: rejects invalid email and short password', () => {
  assert.equal(service.register({ name: 'A', email: 'not-an-email', password: 'Test@123' }).ok, false);
  assert.equal(service.register({ name: 'A', email: 'a@b.com', password: '123' }).ok, false);
  assert.equal(service.register({ name: '', email: 'a@b.com', password: 'Test@123' }).ok, false);
});

test('login: succeeds with correct password and fails otherwise', () => {
  const r = makeUser();
  const ok = service.login({ email: r.data.email, password: 'Test@123' });
  assert.equal(ok.ok, true);
  const bad = service.login({ email: r.data.email, password: 'Wrong123' });
  assert.equal(bad.ok, false);
});

test('resolveToken: round-trips a issued token and rejects tampered tokens', () => {
  const token = auth.createToken('user-123', SECRET);
  assert.equal(service.resolveToken(token, SECRET), 'user-123');
  assert.equal(service.resolveToken(token + 'x', SECRET), null);
  assert.equal(service.resolveToken('garbage.token', SECRET), null);
  assert.equal(service.resolveToken('', SECRET), null);
});

test('recordPractice: unknown user returns 404', () => {
  const r = service.recordPractice({ userId: 'does-not-exist', correct: true });
  assert.equal(r.ok, false);
  assert.equal(r.status, 404);
});

test('recordPractice: correct answer awards XP and grows total', () => {
  const r = makeUser();
  const id = r.data.id;
  const first = service.recordPractice({ userId: id, problemId: 'p-ncert-3.2-1', correct: true });
  assert.equal(first.ok, true);
  assert.ok(first.data.xpAwarded > 0);
  assert.equal(first.data.totalXp, first.data.xpAwarded);
  assert.equal(first.data.currentStreak, 1);
  assert.equal(first.data.solvedCount, 1);

  const second = service.recordPractice({ userId: id, problemId: 'p-ncert-3.2-1', correct: true, today: g.dayKey() });
  assert.equal(second.data.currentStreak, 1); // same day
});

test('recordPractice: wrong answer awards 0 XP and keeps totals', () => {
  const r = makeUser();
  const id = r.data.id;
  service.recordPractice({ userId: id, problemId: 'p-ncert-3.2-1', correct: true });
  const before = service.getProfile(id).data.progress;
  const wrong = service.recordPractice({ userId: id, problemId: 'p-ncert-3.2-1', correct: false });
  assert.equal(wrong.data.xpAwarded, 0);
  assert.equal(wrong.data.totalXp, before.totalXp);
});

test('grantXp: adds XP and updates rank', () => {
  const r = makeUser();
  const id = r.data.id;
  const out = service.grantXp({ userId: id, amount: 120 });
  assert.ok(out.ok);
  assert.equal(out.data.totalXp, 120);
  assert.equal(out.data.rank, 'EXPLORER');

  const neg = service.grantXp({ userId: id, amount: -5 });
  assert.equal(neg.ok, false);
});

test('getProfile: returns rank, position and badges', () => {
  const r = makeUser();
  const id = r.data.id;
  service.grantXp({ userId: id, amount: 600 });
  const p = service.getProfile(id);
  assert.equal(p.ok, true);
  assert.equal(p.data.rank, 'SCHOLAR');
  assert.equal(p.data.rankPosition, 1);
  assert.ok(Array.isArray(p.data.badges));
});

test('getAnalytics: reports attempts, accuracy and recent activity', () => {
  const r = makeUser();
  const id = r.data.id;
  service.recordPractice({ userId: id, problemId: 'p-ncert-3.2-1', correct: true });
  service.recordPractice({ userId: id, problemId: 'p-ncert-3.2-1', correct: false });
  const a = service.getAnalytics(id);
  assert.equal(a.ok, true);
  assert.equal(a.data.attempts, 2);
  assert.equal(a.data.correct, 1);
  assert.equal(a.data.accuracy, 50);
  assert.equal(a.data.recent.length, 2);
});

test('getLeaderboard: orders by total XP descending', () => {
  const low = makeUser().data.id;
  const high = makeUser().data.id;
  service.grantXp({ userId: low, amount: 10 });
  service.grantXp({ userId: high, amount: 80 });
  const board = service.getLeaderboard();
  const idxLow = board.data.findIndex(e => e.userId === low);
  const idxHigh = board.data.findIndex(e => e.userId === high);
  assert.ok(idxHigh >= 0 && idxLow >= 0);
  assert.ok(idxHigh < idxLow); // higher XP appears first
});

test('getDailyGoal: counts today\'s correct solves against the target', () => {
  const r = makeUser();
  const id = r.data.id;
  const today = g.dayKey();

  const before = service.getDailyGoal(id, { target: 5, today });
  assert.ok(before.ok);
  assert.equal(before.data.solvedToday, 0);
  assert.equal(before.data.remaining, 5);
  assert.equal(before.data.done, false);

  const ins = db.prepare("INSERT INTO practice_events (user_id, problem_id, difficulty, correct, xp_awarded, created_at) VALUES (?, ?, 'MEDIUM', 1, 20, ?)");
  ins.run(id, 'p-ncert-3.2-1', `${today} 05:00:00`);
  ins.run(id, 'p-ncert-3.2-1', `${today} 06:00:00`);
  ins.run(id, 'p-ncert-3.2-1', `${today} 07:00:00`);

  const after = service.getDailyGoal(id, { target: 5, today });
  assert.equal(after.data.solvedToday, 3);
  assert.equal(after.data.remaining, 2);
  assert.equal(after.data.progressPct, 60);
});

test('getDailyGoal: unknown user returns 404', () => {
  const r = service.getDailyGoal('does-not-exist');
  assert.equal(r.ok, false);
  assert.equal(r.status, 404);
});

test('shareSummary: builds a shareable one-liner', () => {
  const r = makeUser();
  const id = r.data.id;
  service.grantXp({ userId: id, amount: 100 });
  const s = service.shareSummary(id);
  assert.ok(s.ok);
  assert.ok(s.data.text.includes('XP'));
  assert.ok(s.data.text.length > 20);
});