"""
Shared data models for all agent loops.

Uses Pydantic for validation and serialization.
Compatible with LangGraph StateSchema.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DifficultyTier(str, Enum):
    SIMPLE = "SIMPLE"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class LoopType(str, Enum):
    AGENT = "agent_loop"
    VERIFICATION = "verification_loop"
    EVENT_DRIVEN = "event_driven_loop"
    HILL_CLIMBING = "hill_climbing_loop"


class AgentMode(str, Enum):
    BOARD = "BOARD"
    COMPETITIVE = "COMPETITIVE"
    DUAL = "DUAL"


class TutorOutput(BaseModel):
    explanation: str = Field(description="Class-6 anchored explanation")
    ncert_core: str = Field(description="NCERT 2026-27 core content")
    jee_neet_bridge: Optional[str] = Field(
        None, description="JEE/NEET level extension"
    )
    latex_rendered: bool = Field(
        default=False, description="Whether LaTeX rendering was applied"
    )
    mode: AgentMode = Field(default=AgentMode.DUAL)


class EvaluatorOutput(BaseModel):
    score: float = Field(ge=0.0, le=1.0, description="Score 0.0 to 1.0")
    is_correct: bool = Field(description="Whether answer is correct")
    weak_concepts: List[str] = Field(
        default_factory=list, description="Identified weak areas"
    )
    feedback: str = Field(description="Human-readable feedback")
    partial_credit: float = Field(
        ge=0.0, le=1.0, default=0.0, description="Partial credit if applicable"
    )


class HintOutput(BaseModel):
    hint_text: str = Field(description="Targeted hint")
    hint_level: int = Field(
        ge=0, le=3, description="0=conceptual nudge, 3=almost solution"
    )
    prerequisite_reminder: Optional[str] = Field(
        None, description="Reference to prerequisite concept"
    )
    class6_analogy: Optional[str] = Field(
        None, description="Class 6 level analogy"
    )


class VerificationOutput(BaseModel):
    passes: bool = Field(description="Whether content passes curriculum guard")
    ncert_aligned: bool = Field(description="Aligned with NCERT 2026-27")
    issues: List[str] = Field(default_factory=list)
    suggested_fixes: List[str] = Field(default_factory=list)


class EventOutput(BaseModel):
    event_type: str = Field(description="Type of event processed")
    triggered_actions: List[str] = Field(
        default_factory=list, description="Actions taken"
    )
    student_impact: Optional[str] = Field(
        None, description="How student was affected"
    )


class HillClimbOutput(BaseModel):
    iteration: int = Field(description="Current hill climb iteration")
    current_score: float = Field(description="Current difficulty score")
    best_score: float = Field(description="Best score found so far")
    converged: bool = Field(default=False, description="Whether converged")
    recommended_difficulty: DifficultyTier = Field(
        default=DifficultyTier.MEDIUM
    )


class StudentProfile(BaseModel):
    student_id: str
    mastery_scores: Dict[str, float] = Field(default_factory=dict)
    weak_concepts: List[str] = Field(default_factory=list)
    strong_concepts: List[str] = Field(default_factory=list)
    preferred_mode: AgentMode = Field(default=AgentMode.DUAL)
    history: List[Dict[str, Any]] = Field(default_factory=list)


class LoopResult(BaseModel):
    loop_type: LoopType
    iterations_used: int = Field(description="Actual iterations consumed")
    converged: bool = Field(default=False, description="Loop converged")
    output: Any = Field(default=None, description="Final loop output")
    terminated_early: bool = Field(
        default=False, description="Hit max iterations guard"
    )


class AgentState(BaseModel):
    """Shared state for LangGraph StateGraph across all agent loops."""

    # Input
    question: Optional[str] = Field(None)
    student_answer: Optional[str] = Field(None)
    mode: AgentMode = Field(default=AgentMode.DUAL)
    context: Optional[Dict[str, Any]] = Field(default=None)

    # Student profile
    student: Optional[StudentProfile] = Field(default=None)

    # Agent outputs
    tutor_output: Optional[TutorOutput] = Field(default=None)
    evaluator_output: Optional[EvaluatorOutput] = Field(default=None)
    hint_output: Optional[HintOutput] = Field(default=None)
    verification_output: Optional[VerificationOutput] = Field(default=None)
    event_output: Optional[EventOutput] = Field(default=None)
    hill_climb_output: Optional[HillClimbOutput] = Field(default=None)

    # Loop control
    current_loop: Optional[LoopType] = Field(default=None)
    iteration: int = Field(default=0, description="Current loop iteration")
    max_iterations: int = Field(
        default=5, description="Per-loop max iterations"
    )
    should_continue: bool = Field(default=True)
    termination_reason: Optional[str] = Field(default=None)

    # Errors
    error: Optional[str] = Field(default=None)

    class Config:
        arbitrary_types_allowed = True
