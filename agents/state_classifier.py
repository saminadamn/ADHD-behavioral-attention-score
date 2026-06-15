"""
agents/state_classifier.py
--------------------------
LangGraph node: AttentionStateClassifier  (Step 6)

Input  (from WorkflowState.features)
-----
topic_shift_score   float  0-1
engagement_score    float  0-1
latency_score       float  0-1
response_length     int    words

Output (written to WorkflowState)
------
attention_state     "Focused" | "Distracted" | "Impulsive"
confidence          float  0-1

Classification rules
--------------------
Priority order: Impulsive > Distracted > Focused (most distinctive first)

Impulsive:   very short response (< 6 words)          -> high confidence
             OR very low latency (< 0.12)              -> high confidence
             AND engagement < 0.45                     -> needed for short-but-relevant guard

Distracted:  topic_shift > 0.55
             OR (latency_score > 0.60 AND engagement < 0.55)

Focused:     default when neither above rule fires
             strengthened by high engagement + low topic shift

Confidence scoring
------------------
Each rule has a primary signal whose distance from its threshold
is converted to a confidence margin:
    confidence = base + margin * sensitivity
clamped to [0.40, 0.99].
"""

from __future__ import annotations

from models.state import FeatureScores, WorkflowState

# ---------------------------------------------------------------------------
# Thresholds (tunable)
# ---------------------------------------------------------------------------

_IMP_MAX_WORDS    = 6       # responses shorter than this → likely impulsive
_IMP_MAX_LATENCY  = 0.12    # normalised latency below this → impulsive reflex
_IMP_MAX_ENGAGE   = 0.45    # engagement guard (avoid tagging quick-but-correct)

_DIS_MIN_SHIFT    = 0.55    # topic_shift above this → distracted
_DIS_MIN_LATENCY  = 0.60    # slow + disengaged → distracted
_DIS_MAX_ENGAGE   = 0.55    # used with latency rule

_FOC_MIN_ENGAGE   = 0.60    # ideal engagement for full-confidence focused
_FOC_MAX_SHIFT    = 0.40    # ideal shift ceiling for full-confidence focused


# ---------------------------------------------------------------------------
# Internal rule evaluators
# ---------------------------------------------------------------------------

def _classify_impulsive(f: FeatureScores) -> tuple[bool, float]:
    """Returns (is_impulsive, confidence)."""
    short = f.response_length < _IMP_MAX_WORDS
    fast  = f.latency_score < _IMP_MAX_LATENCY
    low_e = f.engagement_score < _IMP_MAX_ENGAGE

    if not (short or fast):
        return False, 0.0

    if short and fast and low_e:
        # All three signals agree — strongest case
        margin = min(
            (_IMP_MAX_WORDS - f.response_length) / _IMP_MAX_WORDS,
            (_IMP_MAX_LATENCY - f.latency_score) / _IMP_MAX_LATENCY,
        )
        return True, round(min(0.99, 0.80 + 0.19 * margin), 3)

    if short and low_e:
        margin = (_IMP_MAX_WORDS - f.response_length) / _IMP_MAX_WORDS
        return True, round(min(0.99, 0.65 + 0.20 * margin), 3)

    if fast:
        margin = (_IMP_MAX_LATENCY - f.latency_score) / _IMP_MAX_LATENCY
        return True, round(min(0.99, 0.60 + 0.25 * margin), 3)

    return False, 0.0


def _classify_distracted(f: FeatureScores) -> tuple[bool, float]:
    """Returns (is_distracted, confidence)."""
    shift_trigger   = f.topic_shift_score > _DIS_MIN_SHIFT
    latency_trigger = f.latency_score > _DIS_MIN_LATENCY and f.engagement_score < _DIS_MAX_ENGAGE

    if not (shift_trigger or latency_trigger):
        return False, 0.0

    if shift_trigger and latency_trigger:
        shift_margin   = (f.topic_shift_score - _DIS_MIN_SHIFT) / (1.0 - _DIS_MIN_SHIFT)
        latency_margin = (f.latency_score - _DIS_MIN_LATENCY) / (1.0 - _DIS_MIN_LATENCY)
        conf = min(0.99, 0.75 + 0.12 * shift_margin + 0.12 * latency_margin)
        return True, round(conf, 3)

    if shift_trigger:
        margin = (f.topic_shift_score - _DIS_MIN_SHIFT) / (1.0 - _DIS_MIN_SHIFT)
        return True, round(min(0.99, 0.65 + 0.25 * margin), 3)

    # latency + disengagement only
    margin = (f.latency_score - _DIS_MIN_LATENCY) / (1.0 - _DIS_MIN_LATENCY)
    return True, round(min(0.99, 0.55 + 0.25 * margin), 3)


def _classify_focused(f: FeatureScores) -> tuple[bool, float]:
    """Default branch — always returns True with variable confidence."""
    engage_margin = max(0.0, (f.engagement_score - _FOC_MIN_ENGAGE) / (1.0 - _FOC_MIN_ENGAGE))
    shift_margin  = max(0.0, (_FOC_MAX_SHIFT - f.topic_shift_score) / _FOC_MAX_SHIFT)
    conf = min(0.99, 0.50 + 0.25 * engage_margin + 0.20 * shift_margin)
    return True, round(max(0.40, conf), 3)


# ---------------------------------------------------------------------------
# LangGraph node
# ---------------------------------------------------------------------------

def attention_state_classifier(state: WorkflowState) -> dict:
    """
    LangGraph node — AttentionStateClassifier.

    Reads  : state.features (FeatureScores)
    Writes : attention_state (str), confidence (float)
    """
    if state.features is None:
        return {"error": "AttentionStateClassifier: features not populated. Run signal_extractor first."}

    f = state.features

    # Priority: Impulsive → Distracted → Focused
    is_imp, conf_imp = _classify_impulsive(f)
    if is_imp:
        _log(f, "Impulsive", conf_imp)
        return {"attention_state": "Impulsive", "confidence": conf_imp}

    is_dis, conf_dis = _classify_distracted(f)
    if is_dis:
        _log(f, "Distracted", conf_dis)
        return {"attention_state": "Distracted", "confidence": conf_dis}

    _, conf_foc = _classify_focused(f)
    _log(f, "Focused", conf_foc)
    return {"attention_state": "Focused", "confidence": conf_foc}


# ---------------------------------------------------------------------------
# Debug logger
# ---------------------------------------------------------------------------

def _log(f: FeatureScores, label: str, confidence: float) -> None:
    print(
        f"[classifier] {label:<12} ({confidence:.0%} conf) | "
        f"words={f.response_length:>3}  shift={f.topic_shift_score:.3f}  "
        f"engage={f.engagement_score:.3f}  latency={f.latency_score:.3f}"
    )
