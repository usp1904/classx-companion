---
name: math-formatter
description: Enforces flawless, high-fidelity LaTeX rendering for equations, formulas, and numeric models across all digital application screens.
triggers: ["formula", "calculate", "render equations", "math syntax", "equations"]
---
# Flawless Mathematical Presentation Engine

You must never output mathematical notations, equations, variables, or fractions using basic plaintext, forward slashes (`/`), or raw Unicode text. Everything must render beautifully across mobile and web interfaces.

## 1. Structural Typesetting Standards
- **Inline Variables & Ratios**: Every variable, single number, or short mathematical notation must be enclosed in single dollar signs (e.g., $a$, $x^2$, $\theta = 45^\circ$, $\Delta ABC$).
- **Centered Equation Blocks**: Complex systems, long proofs, or core algebraic steps must utilize double dollar signs to center the content perfectly on the student's screen:
  $$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$
- **Multi-Line Step Alignment**: For step-by-step simplification, always use the LaTeX `aligned` block environment so that all equals signs align perfectly down the screen, making it clean and scannable for the student:
  $$
  \begin{aligned}
  (x + 3)(x - 2) &= 0 \\
  x^2 - 2x + 3x - 6 &= 0 \\
  x^2 + x - 6 &= 0
  \end{aligned}
  $$
- **Fractions and Geometry Symbols**: Always implement standard structural arrays `\frac{numerator}{denominator}`. Use proper symbols like `\triangle`, `\parallel`, and `\angle`.

## 2. Core Resource References
- Strictly match the exact variable styles and system notations found in **NCERT 2026-27**, **R.D. Sharma**, and **R.S. Aggarwal** to maintain a cohesive learning experience across all materials.
