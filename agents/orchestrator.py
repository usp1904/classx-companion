"""
Agent Orchestrator — LangGraph StateGraph that coordinates all 4 loops.

Architecture:
```
                    ┌──────────────────────┐
                    │   Orchestrator        │
                    │   (StateGraph)        │
                    └──────┬───────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │ Agent Loop │   │Verification│   │  Event     │
   │ Tutor →    │   │   Loop     │   │  Loop      │
   │ Eval → Hint│   │            │   │            │
   └────────────┘   └────────────┘   └────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                   ┌──────────────┐
                   │Hill Climbing │
                   │    Loop      │
                   │(adaptation)  │
                   └──────────────┘
```

Termination guarantees:
- Each loop has a bounded max iteration count
- `should_continue` flag gates further execution
- Convergence detection stops loops early
- Error in any loop triggers graceful degradation
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Tuple

from .compression_agent import CompressionAgent, CompressionResult
from .config import config
from .evaluator_agent import evaluator_node
from .event_loop import event_node, EventType, StudentEvent
from .hill_climbing import hill_climb_node
from .hint_agent import hint_node
from .models import (
    AgentMode,
    AgentState,
    DifficultyTier,
    EvaluatorOutput,
    HillClimbOutput,
    LoopResult,
    LoopType,
    StudentProfile,
    TutorOutput,
    VerificationOutput,
)
from .tutor_agent import tutor_node
from .verification_loop import verification_node

logger = logging.getLogger("agents.orchestrator")


class AgentOrchestrator:
    """
    Orchestrates all 4 loop types using an internal state machine.

    Designed to be called from the Node.js backend via subprocess or HTTP.
    """

    def __init__(self):
        self.max_agent_iterations = config.MAX_AGENT_LOOP_ITERATIONS
        self.max_verification_iterations = config.MAX_VERIFICATION_LOOP_ITERATIONS
        self.max_event_iterations = config.MAX_EVENT_LOOP_ITERATIONS
        self.max_hill_climb_iterations = config.MAX_HILL_CLIMB_ITERATIONS
        self._doom_history: Dict[str, List[str]] = {}

    # ───────────────────────────────────────────────
    # 1. AGENT LOOP: Tutor → Evaluator → Hint
    # ───────────────────────────────────────────────

    async def run_agent_loop(
        self,
        question: str,
        student_answer: Optional[str] = None,
        mode: AgentMode = AgentMode.DUAL,
        context: Optional[Dict[str, Any]] = None,
        student: Optional[StudentProfile] = None,
    ) -> Dict[str, Any]:
        """
        The core Agent Loop:
        1. Tutor generates explanation
        2. Evaluator grades the student's answer (if provided)
        3. Hint generates progressive hints (if needed)
        4. Loops up to MAX_AGENT_LOOP_ITERATIONS times

        Never falls into indefinite loop — bounded by iteration counter + convergence check.
        """
        state = AgentState(
            question=question,
            student_answer=student_answer or "",
            mode=mode,
            context=context or {},
            student=student
            or StudentProfile(
                student_id=(context or {}).get("student_id", "anonymous")
            ),
            current_loop=LoopType.AGENT,
        )

        iteration = 0
        while state.should_continue and iteration < self.max_agent_iterations:
            iteration += 1
            state.iteration = iteration

            # Step 1: Tutor
            tutor_result = await tutor_node(state)
            state.tutor_output = tutor_result.get(
                "tutor_output", state.tutor_output
            )

            # If student answer provided, evaluate it
            if state.student_answer:
                eval_result = await evaluator_node(state)
                state.evaluator_output = eval_result.get(
                    "evaluator_output", state.evaluator_output
                )

                # If struggling, generate hint
                if (
                    state.evaluator_output
                    and state.evaluator_output.score < 0.7
                ):
                    hint_result = await hint_node(state)
                    state.hint_output = hint_result.get(
                        "hint_output", state.hint_output
                    )

            # Convergence check
            if (
                state.evaluator_output
                and state.evaluator_output.score >= 0.7
            ):
                state.should_continue = False
                state.termination_reason = "Student mastered concept"

            # Doom loop detection: check for state repetition
            doom_fp = self._fingerprint_state(state)
            loop_key = f"agent_{id(state)}"
            if loop_key not in self._doom_history:
                self._doom_history[loop_key] = []
            self._doom_history[loop_key].append(doom_fp)

            # If last N iterations have the same fingerprint, kill the loop
            recent = self._doom_history[loop_key][-config.DOOM_LOOP_MAX_REPETITIONS:]
            if (
                len(recent) >= config.DOOM_LOOP_MAX_REPETITIONS
                and len(set(recent)) == 1
            ):
                state.should_continue = False
                state.termination_reason = (
                    f"Doom loop detected: same state fingerprint "
                    f"for {config.DOOM_LOOP_MAX_REPETITIONS} consecutive iterations"
                )

            if iteration >= self.max_agent_iterations:
                state.should_continue = False
                state.termination_reason = "Max iterations reached"

        # Cleanup doom history for this state
        self._doom_history.pop(loop_key, None)
        return self._serialize_state(state, LoopType.AGENT, iteration)

    # ───────────────────────────────────────────────
    # 2. VERIFICATION LOOP
    # ───────────────────────────────────────────────

    async def run_verification_loop(
        self,
        content: Any,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Verification loop: checks content against NCERT 2026-27.
        Bounded by MAX_VERIFICATION_LOOP_ITERATIONS.
        """
        from .verification_loop import VerificationLoop

        loop = VerificationLoop()
        result = await loop.verify(content, context)

        return self._serialize_result(
            result,
            {
                "verification_output": result.output.dict()
                if hasattr(result.output, "dict")
                else result.output
            },
        )

    # ───────────────────────────────────────────────
    # 3. EVENT-DRIVEN LOOP
    # ───────────────────────────────────────────────

    async def run_event_loop(
        self,
        event_type: str,
        student_id: str,
        payload: Optional[Dict[str, Any]] = None,
        student: Optional[StudentProfile] = None,
    ) -> Dict[str, Any]:
        """
        Event-driven loop: processes student events in real-time.
        Bounded by MAX_EVENT_LOOP_ITERATIONS.
        """
        from .event_loop import EventLoop, EventType as ET

        loop = EventLoop()
        try:
            event_type_enum = ET(event_type)
        except ValueError:
            event_type_enum = ET.QUESTION_ASKED

        event = StudentEvent(
            event_type=event_type_enum,
            student_id=student_id,
            payload=payload or {},
        )
        result = await loop.process_event(event, student)

        return self._serialize_result(
            result,
            {
                "event_output": result.output.dict()
                if hasattr(result.output, "dict")
                else result.output
            },
        )

    # ───────────────────────────────────────────────
    # 4. HILL CLIMBING LOOP
    # ───────────────────────────────────────────────

    async def run_hill_climb_loop(
        self, student: StudentProfile
    ) -> Dict[str, Any]:
        """
        Hill climbing loop: optimizes difficulty for adaptive learning.
        Bounded by MAX_HILL_CLIMB_ITERATIONS + plateau detection.
        """
        from .hill_climbing import HillClimbingLoop

        loop = HillClimbingLoop()
        result = await loop.optimize(student)

        return self._serialize_result(
            result,
            {
                "hill_climb_output": result.output.dict()
                if hasattr(result.output, "dict")
                else result.output
            },
        )

    # ───────────────────────────────────────────────
    # 5. MASTER ORCHESTRATION (all 4 loops)
    # ───────────────────────────────────────────────

    async def run_full_pipeline(
        self,
        question: str,
        student_answer: Optional[str] = None,
        mode: AgentMode = AgentMode.DUAL,
        context: Optional[Dict[str, Any]] = None,
        student: Optional[StudentProfile] = None,
    ) -> Dict[str, Any]:
        """
        Runs the complete orchestration pipeline:
        1. Event Loop (process incoming event)
        2. Agent Loop (tutor → evaluate → hint)
        3. Verification Loop (NCERT alignment)
        4. Compression Agent (Caveman + RTK — token-efficient storage)
        5. SuperMemory (semantic persistence of compressed output)
        6. Hill Climbing Loop (adapt difficulty)

        Each loop is independently bounded. If any loop fails, the pipeline
        continues with degraded output (graceful degradation).
        """
        results = {
            "event_loop": None,
            "agent_loop": None,
            "verification_loop": None,
            "compression": None,
            "hill_climb_loop": None,
            "overall_status": "ok",
            "errors": [],
        }

        student_obj = student or StudentProfile(
            student_id=(context or {}).get("student_id", "anonymous")
        )

        # Step 1: Event-driven preprocessing
        try:
            event_type = (context or {}).get(
                "event_type", "question_asked"
            )
            event_result = await self.run_event_loop(
                event_type=event_type,
                student_id=student_obj.student_id,
                payload={"question": question, "answer": student_answer},
                student=student_obj,
            )
            results["event_loop"] = event_result
            if event_result.get("event_output"):
                student_obj = event_result.get("student", student_obj)
        except Exception as e:
            results["errors"].append(f"Event loop error: {e}")

        # Step 2: Agent loop (core teaching)
        try:
            agent_result = await self.run_agent_loop(
                question=question,
                student_answer=student_answer,
                mode=mode,
                context=context,
                student=student_obj,
            )
            results["agent_loop"] = agent_result
            if agent_result.get("evaluator_output"):
                score = agent_result["evaluator_output"].get("score", 0.5)
                context_payload = context or {}
                concepts = context_payload.get("concepts", ["general"])

                struggle_event = StudentEvent(
                    event_type=EventType.CONCEPT_STRUGGLED
                    if score < 0.5
                    else EventType.ANSWER_SUBMITTED,
                    student_id=student_obj.student_id,
                    payload={"concepts": concepts, "score": score},
                )
                await self.run_event_loop(
                    event_type=struggle_event.event_type.value,
                    student_id=student_obj.student_id,
                    payload=struggle_event.payload,
                    student=student_obj,
                )
        except Exception as e:
            results["errors"].append(f"Agent loop error: {e}")

        # Step 3: Verification
        tutor_content = None
        try:
            if agent_result and agent_result.get("tutor_output"):
                tutor_content = agent_result["tutor_output"]
                verification_result = await self.run_verification_loop(
                    tutor_content, context
                )
                results["verification_loop"] = verification_result
        except Exception as e:
            results["errors"].append(f"Verification loop error: {e}")

        # Step 4: Compression Agent (Caveman + RTK)
        try:
            if tutor_content and agent_result and agent_result.get("tutor_output"):
                from .models import TutorOutput
                from .compression_agent import CompressionAgent

                tutor_out = agent_result["tutor_output"]
                if isinstance(tutor_out, dict):
                    tutor_out = TutorOutput(**tutor_out)

                ca = CompressionAgent()
                compression_result = await ca.compress(
                    tutor_output=tutor_out,
                    question=question,
                    ncert_ref=(context or {}).get("ncert_ref"),
                )
                results["compression"] = compression_result.dict()

                # Persist to SuperMemory (Python side — pushes to JS bridge or Redis)
                self._store_supermemory(compression_result, question)
        except Exception as e:
            results["errors"].append(f"Compression error: {e}")

        # Step 5: Hill climbing (adaptive difficulty)
        try:
            hill_result = await self.run_hill_climb_loop(student_obj)
            results["hill_climb_loop"] = hill_result
        except Exception as e:
            results["errors"].append(f"Hill climb loop error: {e}")

        if results["errors"]:
            results["overall_status"] = "degraded"

        return results

    def _store_supermemory(
        self,
        compression_result: "CompressionResult",
        question: str,
    ) -> None:
        """
        Persist a compressed RTK payload to SuperMemory.

        In production, this writes to Redis via the JS bridge.
        In dev/stub mode, this is a no-op (cache warming for demo).
        """
        try:
            import json
            import os

            rtk = compression_result.rtk_payload
            sm_key = f"supermemory:{rtk.concept_key}:{rtk.mode}"

            # Log for observability
            logger.info(
                "SuperMemory: storing %s (savings: %.0f%%) | key=%s",
                rtk.concept_key,
                compression_result.token_savings_ratio * 100,
                sm_key,
            )

            # If configured, push via JS bridge or direct Redis
            bridge_url = os.environ.get("AGENT_BRIDGE_URL")
            if bridge_url and rtk.concept_key:
                import requests

                try:
                    requests.post(
                        f"{bridge_url}/agents/supermemory/store",
                        json={
                            "concept_key": rtk.concept_key,
                            "question_hash": rtk.question_hash,
                            "ncert_ref": rtk.ncert_ref,
                            "anchor": rtk.anchor,
                            "core": rtk.core,
                            "bridge": rtk.bridge,
                            "mode": rtk.mode,
                            "latex_map": rtk.latex_map,
                            "compressed_repr": rtk.compressed_repr,
                            "token_savings_ratio": compression_result.token_savings_ratio,
                        },
                        timeout=2,
                    )
                except Exception:
                    logger.debug("SuperMemory bridge unavailable — stored in-memory only")
        except Exception as e:
            logger.debug("SuperMemory: skipped (%s)", e)

    # ───────────────────────────────────────────────
    # Serialization helpers
    # ───────────────────────────────────────────────

    def _fingerprint_state(self, state: AgentState) -> str:
        parts = []
        if state.tutor_output:
            parts.append(f"tutor_mode={state.tutor_output.mode.value}")
        if state.evaluator_output:
            parts.append(f"score={state.evaluator_output.score:.2f}")
            parts.append(f"correct={state.evaluator_output.is_correct}")
        if state.hint_output:
            parts.append(f"hint_level={state.hint_output.hint_level}")
        return "|".join(parts)

    def _serialize_state(
        self,
        state: AgentState,
        loop_type: LoopType,
        iterations: int,
    ) -> Dict[str, Any]:
        return {
            "loop_type": loop_type.value,
            "iterations_used": iterations,
            "terminated_early": iterations >= self.max_agent_iterations,
            "termination_reason": state.termination_reason,
            "tutor_output": state.tutor_output.dict()
            if state.tutor_output and hasattr(state.tutor_output, "dict")
            else state.tutor_output,
            "evaluator_output": state.evaluator_output.dict()
            if state.evaluator_output
            and hasattr(state.evaluator_output, "dict")
            else state.evaluator_output,
            "hint_output": state.hint_output.dict()
            if state.hint_output and hasattr(state.hint_output, "dict")
            else state.hint_output,
            "error": state.error,
        }

    def _serialize_result(
        self, result: LoopResult, extra: Dict[str, Any]
    ) -> Dict[str, Any]:
        base = {
            "loop_type": result.loop_type.value,
            "iterations_used": result.iterations_used,
            "converged": result.converged,
            "terminated_early": result.terminated_early,
        }
        base.update(extra)
        return base


# Singleton
_orchestrator: Optional[AgentOrchestrator] = None


def get_orchestrator() -> AgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator


# ───────────────────────────────────────────────
# CLI entry point (for subprocess calls from Node.js)
# ───────────────────────────────────────────────

async def main_cli():
    import sys

    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}))
        return

    command = sys.argv[1]
    orchestrator = get_orchestrator()

    if command == "agent_loop":
        input_data = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        result = await orchestrator.run_agent_loop(
            question=input_data.get("question", ""),
            student_answer=input_data.get("student_answer"),
            mode=AgentMode(input_data.get("mode", "DUAL")),
            context=input_data.get("context"),
            student=(
                StudentProfile(**input_data["student"])
                if input_data.get("student")
                else None
            ),
        )
        print(json.dumps(result))

    elif command == "verification_loop":
        input_data = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        result = await orchestrator.run_verification_loop(
            content=input_data.get("content"),
            context=input_data.get("context"),
        )
        print(json.dumps(result))

    elif command == "event_loop":
        input_data = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        result = await orchestrator.run_event_loop(
            event_type=input_data.get("event_type", "question_asked"),
            student_id=input_data.get("student_id", "anonymous"),
            payload=input_data.get("payload"),
            student=(
                StudentProfile(**input_data["student"])
                if input_data.get("student")
                else None
            ),
        )
        print(json.dumps(result))

    elif command == "hill_climb":
        input_data = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        result = await orchestrator.run_hill_climb_loop(
            student=StudentProfile(**input_data.get("student", {})),
        )
        print(json.dumps(result))

    elif command == "full_pipeline":
        input_data = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        result = await orchestrator.run_full_pipeline(
            question=input_data.get("question", ""),
            student_answer=input_data.get("student_answer"),
            mode=AgentMode(input_data.get("mode", "DUAL")),
            context=input_data.get("context"),
            student=(
                StudentProfile(**input_data["student"])
                if input_data.get("student")
                else None
            ),
        )
        print(json.dumps(result))

    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))


if __name__ == "__main__":
    asyncio.run(main_cli())
