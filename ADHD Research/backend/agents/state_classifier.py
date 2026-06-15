"""
AttentionStateClassifier — LangGraph node.
Rule-based classifier: Impulsive > Distracted > Focused (priority order).
"""
from __future__ import annotations
import logging

logger = logging.getLogger(__name__)

_IMP_WORDS    = 6
_IMP_LATENCY  = 0.12
_IMP_ENGAGE   = 0.45
_DIST_SHIFT   = 0.55
_DIST_LATENCY = 0.60
_DIST_ENGAGE  = 0.55


def attention_state_classifier(state) -> dict:
    f = state.features
    if f is None:
        return {"error": "AttentionStateClassifier: features not set. Run extractor first."}

    words    = f.response_length
    shift    = f.topic_shift_score
    engage   = f.engagement_score
    latency  = f.latency_score

    if (words < _IMP_WORDS or latency < _IMP_LATENCY) and engage < _IMP_ENGAGE:
        conf  = round(1.0 - (engage / _IMP_ENGAGE), 4)
        label = "Impulsive"
    elif shift > _DIST_SHIFT or (latency > _DIST_LATENCY and engage < _DIST_ENGAGE):
        margin = max(shift - _DIST_SHIFT, latency - _DIST_LATENCY)
        conf   = round(min(1.0, 0.5 + margin * 1.5), 4)
        label  = "Distracted"
    else:
        focus_margin = max(0.0, engage - (1 - shift) * 0.5)
        conf  = round(min(1.0, 0.5 + focus_margin), 4)
        label = "Focused"

    logger.debug(f"Classified: {label} ({conf:.0%})")
    return {"attention_state": label, "confidence": conf}
