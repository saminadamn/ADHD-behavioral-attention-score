"""
RLRewardModeler — LangGraph node.
Computes transition-based reward from (previous_attention_state -> current).
"""
from __future__ import annotations
import logging

logger = logging.getLogger(__name__)

_REWARD: dict[str | None, dict[str, float]] = {
    "Focused":    {"Focused": +10.0, "Distracted": -6.0, "Impulsive": -8.0},
    "Distracted": {"Focused": +8.0,  "Distracted": -4.0, "Impulsive":  0.0},
    "Impulsive":  {"Focused": +8.0,  "Distracted":  0.0, "Impulsive": -5.0},
    None:         {"Focused": +5.0,  "Distracted": -2.0, "Impulsive": -3.0},
}


def rl_reward_modeler(state) -> dict:
    current  = state.attention_state
    if current is None:
        return {"error": "RLRewardModeler: attention_state not set."}
    previous = state.previous_attention_state
    reward   = _REWARD.get(previous, _REWARD[None]).get(current, 0.0)
    logger.debug(f"Reward: {previous or 'START'} -> {current} = {reward:+.1f}")
    return {"reward": reward}


def compute_reward(previous: str | None, current: str) -> float:
    return _REWARD.get(previous, _REWARD[None]).get(current, 0.0)
