# Class X Companion — Enterprise Architecture Blueprint

> **Mission**: Democratize high-quality Class X + IIT-JEE/NEET foundation education across India using a 100% open-source stack. Every architectural decision must reduce cost, eliminate vendor lock-in, and never charge a student or parent for access.

**Document owner**: Architecture working group
**Status**: v0.1 — Phase 0 (Foundation) in active build
**Last updated**: 2026-07-12

---

## 0. Preamble — What This Document Is, and What It Is Not

This blueprint is grounded in three principles:

1. **Reality over hype.** Some marquee tools mentioned in early brainstorming (e.g. "Google Pomelli", "Google Omni", "Veo3", "vectorless databases", "Google OKF", "S3 Protocol" as a web serving protocol) are either non-existent, unreleased, or misapplied. This document replaces them with verified, working open-source equivalents. Each substitution is justified.
2. **Build in phases.** We do not jump from "Express scaffold" to "enterprise-scaled global platform" in one step. We grow through 4 phases. Each phase is independently useful and shippable.
3. **Free for the student, sustainable for the project.** "Open-source" is not just license choice — it must be **cost-free at the point of delivery** (no AWS/GCP/Azure bill that requires a paying customer to keep the lights on). This shapes every tech choice below.

The current scaffold (Express API + React CDN frontend + JSON syllabus + skill contracts) is the seed. Everything that follows grows from it.

---

## 1. Executive Summary — The "One-Pager"

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React (CDN) → React + Vite + TypeScript | CDN-first for zero-build demos; Vite when complexity demands it. |
| **Rendering of math/science** | KaTeX (server + client) | Free, fast, perfect for LaTeX with our `math-formatter` skill output. |
| **Visualization** | D3.js + custom SVG renderers + p5.js for interactive sims | Pure JS, no proprietary licenses, no 3rd-party SaaS. |
| **Animation/Video (later)** | Manim Community (Python, MIT) for math/science; Lottie for lightweight web | Manim is the 3Blue1Brown engine — MIT-licensed, runs on a laptop. |
| **Backend** | Node.js (Express, current) → Node + Fastify when needed | Current Express works; Fastify only if we hit perf walls. |
| **AI Orchestration** | LangChain.js + LangGraph.js | Both Apache 2.0, both work with open-source LLMs. |
| **LLM (default)** | Ollama-hosted models (Llama 3, Mistral, Qwen 2.5) + OpenRouter fallback | Ollama = fully local, free, private. OpenRouter is a free-tier escape hatch. |
| **RAG (retrieval)** | Self-hosted Chroma (vector) + custom JSON tree (structured) | Chroma is Apache 2.0. We keep both because the current codebase already has both. |
| **Knowledge Graph** | NetworkX (Python) or Graphology (JS) | Both MIT, both local. No "Google OKF" dependency. |
| **Storage (objects)** | MinIO (S3-compatible, Apache 2.0) self-hosted | Real S3 protocol, no AWS bill. |
| **Database** | PostgreSQL (structured) + Chroma (vectors) + Redis (cache/session) | All open-source, all battle-tested. |
| **Search** | Meilisearch (MIT) | Free, self-hosted, dead simple. |
| **Real-time** | WebRTC (peer tutoring later) + WebSockets (chat) via `ws` | Native, free, no SaaS. |
| **Auth** | Auth.js (NextAuth equivalent for Node) or roll-your-own JWT | Open-source, no Firebase. |
| **Hosting** | Self-host on a community VPS / Hetzner / OVH (or donated infra) | No cloud lock-in. |
| **CDN** | Cloudflare Free Tier + jsDelivr / unpkg for static libs | Free tiers suffice at our scale. |
| **Observability** | Grafana + Prometheus + Loki (the PLG stack, all open-source) | Free, self-hosted, enterprise-grade. |
| **CI/CD** | GitHub Actions (free for public repos) | Free, native to GitHub. |

**The student's cost = ₹0. Forever.**

---

## 2. The Honest Tool-Substitution Table

You asked for a set of marquee tools. Some are real, some are not. Here is the side-by-side. Keep this table handy — every teammate who joins will ask the same questions.

| What you asked for | Status | What we use instead | License | Notes |
|---|---|---|---|---|
| **Google Pomelli** | ❌ Not a real Google product | n/a | — | We use no Google-proprietary product for core flows. |
| **Google Omni** | ❌ Not a real Google product | n/a | — | If you mean Google's multimodal Gemini: we do **not** depend on it. Local models are the default. |
| **Google Veo3** | ⚠️ Not publicly confirmed as released (Veo 2 is) | **Manim Community** for math/science animations; **Lottie + SVG** for web | MIT / CC-BY | Veo is paid, hosted, and would lock us in. Manim is what 3Blue1Brown uses — same quality class, free. |
| **Google document tree structure** | ⚠️ Real concept (Google Docs' outline) but not an API for us | **Custom JSON syllabus tree** (we already have it in `data/syllabus-rag-tree.json`) | Our own data | We don't need Google's product; we own the tree. |
| **Google OKF** | ❌ Not a known Google product | **Graphology / NetworkX** knowledge graph | MIT | We build our own concept lineage graph. |
| **MCP (Model Context Protocol)** | ✅ Real, Anthropic-launched, open standard | **MCP** itself — used as-is | Open standard | We already have an MCP connector stub in `services/mcp.js`. Good. |
| **RAG** | ✅ Real technique | **LangChain.js RAG + Chroma vector store + custom tree retriever** | Apache 2.0 | We use a **hybrid** approach: tree-first (deterministic) + vector-second (fuzzy). |
| **Vectorless databases** | ❌ Not a real category | **Hybrid retrieval: tree (deterministic) + vector (fuzzy)** | n/a | "Vectorless" is sometimes a marketing term for tree/graph retrieval. We get the same benefit by combining both. |
| **MeshLoadbalancer** | ⚠️ Generic concept | **HAProxy** or **Traefik** or **NGINX** | All free | Mesh LB is just LB software. Pick the boring, proven one. |
| **AWS / Azure / Google Cloud APIs** | ⚠️ Real, but expensive and lock-in-prone | **Self-hosted MinIO (S3-compatible) + community VPS** | Apache 2.0 / various | We keep one cloud "blast shield" option documented but do not depend on it. |
| **ReactJS** | ✅ Real | **React 18 (CDN) → React 18 + Vite + TypeScript at scale** | MIT | Already in use. |
| **Node.js** | ✅ Real | **Node.js LTS** | MIT | Already in use. |
| **SVG / HTML5** | ✅ Real web standards | **SVG + HTML5 Canvas + D3.js + p5.js** | All open | Standard W3C standards. |
| **S3 Protocol** | ✅ Real (object storage API) | **MinIO** exposes the S3 API on our own infra | Apache 2.0 | We get the S3 protocol without AWS. |
| **LangChain** | ✅ Real | **LangChain.js** | Apache 2.0 | Already implied by `master-architectural-system-prompt`. |
| **LangGraph** | ✅ Real | **LangGraph.js** | Apache 2.0 | For multi-agent orchestration. |
| **webRTC** | ✅ Real web standard | **WebRTC** (native browser API) | Open standard | For peer-tutoring in later phases. |
| **HTMX** | ✅ Real | **HTMX 1.x** for server-rendered progressive enhancement | BSD-2 | For low-bandwidth fallback views. |
| **Redis** | ✅ Real | **Redis 7** (open source, NOT the new SSPL license — use Redis Stack Community) | Various | For session + cache + pub/sub. |
| **Mesh load balancer** | ⚠️ Generic | **HAProxy / Traefik** | GPL / MIT | We pick one per deploy. |

---

## 3. Architecture Overview (4 Phases)

The build is split into 4 phases. **Each phase is independently deployable and useful to students.** We do not wait for Phase 4 to help anyone.

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 0 — Foundation (CURRENT)                                  │
│  • Express API + skill endpoints                                 │
│  • React CDN frontend                                            │
│  • JSON syllabus + RAG tree + embeddings                         │
│  • MCP / KG stubs                                                │
│  STATUS: working, ~60% of skill contracts implemented           │
├─────────────────────────────────────────────────────────────────┤
│ PHASE 1 — Static Pedagogy Engine (NEXT, 2-4 weeks)              │
│  • Author 1 Class 10 chapter end-to-end                         │
│  • Render all LaTeX with KaTeX (client + server)                │
│  • Render all viz with D3 (client)                              │
│  • Local Ollama for AI tutoring                                 │
│  • MinIO for media storage                                      │
│  STATUS: not started                                            │
├─────────────────────────────────────────────────────────────────┤
│ PHASE 2 — Adaptive Learning Loop (4-8 weeks)                    │
│  • Student profiles + spaced repetition                          │
│  • Real Chroma + Postgres + Redis stack                          │
│  • LangGraph multi-agent (tutor, evaluator, hint-generator)      │
│  • Meilisearch for full-text syllabus search                     │
│  STATUS: not started                                            │
├─────────────────────────────────────────────────────────────────┤
│ PHASE 3 — Real-time Collaborative Tutoring (8-12 weeks)         │
│  • WebRTC peer study rooms                                       │
│  • Live whiteboard (Yjs / tldraw)                                │
│  • Manim-rendered pre-baked animations per concept              │
│  • Multi-language UI (English → Hindi → Telugu → Tamil)         │
│  STATUS: not started                                            │
├─────────────────────────────────────────────────────────────────┤
│ PHASE 4 — Enterprise Scale (12+ weeks)                           │
│  • Multi-region deployment                                       │
│  • Observability stack (Prometheus/Grafana/Loki)                │
│  • Horizontal scaling, CDN, edge caching                        │
│  • Curriculum coverage all 5 subjects, all chapters             │
│  STATUS: not started                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Phase 0 — Foundation (Current State, with Gaps)

### 4.1 What Exists

| File / Module | Status | Notes |
|---|---|---|
| `server.js` | ✅ Done | Express + CORS + body parser + static serve |
| `routes/api.js` | ✅ Done | 9+ skill-backed endpoints |
| `lib/validator.js` | ✅ Done | Schema validation + LaTeX heuristics |
| `lib/syllabus.js` | ✅ Done | Syllabus loader + search |
| `lib/instructionBank.js` | ✅ Done | Skill instruction bank |
| `services/mcp.js` | 🟡 Stub | Proxies to `MCP_ENDPOINT` env var |
| `services/kg.js` | 🟡 Stub | Proxies to `KG_ENDPOINT` env var |
| `data/syllabus.json` | ✅ Done | 22 KB syllabus data |
| `data/syllabus-rag-tree.json` | ✅ Done | 20 KB RAG tree |
| `data/syllabus-embeddings.json` | ✅ Done | 14 KB embeddings (likely placeholder) |
| `schemas/question.schema.json` | ✅ Done | Question metadata schema |
| `schemas/viz.schema.json` | ✅ Done | Visualization schema |
| `frontend/index.html` | ✅ Done | React CDN-based UI |
| `frontend/app.js` | ✅ Done | 21 KB React app |
| `frontend/vendor-react*.js` | ✅ Done | React 18 from CDN |
| `tests/instructionBank.test.js` | ✅ Done | Single test file |
| 5 skill contracts (`*.md`) | ✅ Done | All five pedagogical skills |

### 4.2 Gaps & Risks in Phase 0

| Gap | Severity | Recommendation |
|---|---|---|
| **Duplicate `classx-companion/classx-companion/`** directory | High | Delete the nested copy — it's a copy of the root, will cause confusion. |
| **No test coverage for `api.js`, `validator.js`, `syllabus.js`** | High | Add at least smoke tests for each endpoint. |
| **Embeddings file is 14 KB — too small to be real embeddings** | High | Regenerate with a real model (e.g., `all-MiniLM-L6-v2` via sentence-transformers) when Phase 1 starts. For Phase 0, keep it as a placeholder. |
| **No KaTeX rendering in frontend** | Medium | Add KaTeX CSS + JS in `frontend/index.html`. |
| **No D3/visualization renderer in frontend** | Medium | Add D3 (CDN) when first viz endpoint is consumed. |
| **TODO.md has unstarted UI styling work** | Low | Tackle in Phase 0.1 — neon-but-soft palette. |
| **No CI / lint** | Medium | Add GitHub Actions with `npm test` + ESLint. |
| **No `.env.example`** | Medium | Add one — even if most vars are optional. |
| **No rate limiting on API** | Medium | Add `express-rate-limit` before any public deploy. |

### 4.3 Phase 0.1 — Finish The Foundation (1-2 weeks)

Concrete checklist:

- [ ] **DEDUPE**: Delete `classx-companion/classx-companion/` (verify nothing unique inside first).
- [ ] **Add `package.json` test script + minimal tests** for every route in `routes/api.js`.
- [ ] **Add `.env.example`** with `PORT`, `MCP_ENDPOINT`, `MCP_API_KEY`, `KG_ENDPOINT`, `KG_API_KEY`.
- [ ] **Add `express-rate-limit`** middleware.
- [ ] **Add ESLint + Prettier** with a config committed.
- [ ] **Add GitHub Actions** workflow: install → lint → test on PR.
- [ ] **UI palette**: Complete the TODO.md item — neon-but-soft eye-comfort theme.
- [ ] **README**: Document every env var and every endpoint with `curl` examples (current README is good; expand it).
- [ ] **License file**: Add `LICENSE` (MIT or Apache 2.0 — see §10).

---

## 5. Phase 1 — Static Pedagogy Engine

**Goal**: End-to-end learning experience for ONE chapter, fully working, deployable.

### 5.1 Pick The Chapter

Start with **Class 10 Mathematics, Chapter 3 — Pair of Linear Equations in Two Variables**.

Why this chapter:
- Universally taught (all Indian boards)
- Visual (lines, intersection, slopes)
- Real-world relatable (cost problems, age problems, mixtures)
- Has clean NCERT + RD Sharma progression
- Easy to render (no chemistry diagrams, no optics)
- Foundation for Class 11 Coordinate Geometry + Calculus

### 5.2 Content Pipeline (Authoring Workflow)

This is the most important part of Phase 1 — the rest is plumbing.

```
                    ┌─────────────────────┐
                    │   NCERT PDF (Ch 3)  │
                    └──────────┬──────────┘
                               │
                               ▼
                 ┌─────────────────────────┐
                 │  Manual structured      │
                 │  authoring in           │
                 │  content/ch3/*.json     │
                 │  (see §5.3 schema)      │
                 └──────────┬──────────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │  Curriculum-guard validates   │
              │  (NCERT alignment check)      │
              └──────────┬───────────────────┘
                         │
                         ▼
            ┌─────────────────────────────────┐
            │  Math-formatter checks LaTeX     │
            │  Auto-fixes plaintext fractions  │
            └──────────┬──────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────────┐
            │  Viz-generator emits viz JSON    │
            │  (line graphs, triangle, etc.)   │
            └──────────┬───────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────────┐
            │  HTML page assembled by Vite SSR  │
            │  Renders KaTeX + D3 + content     │
            └──────────┬───────────────────────┘
                       │
                       ▼
                  STUDENT VIEW
```

### 5.3 Authoring Schema (`content/ch3/lesson-1.json`)

```json
{
  "id": "ch3-l1",
  "chapter": "Pair of Linear Equations in Two Variables",
  "lesson": 1,
  "title": "Introduction to Linear Equations in Two Variables",
  "outcomes": [
    "Identify a linear equation in two variables",
    "Recognize that one equation has infinitely many solutions",
    "Find at least 3 solutions to a given equation"
  ],
  "blocks": [
    {
      "type": "class6_anchor",
      "content_md": "Imagine a magic chocolate shop..."
    },
    {
      "type": "ncert_core",
      "content_md": "An equation of the form $ax + by + c = 0$ ..."
    },
    {
      "type": "rd_sharma_extension",
      "content_md": "For JEE Main, you must also handle the case ..."
    },
    {
      "type": "latex_display",
      "tex": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
    },
    {
      "type": "viz",
      "viz": {
        "rendererType": "COORDINATE_GRAPH",
        "syllabusSource": "NCERT_2026_27",
        "visualizationProperties": { }
      }
    },
    {
      "type": "worked_example",
      "boardMode": "Given: ...\nTo Find: ...\nSteps: ...",
      "speedMode": "Golden step: ..."
    },
    {
      "type": "real_world_example",
      "title": "The auto-rickshaw fare",
      "content_md": "When you take an auto in your city..."
    },
    {
      "type": "pyq_link",
      "source_exam_origin": "CBSE_BOARD_2020",
      "academic_source_truth": "NCERT_CH3_EX_3_1_Q2"
    }
  ],
  "common_misconceptions": [
    "Thinking one linear equation has a unique solution"
  ],
  "prerequisite_nodes": ["MATH_CLASS9_LINEAR_EQUATIONS_ONE_VAR"]
}
```

This is the **single source of truth**. The frontend, the AI tutor, and the analytics all read from it.

---

### 5.4 AI Tutoring Setup

**Default model**: Local Ollama (free, private, works on a laptop).

```bash
# On the dev machine:
ollama pull llama3.1:8b
ollama pull qwen2.5:7b
```

**Why Ollama first, not GPT/Gemini**:
- ₹0 per query
- No data leaves the server
- No API key to leak
- Works offline (critical for low-connectivity Indian students)

**Fallback**: If a query exceeds local capability, route to **OpenRouter free tier** (Mistral, Llama free models). This is a free escape hatch, not the default.

**Never pay for a model** until:
- We have ≥1,000 active students using the AI tutor
- We have measured that local models are actually insufficient
- We have a clear "AI tutor" feature worth paying for

### 5.5 Phase 1 Deliverables (end of 2-4 weeks)

- [ ] `content/ch3/` with 4-6 lessons authored
- [ ] KaTeX rendering working in `frontend/index.html`
- [ ] D3 viz rendering for at least COORDINATE_GRAPH type
- [ ] MinIO running locally (Docker) with sample media
- [ ] Local Ollama integrated with one AI tutor endpoint
- [ ] One student can: open page → read lesson → see LaTeX → see viz → ask AI a question → get a Class-6-level explanation

---

## 6. Phase 2 — Adaptive Learning Loop

**Goal**: The system remembers what the student knows, and adapts.

### 6.1 Stack Changes

| Component | Phase 0/1 | Phase 2 |
|---|---|---|
| Storage | JSON files | **PostgreSQL 16** + **Chroma** (real) + **Redis 7** |
| Search | in-memory | **Meilisearch** |
| AI | single prompt | **LangGraph multi-agent** |
| Auth | none | **Auth.js** (or JWT) |
| Student state | none | **Spaced repetition** (FSRS algorithm) |
| Analytics | none | **PostHog** (self-hosted, MIT) |

### 6.2 Multi-Agent Architecture (LangGraph)

Three agents, one orchestrator:

```
            ┌──────────────────────────────────┐
            │  Orchestrator (LangGraph State)   │
            └─────────────┬────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  TUTOR   │     │ EVALUATOR│     │  HINT    │
  │  agent   │     │  agent   │     │  agent   │
  └──────────┘     └──────────┘     └──────────┘
   • Explains       • Grades the    • Generates
     concepts         student's       targeted
   • Uses Class-6     answer          hints using
     anchor first   • Identifies     prerequisite
   • Board mode /     weak concepts   nodes from
     speed mode       via KG         syllabus tree
                     • Triggers
                       remedial
                       micro-lesson
```

Each agent is a separate LangGraph node. They share state via LangGraph's `StateGraph` channels. All run on the same Ollama instance in Phase 2.

### 6.3 Retrieval — Hybrid (Not "Vectorless")

"Vectorless" isn't a thing. What we *actually* want is **deterministic-first, fuzzy-second** retrieval:

1. **Tree retrieval (deterministic)**: Student asks about "quadratic formula". We look it up in `syllabus-rag-tree.json` by path. 100% precise, 0% hallucination.
2. **Vector retrieval (fuzzy)**: Student asks "why does a ball fall". We embed, query Chroma, return the relevant concept chunks. May return 1-3 close matches.

Tree first; if confidence < threshold, fall back to vector. This gives the determinism of structured data with the flexibility of embeddings.

### 6.4 Student Knowledge Model

In Postgres:

```sql
CREATE TABLE student_concept_state (
  student_id     UUID,
  concept_node   TEXT,  -- e.g. "MATH_CLASS10_CH3_L2"
  fsrs_stability REAL,  -- FSRS algorithm
  fsrs_difficulty REAL,
  last_reviewed  TIMESTAMPTZ,
  next_review    TIMESTAMPTZ,
  PRIMARY KEY (student_id, concept_node)
);
```

FSRS (Free Spaced Repetition Scheduler) is MIT-licensed, well-tested, and beats SM-2/Anki's algorithm.

### 6.5 Phase 2 Deliverables (end of 4-8 weeks)

- [ ] Postgres + Chroma + Redis running via `docker-compose.yml`
- [ ] All endpoints backed by real DB (not JSON files)
- [ ] LangGraph orchestrator with 3 agents
- [ ] Student sign-up + login (Auth.js)
- [ ] Spaced repetition queue surfaced in UI
- [ ] Meilisearch replaces in-memory search

---

## 7. Phase 3 — Real-time Collaborative Tutoring

**Goal**: Two students in two villages can study together. A volunteer tutor in Bengaluru can whiteboard with a student in Madhubani.

### 7.1 Real-time Stack

| Need | Tool | License |
|---|---|---|
| WebRTC signaling | Our own Node + `ws` | MIT |
| Whiteboard | **tldraw** (TLDraw is Apache 2.0) | Apache 2.0 |
| CRDT (concurrent edits) | **Yjs** | MPL-2.0 |
| Voice/video (peer to peer) | **LiveKit** (self-hosted) or raw WebRTC | Apache 2.0 |
| Chat | **Matrix** (Synapse) | Apache 2.0 |
| Animations (pre-baked per concept) | **Manim Community** rendered on a render worker | MIT |

### 7.2 Animation Pipeline

Manim is what 3Blue1Brown uses. We can render a Manim script → MP4 → store in MinIO → embed in lesson. Cost per video: a few minutes of CPU time on a render worker. Free.

**Render worker spec** (one VM):
- 8 vCPU, 16 GB RAM
- Renders a 60-second 1080p Manim scene in ~3-5 minutes
- Can pre-render the entire Class 10 syllabus (~150 concepts × 1 minute) in ~10 hours = $2 of Hetzner cloud

**vs. paying for Veo3**:
- We have full control of the visual
- We can edit any frame
- No per-video cost
- Same quality class (3Blue1Brown sets the bar)

### 7.3 Phase 3 Deliverables (end of 8-12 weeks)

- [ ] WebRTC study room works between 2 browsers
- [ ] Live whiteboard (tldraw) on shared lesson
- [ ] Manim-rendered MP4 for at least 5 key concepts
- [ ] Optional Matrix-based chat for community

---

## 8. Phase 4 — Enterprise Scale

Only relevant once we have **real traffic** (≥10k MAU). Premature optimization is the enemy.

### 8.1 What Changes at Scale

| Concern | Solution |
|---|---|
| Read-heavy load | **CDN in front of all static content** (Cloudflare free tier handles 100k req/day) |
| Slow AI responses | **Cache** in Redis with `Cache-Control: public, max-age=86400` for identical queries |
| Region latency | **Multi-region** deployment: India primary, EU/US fallback. Free on Hetzner, Oracle Free Tier, or community VPS |
| Observability | **PLG stack** (Prometheus + Loki + Grafana). All open-source, all self-hosted. |
| Database scaling | Postgres → read replicas (free, just more VMs) |
| Search | Meilisearch → single instance handles 50M docs |

### 8.2 SLAs We Can Honestly Commit To

| Phase | Uptime target | Latency target |
|---|---|---|
| Phase 0 | "best effort" | n/a |
| Phase 1 | "best effort" | < 2s p95 page load |
| Phase 2 | 99% (43 min downtime/week budget) | < 1s p95 |
| Phase 3 | 99.5% | < 500ms p95 |
| Phase 4 | 99.9% | < 200ms p95 |

We do **not** promise 99.99% — that requires multi-region active-active, paid monitoring, and on-call humans. We are open-source; we are honest.

### 8.3 What "Enterprise-Grade" Means for *Us*

| "Enterprise" claim | Our take |
|---|---|
| Multi-region failover | Yes, Phase 4 |
| Auto-scaling | Yes, via Kubernetes or simple Docker Swarm |
| Observability | Yes, PLG stack |
| Disaster recovery | Daily Postgres backups to a second region |
| Compliance (DPDP Act 2023, India) | Yes — student data is encrypted at rest, never sold, never used for ads |
| Load balancer | **Traefik** (Apache 2.0) — easier than HAProxy, works with Let's Encrypt out of the box |
| Mesh LB | We use Traefik; "service mesh" (Istio/Linkerd) is overkill for our scale. |

---

## 9. Cross-Cutting Concerns

### 9.1 Security

- **HTTPS**: Let's Encrypt + auto-renewal via Traefik
- **Headers**: Helmet.js
- **Rate limiting**: `express-rate-limit` (added in Phase 0.1)
- **CSP**: Strict Content-Security-Policy; only allow self + KaTeX CDN + D3 CDN
- **Auth**: bcrypt for passwords, JWT for sessions (HS256, rotate secret yearly)
- **Secrets**: `.env` only, never committed. Use `dotenv-vault` if we ever need shared secrets.
- **DPDP Act (India 2023)**: Student is data principal. We collect minimum, never share, never sell. Document this in a privacy policy page.

### 9.2 Accessibility

- WCAG 2.1 AA target from Phase 1
- KaTeX has built-in MathML/ARIA support
- High-contrast theme is the default (low-vision students in rural India)
- Hindi/Telugu/Tamil UI in Phase 3
- Offline-first: lessons cached in `localStorage` so a student with no data can still read what they downloaded

### 9.3 Internationalization (i18n)

- i18next for UI strings
- Math content stays in English numerals (universal in Indian schools); only the surrounding prose is translated
- Each lesson gets a `title_i18n` map

### 9.4 Cost Projections (1k → 100k MAU)

| MAU | Hetzner bill | MinIO storage | AI compute | Total / month |
|---|---|---|---|---|
| 1,000 | €4 (CX22) | 50 GB | Local Ollama (€0) | **< €10** |
| 10,000 | €40 (4× CX32) | 500 GB | 1× A100 spot for AI (€150) | **~ €200** |
| 100,000 | €400 | 5 TB | 4× A100 spot (€600) | **~ €1,200** |

Compared to a SaaS stack at 100k MAU: **$5,000 - $50,000 / month**.

The savings fund content authors, animators, and reviewers — which is what actually helps students.

### 9.5 The "Free at Point of Delivery" Promise

To keep the promise:
- No proprietary dependencies that could change license
- No SaaS API in the critical path
- All content (videos, lessons, viz) stored in our own MinIO
- All code Apache 2.0 / MIT
- If a dependency goes closed-source, we replace it (we've planned for this — see §11)

---

## 10. Licensing

- **Codebase**: Apache 2.0 (allows commercial use, but we promise free for students)
- **Content (lessons, animations)**: CC-BY-SA 4.0 (anyone can remix, must attribute, must share-alike)
- **Student data**: Never licensed, never sold, never shared

---

## 11. Risk Register & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Local Ollama quality is too low for Class 10 JEE-level | Medium | High | Fall back to OpenRouter free tier; eventually fine-tune Llama 3.1 8B on NCERT content |
| Chroma doesn't scale | Low | Medium | Postgres + pgvector is an easy swap |
| Manim rendering too slow | Medium | Low | Pre-render in batch, never on-demand |
| Cloud VPS provider changes terms | Low | High | Architecture is portable; can move to a different provider in <1 day |
| Closed-source dependency change | Medium | Medium | Phase 4 = full audit + contingency swap plan for every dep |
| Contributor burnout | High | High | Clear ownership, time-boxed phases, public roadmap |
| NCERT syllabus changes mid-year | Low | Medium | Content is JSON; we can update one file and re-render |
| Student data breach | Low | Critical | Encryption at rest, minimal data, no third-party SDKs |
| "Just use ChatGPT" pressure from users | High | Low | Document why we are deliberately LLM-agnostic; show our pedagogy is not just "AI" |

---

## 12. Success Metrics

We measure what matters: **did the student learn?**

| Metric | How measured | Target |
|---|---|---|
| Chapter completion rate | Per-chapter progress events | ≥ 60% of starters complete |
| Score improvement (pre/post quiz) | Quiz module in Phase 2 | +20 percentage points average |
| Return rate (DAU/MAU) | Auth events | ≥ 30% |
| Time-to-first-understanding | Time from lesson open to first correct exercise | < 15 min for basic concept |
| AI tutor helpfulness | Thumbs up/down | ≥ 80% positive |
| Cost per active student per month | (VPS bill) / MAU | < ₹10 ($0.12) |
| **Student outcome**: % who crack JEE/NEET after using platform | Annual survey, opt-in | Aim to beat national average by 2x |

---

## 13. Open Questions for You (The Founder)

1. **License for content** — Apache 2.0 for code is standard. CC-BY-SA 4.0 for content means anyone can remix. Is that what you want, or do you want stricter (e.g., CC-BY-NC-SA to prevent paid clones)?
2. **Who creates content?** You, volunteer teachers, paid authors, or AI-generated + human-reviewed? This is the #1 determinant of success.
3. **Volunteer tutor network?** Will you recruit IIT/NIT alumni to be volunteer tutors in study rooms (Phase 3)? This is the cheapest way to add value.
4. **First language priority** — English first, then Hindi, then which (Telugu, Tamil, Bengali, Marathi)?
5. **Anonymous or signed-up?** Phase 0/1 can be anonymous (no DB). Phase 2 requires accounts. Confirm.
6. **Brand name?** "ClassX Companion" is a working name. A real brand helps fundraising (if you ever want to) and word-of-mouth.

---

## 14. Next Steps (This Week)

1. **You review this document** and tell me which phases to prioritize.
2. **We delete the duplicate** `classx-companion/classx-companion/` folder.
3. **We add Phase 0.1 tasks** to the issue tracker / TODO.md.
4. **We pick the first chapter** (my recommendation: Class 10 Maths Ch 3).
5. **We author 1 lesson end-to-end** as a proof — this exercises every system.

---

*Document version 0.1. Maintained in `ARCHITECTURE.md` at the repo root. PRs welcome — this is a living document.*

---

## 15. Cost Optimization Playbook (Quality-Preserving)

> **Constraint**: Every optimization below must keep measurable student outcomes (test scores, completion rate, time-to-understanding) at parity or better. If an optimization hurts pedagogy or breaks reliability, we don't ship it.

### 15.1 The Cost Hierarchy — Where to Attack First

| Rank | Cost Bucket | % of total | Optimization potential |
|---|---|---|---|
| 🥇 | **AI/LLM inference** | 40-60% | **70-80%** savings possible |
| 🥈 | **Bandwidth / egress** | 15-25% | **50-70%** savings possible |
| 🥉 | **Storage** | 10-20% | **40-60%** savings possible |
| 4 | **Compute (CPU/RAM)** | 10-20% | **30-50%** savings possible |
| 5 | **Observability / devops** | 5-10% | **80%+** (already near $0 if disciplined) |

Read the AI section most carefully — that's where the budget goes.

### 15.2 AI / LLM Cost Optimization (The Big One)

#### A. Model Cascading (Tiered Routing)

Don't send every query to the same model. Classify first, then route:

```
Student query ──► Intent classifier (small model, ~1ms, ~free)
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   SIMPLE          MEDIUM          HARD
  "Define x"      "Solve this      "Why does
                   equation"        quantum..."
        │              │              │
        ▼              ▼              ▼
   Llama 3.2 1B   Llama 3.1 8B    Qwen 2.5 32B
   (Q4_K_M)       (Q4_K_M)        (Q5_K_M)
   ~$0            ~$0.0001/query   ~$0.001/query
   ~50ms          ~1.2s            ~4s
```

**Result**: 60-70% of queries hit the tiny model, costing essentially nothing. Hard queries still get a big model, but rarely.

#### B. Semantic Caching (The Single Highest-ROI Optimization)

Students ask the same questions millions of times. "What is photosynthesis?" gets asked 100,000 times a year by 100,000 different students. The answer doesn't change.

**Implementation**:
- Embed the question → look up in Redis vector index
- If cosine similarity > 0.95 to a cached answer, return it (sub-10ms, zero LLM cost)
- Only if no cache hit, call the LLM
- Cache the new answer

**Expected hit rate**: 30-50% within the first month of operation, growing over time. This is the single biggest cost saver for any tutoring system.

```javascript
// Pseudo-code
async function tutorAnswer(question) {
  const cached = await redisVectorSearch(question, threshold=0.95);
  if (cached) return cached;  // FREE
  const answer = await llm.generate(question);
  await redisVectorStore(question, answer);
  return answer;
}
```

#### C. Quantization (Smaller Models, Same Quality for Most Tasks)

Modern LLMs quantized to 4-bit (`Q4_K_M`) lose < 2% quality on most educational tasks but use 75% less RAM and run 2-3x faster.

| Format | Size (Llama 3.1 8B) | Quality | Speed |
|---|---|---|---|
| F16 (full) | 16 GB | 100% | 1x |
| Q8_0 | 8 GB | 99.5% | 1.3x |
| Q5_K_M | 5.5 GB | 99% | 1.6x |
| **Q4_K_M (default)** | **4.5 GB** | **98%** | **2x** |
| Q3_K_M | 3.5 GB | 95% | 2.5x |

**Recommendation**: Default to Q4_K_M. Only use Q5 or F16 for the evaluator agent (where accuracy matters most).

#### D. Specialized Small Models > General Big Models

Don't use one giant model for everything. Train small specialists:

- **Tutor agent** (Class 6 analogies, explanations): Fine-tuned Llama 3.1 8B
- **Hint agent** (targeted nudges): Fine-tuned Phi-3.5 mini (3.8B) — does it in 200ms
- **Evaluator agent** (grade answers): Fine-tuned Qwen 2.5 7B
- **Intent classifier** (which agent to call): Trained classifier, not even an LLM

A 3.8B model fine-tuned on hint-generation beats a 70B general model on hints, **at 1/20th the cost**.

#### E. Prompt Compression

System prompts can be 2-3x shorter with no quality loss:

- Remove redundant whitespace
- Strip markdown formatting from prompts (the model doesn't need it)
- Use shorthand ("CBSE 2026 NCERT" instead of "Central Board of Secondary Education 2026 National Council of Educational Research and Training")
- Cache the system prompt at the LLM server (Ollama supports this)

**Result**: 30-50% reduction in prefill tokens (the expensive part of inference).

#### F. Browser-Side Inference (Zero Server Cost for Some Queries)

For truly simple queries ("what is x² + 2x + 1?"), we can run a tiny model **in the student's browser** via WebLLM:

- No server cost
- No latency
- No data leaves the device
- Works offline

**Limitation**: Only practical for 1-3B models on desktop/laptop. Indian students on cheap Android phones can't run this — keep server-side as default, browser as progressive enhancement.

#### G. Batch & Async Where Possible

- **Quiz grading**: Batch 50 student answers, send to LLM once with a list. 5x cheaper than 50 separate calls.
- **Content generation**: When authoring lessons, batch all "explain this concept" requests for a chapter into one big LLM call.
- **Email digests / reports**: Generate at 6 AM IST, not on-demand.

#### H. Speculative Decoding (Phase 2+)

Use a tiny draft model to predict tokens, big model to verify. ~2x speedup, no quality loss. vLLM supports this; Ollama doesn't yet (as of 2026) but the technique is available via llama.cpp directly.

---

### 15.3 Bandwidth / Egress Optimization (The India-Specific Lever)

Indian students often pay ₹500-1500/month for data. Every kilobyte we send is money out of their pocket. This is both a **cost** issue and a **moral** issue.

#### A. Brotli Compression (Universal Win)

- Gzip: 1.0x baseline
- **Brotli: 0.80x** (20% smaller for text, HTML, JS)
- Trivial to enable in Traefik/Caddy/NGINX

**Cost**: 0. Effort: 10 minutes. Quality: zero impact. **Do this today.**

#### B. AVIF/WebP for Images (vs PNG/JPEG)

- AVIF: 50% smaller than JPEG at same quality
- WebP: 30% smaller than JPEG
- All modern browsers support both

For lesson diagrams, this is free money.

#### C. Lazy-Load & Responsive Images

A Class 6 student on a 4-inch Android phone doesn't need a 4K image. Use `srcset`:

```html
<img src="diagram-320.webp"
     srcset="diagram-320.webp 320w,
             diagram-640.webp 640w,
             diagram-1280.webp 1280w"
     sizes="(max-width: 640px) 100vw, 640px"
     loading="lazy"
     alt="...">
```

#### D. Service Worker / PWA (The Bandwidth Killer)

Cache lessons, images, and JS on first visit. Re-reads cost **zero bandwidth**.

- Phase 1: Basic SW caches `index.html`, CSS, JS, KaTeX
- Phase 2: SW caches last 5 lessons read
- Phase 3: SW caches full chapter when student chooses

**This is how we make students in low-data regions feel like the app is "free"** — because for re-reads, it actually is.

#### E. Code Splitting & Tree Shaking

React app currently bundles everything. Move to Vite + dynamic imports:

```javascript
const VizRenderer = React.lazy(() => import('./VizRenderer'));
const LaTeXRenderer = React.lazy(() => import('./LaTeXRenderer'));
```

A student who only reads lessons doesn't download the viz renderer (~80 KB gzipped).

#### F. HTTP/3 (QUIC)

Traefik supports it natively. 0-RTT for repeat connections = faster loads on flaky mobile networks.

#### G. Preact Instead of React (If We Rebuilt Today)

- Preact: 3 KB gzipped
- React 18: 45 KB gzipped
- Same API, 15x smaller

**Recommendation**: Keep React for now (CDN already loaded). Consider Preact for a future rebuild.

#### H. Telegram Bot / WhatsApp Bridge (The "Data-Free" Path)

For students with literal zero data but a feature phone + WhatsApp:

- Student sends "explain photosynthesis" to our WhatsApp Business number
- Meta's free tier: 1,000 conversations/month
- For larger scale, the Baileys (MIT) library gives us unofficial WhatsApp access

**Cost**: Free for the student (WhatsApp data is cheap or free on most Indian plans). Our cost: tiny (one VM running the bot).

### 15.4 Storage Cost Optimization

#### A. Tiered Storage (Hot vs Cold)

```
Hot (frequent)         Warm (monthly)         Cold (rare)
MinIO on SSD           MinIO on HDD           Hetzner Storage Box
€0.05/GB/mo            €0.01/GB/mo            €0.0035/GB/mo
Lesson HTML, viz       Recent animations      Old question papers
```

Automated tiering moves data after 30/180 days.

#### B. Video Re-encoding (Manim outputs)

Manim defaults to H.264 at high bitrate. We can:
- Re-encode to AV1 (50% smaller) using `svt-av1` (BSD-licensed)
- Use multiple resolutions (240p, 480p, 720p) and serve adaptively
- Strip audio (we don't need it for math viz)

#### C. Deduplication

Many lessons reuse the same diagrams (a sine wave, a triangle). Hash-based dedup on upload = one copy, not fifty.

#### D. Aggressive Compression for Text Content

Lessons are JSON. `gzip -9` on a 1 MB lesson file → 200 KB. Serve pre-compressed.

### 15.5 Compute Cost Optimization

#### A. ARM (Ampere) Instances — 30-40% Cheaper

Hetzner, Oracle Cloud, AWS Graviton all offer ARM at 30-40% discount vs x86. Our stack is fully ARM-compatible (Node, Postgres, Redis, MinIO, Ollama, Manim all run on ARM).

**Action**: Default to ARM in deployment. Test on ARM in CI.

#### B. Spot / Preemptible for Batch Jobs

- **Manim renders**: 70% cheaper on spot. If VM dies, just re-render.
- **Embedding generation**: 70% cheaper on spot. Idempotent.
- **AI inference for non-real-time**: Can tolerate interruptions.

**Do NOT use spot for**: API server, Postgres primary, Redis (must be always-on).

#### C. Scale-to-Zero for Render Workers

The Manim render worker is idle 95% of the time. A "scale-to-zero" pattern:

```
Queue depth > 0? → Spin up worker VM
Queue depth = 0 for 5 min? → Destroy worker VM
```

**Result**: Pay only for the minutes you're actually rendering. 95% cost reduction on this workload.

#### D. Co-locate Services Until 10k Users

At our scale, **one VM runs everything**: API + Postgres + Redis + MinIO + Ollama. Less overhead, no inter-service network costs.

- 1k MAU: 1 VM, €4/month
- 10k MAU: Split out Postgres, 2-3 VMs, €40/month
- 100k MAU: Full separation, 10+ VMs, €400/month

The "microservices from day 1" anti-pattern costs a fortune. Defer it.

#### E. No Kubernetes Until 50k+ Users

Docker Compose + systemd is enough until 50k MAU. Kubernetes is a salary's worth of complexity. When we need it, **K3s** (single binary, Apache 2.0) is the budget choice.

---

### 15.6 Observability Cost (Stay Near $0)

- **Grafana Cloud free tier**: 10k metrics, 50 GB logs, 50 GB traces. We'll never exceed this in Phase 1-2.
- **Self-host PLG stack** when we outgrow free tier: Prometheus + Loki + Grafana, all on a €4 VM.
- **Log retention**: 7 days hot, 30 days warm, 90 days cold. Logs older than 90 days are usually useless.
- **Sample traces**: Don't trace every request. 10% sample rate is plenty.

### 15.7 The Free-Tier Stack (Phase 0/1 Only)

We can defer paying for almost anything in Phase 0/1:

| Service | Free Tier Alternative | Why it works for us |
|---|---|---|
| AWS S3 | **Cloudflare R2** (10 GB free) or **Backblaze B2** (10 GB free) | Plenty for one chapter's media |
| AWS RDS Postgres | **Supabase** free tier (500 MB) or **Neon** free tier (500 MB) | 10x more than we need in Phase 0 |
| AWS ElastiCache Redis | **Upstash Redis** free tier (10k req/day) | Fine for low traffic |
| Cloudflare Workers | **Cloudflare Workers** free tier (100k req/day) | Edge logic, no server cost |
| Meilisearch Cloud | Self-host on our VM | It's just one binary |
| Vercel/Netlify | **Render.com** free tier (750 hr/mo) or our own VM | More flexible |
| Hugging Face Inference | **Hugging Face Spaces** free CPU | For embedding generation |
| GitHub | **GitHub** free for public repos | Trivially |

**Strategy**: Use free tiers aggressively in Phase 0/1. By the time we outgrow them, we'll have users and clearer scaling needs.

### 15.8 Developer Productivity (Hidden Cost)

Time is money. Cheap things that save time:

- **Tilt.dev** or **Skaffold**: Live-reload K8s dev (Phase 4+)
- **Caddy** instead of NGINX: Zero-config HTTPS, automatic certs
- **sqlc** (for Go) or **Kysely** (for Node): Type-safe SQL, fewer bugs
- **Vitest**: 10x faster than Jest, same API
- **pnpm over npm**: 2x faster installs, less disk
- **Turborepo**: Cached monorepo builds (if we grow to one)

### 15.9 Cost Optimization — Top 10 To-Do This Week

In order of ROI:

| # | Action | Effort | Savings | Quality impact |
|---|---|---|---|---|
| 1 | **Enable Brotli compression** in Traefik/NGINX | 30 min | 20% bandwidth | None |
| 2 | **Add semantic cache** (Redis + embedding) for AI tutor | 4 hrs | 40-60% AI cost | None |
| 3 | **Set up model cascading** (small → big) | 6 hrs | 30-40% AI cost | None |
| 4 | **Convert images to WebP/AVIF** in existing assets | 2 hrs | 30-50% image bandwidth | None |
| 5 | **Use Q4_K_M quantization** for default Ollama models | 30 min | 50% RAM, 2x speed | <2% quality loss |
| 6 | **Add basic Service Worker** for static asset caching | 3 hrs | 50% bandwidth for return visits | None |
| 7 | **Enable ARM builds** in CI | 1 hr | 30-40% compute cost | None |
| 8 | **Lazy-load viz + LaTeX renderers** in React app | 2 hrs | 80 KB first-load | None |
| 9 | **Add request coalescing** for duplicate concurrent queries | 3 hrs | 10-20% AI cost | None |
| 10 | **Document free-tier usage** in `.env.example` | 1 hr | $0 to start | None |

**Total effort**: ~25 hours. **Estimated annual savings at 10k MAU**: €2,000-4,000.

### 15.10 What We Will NOT Do (Quality Compromises We Reject)

| Tempting optimization | Why we reject it |
|---|---|
| Skip the Class 6 anchor to save prompt tokens | Breaks the pedagogy. The whole differentiator. |
| Use a 1B model for *all* queries | Quality tank on hard JEE/NEET questions. |
| Block students on slow connections instead of optimizing | India is mobile-first. Discrimination by data plan = wrong. |
| Use ads to subsidize cost | Students came to learn, not be marketed to. |
| Sell student data | Violates DPDP Act + our principles. |
| Cut the offline-first PWA | Hurts students in low-connectivity areas disproportionately. |
| Skip the LaTeX rendering for plain text math | Renders illegible on phones. |
| Use synchronous (blocking) calls instead of streaming | Hurts perceived quality. Students think the app is broken. |
| Drop the spaced repetition system | Reduces long-term retention measurably. |

### 15.11 The Cost Scorecard (How We'll Track It)

Add to the success metrics (§12):

| Metric | Target |
|---|---|
| Cost per active student per month | < ₹10 ($0.12) |
| AI cache hit rate | > 30% (Phase 2), > 50% (Phase 3) |
| Avg LLM tokens per tutor query | < 800 (with prompt compression) |
| Page weight (gzipped) | < 200 KB for first load |
| PWA cache hit rate (returning students) | > 60% |
| % of assets on CDN | 100% by Phase 2 |
| Compute cost per 1k AI queries | < $0.10 |

If we miss these targets, we revisit the optimization playbook.

---

## 16. The Differentiator Question (Revisited)

Going back to the original discussion — the **why** of this project. The cost optimization above gives us a 10-50x cost advantage over corporate edtech. But cost isn't the differentiator — **quality is**. The cost advantage lets us reinvest into:

- **Better content authors** (₹0 saved = ₹X paid to a great teacher)
- **More Manim animations** (every concept visualized)
- **Volunteer tutor stipends** (Phase 3 study rooms)
- **Real-world video examples** (filmed, not AI-generated)
- **Multi-language translation** (Hindi, Telugu, Tamil, Bengali)

**The flywheel**: Low cost → more content quality → more students → more contributors → even better content → even more students.

Our defensibility isn't "we have AI." Everyone has AI. Our defensibility is **"we have the best Class 10 + JEE/NEET foundation content, in every language, for free, forever."** The cost architecture makes that mission economically possible.

---

*End of cost optimization section. PRs to this document are especially welcome — this is where the day-to-day engineering decisions live.*


