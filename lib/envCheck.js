'use strict';

const REQUIRED_VARS = [];

const WARN_VARS = [
  { var: 'MCP_ENDPOINT', label: 'MCP connector' },
  { var: 'KG_ENDPOINT', label: 'Knowledge Graph connector' },
  { var: 'OPENROUTER_API_KEY', label: 'OpenRouter AI (free tier)' }
];

function validate() {
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'fatal',
      message: `Missing required environment variables: ${missing.join(', ')}`
    }));
    process.exit(1);
  }

  for (const { var: name, label } of WARN_VARS) {
    if (process.env[name]) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `${label} configured via ${name}`
      }));
    }
  }
}

module.exports = { validate };
