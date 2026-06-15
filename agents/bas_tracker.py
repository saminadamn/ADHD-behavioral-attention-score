"""
agents/bas_tracker.py
---------------------
LangGraph node: BASTracker  (Step 9)

Maintains a running Behavioural Activation System (BAS) score across
conversational turns. The score reflects the cumulative reward signal
from the RL reward modeler.

Mechanics
---------
  initial BAS   = 50.0   (mid-point of 0–100 range)
  update rule   : BAS_new = clamp(BAS_old + reward, 0, 100)
  moving average: window of last N turns (default 5)

Writes (into WorkflowState)
------
  current_bas    float        updated BAS score
  bas_history    list[float]  appended score for this turn
  reward         float        passed through unchanged
"""

from __future__ import annotations

import statistics

from agents.reward_modeler import compute_reward
from models.state import WorkflowState

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BAS_INITIAL  = 50.0
BAS_MIN      =  0.0
BAS_MAX      = 100.0
MA_WINDOW    =  5       # moving-average window (turns)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _moving_average(history: list[float], window: int) -> float:
    if not history:
        return BAS_INITIAL
    tail = history[-window:]
    return round(statistics.mean(tail), 3)


# ---------------------------------------------------------------------------
# LangGraph node
# ---------------------------------------------------------------------------

def bas_tracker(state: WorkflowState) -> dict:
    """
    LangGraph node — BASTracker.

    Reads  : state.reward, state.current_bas, state.bas_history,
              state.attention_state
    Writes : current_bas, bas_history
    """
    reward       = state.reward
    previous_bas = state.current_bas if state.bas_history else BAS_INITIAL
    new_bas      = _clamp(previous_bas + reward, BAS_MIN, BAS_MAX)
    new_history  = state.bas_history + [new_bas]
    moving_avg   = _moving_average(new_history, MA_WINDOW)

    _log(state, previous_bas, new_bas, moving_avg, new_history)

    return {
        "current_bas":  round(new_bas, 3),
        "bas_history":  new_history,
    }


# ---------------------------------------------------------------------------
# Standalone multi-turn simulation (used by tests)
# ---------------------------------------------------------------------------

def simulate_bas_trajectory(
    attention_sequence: list[str],
) -> dict:
    """
    Simulate BAS across an ordered list of attention labels.
    Returns a summary dict with history, final BAS, and moving average.
    """
    bas      = BAS_INITIAL
    history  = []
    previous = None

    for label in attention_sequence:
        reward  = compute_reward(previous, label)
        bas     = _clamp(bas + reward, BAS_MIN, BAS_MAX)
        history.append(bas)
        previous = label

    return {
        "final_bas":      round(bas, 3),
        "bas_history":    history,
        "moving_average": _moving_average(history, MA_WINDOW),
        "min_bas":        round(min(history), 3),
        "max_bas":        round(max(history), 3),
    }


# ---------------------------------------------------------------------------
# Debug logger
# ---------------------------------------------------------------------------

def _log(
    state: WorkflowState,
    prev_bas: float,
    new_bas: float,
    ma: float,
    history: list[float],
) -> None:
    delta = new_bas - prev_bas
    sign  = "+" if delta >= 0 else ""
    bar_width = 30
    filled = round((new_bas / BAS_MAX) * bar_width)
    bar    = "[" + "#" * filled + "-" * (bar_width - filled) + "]"

    print(
        f"[bas_tracker]  turn={len(history):>3}  "
        f"label={state.attention_state or '?':<12}  "
        f"reward={sign}{state.reward:.1f}  "
        f"BAS: {prev_bas:.1f} -> {new_bas:.1f} ({sign}{delta:.1f})  "
        f"MA-{MA_WINDOW}={ma:.1f}  {bar}"
    )
