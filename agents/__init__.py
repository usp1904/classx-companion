"""
ClassX Companion — Multi-Agent Orchestration Layer

Enterprise-grade agent system using LangGraph StateGraph for:
- Agent Loop (Tutor → Evaluator → Hint Generator)
- Verification Loop (NCERT curriculum guard)
- Event-driven Loop (reactive student event processing)
- Hill Climbing Loop (adaptive difficulty optimization)

All 4 loops share state via LangGraph's StateGraph channels.
No infinite loops - each loop has bounded iterations & termination guards.
"""

from .models import (
    AgentState,
    TutorOutput,
    EvaluatorOutput,
    HintOutput,
    VerificationOutput,
    EventOutput,
    HillClimbOutput,
    StudentProfile,
    DifficultyTier,
    LoopType,
    LoopResult,
)

from .orchestrator import AgentOrchestrator

__all__ = [
    "AgentOrchestrator",
    "AgentState",
    "TutorOutput",
    "EvaluatorOutput",
    "HintOutput",
    "VerificationOutput",
    "EventOutput",
    "HillClimbOutput",
    "StudentProfile",
    "DifficultyTier",
    "LoopType",
    "LoopResult",
]
