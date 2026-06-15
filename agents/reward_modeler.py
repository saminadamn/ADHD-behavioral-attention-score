"""
agents/reward_modeler.py
------------------------
LangGraph node: RLRewardModeler  (Step 8)

Computes a scalar reward based on the transition between the previous
attention state and the current attention state.

Transition table
----------------
                      CURRENT
               Focused  Distracted  Impulsive
PREVIOUS
Focused          +10        -6         -8
Distracted        +8        -4          0
Impulsive         +8         0         -5
(None / start)    +5        -2         -3

Positive rewards reinforce movement toward Focused.
Negative rewards penalise persisting in or entering off-task states.

Writes
------
reward  float   (into WorkflowState.reward)
"""

from __future__ import annotations

from models.state import AttentionLabel, WorkflowState

# ---------------------------------------------------------------------------
# Reward matrix   [previous][current]
# ---------------------------------------------------------------------------

_REWARD: dict[str | None, dict[AttentionLabel, float]] = {
    "Focused": {
        "Focused":    +10.0,
        "Distracted":  -6.0,
        "Impulsive":   -8.0,
    },
    "Distracted": {
        "Focused":    +8.0,
        "Distracted": -4.0,
        "Impulsive":   0.0,
    },
    "Impulsive": {
        "Focused":    +8.0,
        "Distracted":  0.0,
        "Impulsive":  -5.0,
    },
    None: {         # first turn -- no previous state
        "Focused":    +5.0,
        "Distracted": -2.0,
        "Impulsive":  -3.0,
    },
}


# ---------------------------------------------------------------------------
# LangGraph node
# ---------------------------------------------------------------------------

def rl_reward_modeler(state: WorkflowState) -> dict:
    """
    LangGraph node -- RLRewardModeler (stateful).

    Reads  : state.attention_state          current turn label
             state.previous_attention_state  label from the prior turn (memory)
    Writes : reward (float)

    Transition-based reward: value depends on the (previous -> current) pair.
    On the very first turn previous_attention_state is None and the
    first-turn subtable is used.
    """
    current = state.attention_state
    if current is None:
        return {"error": "RLRewardModeler: attention_state not set. Run classifier first."}

    previous = state.previous_attention_state   # None on turn 1, set by memory_update after
    reward   = _REWARD.get(previous, _REWARD[None]).get(current, 0.0)

    _log(previous, current, reward)
    return {"reward": reward}


# ---------------------------------------------------------------------------
# Public helper -- used by bas_tracker and simulate_profiles
# ---------------------------------------------------------------------------

def compute_reward(previous: str | None, current: str) -> float:
    """Direct reward lookup without touching WorkflowState."""
    return _REWARD.get(previous, _REWARD[None]).get(current, 0.0)


# ---------------------------------------------------------------------------
# Debug logger
# ---------------------------------------------------------------------------

def _log(previous: str | None, current: str, reward: float) -> None:
    arrow  = f"{previous or 'START':>12} -> {current:<12}"
    sign   = "+" if reward >= 0 else ""
    print(f"[reward]  {arrow}  reward = {sign}{reward:.1f}")
