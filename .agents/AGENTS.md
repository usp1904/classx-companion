# Workspace Rules

## Token & Memory Optimization
* **Going forward leverage Caveman + RTK + SuperMemory throughout the chat**:
  * Apply Caveman prompt compression (strip non-essential tokens like articles, prepositions, and repetitive connectors) to minimize token usage.
  * Structure outputs using RTK (Real-Time Knowledge categorization: Anchor, Core, Bridge) for caching and semantic indexing.
  * Consult `SuperMemory` (`lib/superMemory.js` / semantic cache) before resolving tasks to reuse already computed concepts and maximize execution efficiency.

## CRS resolution hierarchy (run every task in this order)
1. **User request** — capture intent verbatim.
2. **CRS architecture instruction** — apply active architectural contract (VidyaSethu spec, ARCHITECTURE.md phases) first.
3. **Task classification** — `authoring` / `backend` / `frontend` / `integration` / `infra` / `fix`. Pick ONE.
4. **Skill selection** — load ONLY matching module: `curriculum-guard`, `math-formatter`, `dual-mode-router`, `viz-generator`, `historical-paper-tags`. Load exactly one unless task genuinely spans two.
5. **Load only matching module guidance** — never dump all skill docs into context.
6. **Respond using compact output** — Caveman + RTK (Anchor/Core/Bridge); strip filler.
7. **Optionally write memory note** — one-line Supertypes entry only if state/behavior changes.

## CRS mode defaults
- **Caveman + RTK + SuperMemory** on every reply; optimize token usage; use multiple agents ONLY for truly parallel independent sub-searches.
