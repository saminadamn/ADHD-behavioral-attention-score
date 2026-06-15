"""
tests/test_reward_bas.py
------------------------
Step 8+9: Test RLRewardModeler and BASTracker independently.
Verifies the reward table and simulates three clinical trajectories.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from agents.reward_modeler import compute_reward
from agents.bas_tracker    import simulate_bas_trajectory, BAS_INITIAL

# ---------------------------------------------------------------------------
# Reward table validation
# ---------------------------------------------------------------------------

EXPECTED_REWARDS = {
    ("Focused",    "Focused"):    +10.0,
    ("Focused",    "Distracted"):  -6.0,
    ("Focused",    "Impulsive"):   -8.0,
    ("Distracted", "Focused"):     +8.0,
    ("Distracted", "Distracted"):  -4.0,
    ("Impulsive",  "Focused"):     +8.0,
    ("Impulsive",  "Impulsive"):   -5.0,
    (None,         "Focused"):     +5.0,
    (None,         "Distracted"):  -2.0,
    (None,         "Impulsive"):   -3.0,
}

# ---------------------------------------------------------------------------
# Clinical trajectory scenarios
# ---------------------------------------------------------------------------

SCENARIOS = {
    "Improving student (Impulsive -> Focused)": [
        "Impulsive", "Impulsive", "Distracted", "Focused",
        "Focused", "Focused", "Focused", "Focused",
    ],
    "Deteriorating student (Focused -> Distracted)": [
        "Focused", "Focused", "Distracted", "Distracted",
        "Impulsive", "Distracted", "Impulsive", "Impulsive",
    ],
    "Stable ADHD pattern": [
        "Distracted", "Impulsive", "Distracted", "Focused",
        "Impulsive", "Distracted", "Impulsive", "Focused",
    ],
}


def main() -> None:
    print("=" * 65)
    print("  RLRewardModeler + BASTracker — Step 8/9 Test")
    print("=" * 65)

    # --- Reward table ---
    print("\n--- Reward Table Validation ---")
    all_pass = True
    for (prev, curr), expected in EXPECTED_REWARDS.items():
        actual = compute_reward(prev, curr)
        ok     = actual == expected
        if not ok:
            all_pass = False
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}]  {str(prev):>12} -> {curr:<12}  expected={expected:+.1f}  got={actual:+.1f}")
    print(f"\n  {'All reward checks passed.' if all_pass else 'SOME CHECKS FAILED.'}")

    # --- BAS trajectory simulation ---
    print("\n--- BAS Trajectory Simulations ---")
    for name, sequence in SCENARIOS.items():
        result = simulate_bas_trajectory(sequence)
        print(f"\n  Scenario: {name}")
        print(f"    Sequence    : {' -> '.join(sequence)}")
        print(f"    BAS history : {[round(b, 1) for b in result['bas_history']]}")
        print(f"    Start BAS   : {BAS_INITIAL:.1f}")
        print(f"    Final BAS   : {result['final_bas']:.1f}  "
              f"(min={result['min_bas']:.1f}, max={result['max_bas']:.1f})")
        print(f"    Moving avg  : {result['moving_average']:.1f}")

    print("\n" + "=" * 65)


if __name__ == "__main__":
    main()
