"""
Tutor Agent — LangGraph node.

Pedagogical contract (from master-architectural-system-prompt):
1) Anchor with a Class-6 everyday analogy
2) Give the NCERT 2026-27 rule
3) Extend to JEE/NEET if relevant
4) Render math in LaTeX
5) Support BOARD / COMPETITIVE / DUAL modes
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, Optional

from .config import config
from .models import (
    AgentMode,
    AgentState,
    DifficultyTier,
    TutorOutput,
)


def _latex_guard(text: str) -> str:
    """Ensure plaintext math is wrapped in LaTeX delimiters."""
    text = re.sub(r"(?<!\$)\b(\d+)/(\d+)\b(?!\$)", r"$\\frac{\1}{\2}$", text)
    text = re.sub(r"(?<!\$)\b([a-zA-Z])\^(\d+)\b(?!\$)", r"$\1^{\2}$", text)
    return text


class TutorAgent:
    """Generates structured explanations using the dual-mode pedagogy."""

    def __init__(self):
        self.model = config.TUTOR_MODEL
        self.temperature = config.TUTOR_TEMPERATURE

    def _build_prompt(
        self,
        question: str,
        mode: AgentMode,
        context: Optional[Dict[str, Any]],
        tier: DifficultyTier,
    ) -> str:
        base = (
            "You are an expert Class X tutor for Indian students preparing for "
            "school exams + JEE/NEET foundation.\n\n"
            "Your response MUST follow this structure:\n"
            "1. Class 6 Anchor: A simple everyday analogy a 11-year-old would understand\n"
            "2. NCERT Core: The exact rule from NCERT 2026-27 syllabus\n"
            "3. JEE/NEET Bridge: Extended insight for competitive exams (if applicable)\n\n"
            "Rules:\n"
            "- Always render math in LaTeX ($...$ for inline, $$...$$ for blocks)\n"
            "- Never use plaintext fractions (1/2) or caret powers (x^2)\n"
            "- Use Indian real-world examples (auto-rickshaw fares, cricket stats, "
            "family grocery budgeting)\n"
        )

        if mode == AgentMode.BOARD:
            base += "\nStyle: BOARD EXAM MODE. Use Given/To Find/Steps format. Show complete step-by-step working."
        elif mode == AgentMode.COMPETITIVE:
            base += "\nStyle: COMPETITIVE MODE. Lead with the golden step and elimination tricks. Prioritize speed."
        else:
            base += (
                "\nStyle: DUAL MODE. First present Board step-by-step, "
                "then show the competitive golden step shortcut."
            )

        if tier == DifficultyTier.SIMPLE:
            base += "\nDifficulty: SIMPLE — Use very basic language, focus on definition and recall."
        elif tier == DifficultyTier.HARD:
            base += (
                "\nDifficulty: HARD — Include derivation, proof, and multi-step reasoning. "
                "Target JEE/NEET level."
            )
        else:
            base += "\nDifficulty: MEDIUM — Balance clarity with depth."

        if context and context.get("lessonId"):
            base += f"\nLesson context: {context['lessonId']}"
        if context and context.get("chapterId"):
            base += f"\nChapter: {context['chapterId']}"

        return f"{base}\n\nStudent question: {question}"

    async def generate(
        self,
        question: str,
        mode: AgentMode = AgentMode.DUAL,
        context: Optional[Dict[str, Any]] = None,
        tier: DifficultyTier = DifficultyTier.MEDIUM,
    ) -> TutorOutput:
        prompt = self._build_prompt(question, mode, context, tier)

        if self.model == "stub":
            return self._stub_response(question, mode, tier)

        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            from langchain_ollama import ChatOllama

            llm = ChatOllama(
                model=self.model,
                temperature=self.temperature,
                base_url=config.TUTOR_MODEL
                if config.TUTOR_MODEL.startswith("http")
                else "http://localhost:11434",
            )
            messages = [
                SystemMessage(
                    content="You are a Class X tutor following NCERT 2026-27 curriculum."
                ),
                HumanMessage(content=prompt),
            ]
            response = await llm.ainvoke(messages)
            text = response.content if hasattr(response, "content") else str(response)
            text = _latex_guard(text)

            return TutorOutput(
                explanation=text,
                ncert_core=text,
                jee_neet_bridge=text if tier == DifficultyTier.HARD else None,
                latex_rendered=True,
                mode=mode,
            )
        except ImportError:
            return self._stub_response(question, mode, tier)
        except Exception as e:
            return self._stub_response(question, mode, tier, error=str(e))

    def _stub_response(
        self,
        question: str,
        mode: AgentMode,
        tier: DifficultyTier,
        error: Optional[str] = None,
    ) -> TutorOutput:
        safe = question.strip()[:300]
        explanation = (
            f"[TutorAgent | {tier.value} | {'live' if not error else 'stub'}]\n\n"
            f"Class 6 Anchor: Think of something you see every day that this idea reminds you of. "
            f"For example, sharing chocolates with friends — when you split a bar, "
            f"you're doing division without realizing it!\n\n"
            f"NCERT Core (2026-27): The concept behind \"{safe}\" is defined in "
            f"your NCERT Class X textbook. Apply the standard formula step by step.\n\n"
        )
        if mode == AgentMode.COMPETITIVE or mode == AgentMode.DUAL:
            explanation += (
                f"JEE/NEET Golden Step: The key insight is to identify the single "
                f"operation that solves this in under 30 seconds. Look for symmetry, "
                f"substitution patterns, or elimination shortcuts.\n\n"
            )
        if mode == AgentMode.BOARD or mode == AgentMode.DUAL:
            explanation += (
                f"Board Exam Approach:\n"
                f"  Given: ...\n"
                f"  To Find: ...\n"
                f"  Steps:\n"
                f"    1. Write what's given\n"
                f"    2. Apply the formula\n"
                f"    3. Compute carefully\n"
                f"    4. Verify your answer\n"
            )

        jee_bridge = (
            f"Extension: For competitive exams, practice similar problems "
            f"with varying parameters. The real test is applying this concept "
            f"in unfamiliar contexts."
        )

        return TutorOutput(
            explanation=explanation,
            ncert_core=f"NCERT Class X: {safe}",
            jee_neet_bridge=jee_bridge if tier != DifficultyTier.SIMPLE else None,
            latex_rendered=True,
            mode=mode,
        )


# ── LangGraph node function ──

async def tutor_node(state: AgentState) -> dict:
    """LangGraph node: runs the Tutor Agent."""
    agent = TutorAgent()
    try:
        tier = DifficultyTier.MEDIUM
        if state.evaluator_output:
            if state.evaluator_output.score < 0.4:
                tier = DifficultyTier.SIMPLE
            elif state.evaluator_output.score > 0.8:
                tier = DifficultyTier.HARD

        output = await agent.generate(
            question=state.question or "",
            mode=state.mode,
            context=state.context,
            tier=tier,
        )
        return {"tutor_output": output, "iteration": state.iteration + 1}
    except Exception as e:
        return {
            "tutor_output": TutorOutput(
                explanation=f"Error generating explanation: {e}",
                ncert_core="",
            ),
            "error": str(e),
        }
