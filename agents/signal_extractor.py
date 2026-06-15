"""
agents/signal_extractor.py
--------------------------
LangGraph node: BehavioralSignalExtractor

Reads teacher_prompt, student_response, response_latency from WorkflowState
and writes a populated FeatureScores object back into state.features.

Signals extracted
-----------------
1. response_length      number of words in the student response
2. sentiment            TextBlob polarity  (-1.0 negative → +1.0 positive)
3. topic_shift_score    1 - cosine_similarity(prompt_emb, response_emb)
                        via sentence-transformers  (0 = on-topic, 1 = full drift)
4. engagement_score     weighted blend of length bucket + semantic relevance
5. latency_score        min-max normalised latency clamped to [0, 1]
                        calibrated on the synthetic dataset range (0.5s – 25s)
"""

from __future__ import annotations

import math
from functools import lru_cache
from typing import TYPE_CHECKING

from textblob import TextBlob
from sentence_transformers import SentenceTransformer, util

from models.state import FeatureScores, WorkflowState

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Sentence-transformer model — small, fast, no GPU required
_MODEL_NAME = "all-MiniLM-L6-v2"

# Latency calibration bounds (seconds) derived from synthetic dataset:
#   Impulsive  0.5 – 3.0 s
#   Focused    3.0 – 12.0 s
#   Distracted 8.0 – 25.0 s
_LATENCY_MIN = 0.5
_LATENCY_MAX = 25.0

# Engagement weight split
_W_LENGTH      = 0.4   # share from response-length bucket
_W_RELEVANCE   = 0.6   # share from semantic relevance (1 - topic_shift)

# Word-count thresholds that map to a length bucket score
_LENGTH_BUCKETS = [
    (0,   5,   0.10),   # very short  → impulsive pattern
    (5,   20,  0.40),   # short       → partial engagement
    (20,  50,  0.70),   # medium      → reasonable engagement
    (50,  100, 0.90),   # long        → high engagement
    (100, math.inf, 1.0),  # very long → full engagement
]


# ---------------------------------------------------------------------------
# Model loader  (singleton — loaded once per process)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    print("[signal_extractor] Loading sentence-transformer model (first call only)...")
    return SentenceTransformer(_MODEL_NAME)


# ---------------------------------------------------------------------------
# Individual extractors
# ---------------------------------------------------------------------------

def _response_length(response: str) -> int:
    """Word count of the student response."""
    return len(response.split())


def _sentiment(response: str) -> float:
    """
    TextBlob polarity score.
    Returns float in [-1.0, 1.0]:
        -1.0  strongly negative
         0.0  neutral
        +1.0  strongly positive
    """
    return round(TextBlob(response).sentiment.polarity, 4)


def _topic_shift_score(prompt: str, response: str) -> float:
    """
    Semantic distance between the teacher prompt and student response.
    Uses cosine similarity of sentence embeddings:
        topic_shift = 1 - cosine_similarity
    Range [0.0, 1.0]:
        0.0  response is semantically identical to prompt (fully on-topic)
        1.0  response is completely unrelated (full topic drift)
    """
    model = _get_model()
    emb_prompt   = model.encode(prompt,   convert_to_tensor=True)
    emb_response = model.encode(response, convert_to_tensor=True)
    cosine_sim   = float(util.cos_sim(emb_prompt, emb_response)[0][0])
    # Clamp to [0, 1] before inverting (cosine can be slightly < 0)
    cosine_sim   = max(0.0, min(1.0, cosine_sim))
    return round(1.0 - cosine_sim, 4)


def _length_bucket_score(word_count: int) -> float:
    """Map word count to a [0, 1] engagement proxy via defined buckets."""
    for low, high, score in _LENGTH_BUCKETS:
        if low <= word_count < high:
            return score
    return 1.0


def _engagement_score(word_count: int, topic_shift: float) -> float:
    """
    Weighted blend of:
      - length_bucket_score  (proxy for response depth)
      - semantic relevance   (1 - topic_shift_score)
    Range [0.0, 1.0].
    """
    length_score    = _length_bucket_score(word_count)
    relevance_score = 1.0 - topic_shift
    score = _W_LENGTH * length_score + _W_RELEVANCE * relevance_score
    return round(min(1.0, max(0.0, score)), 4)


def _latency_score(latency_seconds: float) -> float:
    """
    Min-max normalise latency into [0.0, 1.0].

    Interpretation:
        ~0.0  very fast / impulsive
        ~0.5  deliberate / focused range
        ~1.0  very slow / distracted or disengaged

    Calibrated to the ADHD-BAS synthetic dataset bounds:
        minimum  0.5 s  (fastest impulsive response)
        maximum 25.0 s  (slowest distracted response)
    """
    clamped = max(_LATENCY_MIN, min(_LATENCY_MAX, latency_seconds))
    normalised = (clamped - _LATENCY_MIN) / (_LATENCY_MAX - _LATENCY_MIN)
    return round(normalised, 4)


# ---------------------------------------------------------------------------
# LangGraph node
# ---------------------------------------------------------------------------

def behavioral_signal_extractor(state: WorkflowState) -> dict:
    """
    LangGraph node — BehavioralSignalExtractor.

    Reads
    -----
    state.teacher_prompt       str
    state.student_response     str
    state.response_latency     float (seconds)

    Writes (partial dict update)
    ----------------------------
    features : FeatureScores
    """
    prompt   = state.teacher_prompt
    response = state.student_response
    latency  = state.response_latency

    if not prompt or not response:
        return {
            "error": (
                "BehavioralSignalExtractor requires non-empty "
                "teacher_prompt and student_response."
            )
        }

    # --- Extract each signal -------------------------------------------
    word_count   = _response_length(response)
    sentiment    = _sentiment(response)
    topic_shift  = _topic_shift_score(prompt, response)
    engagement   = _engagement_score(word_count, topic_shift)
    lat_score    = _latency_score(latency)

    features = FeatureScores(
        response_length    = word_count,
        sentiment          = sentiment,
        topic_shift_score  = topic_shift,
        engagement_score   = engagement,
        latency_score      = lat_score,
    )

    _log_extraction(prompt, response, latency, features)

    return {"features": features}


# ---------------------------------------------------------------------------
# Debug helper
# ---------------------------------------------------------------------------

def _log_extraction(
    prompt: str,
    response: str,
    latency: float,
    features: FeatureScores,
) -> None:
    bar_width = 20

    def bar(value: float, lo: float = 0.0, hi: float = 1.0) -> str:
        pct   = (value - lo) / (hi - lo) if hi != lo else 0.0
        filled = round(pct * bar_width)
        return "[" + "#" * filled + "-" * (bar_width - filled) + f"] {value:+.3f}"

    print("\n[signal_extractor] -------- BehavioralSignalExtractor --------")
    print(f"  Prompt   : {prompt[:80]}{'...' if len(prompt) > 80 else ''}")
    print(f"  Response : {response[:80]}{'...' if len(response) > 80 else ''}")
    print(f"  Latency  : {latency:.2f} s")
    print(f"  ----")
    print(f"  response_length   : {features.response_length} words")
    print(f"  sentiment         : {bar(features.sentiment, -1.0, 1.0)}")
    print(f"  topic_shift_score : {bar(features.topic_shift_score)}")
    print(f"  engagement_score  : {bar(features.engagement_score)}")
    print(f"  latency_score     : {bar(features.latency_score)}")
    print("[signal_extractor] -----------------------------------------------\n")
