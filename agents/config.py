"""
Agent system configuration.

All values can be overridden via environment variables (AGENT_*).
Keeps the agent layer decoupled from infra details.
"""

import os


def _bool(key: str, default: bool) -> bool:
    v = os.environ.get(key, "")
    if v.lower() in ("1", "true", "yes", "on"):
        return True
    if v.lower() in ("0", "false", "no", "off"):
        return False
    return default


def _int(key: str, default: int) -> int:
    try:
        return int(os.environ.get(key, str(default)))
    except (ValueError, TypeError):
        return default


class AgentConfig:
    # ── Loop bounds (prevents indefinite loops) ──
    MAX_AGENT_LOOP_ITERATIONS: int = _int("AGENT_MAX_AGENT_LOOP_ITERATIONS", 5)
    MAX_VERIFICATION_LOOP_ITERATIONS: int = _int("AGENT_MAX_VERIFICATION_LOOP_ITERATIONS", 3)
    MAX_EVENT_LOOP_ITERATIONS: int = _int("AGENT_MAX_EVENT_LOOP_ITERATIONS", 10)
    MAX_HILL_CLIMB_ITERATIONS: int = _int("AGENT_MAX_HILL_CLIMB_ITERATIONS", 20)

    # ── Doom loop detection ──
    DOOM_LOOP_MAX_REPETITIONS: int = _int("DOOM_LOOP_MAX_REPETITIONS", 3)

    # ── Hill climbing ──
    HILL_CLIMB_LEARNING_RATE: float = float(
        os.environ.get("AGENT_HILL_CLIMB_LEARNING_RATE", "0.1")
    )
    HILL_CLIMB_CONVERGENCE_THRESHOLD: float = float(
        os.environ.get("AGENT_HILL_CLIMB_CONVERGENCE_THRESHOLD", "0.001")
    )

    # ── Tutor agent ──
    TUTOR_MODEL: str = os.environ.get("AGENT_TUTOR_MODEL", "stub")
    TUTOR_TEMPERATURE: float = float(
        os.environ.get("AGENT_TUTOR_TEMPERATURE", "0.7")
    )

    # ── Evaluator agent ──
    EVALUATOR_MODEL: str = os.environ.get("AGENT_EVALUATOR_MODEL", "stub")
    EVALUATOR_TEMPERATURE: float = float(
        os.environ.get("AGENT_EVALUATOR_TEMPERATURE", "0.3")
    )

    # ── Hint agent ──
    HINT_MODEL: str = os.environ.get("AGENT_HINT_MODEL", "stub")
    HINT_TEMPERATURE: float = float(
        os.environ.get("AGENT_HINT_TEMPERATURE", "0.5")
    )

    # ── Verification agent ──
    VERIFICATION_MODEL: str = os.environ.get("AGENT_VERIFICATION_MODEL", "stub")
    VERIFICATION_TEMPERATURE: float = float(
        os.environ.get("AGENT_VERIFICATION_TEMPERATURE", "0.2")
    )

    # ── Content paths ──
    SYLLABUS_PATH: str = os.environ.get(
        "AGENT_SYLLABUS_PATH", "data/syllabus.json"
    )
    SYLLABUS_RAG_TREE_PATH: str = os.environ.get(
        "AGENT_SYLLABUS_RAG_TREE_PATH", "data/syllabus-rag-tree.json"
    )

    # ── API endpoints (Node.js backend) ──
    BACKEND_API_URL: str = os.environ.get(
        "BACKEND_API_URL", "http://localhost:3000/api"
    )


config = AgentConfig()
