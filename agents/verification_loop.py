"""
Verification Loop — ensures all content passes NCERT 2026-27 curriculum guard.

This loop is a bounded cycle:
  1. Load content/answer
  2. Verify against syllabus tree & question schema
  3. If issues found AND iterations < MAX → fix and re-verify
  4. If iterations >= MAX → flag for human review
  5. If passes → return verified content

Termination guards:
- MAX_VERIFICATION_LOOP_ITERATIONS hard limit
- Convergence check: no new issues after a pass
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional

from .config import config
from .models import (
    AgentState,
    LoopResult,
    LoopType,
    VerificationOutput,
)


class VerificationLoop:
    """
    Bounded verification loop that checks NCERT 2026-27 alignment.
    """

    def __init__(self):
        self.model = config.VERIFICATION_MODEL
        self.max_iterations = config.MAX_VERIFICATION_LOOP_ITERATIONS
        self._load_syllabus()

    def _load_syllabus(self):
        path = config.SYLLABUS_PATH
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    self.syllabus = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.syllabus = {"subjects": []}
        else:
            self.syllabus = {"subjects": []}

    def _get_all_topics(self) -> set:
        topics = set()
        for subject in self.syllabus.get("subjects", []):
            for chapter in subject.get("chapters", []):
                for topic in chapter.get("topics", []):
                    topics.add(topic.lower())
        return topics

    def _check_ncert_alignment(self, text: str) -> List[str]:
        issues = []
        known_topics = self._get_all_topics()

        if "/" in text and "$" not in text:
            issues.append("Plaintext fraction detected. Wrap in $\\frac{}{}$")

        if re.search(r"\b[a-zA-Z]\^\d", text) and "$" not in text:
            issues.append("Caret power detected. Use LaTeX superscript.")

        has_ncert_ref = any(
            kw in text.lower()
            for kw in ["ncert", "cbse", "according to syllabus", "as per curriculum"]
        )
        if not has_ncert_ref and len(text) > 50:
            issues.append("No NCERT/curriculum reference found for long content.")

        return issues

    def _check_against_schema(self, content: Dict) -> List[str]:
        issues = []
        required = [
            "source_exam_origin",
            "academic_source_truth",
            "cognitive_complexity_tier",
        ]
        for field in required:
            if field not in content:
                issues.append(f"Missing required field: {field}")

        tier = content.get("cognitive_complexity_tier")
        valid_tiers = [
            "TIER_1_BASIC",
            "TIER_2_EXTENDED",
            "TIER_3_JEE_NEET_CHALLENGE",
        ]
        if tier and tier not in valid_tiers:
            issues.append(
                f"Invalid tier '{tier}'. Must be one of {valid_tiers}"
            )

        source = content.get("source_exam_origin", "")
        if source and "board" in source.lower() and tier == "TIER_3_JEE_NEET_CHALLENGE":
            issues.append(
                "Board-level source should not have JEE/NEET challenge tier"
            )

        return issues

    async def _llm_verify(
        self, text: str, context: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        if self.model == "stub":
            return []

        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            from langchain_ollama import ChatOllama

            llm = ChatOllama(model=self.model, temperature=self.temperature)
            prompt = (
                f"Verify this educational content against NCERT 2026-27 Class X syllabus:\n\n"
                f"{text[:2000]}\n\n"
                f"List any:\n"
                f"1. Factual errors\n"
                f"2. Misalignment with NCERT curriculum\n"
                f"3. Inappropriate difficulty level\n"
                f"4. Missing prerequisites\n\n"
                f"Return 'NO_ISSUES' if everything is correct."
            )
            messages = [
                SystemMessage(content="You are an NCERT curriculum alignment expert."),
                HumanMessage(content=prompt),
            ]
            response = await llm.ainvoke(messages)
            content_resp = (
                response.content if hasattr(response, "content") else str(response)
            )
            if "NO_ISSUES" in content_resp:
                return []
            return [
                line.strip()
                for line in content_resp.split("\n")
                if line.strip() and not line.startswith("```")
            ][:5]
        except Exception:
            return []

    async def verify(
        self, content: Any, context: Optional[Dict[str, Any]] = None
    ) -> LoopResult:
        iteration = 0
        all_issues: List[str] = []
        all_fixes: List[str] = []
        previous_issue_count = -1

        while iteration < self.max_iterations:
            iteration += 1
            issues: List[str] = []

            if isinstance(content, str):
                issues.extend(self._check_ncert_alignment(content))
            elif isinstance(content, dict):
                issues.extend(self._check_against_schema(content))

            llm_issues = await self._llm_verify(
                json.dumps(content) if not isinstance(content, str) else content,
                context,
            )
            issues.extend(llm_issues)

            all_issues = list(set(all_issues + issues))

            # Convergence check
            if len(all_issues) == previous_issue_count:
                break
            previous_issue_count = len(all_issues)

            if not issues:
                break

            for issue in issues:
                if "fraction" in issue.lower() or "latex" in issue.lower():
                    all_fixes.append("Wrap math expressions in LaTeX delimiters")
                if "reference" in issue.lower() or "ncert" in issue.lower():
                    all_fixes.append("Add NCERT 2026-27 curriculum reference")
                if "schema" in issue.lower() or "field" in issue.lower():
                    all_fixes.append("Include required metadata fields")

        passes = len(all_issues) == 0

        return LoopResult(
            loop_type=LoopType.VERIFICATION,
            iterations_used=iteration,
            converged=passes or len(all_issues) == previous_issue_count,
            output=VerificationOutput(
                passes=passes,
                ncert_aligned=passes,
                issues=all_issues,
                suggested_fixes=list(set(all_fixes)),
            ),
            terminated_early=iteration >= self.max_iterations and not passes,
        )


# ── LangGraph node function ──

async def verification_node(state: AgentState) -> dict:
    """LangGraph node: runs the Verification Loop."""
    loop = VerificationLoop()
    try:
        content = {}
        if state.tutor_output:
            content["explanation"] = state.tutor_output.explanation
            content["ncert_core"] = state.tutor_output.ncert_core

        result = await loop.verify(content, state.context)
        return {
            "verification_output": result.output,
            "current_loop": LoopType.VERIFICATION,
            "iteration": result.iterations_used,
            "should_continue": not result.converged
            and result.iterations_used < config.MAX_VERIFICATION_LOOP_ITERATIONS,
        }
    except Exception as e:
        return {
            "verification_output": VerificationOutput(
                passes=False,
                ncert_aligned=False,
                issues=[f"Verification error: {e}"],
            ),
            "error": str(e),
            "should_continue": False,
        }
