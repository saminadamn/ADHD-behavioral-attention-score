"""
BehavioralSignalExtractor — LangGraph node.
Extracts five behavioural features from a teacher-student interaction turn.
"""
from __future__ import annotations
import logging
import statistics
from functools import lru_cache

logger = logging.getLogger(__name__)

_MIN_LATENCY = 0.5
_MAX_LATENCY = 25.0


@lru_cache(maxsize=1)
def _load_model():
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformer model...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Model loaded.")
        return model
    except Exception as e:
        logger.warning(f"Could not load sentence-transformer: {e}. Using fallback similarity.")
        return None


def _cosine_sim(a, b) -> float:
    import numpy as np
    a, b = np.array(a), np.array(b)
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    return float(np.dot(a, b) / denom) if denom > 0 else 0.0


def _word_overlap_similarity(text_a: str, text_b: str) -> float:
    """Fallback similarity when sentence-transformer is unavailable."""
    words_a = set(text_a.lower().split())
    words_b = set(text_b.lower().split())
    if not words_a or not words_b:
        return 0.0
    return len(words_a & words_b) / max(len(words_a), len(words_b))


def _topic_shift(prompt: str, response: str) -> float:
    model = _load_model()
    if model is not None:
        embs = model.encode([prompt, response])
        sim = _cosine_sim(embs[0], embs[1])
    else:
        sim = _word_overlap_similarity(prompt, response)
    return float(max(0.0, min(1.0, 1.0 - sim)))


def _sentiment(text: str) -> float:
    try:
        from textblob import TextBlob
        return float(TextBlob(text).sentiment.polarity)
    except Exception:
        return 0.0


def _length_bucket(n_words: int) -> float:
    if n_words <= 3:
        return 0.1
    if n_words <= 8:
        return 0.35
    if n_words <= 20:
        return 0.65
    if n_words <= 50:
        return 0.85
    return 1.0


def behavioral_signal_extractor(state) -> dict:
    from models.state import FeatureScores
    prompt   = state.teacher_prompt
    response = state.student_response
    latency  = state.response_latency

    words          = len(response.split())
    sentiment      = _sentiment(response)
    topic_shift    = _topic_shift(prompt, response)
    engagement     = 0.4 * _length_bucket(words) + 0.6 * (1.0 - topic_shift)
    engagement     = round(max(0.0, min(1.0, engagement)), 4)
    latency_norm   = (latency - _MIN_LATENCY) / (_MAX_LATENCY - _MIN_LATENCY)
    latency_score  = round(max(0.0, min(1.0, latency_norm)), 4)

    return {"features": FeatureScores(
        response_length   = words,
        sentiment         = round(sentiment, 4),
        topic_shift_score = round(topic_shift, 4),
        engagement_score  = engagement,
        latency_score     = latency_score,
    )}
