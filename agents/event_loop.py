"""
Event-driven Loop — reacts to student actions in real-time.

Events processed:
- question_asked → trigger tutor agent
- answer_submitted → trigger evaluator
- hint_requested → trigger hint agent
- lesson_completed → update mastery, suggest next
- quiz_attempted → analyze performance
- concept_struggled → trigger remedial micro-lesson

Termination guards:
- MAX_EVENT_LOOP_ITERATIONS hard limit
- Event queue drain check
- No recursive event generation
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .config import config
from .models import AgentState, EventOutput, LoopResult, LoopType, StudentProfile


class EventType(str, Enum):
    QUESTION_ASKED = "question_asked"
    ANSWER_SUBMITTED = "answer_submitted"
    HINT_REQUESTED = "hint_requested"
    LESSON_COMPLETED = "lesson_completed"
    QUIZ_ATTEMPTED = "quiz_attempted"
    CONCEPT_STRUGGLED = "concept_struggled"
    CONCEPT_MASTERED = "concept_mastered"
    SESSION_STARTED = "session_started"
    SESSION_ENDED = "session_ended"


class StudentEvent(BaseModel):
    event_type: EventType
    student_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: Dict[str, Any] = Field(default_factory=dict)


class EventLoop:
    """
    Processes student events and triggers appropriate actions.

    Bounded: processes up to MAX_EVENT_LOOP_ITERATIONS events per cycle.
    """

    def __init__(self):
        self.max_iterations = config.MAX_EVENT_LOOP_ITERATIONS
        self._event_handlers = self._register_handlers()

    def _register_handlers(self) -> Dict[EventType, str]:
        return {
            EventType.QUESTION_ASKED: "tutor_node",
            EventType.ANSWER_SUBMITTED: "evaluator_node",
            EventType.HINT_REQUESTED: "hint_node",
            EventType.CONCEPT_STRUGGLED: "tutor_node",
            EventType.LESSON_COMPLETED: "update_mastery",
            EventType.QUIZ_ATTEMPTED: "analyze_quiz",
            EventType.CONCEPT_MASTERED: "advance_difficulty",
            EventType.SESSION_STARTED: "load_profile",
            EventType.SESSION_ENDED: "save_profile",
        }

    def _update_mastery(
        self, student: StudentProfile, concept: str, score: float
    ) -> StudentProfile:
        student.mastery_scores[concept] = max(
            student.mastery_scores.get(concept, 0.0), score
        )
        if score >= 0.8 and concept not in student.strong_concepts:
            student.strong_concepts.append(concept)
            if concept in student.weak_concepts:
                student.weak_concepts.remove(concept)
        elif score < 0.5 and concept not in student.weak_concepts:
            student.weak_concepts.append(concept)

        student.history.append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "action": "mastery_update",
                "concept": concept,
                "score": score,
            }
        )
        return student

    async def process_event(
        self, event: StudentEvent, student: Optional[StudentProfile] = None
    ) -> LoopResult:
        iteration = 0
        triggered_actions: List[str] = []
        student_impact: Optional[str] = None
        updated_student = student or StudentProfile(student_id=event.student_id)

        while iteration < self.max_iterations:
            iteration += 1
            handler = self._event_handlers.get(event.event_type)
            if not handler:
                break

            triggered_actions.append(
                f"{handler} (from {event.event_type})"
            )

            # Process based on event type
            if event.event_type == EventType.LESSON_COMPLETED:
                lesson_id = event.payload.get("lesson_id", "unknown")
                score = event.payload.get("score", 0.0)
                updated_student = self._update_mastery(
                    updated_student, lesson_id, score
                )
                student_impact = f"Mastery updated for {lesson_id} to {score:.0%}"

            elif event.event_type == EventType.QUIZ_ATTEMPTED:
                quiz_id = event.payload.get("quiz_id", "unknown")
                result = event.payload.get("result", 0.0)
                concepts = event.payload.get("concepts", [])
                for concept in concepts:
                    updated_student = self._update_mastery(
                        updated_student, concept, result
                    )
                student_impact = f"Quiz {quiz_id}: {result:.0%} correct across {len(concepts)} concepts"

            elif event.event_type == EventType.CONCEPT_STRUGGLED:
                concept = event.payload.get("concept", "unknown")
                if concept not in updated_student.weak_concepts:
                    updated_student.weak_concepts.append(concept)
                student_impact = f"Struggle detected on {concept}. Remedial lesson recommended."

            elif event.event_type == EventType.CONCEPT_MASTERED:
                concept = event.payload.get("concept", "unknown")
                updated_student.mastery_scores[concept] = 1.0
                if concept not in updated_student.strong_concepts:
                    updated_student.strong_concepts.append(concept)
                student_impact = f"Concept {concept} mastered! Ready for next level."

            # Prevent infinite recursive event generation
            if event.event_type in (
                EventType.ANSWER_SUBMITTED,
                EventType.HINT_REQUESTED,
            ):
                break

        return LoopResult(
            loop_type=LoopType.EVENT_DRIVEN,
            iterations_used=iteration,
            converged=True,
            output=EventOutput(
                event_type=event.event_type.value,
                triggered_actions=triggered_actions,
                student_impact=student_impact,
            ),
            terminated_early=False,
        )


# ── LangGraph node function ──

async def event_node(state: AgentState) -> dict:
    """LangGraph node: processes events from the current state."""
    loop = EventLoop()
    try:
        student = state.student or StudentProfile(
            student_id=state.context.get("student_id", "anonymous")
            if state.context
            else "anonymous"
        )
        context = state.context or {}
        event_type_str = context.get("event_type", "question_asked")

        try:
            event_type = EventType(event_type_str)
        except ValueError:
            event_type = EventType.QUESTION_ASKED

        event = StudentEvent(
            event_type=event_type,
            student_id=student.student_id,
            payload=context.get("payload", {}),
        )
        result = await loop.process_event(event, student)
        return {
            "event_output": result.output,
            "student": student,
            "current_loop": LoopType.EVENT_DRIVEN,
        }
    except Exception as e:
        return {
            "event_output": EventOutput(
                event_type="error",
                triggered_actions=[],
                student_impact=f"Event processing error: {e}",
            ),
            "error": str(e),
        }
