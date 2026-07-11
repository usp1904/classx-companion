---
name: historical-paper-tags
description: Directs metadata tagging for past 10 years of board papers and foundation exams to power automated diagnostics and targeted practice.
triggers: ["previous year question", "pyq", "board paper", "solved model exam", "question metadata"]
---
# Historical Paper Indexing & Remedial Diagnostics Engine

Every test question, past paper problem (CBSE, AP, TG State Boards), or foundation entry processed by the system must include a comprehensive diagnostic metadata block to track and support student progress.

## 1. System Metadata Schema Requirements
Every question object must be structured with these exact data attributes:
- **`source_exam_origin`**: Origin details (e.g., `CBSE_BOARD_2017`, `AP_STATE_BOARD_2022`, `TG_STATE_BOARD_2025`, `JEE_MAIN_FOUNDATION_2020`).
- **`academic_source_truth`**: Reference mapping (e.g., `NCERT_2026_27_CH4`, `RD_SHARMA_CH5_EX3`).
- **`cognitive_complexity_tier`**:
  - `TIER_1_BASIC`: Simple formula substitution directly matching core NCERT layouts.
  - `TIER_2_EXTENDED`: Multi-layered computational problems matching R.D. Sharma advanced sets.
  - `TIER_3_JEE_NEET_CHALLENGE`: Advanced, cross-concept questions that combine multiple chapters to test deep analytical skills.
- **`prerequisite_nodes`**: The fundamental, underlying concepts required to solve this problem, mapped all the way back to basic skills (e.g., `["MATH_CLASS6_FRACTIONS", "MATH_CLASS10_LINEAR_EQUATIONS"]`).

## 2. Companion Hint Architecture (The "Friend" Interface)
When a student struggles with a problem, do not just display a long, overwhelming solution. You must generate a highly targeted, encouraging hint that pinpoints the key conceptual step:

```text
> 💡 **Your Companion's Secret Hint**: 
> Hey! Don't let this massive equation intimidate you. Remember our **Class 6 playground see-saw analogy**? Whatever weight you add to the left side, you must add to the right side to keep it perfectly balanced. Try subtracting \(3x\) from both sides first and watch how beautifully it simplifies!
```

## 3. Automated Remedial Loop Execution
If a student incorrectly answers a question:
1. Parse the `prerequisite_nodes` list.
2. Determine if the error was due to a core concept gap (e.g., misunderstanding a physics law) or a foundational calculation error (e.g., an algebraic mistake).
3. Instantly provide a targeted remedial micro-lesson matching the identified gap to rebuild their confidence.
