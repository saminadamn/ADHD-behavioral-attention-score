"""
Unit tests for the two signals added to fix the impulsivity blind spot
(see docs/model_limitations.md): repetition_score and completeness_score.
"""
from agents.signal_extractor import _repetition_score, _completeness_score


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
