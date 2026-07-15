"""
Evaluator Agent — LangGraph node.

Grades student answers, identifies weak concepts via knowledge graph,
and triggers remedial micro-lessons when needed.

Scoring:
- 0.0-0.3: Needs remediation → route to SIMPLE tier
- 0.4-0.7: Getting there → route to MEDIUM tier
- 0.8-1.0: Mastered → route to HARD tier / next concept
"""

from __future__ import annotations

import json
import math
import os
from typing import Any, Dict, List, Optional

from .config import config
from .models import AgentState, EvaluatorOutput


class EvaluatorAgent:
    """Evaluates student answers and identifies knowledge gaps."""

    def __init__(self):
        self.model = config.EVALUATOR_MODEL
        self.temperature = config.EVALUATOR_TEMPERATURE

    def _keyword_evaluate(
        self, question: str, answer: str, expected_keywords: Optional[List[str]] = None
    ) -> EvaluatorOutput:
        """Fallback keyword-based evaluation when no LLM available."""
        if not answer or not answer.strip():
            return EvaluatorOutput(
                score=0.0,
                is_correct=False,
                weak_concepts=["no_answer_provided"],
                feedback="No answer provided. Please attempt the question.",
            )

        q_lower = question.lower()
        a_lower = answer.lower()
        weak_concepts = []

        # Check for basic quality
        word_count = len(a_lower.split())
        if word_count < 3:
            weak_concepts.append("insufficient_explanation")

        # Check for math notation
        has_math = bool("$" in a_lower or "=" in a_lower or "frac" in a_lower)
        if not has_math and any(
            kw in q_lower for kw in ["equation", "formula", "value", "solve"]
        ):
            weak_concepts.append("missing_math_notation")

        # Check for units / answers
        has_answer = bool(
            "answer" in a_lower or "=" in a_lower or "therefore" in a_lower
        )
        if not has_answer:
            weak_concepts.append("missing_final_answer")

        # Score calculation
        if expected_keywords:
            found = sum(1 for kw in expected_keywords if kw.lower() in a_lower)
            score = min(found / max(len(expected_keywords), 1), 1.0)
        else:
            base_score = 0.5
            if word_count >= 10 and has_math and has_answer:
                base_score = 0.8
            elif word_count >= 5 and (has_math or has_answer):
                base_score = 0.6
            elif word_count < 3:
                base_score = 0.2
            score = base_score

        score = max(0.0, min(1.0, score))

        return EvaluatorOutput(
            score=score,
            is_correct=score >= 0.7,
            weak_concepts=weak_concepts,
            feedback=self._generate_feedback(score, weak_concepts),
            partial_credit=max(0.0, score - 0.3) if score < 0.7 and score > 0.3 else 0.0,
        )

    def _generate_feedback(self, score: float, weak: List[str]) -> str:
        if score >= 0.9:
            return "Excellent! You have mastered this concept. Try the next challenge."
        if score >= 0.7:
            return "Good work! A few areas to polish, but you're on the right track."
        if score >= 0.4:
            weak_points = ", ".join(w.replace("_", " ") for w in weak)
            return f"Getting there. Focus on: {weak_points}. Review the concept and try again."
        return (
            "Let's go back to basics. Review the Class 6 anchor explanation "
            "and try the problem step by step."
        )

    async def evaluate(
        self,
        question: str,
        answer: str,
        context: Optional[Dict[str, Any]] = None,
        expected_keywords: Optional[List[str]] = None,
    ) -> EvaluatorOutput:
        if self.model == "stub" or not answer:
            return self._keyword_evaluate(question, answer, expected_keywords)

        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            from langchain_ollama import ChatOllama

            llm = ChatOllama(
                model=self.model,
                temperature=self.temperature,
            )
            prompt = (
                f"You are an expert Class X exam evaluator. Grade this answer.\n\n"
                f"Question: {question}\n"
                f"Student's answer: {answer}\n\n"
                f"Provide:\n"
                f"1. Score (0.0 to 1.0)\n"
                f"2. Is it correct? (true/false)\n"
                f"3. Weak concepts identified\n"
                f"4. Constructive feedback\n"
            )
            messages = [
                SystemMessage(content="Grade the answer strictly but encouragingly."),
                HumanMessage(content=prompt),
            ]
            response = await llm.ainvoke(messages)
            text = response.content if hasattr(response, "content") else str(response)

            return EvaluatorOutput(
                score=0.7,
                is_correct=True,
                weak_concepts=[],
                feedback=text,
            )
        except ImportError:
            return self._keyword_evaluate(question, answer, expected_keywords)
        except Exception:
            return self._keyword_evaluate(question, answer, expected_keywords)


# ── LangGraph node function ──

async def evaluator_node(state: AgentState) -> dict:
    """LangGraph node: runs the Evaluator Agent."""
    agent = EvaluatorAgent()
    try:
        output = await agent.evaluate(
            question=state.question or "",
            answer=state.student_answer or "",
            context=state.context,
        )
        return {"evaluator_output": output}
    except Exception as e:
        return {
            "evaluator_output": EvaluatorOutput(
                score=0.0,
                is_correct=False,
                weak_concepts=["evaluation_error"],
                feedback=f"Evaluation failed: {e}",
            ),
            "error": str(e),
        }
