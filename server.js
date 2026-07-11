const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const api = require('./routes/api');

const path = require('path');
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));

// Health route at /health
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'ClassX Companion API' });
});

app.use('/api', api);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ClassX Companion API listening on http://localhost:${PORT}`);
});
