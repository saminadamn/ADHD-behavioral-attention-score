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


def _repetition_score(text: str) -> float:
    """
    Proxy for garbled/blurted-out text: repeated whole words, or a word
    containing a repeated sub-string inside itself (e.g. "canwegonowcanwegonow").
    0.0 = no detectable repetition, 1.0 = heavily repetitive.
    """
    words = text.lower().split()
    if len(words) < 2:
        word_repeat = 0.0
    else:
        word_repeat = 1.0 - (len(set(words)) / len(words))

    intra_word_repeat = 0.0
    for w in words:
        n = len(w)
        if n < 8:
            continue
        half = n // 2
        if w[:half] == w[half:half * 2]:
            intra_word_repeat = 1.0
            break

    return round(max(word_repeat, intra_word_repeat), 4)


def _completeness_score(text: str) -> float:
    """
    Proxy for a response that trails off mid-thought rather than one that is
    just naturally short: ends on sentence-final punctuation (or a complete
    short exclamation), penalized for ending mid-word, on a conjunction/
    article, or with no terminal punctuation on a longer response.
    1.0 = reads as complete, 0.0 = clearly trails off.
    """
    stripped = text.strip()
    if not stripped:
        return 0.0

    words = stripped.split()
    ends_with_punct = stripped[-1] in ".!?"
    _TRAILING_OFF_WORDS = {
        "is", "was", "are", "were", "the", "a", "an", "and", "but", "or",
        "because", "so", "to", "of", "that", "my", "i",
    }
    trails_on_filler = words[-1].lower().strip(".,!?") in _TRAILING_OFF_WORDS

    if ends_with_punct and not trails_on_filler:
        return 1.0
    if len(words) <= 2 and not trails_on_filler:
        # Short but plausibly a complete one-word/two-word answer ("Yes.", "42").
        return 0.8
    if trails_on_filler:
        return 0.1
    return 0.5


_READING_SECONDS_PER_WORD = 0.25  # ~240 words/minute silent reading
_BASE_THINKING_SECONDS    = 0.5   # minimum processing time even for trivial recall ("6 x 7?")
_PER_CLAUSE_SECONDS       = 0.6   # extra thinking time per comma / "and" / semicolon -- complexity
                                   # matters far more than base time, so a simple short question
                                   # answered instantly isn't flagged just for being answered fast
_PREMATURITY_RATIO_FLOOR  = 0.6   # latency at/above this fraction of expected time is not premature


def _expected_response_time(prompt: str) -> float:
    """
    Rough baseline for how long a question this long and this clausally
    complex plausibly takes to read and think about, in seconds. Not a
    precision estimate -- just enough to tell "fast because the question
    was simple" apart from "fast given how much the question actually asked."
    """
    words = len(prompt.split())
    reading_time = words * _READING_SECONDS_PER_WORD
    clause_markers = prompt.count(",") + prompt.count(";") + prompt.count(" and ")
    thinking_time = _BASE_THINKING_SECONDS + _PER_CLAUSE_SECONDS * clause_markers
    return reading_time + thinking_time


def _prematurity_score(prompt: str, latency: float) -> float:
    """
    How much faster the response came back than the question's own length
    and complexity make plausible. 0.0 = at or above a normal pace for a
    question this size, 1.0 = answered in essentially zero time relative to
    what the question demanded (the "answered before the question was
    finished" pattern -- distinct from repetition_score/completeness_score,
    since this response can be perfectly coherent and still be premature).
    """
    expected = _expected_response_time(prompt)
    if expected <= 0:
        return 0.0
    ratio = latency / expected
    if ratio >= _PREMATURITY_RATIO_FLOOR:
        return 0.0
    return round(max(0.0, min(1.0, (_PREMATURITY_RATIO_FLOOR - ratio) / _PREMATURITY_RATIO_FLOOR)), 4)


def behavioral_signal_extractor(state) -> dict:
    from models.state import FeatureScores
    prompt   = state.teacher_prompt
    response = state.student_response
    latency  = state.response_latency

    words              = len(response.split())
    sentiment          = _sentiment(response)
    topic_shift        = _topic_shift(prompt, response)
    repetition         = _repetition_score(response)
    completeness       = _completeness_score(response)
    prematurity        = _prematurity_score(prompt, latency)

    # Repetition and incompleteness both drag engagement down directly --
    # a fast, on-topic-looking response that is garbled or trails off is not
    # actually engaged, which the length/topic-shift blend alone can't see.
    # prematurity is deliberately NOT blended in here: a premature response
    # can otherwise be perfectly coherent (see docs/model_limitations.md), so
    # it's surfaced as its own signal for the classifier rather than folded
    # into a "how good is this response" score.
    engagement = (
        0.3 * _length_bucket(words)
        + 0.4 * (1.0 - topic_shift)
        + 0.15 * completeness
        + 0.15 * (1.0 - repetition)
    )
    engagement     = round(max(0.0, min(1.0, engagement)), 4)
    latency_norm   = (latency - _MIN_LATENCY) / (_MAX_LATENCY - _MIN_LATENCY)
    latency_score  = round(max(0.0, min(1.0, latency_norm)), 4)

    return {"features": FeatureScores(
        response_length    = words,
        sentiment          = round(sentiment, 4),
        topic_shift_score  = round(topic_shift, 4),
        engagement_score   = engagement,
        latency_score      = latency_score,
        repetition_score   = repetition,
        completeness_score = completeness,
        prematurity_score  = prematurity,
    )}
