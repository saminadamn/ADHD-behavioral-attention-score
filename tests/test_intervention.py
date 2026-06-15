"""
tests/test_intervention.py
--------------------------
Full coverage test for InterventionGenerator:
  - All 4 tiers x 3 states + None = 16 combinations
  - Boundary conditions at BAS 25, 50, 75
  - LangGraph node via WorkflowState
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models.state import WorkflowState
from agents.intervention_generator import (
    get_intervention,
    get_tier,
    intervention_generator,
)

CASES = [
    # (bas,   state,         expected_tier)
    (90.0,  "Focused",     "SUSTAIN"),
    (90.0,  "Distracted",  "SUSTAIN"),
    (90.0,  "Impulsive",   "SUSTAIN"),
    (90.0,  None,          "SUSTAIN"),
    (60.0,  "Focused",     "ENCOURAGE"),
    (60.0,  "Distracted",  "ENCOURAGE"),
    (60.0,  "Impulsive",   "ENCOURAGE"),
    (60.0,  None,          "ENCOURAGE"),
    (38.0,  "Focused",     "SIMPLIFY"),
    (38.0,  "Distracted",  "SIMPLIFY"),
    (38.0,  "Impulsive",   "SIMPLIFY"),
    (38.0,  None,          "SIMPLIFY"),
    (15.0,  "Focused",     "BREAK"),
    (15.0,  "Distracted",  "BREAK"),
    (15.0,  "Impulsive",   "BREAK"),
    (15.0,  None,          "BREAK"),
    # Boundaries
    (25.0,  None,          "BREAK"),     # exactly 25 -> BREAK
    (25.1,  None,          "SIMPLIFY"),  # just above -> SIMPLIFY
    (50.0,  None,          "SIMPLIFY"),  # exactly 50 -> SIMPLIFY
    (50.1,  None,          "ENCOURAGE"), # just above -> ENCOURAGE
    (75.0,  None,          "ENCOURAGE"), # exactly 75 -> ENCOURAGE
    (75.1,  None,          "SUSTAIN"),   # just above -> SUSTAIN
    (0.0,   "Impulsive",   "BREAK"),     # floor
    (100.0, "Focused",     "SUSTAIN"),   # ceiling
]

SPOT_CHECKS = [
    (85.0,  "Focused"),
    (62.0,  "Distracted"),
    (40.0,  "Impulsive"),
    (10.0,  "Distracted"),
    (55.0,  None),
]


def test_tier_boundaries() -> bool:
    print("--- Tier & State Coverage ---")
    all_pass = True
    for bas, state, expected in CASES:
        actual = get_tier(bas)
        ok     = actual == expected
        if not ok:
            all_pass = False
        tag   = "PASS" if ok else "FAIL"
        label = (state or "None")[:10]
        print(f"  [{tag}]  BAS={bas:6.1f}  state={label:<12}  "
              f"tier={actual:<10}  (expected {expected})")
    return all_pass


def test_outputs_non_empty() -> bool:
    print("\n--- Output Completeness ---")
    all_pass = True
    for tier_bas in [90.0, 60.0, 38.0, 15.0]:
        for state in ("Focused", "Distracted", "Impulsive", None):
            result = get_intervention(tier_bas, state)
            has_iv = bool(result.get("intervention", "").strip())
            has_rt = bool(result.get("rationale", "").strip())
            ok     = has_iv and has_rt
            if not ok:
                all_pass = False
            label = (state or "None")[:10]
            print(f"  [{'PASS' if ok else 'FAIL'}]  BAS={tier_bas}  state={label:<12}  "
                  f"intervention={'OK' if has_iv else 'EMPTY'}  rationale={'OK' if has_rt else 'EMPTY'}")
    return all_pass


def test_langgraph_node() -> bool:
    print("\n--- LangGraph Node (WorkflowState) ---")
    all_pass = True
    for bas, state in [(88.0, "Focused"), (45.0, "Distracted"), (20.0, "Impulsive")]:
        ws     = WorkflowState(current_bas=bas, attention_state=state)
        result = intervention_generator(ws)
        ok     = "intervention" in result and "rationale" in result
        if not ok:
            all_pass = False
        tag    = "PASS" if ok else "FAIL"
        tier   = get_tier(bas)
        print(f"  [{tag}]  BAS={bas}  state={state:<12}  tier={tier}")
    return all_pass


def print_sample_outputs() -> None:
    print("\n--- Sample Outputs (spot checks) ---")
    for bas, state in SPOT_CHECKS:
        result = get_intervention(bas, state)
        tier   = get_tier(bas)
        iv_preview = result["intervention"][:100].replace("\n", " ")
        rt_preview = result["rationale"][:100].replace("\n", " ")
        print(f"\n  BAS={bas:<6}  state={str(state):<12}  tier={tier}")
        print(f"  Intervention : {iv_preview}...")
        print(f"  Rationale    : {rt_preview}...")


def main() -> None:
    print("=" * 70)
    print("  InterventionGenerator — Test Suite")
    print("=" * 70)

    p1 = test_tier_boundaries()
    p2 = test_outputs_non_empty()
    p3 = test_langgraph_node()
    print_sample_outputs()

    passed = sum([p1, p2, p3])
    print(f"\n{'=' * 70}")
    print(f"  Results: {passed}/3 test groups passed.")
    print(f"  {'All tests passed.' if passed == 3 else 'SOME TESTS FAILED.'}")
    print("=" * 70)


if __name__ == "__main__":
    main()
