"""
Hint Agent — LangGraph node.

Generates progressive hints (level 0-3) based on:
- The student's current answer
- Identified weak concepts from evaluator
- Prerequisite nodes from syllabus tree
- Class 6 anchor analogies

Progressive hint levels:
0: Conceptual nudge — "Think about what this reminds you of in daily life"
1: Directional — "Which formula might apply here?"
2: Procedural — "Try this specific step..."
3: Almost solution — "Here's the key substitution..."
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

from .config import config
from .models import AgentState, HintOutput


class HintAgent:
    """Generates progressive hints using the syllabus knowledge graph."""

    def __init__(self):
        self.model = config.HINT_MODEL
        self.temperature = config.HINT_TEMPERATURE

    def _load_rag_tree(self) -> Dict[str, Any]:
        path = config.SYLLABUS_RAG_TREE_PATH
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}

    def _find_prerequisite(self, concept: str) -> Optional[str]:
        tree = self._load_rag_tree()
        for node in tree.get("nodes", []):
            if concept.lower() in node.get("id", "").lower():
                prereqs = node.get("prerequisites", [])
                if prereqs:
                    prereq_id = prereqs[0]
                    for n in tree.get("nodes", []):
                        if n.get("id") == prereq_id:
                            return n.get("analogy") or n.get("label")
                return None
        return None

    def _class6_analogies(self) -> Dict[str, str]:
        return {
            "algebra": "Think of a balance scale — whatever you do to one side, do to the other.",
            "geometry": "Imagine folding paper to see shapes and angles line up.",
            "trigonometry": "Think of a ladder against a wall — the angle changes how high it reaches.",
            "arithmetic": "Like dividing chocolates among friends — fair sharing.",
            "calculus": "Like watching a car's speedometer change moment by moment.",
            "probability": "Like flipping a coin — what are the chances it lands heads up?",
            "statistics": "Like counting the different colors of marbles in a jar.",
            "physics": "Like pushing a toy car — harder push = faster car.",
            "chemistry": "Like mixing colors of paint to make new colors.",
            "biology": "Like a tree growing from a seed — gradual change over time.",
        }

    async def generate(
        self,
        question: str,
        answer: str,
        weak_concepts: List[str],
        context: Optional[Dict[str, Any]] = None,
    ) -> HintOutput:
        if self.model == "stub":
            return self._stub_hint(question, answer, weak_concepts, context)

        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            from langchain_ollama import ChatOllama

            llm = ChatOllama(
                model=self.model,
                temperature=self.temperature,
            )

            prompt = (
                f"Generate a progressive hint for a Class X student.\n\n"
                f"Question: {question}\n"
                f"Their current answer: {answer if answer else '(not attempted)'}\n"
                f"Weak areas: {', '.join(weak_concepts) if weak_concepts else 'general'}\n\n"
                f"Provide a hint at level 0-3:\n"
                f"0 = Very gentle nudge\n"
                f"1 = Directional guidance\n"
                f"2 = Specific procedural help\n"
                f"3 = Almost complete solution\n\n"
                f"Include a Class-6 analogy if possible."
            )
            messages = [
                SystemMessage(
                    content="You are a supportive tutor who gives just enough help to let the student figure it out themselves."
                ),
                HumanMessage(content=prompt),
            ]
            response = await llm.ainvoke(messages)
            text = response.content if hasattr(response, "content") else str(response)

            return HintOutput(
                hint_text=text,
                hint_level=1,
            )
        except ImportError:
            return self._stub_hint(question, answer, weak_concepts, context)
        except Exception:
            return self._stub_hint(question, answer, weak_concepts, context)

    def _stub_hint(
        self,
        question: str,
        answer: str,
        weak_concepts: List[str],
        context: Optional[Dict[str, Any]],
    ) -> HintOutput:
        analogies = self._class6_analogies()
        analogy = None
        for topic, text in analogies.items():
            if any(topic in (w.lower()) for w in weak_concepts) or topic in question.lower():
                analogy = text
                break

        if not analogy:
            analogy = "Think about a real-life situation where you've seen this idea in action."

        prereq_reminder = None
        if weak_concepts:
            first_concept = weak_concepts[0]
            prereq_reminder = self._find_prerequisite(first_concept)

        hint_level = min(len(weak_concepts) if weak_concepts else 1, 3)

        hint_texts = {
            0: f"Take a moment: {analogy}",
            1: f"Here's a clue: Think about which formula or rule applies here. {analogy}",
            2: f"Let's narrow it down: Try starting with the formula step by step. {analogy}",
            3: f"Almost there: Here's the key step to focus on... {analogy}",
        }

        return HintOutput(
            hint_text=hint_texts.get(hint_level, hint_texts[1]),
            hint_level=hint_level,
            prerequisite_reminder=prereq_reminder,
            class6_analogy=analogy,
        )


# ── LangGraph node function ──

async def hint_node(state: AgentState) -> dict:
    """LangGraph node: runs the Hint Agent."""
    agent = HintAgent()
    try:
        weak = (
            state.evaluator_output.weak_concepts
            if state.evaluator_output
            else []
        )
        output = await agent.generate(
            question=state.question or "",
            answer=state.student_answer or "",
            weak_concepts=weak,
            context=state.context,
        )
        return {"hint_output": output}
    except Exception as e:
        return {
            "hint_output": HintOutput(
                hint_text=f"Hint generation error: {e}",
                hint_level=0,
            ),
            "error": str(e),
        }
