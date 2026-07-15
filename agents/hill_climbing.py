"""
Hill Climbing Loop — adaptive difficulty optimization.

Continuously adjusts difficulty to keep the student in the
"zone of proximal development" — challenging but not frustrating.

Algorithm:
  current_score = f(difficulty)
  if score > best_score:
    best_score = score
    increase difficulty
  elif score < threshold:
    decrease difficulty
  else:
    stay (local maximum found)

Termination guards:
- MAX_HILL_CLIMB_ITERATIONS hard limit
- Convergence: |change| < HILL_CLIMB_CONVERGENCE_THRESHOLD
- Plateau detection: no improvement in 5 iterations
"""

from __future__ import annotations

import math
from typing import Dict, List, Optional

from .config import config
from .models import (
    AgentState,
    DifficultyTier,
    HillClimbOutput,
    LoopResult,
    LoopType,
    StudentProfile,
)


class HillClimbingLoop:
    """
    Hill climbing optimizer for adaptive difficulty selection.

    Uses a simple gradient-free approach:
    - Measure performance at current difficulty
    - Probe adjacent difficulty levels
    - Move in direction of improvement
    - Terminate on convergence or max iterations
    """

    def __init__(self):
        self.max_iterations = config.MAX_HILL_CLIMB_ITERATIONS
        self.learning_rate = config.HILL_CLIMB_LEARNING_RATE
        self.convergence_threshold = config.HILL_CLIMB_CONVERGENCE_THRESHOLD
        self._plateau_limit = 5

    def _difficulty_to_value(self, tier: DifficultyTier) -> float:
        mapping = {
            DifficultyTier.SIMPLE: 0.0,
            DifficultyTier.MEDIUM: 0.5,
            DifficultyTier.HARD: 1.0,
        }
        return mapping.get(tier, 0.5)

    def _value_to_difficulty(self, value: float) -> DifficultyTier:
        if value <= 0.33:
            return DifficultyTier.SIMPLE
        elif value <= 0.66:
            return DifficultyTier.MEDIUM
        else:
            return DifficultyTier.HARD

    def _estimate_performance(
        self, student: StudentProfile, difficulty: DifficultyTier
    ) -> float:
        if not student.mastery_scores:
            return 0.5

        scores = list(student.mastery_scores.values())
        avg_mastery = sum(scores) / len(scores) if scores else 0.5

        weak_ratio = len(student.weak_concepts) / max(
            len(student.mastery_scores), 1
        )
        strong_ratio = len(student.strong_concepts) / max(
            len(student.mastery_scores), 1
        )

        if difficulty == DifficultyTier.SIMPLE:
            return min(1.0, avg_mastery + 0.2 - weak_ratio * 0.1)
        elif difficulty == DifficultyTier.HARD:
            return max(0.0, avg_mastery - 0.2 + strong_ratio * 0.1)
        else:
            return avg_mastery

    async def optimize(
        self, student: StudentProfile
    ) -> LoopResult:
        iteration = 0
        best_score = 0.0
        best_difficulty = DifficultyTier.MEDIUM
        current_value = self._difficulty_to_value(
            student.preferred_mode
            if hasattr(student, "preferred_mode")
            else DifficultyTier.MEDIUM
        )
        plateau_count = 0
        previous_score = 0.0
        converged = False

        while iteration < self.max_iterations:
            iteration += 1
            current_difficulty = self._value_to_difficulty(current_value)
            current_score = self._estimate_performance(student, current_difficulty)

            if current_score > best_score:
                best_score = current_score
                best_difficulty = current_difficulty

            # Probe both directions
            probe_up = self._estimate_performance(
                student,
                self._value_to_difficulty(
                    min(1.0, current_value + self.learning_rate)
                ),
            )
            probe_down = self._estimate_performance(
                student,
                self._value_to_difficulty(
                    max(0.0, current_value - self.learning_rate)
                ),
            )

            if probe_up > current_score and probe_up >= probe_down:
                current_value = min(1.0, current_value + self.learning_rate)
            elif probe_down > current_score:
                current_value = max(0.0, current_value - self.learning_rate)
            else:
                plateau_count += 1

            # Convergence checks
            delta = abs(current_score - previous_score)
            if delta < self.convergence_threshold:
                if plateau_count >= self._plateau_limit:
                    converged = True
                    break

            previous_score = current_score

            if plateau_count >= self._plateau_limit * 2:
                converged = True
                break

        return LoopResult(
            loop_type=LoopType.HILL_CLIMBING,
            iterations_used=iteration,
            converged=converged,
            output=HillClimbOutput(
                iteration=iteration,
                current_score=current_score,
                best_score=best_score,
                converged=converged,
                recommended_difficulty=best_difficulty,
            ),
            terminated_early=iteration >= self.max_iterations,
        )


# ── LangGraph node function ──

async def hill_climb_node(state: AgentState) -> dict:
    """LangGraph node: runs the Hill Climbing Loop."""
    loop = HillClimbingLoop()
    try:
        student = state.student or StudentProfile(
            student_id=state.context.get("student_id", "anonymous")
            if state.context
            else "anonymous"
        )
        result = await loop.optimize(student)
        return {
            "hill_climb_output": result.output,
            "current_loop": LoopType.HILL_CLIMBING,
            "student": student,
            "should_continue": not result.converged
            and result.iterations_used < config.MAX_HILL_CLIMB_ITERATIONS,
        }
    except Exception as e:
        return {
            "hill_climb_output": HillClimbOutput(
                iteration=0,
                current_score=0.5,
                best_score=0.5,
                converged=True,
                recommended_difficulty=DifficultyTier.MEDIUM,
            ),
            "error": str(e),
            "should_continue": False,
        }



