const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.CLASSX_DB_PATH || path.join(__dirname, '..', 'data', 'classx.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Concurrent-access tuning. The suite runs multiple test processes against the
// same DB file, and to-be-deployed replicas may share storage. WAL keeps a
// writer from blocking readers, and busy_timeout makes colliding writers wait
// instead of immediately throwing "database is locked".
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA foreign_keys = ON;');

// Auto-apply the (idempotent) schema so the DB is usable by ANY consumer —
// app boot, tests, or seed scripts — without them remembering to init.
initDatabase();

// Initialize schema
function initDatabase() {
  const schemaPath = path.join(__dirname, '..', 'schemas', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(sql);
}

module.exports = {
  db,
  initDatabase
};
