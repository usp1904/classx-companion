# Class X Companion — Minimal Backend Scaffold

This repository is a minimal scaffold for the Class X IIT-JEE/NEET Foundation Companion backend, with built-in support for curriculum guard, dual-mode routing, historical paper tags, math formatting, and visualization generation.

Run locally:

```bash
cd classx-companion
npm install
npm start
```

Endpoints:
- `POST /api/validate-question` — validate question metadata against schema (see `schemas/question.schema.json`).
- `POST /api/curriculum-guard` — check question metadata against curriculum expectations.
- `POST /api/historical-paper-tags` — extract historical exam and syllabus tags from metadata.
- `POST /api/dual-mode-route` — route prompt content between BOARDS and COMPETITIVE exam response styles.
- `GET /api/syllabus/subjects` — list available syllabus subjects.
- `GET /api/syllabus/subjects/:subjectId` — get subject detail with chapters.
- `GET /api/syllabus/subjects/:subjectId/chapters/:chapterId` — get chapter detail and exercises.
- `GET /api/syllabus/search?q=...` — search the full syllabus data for subjects, chapters, topics, and exercises.
- `POST /api/visualize` — accepts `{rendererType, syllabusSource, visualizationProperties}` and returns the viz JSON.
- `POST /api/enforce-latex` — checks text for plaintext math patterns and suggests LaTeX fixes.
- `POST /api/convert-latex` — attempts simple conversions from plaintext math to LaTeX expressions.
Additional connector endpoints:
- `GET /api/mcp/fetch?q=...` — proxies to the configured MCP endpoint and returns curriculum retrieval results.
- `GET /api/kg/resolve?id=...` — proxies to the configured knowledge graph resolver endpoint.

Skill coverage:
- `curriculum-guard` is implemented via `POST /api/curriculum-guard`.
- `dual-mode-router` is implemented via `POST /api/dual-mode-route`.
- `historical-paper-tags` is implemented via `POST /api/validate-question` and `POST /api/historical-paper-tags`.
- `math-formatter` is implemented via `POST /api/enforce-latex`, `POST /api/convert-latex`, and `POST /api/format-math`.
- `viz-generator` is implemented via `POST /api/visualize` and the frontend demo at `http://localhost:3000/`.

Application URL:
- `http://localhost:3000/` is the correct URL for the running app frontend.

Environment variables:
- `MCP_ENDPOINT` — full URL of the MCP query endpoint.
- `MCP_API_KEY` — optional bearer token for the MCP service.
- `KG_ENDPOINT` — full URL of the knowledge graph resolver endpoint.
- `KG_API_KEY` — optional bearer token for the KG service.

Frontend:
- A small React frontend demo is available at `frontend/index.html`. It's CDN-based — open it in a browser while the server is running to use the visualization UI which calls `/api/visualize`.

LaTeX auto-conversion:
- `lib/validator.js` includes `autoConvertLaTeX(text)` which performs simple heuristics to convert plaintext fractions and powers into LaTeX-friendly forms. This is a lightweight helper and should be replaced with a robust math parser for production.

Files of interest:
- `schemas/question.schema.json` — metadata schema for `historical-paper-tags`.
- `lib/validator.js` — schema validator and LaTeX enforcement heuristic.
- `routes/api.js` — API endpoints.

Quick test commands (after `npm start`):

```bash
# Health check
curl http://localhost:3000/

# Validate sample question
curl -X POST http://localhost:3000/api/validate-question \
	-H "Content-Type: application/json" \
	-d @samples/sample-question.json

# Enforce LaTeX
curl -X POST http://localhost:3000/api/enforce-latex \
	-H "Content-Type: application/json" \
	-d '{"text": "Compute x^2 + 1"}'

# Visualize (example)
curl -X POST http://localhost:3000/api/visualize \
	-H "Content-Type: application/json" \
	-d '{"rendererType":"COORDINATE_GRAPH","syllabusSource":"RD_SHARMA","visualizationProperties":{"functionString":"2x^2 - 5x + 3"}}'
```
