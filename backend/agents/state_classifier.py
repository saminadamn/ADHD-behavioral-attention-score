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
_IMP_REPEAT   = 0.5     # repetition_score at/above this is itself impulsive, regardless of engagement
_IMP_INCOMPLETE = 0.3   # completeness_score at/below this is itself impulsive (trails off / blurted)
_DIST_SHIFT   = 0.55
_DIST_LATENCY = 0.60
_DIST_ENGAGE  = 0.55


def attention_state_classifier(state) -> dict:
    f = state.features
    if f is None:
        return {"error": "AttentionStateClassifier: features not set. Run extractor first."}

    words        = f.response_length
    shift        = f.topic_shift_score
    engage       = f.engagement_score
    latency      = f.latency_score
    repetition   = f.repetition_score
    completeness = f.completeness_score

    # Repetition (garbled/blurted text) and incompleteness (trails off mid-
    # thought) are direct impulsivity signals on their own -- a short,
    # low-latency response that *also* happens to score as "engaged" on the
    # length/topic-shift blend is still impulsive if it's repetitive or
    # incomplete, which engagement_score alone can't see.
    is_impulsive_signal = (
        (words < _IMP_WORDS or latency < _IMP_LATENCY) and engage < _IMP_ENGAGE
    ) or repetition >= _IMP_REPEAT or completeness <= _IMP_INCOMPLETE

    if is_impulsive_signal:
        severity = max(
            1.0 - (engage / _IMP_ENGAGE) if engage < _IMP_ENGAGE else 0.0,
            repetition,
            1.0 - completeness,
        )
        conf  = round(min(1.0, max(0.5, severity)), 4)
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
