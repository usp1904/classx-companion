# Workspace Rules

## Token & Memory Optimization
* **Going forward leverage Caveman + RTK + SuperMemory throughout the chat**:
  * Apply Caveman prompt compression (strip non-essential tokens like articles, prepositions, and repetitive connectors) to minimize token usage.
  * Structure outputs using RTK (Real-Time Knowledge categorization: Anchor, Core, Bridge) for caching and semantic indexing.
  * Consult `SuperMemory` (`lib/superMemory.js` / semantic cache) before resolving tasks to reuse already computed concepts and maximize execution efficiency.
