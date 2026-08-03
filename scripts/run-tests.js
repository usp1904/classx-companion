// Test runner bootstrap (CRS). Points the app DB at a throwaway temp file so
// tests NEVER write to prod data/classx.db, then runs the node test runner.
// Cross-platform: spawns node as a child so env propagates to each test file
// process.
'use strict';

const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const tmpDb = path.join(os.tmpdir(), `classx-test-${process.pid}-${Date.now()}.db`);
process.env.CLASSX_DB_PATH = tmpDb;

const result = spawnSync(process.execPath, ['--test', 'tests/**/*.test.js'], {
  stdio: 'inherit',
  env: process.env
});

for (const suffix of ['', '-wal', '-shm']) {
  try { fs.unlinkSync(tmpDb + suffix); } catch (_) { /* best-effort */ }
}

process.exit(result.status == null ? 1 : result.status);