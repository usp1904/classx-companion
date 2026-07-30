'use strict';

const config = require('./config');

const LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const currentLevel = LEVELS[config.logging.level] !== undefined ? LEVELS[config.logging.level] : LEVELS.info;

function format(level, msg, args) {
  const ts = new Date().toISOString();
  let formatted = typeof msg === 'string' ? msg : JSON.stringify(msg);
  if (args.length > 0) {
    let i = 0;
    formatted = formatted.replace(/%[sd]/g, () => String(args[i++]));
    if (i < args.length) {
      formatted += ' ' + args.slice(i).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    }
  }
  return { timestamp: ts, level, message: formatted };
}

const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, '..', 'error.log');

const logger = {
  error(msg, ...args) {
    const formatted = format('error', msg, args);
    if (currentLevel >= LEVELS.error) console.error(JSON.stringify(formatted));
    try {
      fs.appendFileSync(logFilePath, JSON.stringify(formatted) + '\n', 'utf8');
    } catch (e) {
      // ignore
    }
  },
  warn(msg, ...args) {
    if (currentLevel >= LEVELS.warn) console.warn(JSON.stringify(format('warn', msg, args)));
  },
  info(msg, ...args) {
    if (currentLevel >= LEVELS.info) console.log(JSON.stringify(format('info', msg, args)));
  },
  http(msg, ...args) {
    if (currentLevel >= LEVELS.http) console.log(JSON.stringify(format('http', msg, args)));
  },
  debug(msg, ...args) {
    if (currentLevel >= LEVELS.debug) console.log(JSON.stringify(format('debug', msg, args)));
  }
};

module.exports = logger;
