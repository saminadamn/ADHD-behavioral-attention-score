"""
RLRewardModeler — LangGraph node.
Computes transition-based reward from (previous_attention_state -> current),
scaled by how confident the classifier was in `current`.
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

# attention_state_classifier never reports below this, so a confidence at
# exactly this floor should still carry a meaningful fraction of the reward
# rather than being scaled almost to zero.
_MIN_CLASSIFIER_CONFIDENCE = 0.5


def rl_reward_modeler(state) -> dict:
    current  = state.attention_state
    if current is None:
        return {"error": "RLRewardModeler: attention_state not set."}
    previous = state.previous_attention_state
    reward   = compute_reward(previous, current, state.confidence)
    logger.debug(
        f"Reward: {previous or 'START'} -> {current} "
        f"(confidence={state.confidence:.0%}) = {reward:+.1f}"
    )
    return {"reward": reward}


def compute_reward(previous: str | None, current: str, confidence: float = 1.0) -> float:
    """
    Base transition reward, scaled by classification confidence: a 51%-
    confidence call and a 100%-confidence call for the same transition no
    longer move BAS by the same amount. `confidence` defaults to 1.0 (full
    weight) for callers that don't have a real classifier confidence to pass
    -- e.g. simulate_bas_trajectory, which synthesizes a label sequence
    directly rather than classifying real turns. Clamped to
    [_MIN_CLASSIFIER_CONFIDENCE, 1.0] since attention_state_classifier never
    reports below that floor -- a transition at the classifier's own minimum
    confidence still carries half the reward rather than being scaled to
    near-zero.
    """
    base = _REWARD.get(previous, _REWARD[None]).get(current, 0.0)
    weight = max(_MIN_CLASSIFIER_CONFIDENCE, min(1.0, confidence))
    return round(base * weight, 4)
