"""
Compression Agent — Caveman + RTK strategies.

Sits after the Validator/Provenance Checker and before SuperMemory.
Compresses verbose LLM output into token-efficient forms for caching.

Caveman: Strips all non-essential tokens (articles, prepositions,
  connectors, repetitive phrasing). Produces minimal-viable explanation
  that a tutor can reconstruct from. Named for the principle:
  "if a caveman would say more, you're over-explaining."

RTK (Response Tokenization & Knitting): Tokenizes the validated tutor
  output into a structured, deduplicable payload. Knits together
  semantically equivalent concepts so repeated explanations collapse
  to the same cache key across rephrased student queries.
"""

from __future__ import annotations

import hashlib
import re
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

from .models import AgentMode, TutorOutput


# ── Compressible tokens ──────────────────────────────────────────────

_STOP_WORDS = frozenset({
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "out", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "each", "every", "both", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "just", "because", "but", "and",
    "or", "if", "while", "although", "since", "unless", "until", "like",
    "about", "also", "well", "now", "even", "still", "already", "yet",
    "please", "let", "us", "see", "know", "say", "think", "make", "take",
    "get", "give", "go", "come", "put", "set", "use", "need", "want",
    "look", "find", "show", "try", "ask", "tell", "help", "keep", "start",
    "turn", "bring", "happen", "write", "provide", "hold", "follow",
})


def _is_stop_word(word: str) -> bool:
    return word.lower().strip(".,!?;:'\"()[]{}") in _STOP_WORDS


# ── Caveman Strategy ─────────────────────────────────────────────────

def compress_caveman(text: str, preserve_pedagogy: bool = True) -> str:
    """
    Ultra-aggressive prompt / explanation compression.

    Steps:
    1. Remove stop words
    2. Strip leading/traivial framing ("Let's look at...", "Now we can...")
    3. Collapse repeated whitespace
    4. Keep LaTeX intact (never compress inside $...$ or $$...$$)
    5. Keep numbers and math operators
    """
    if not text:
        return ""

    lines = text.split("\n")
    compressed: List[str] = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Protect LaTeX blocks
        latex_blocks: List[str] = []
        def _save_latex(m: re.Match) -> str:
            idx = len(latex_blocks)
            latex_blocks.append(m.group(0))
            return f"\x00LATEX_{idx}\x00"

        line = re.sub(r"\$\$.*?\$\$", _save_latex, line, flags=re.DOTALL)
        line = re.sub(r"\$[^$]+\$", _save_latex, line)

        # Remove framing phrases
        line = re.sub(
            r"^(let.s|now|so|first|next|then|okay|well|alright|right)\s*,?\s*",
            "", line, flags=re.IGNORECASE
        )

        # Tokenize and remove stop words (keep short words that may be math)
        tokens = line.split()
        kept = [t for t in tokens if not _is_stop_word(t) or len(t) <= 2]

        line = " ".join(kept)

        # Restore LaTeX
        for idx, block in enumerate(latex_blocks):
            line = line.replace(f"\x00LATEX_{idx}\x00", block)

        if line:
            compressed.append(line)

    result = "\n".join(compressed)
    return result


# ── RTK Strategy ─────────────────────────────────────────────────────

class RTKPayload(BaseModel):
    """
    Response Tokenization & Knitting payload.

    Breaks a validated TutorOutput into its atomic pedagogical atoms,
    then knits them into a deduplicable, cache-friendly structure.
    """
    concept_key: str = Field(description="Normalized concept identifier")
    question_hash: str = Field(description="SHA-256 of canonical question form")
    ncert_ref: Optional[str] = Field(None, description="NCERT reference code")
    anchor: Optional[str] = Field(None, description="Class-6 compressed anchor")
    core: str = Field(description="Compressed NCERT core statement")
    bridge: Optional[str] = Field(None, description="Compressed JEE/NEET bridge")
    mode: str = Field(default="DUAL")
    latex_map: Dict[str, str] = Field(
        default_factory=dict, description="LaTeX expression lookup"
    )
    compressed_repr: str = Field(
        default="", description="Final compressed string for cache keying"
    )


def _canonical_question(question: str) -> str:
    """Normalize a question to its canonical form for dedup lookup."""
    q = question.lower().strip()
    q = re.sub(r"[^\w\s]", "", q)
    q = compress_caveman(q)
    q = re.sub(r"\s+", "_", q.strip())
    return q[:120]


def _concept_key(question: str, ncert_ref: Optional[str] = None) -> str:
    """Derive a concept key from question + optional NCERT reference."""
    base = _canonical_question(question)
    if ncert_ref:
        return f"{ncert_ref.lower()}_{hashlib.md5(base.encode()).hexdigest()[:8]}"
    return f"ck_{hashlib.md5(base.encode()).hexdigest()[:12]}"


def tokenize_rtk(
    tutor_output: TutorOutput,
    question: str,
    ncert_ref: Optional[str] = None,
) -> RTKPayload:
    """
    Tokenize and knit a TutorOutput into an RTKPayload.

    1. Extract pedagogical atoms (anchor, core, bridge)
    2. Compress each with Caveman
    3. Extract LaTeX expressions into a lookup table
    4. Generate deterministic cache keys
    """
    concept = _concept_key(question, ncert_ref)
    q_hash = hashlib.sha256(_canonical_question(question).encode()).hexdigest()[:16]

    # Extract LaTeX expressions to a separate lookup
    latex_map: Dict[str, str] = {}
    idx = 0

    def _extract_latex(text: str) -> str:
        nonlocal idx
        def _replace(m: re.Match) -> str:
            nonlocal idx
            key = f"§L{idx}§"
            latex_map[key] = m.group(0)
            idx += 1
            return key
        text = re.sub(r"\$\$.*?\$\$", _replace, text, flags=re.DOTALL)
        text = re.sub(r"\$[^$]+\$", _replace, text)
        return text

    anchor_raw = (
        _extract_latex(tutor_output.explanation.split("NCERT Core")[0])
        if "NCERT Core" in tutor_output.explanation
        else ""
    )
    core_raw = _extract_latex(tutor_output.ncert_core)

    bridge_raw = ""
    if tutor_output.jee_neet_bridge:
        bridge_raw = _extract_latex(tutor_output.jee_neet_bridge)

    return RTKPayload(
        concept_key=concept,
        question_hash=q_hash,
        ncert_ref=ncert_ref,
        anchor=compress_caveman(anchor_raw) if anchor_raw else None,
        core=compress_caveman(core_raw),
        bridge=compress_caveman(bridge_raw) if bridge_raw else None,
        mode=tutor_output.mode.value,
        latex_map=latex_map,
        compressed_repr=f"{concept}|{q_hash}|{tutor_output.mode.value}",
    )


def decompress_rtk(payload: RTKPayload) -> str:
    """
    Reconstruct a human-readable explanation from an RTKPayload.

    Restores LaTeX from the lookup table, rehydrates stop words
    minimally for readability, and reassembles the pedagogical structure.
    """
    base = f"Core: {payload.core}\n"
    if payload.anchor:
        base = f"Anchor: {payload.anchor}\n{base}"
    if payload.bridge:
        base += f"Bridge: {payload.bridge}\n"

    # Restore LaTeX
    for key, expr in payload.latex_map.items():
        base = base.replace(key, expr)

    return base.strip()


# ── Compression Agent ────────────────────────────────────────────────

class CompressionResult(BaseModel):
    """
    Result of running the Compression Agent on a validated tutor output.
    """
    caveman_explanation: str = Field(description="Caveman-compressed text")
    rtk_payload: RTKPayload = Field(description="RTK tokenization")
    cache_key: str = Field(description="Deterministic cache key for SuperMemory")
    token_savings_ratio: float = Field(
        ge=0.0, le=1.0, description="Fraction of tokens saved vs original"
    )


class CompressionAgent:
    """
    Applies Caveman + RTK to validated tutor output.

    Called after the Validator/Provenance Checker and before SuperMemory:
        Drafting → Validate → Provenance Check → Compression Agent → SuperMemory → Cache
    """

    def __init__(self):
        self._stats = {"caveman_runs": 0, "rtk_runs": 0, "total_tokens_saved": 0}

    async def compress(
        self,
        tutor_output: TutorOutput,
        question: str,
        ncert_ref: Optional[str] = None,
    ) -> CompressionResult:
        original_text = tutor_output.explanation + "\n" + tutor_output.ncert_core
        if tutor_output.jee_neet_bridge:
            original_text += "\n" + tutor_output.jee_neet_bridge
        original_tokens = len(original_text.split())

        # 1. Caveman pass
        caveman_text = compress_caveman(original_text)
        self._stats["caveman_runs"] += 1
        caveman_tokens = len(caveman_text.split())

        # 2. RTK pass
        rtk_payload = tokenize_rtk(tutor_output, question, ncert_ref)
        self._stats["rtk_runs"] += 1

        # 3. Derive cache key
        cache_key = rtk_payload.compressed_repr

        token_savings = 1.0 - (caveman_tokens / max(original_tokens, 1))
        self._stats["total_tokens_saved"] += original_tokens - caveman_tokens

        return CompressionResult(
            caveman_explanation=caveman_text,
            rtk_payload=rtk_payload,
            cache_key=cache_key,
            token_savings_ratio=round(token_savings, 4),
        )

    @property
    def stats(self) -> Dict[str, Any]:
        return {**self._stats}


# ── LangGraph-compatible node ──

async def compression_node(
    tutor_output: TutorOutput,
    question: str,
    ncert_ref: Optional[str] = None,
) -> CompressionResult:
    """Standalone compression node. Call after verification, before SuperMemory."""
    agent = CompressionAgent()
    return await agent.compress(tutor_output, question, ncert_ref)
