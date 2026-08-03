// Seeds the sample test users from VidyaSethu.txt §7 (idempotent):
//   student01@classx.com / Test@123    (student)
//   teacher01@classx.com / Teach@123   (teacher)
//   admin01@classx.com   / Admin@123   (admin)
// Re-running is safe; existing accounts are left untouched.
'use strict';

const engagement = require('../services/engagement');

const sampleUsers = [
  { name: 'Sample Student', email: 'student01@classx.com',  password: 'Test@123',  role: 'student' },
  { name: 'Sample Teacher', email: 'teacher01@classx.com',  password: 'Teach@123', role: 'teacher' },
  { name: 'Sample Admin',   email: 'admin01@classx.com',    password: 'Admin@123', role: 'admin' }
];

for (const u of sampleUsers) {
  const existing = engagement.login({ email: u.email, password: u.password });
  if (existing.ok) {
    console.log(`SKIP (already exists): ${u.email}`);
    continue;
  }
  const r = engagement.register(u);
  if (r.ok) {
    console.log(`OK: ${u.email} (${u.role}) id=${r.data.id}`);
  } else {
    console.log(`WARN ${u.email}: ${r.error}`);
  }
}
console.log('Sample user seeding done.');
process.exit(0);