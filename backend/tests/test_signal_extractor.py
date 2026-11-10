"""
Unit tests for the signals added to fix the impulsivity blind spot
(see docs/model_limitations.md): repetition_score, completeness_score, and
prematurity_score.
"""
from agents.signal_extractor import (
    _repetition_score,
    _completeness_score,
    _expected_response_time,
    _prematurity_score,
)


class TestRepetitionScore:
    def test_no_repetition(self):
        assert _repetition_score("Photosynthesis converts sunlight into glucose.") == 0.0

    def test_single_word_has_no_repetition(self):
        assert _repetition_score("Yes") == 0.0

    def test_empty_string(self):
        assert _repetition_score("") == 0.0

    def test_repeated_whole_words(self):
        score = _repetition_score("no no no I don't know I don't know")
        assert score > 0.0

    def test_intra_word_repetition_detected(self):
        # The exact pattern that caused the original misclassification.
        score = _repetition_score("canwegonowcanwegonow okay fine can we go")
        assert score == 1.0

    def test_long_non_repeating_word_not_flagged(self):
        score = _repetition_score("Supercalifragilisticexpialidocious is a long word")
        assert score < 1.0


class TestCompletenessScore:
    def test_complete_sentence(self):
        assert _completeness_score("The cat sat on the mat.") == 1.0

    def test_complete_short_answer(self):
        assert _completeness_score("Forty-two.") == 1.0

    def test_short_answer_without_punctuation_still_complete(self):
        # "42" -- two tokens or fewer, doesn't end on a filler word.
        assert _completeness_score("42") == 0.8

    def test_trails_off_on_filler_word(self):
        # The exact pattern that caused the original misclassification.
        assert _completeness_score("My favorite animal is") <= 0.1

    def test_trails_off_on_conjunction(self):
        assert _completeness_score("I wanted to go but") <= 0.1

    def test_empty_string_is_incomplete(self):
        assert _completeness_score("") == 0.0

    def test_longer_response_without_terminal_punctuation(self):
        score = _completeness_score("I think the answer involves several steps here")
        assert 0.0 < score < 1.0


class TestExpectedResponseTime:
    def test_longer_question_expects_more_time_than_shorter_one(self):
        short_q = "What is two plus two?"
        long_q = (
            "Can you walk me through, step by step, how photosynthesis "
            "converts sunlight and carbon dioxide into glucose, and explain "
            "why chlorophyll specifically is required for that process?"
        )
        assert _expected_response_time(long_q) > _expected_response_time(short_q)

    def test_more_clauses_expects_more_time_at_equal_length(self):
        # Same word count, but one has comma-separated clauses.
        plain = "Tell me about your weekend trip to the coast last summer"
        clausal = "Tell me, in your own words, about your weekend trip please"
        assert _expected_response_time(clausal) > _expected_response_time(plain)

    def test_empty_prompt_has_nonzero_baseline(self):
        assert _expected_response_time("") > 0.0


class TestPrematurityScore:
    def test_latency_at_or_above_expected_pace_is_not_premature(self):
        prompt = "What is two plus two?"
        expected = _expected_response_time(prompt)
        assert _prematurity_score(prompt, latency=expected) == 0.0
        assert _prematurity_score(prompt, latency=expected * 2) == 0.0

    def test_near_instant_answer_to_a_complex_question_is_premature(self):
        # The exact pattern that caused the Q16-style misclassification:
        # a long, multi-clause question answered in well under a second.
        prompt = (
            "Can you tell me what you think the answer to this long, "
            "multi-part question about the area of a circle, given radius "
            "five, might possibly be?"
        )
        score = _prematurity_score(prompt, latency=0.6)
        assert score > 0.6

    def test_fast_answer_to_a_simple_question_is_not_flagged(self):
        # Fast is fine when the question didn't demand much thinking time.
        prompt = "Six times seven?"
        score = _prematurity_score(prompt, latency=0.6)
        assert score < 0.3

    def test_empty_prompt_does_not_crash(self):
        assert _prematurity_score("", latency=0.0) >= 0.0
