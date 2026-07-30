const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data', 'classx.db');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Deleted existing database file:', dbPath);
} else {
  console.log('Database file not found, nothing to delete.');
}

// Reinitialize empty DB schema
const { initDatabase } = require('../lib/database');
initDatabase();
console.log('Database schema reinitialized.');
