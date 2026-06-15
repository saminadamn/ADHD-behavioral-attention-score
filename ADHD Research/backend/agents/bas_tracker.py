"""
BASTracker — LangGraph node.
Updates the Behavioural Activation Score using the reward signal.
"""
from __future__ import annotations
import logging
import statistics

logger = logging.getLogger(__name__)

BAS_INITIAL = 50.0
BAS_MIN     = 0.0
BAS_MAX     = 100.0
MA_WINDOW   = 5


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def bas_tracker(state) -> dict:
    reward      = state.reward
    current_bas = state.current_bas
    new_bas     = _clamp(current_bas + reward, BAS_MIN, BAS_MAX)
    history     = list(state.bas_history) + [new_bas]
    logger.debug(f"BAS: {current_bas:.1f} + {reward:+.1f} = {new_bas:.1f}")
    return {"current_bas": new_bas, "bas_history": history}


def memory_update(state) -> dict:
    return {
        "previous_attention_state": state.attention_state,
        "previous_reward":          state.reward,
        "previous_bas":             state.current_bas,
    }


def simulate_bas_trajectory(sequence: list[str]) -> dict:
    """Simulate a BAS trajectory from an attention-state sequence."""
    import numpy as np
    from agents.reward_modeler import compute_reward

    bas, history, rewards = BAS_INITIAL, [], []
    prev = None
    for label in sequence:
        reward = compute_reward(prev, label)
        bas    = float(np.clip(bas + reward, BAS_MIN, BAS_MAX))
        history.append(bas)
        rewards.append(reward)
        prev = label

    return {
        "bas_history": history,
        "rewards":     rewards,
        "final_bas":   history[-1] if history else BAS_INITIAL,
        "mean_bas":    float(np.mean(history)) if history else BAS_INITIAL,
        "min_bas":     float(np.min(history))  if history else BAS_INITIAL,
        "max_bas":     float(np.max(history))  if history else BAS_INITIAL,
        "iiv":         float(np.std(rewards))  if rewards else 0.0,
        "n_focused":    sequence.count("Focused"),
        "n_distracted": sequence.count("Distracted"),
        "n_impulsive":  sequence.count("Impulsive"),
    }
