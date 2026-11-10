"""
Regression tests for the attention_state_classifier impulsivity fix
(see docs/model_limitations.md).

These run the full signal_extractor -> state_classifier path (not just the
classifier in isolation) because the bug was in how the two combine: the
classifier was already correct given a bad engagement_score, the fix lives
in the features it's given. Uses the real sentence-transformer model, same
as production -- no mocking, to catch the actual regression if this ever
reappears.
"""
import pytest
from models.state import WorkflowState
from agents.signal_extractor import behavioral_signal_extractor
from agents.state_classifier import attention_state_classifier


def classify(teacher_prompt: str, student_response: str, response_latency: float) -> tuple[str, float]:
    state = WorkflowState(
        teacher_prompt=teacher_prompt,
        student_response=student_response,
        response_latency=response_latency,
    )
    state = state.model_copy(update=behavioral_signal_extractor(state))
    result = attention_state_classifier(state)
    return result["attention_state"], result["confidence"]


class TestImpulsivityRegressions:
    """The two cases that were misclassified as Focused + positive reward
    before repetition_score / completeness_score existed."""

    def test_trailing_off_response_is_not_focused(self):
        label, _ = classify(
            "Please write two sentences describing your favorite animal.",
            "My favorite animal is",
            4.0,
        )
        assert label != "Focused"

    def test_garbled_rushed_response_is_not_focused(self):
        label, _ = classify(
            "Okay, when you're ready, tell me about your weekend.",
            "canwegonowcanwegonow okay fine can we go",
            0.8,
        )
        assert label != "Focused"

    def test_answering_before_a_complex_question_is_finished_is_impulsive(self):
        # A coherent, correct, complete answer -- repetition_score and
        # completeness_score both stay low/high as they should -- but given
        # in a fraction of a second to a long, multi-clause question. This
        # is the case prematurity_score exists for; before it, this landed
        # as a low-confidence, ambiguous call rather than a clear one.
        label, conf = classify(
            "Can you tell me what you think the answer to this long, "
            "multi-part question about the area of a circle, given radius "
            "five, might possibly be?",
            "Twenty-five pi!",
            0.6,
        )
        assert label == "Impulsive"
        assert conf > 0.5


class TestStillClassifiesCorrectly:
    """Make sure the fix didn't break the cases that already worked."""

    def test_coherent_on_topic_answer_is_focused(self):
        label, conf = classify(
            "What is photosynthesis?",
            "Photosynthesis is the process by which plants convert sunlight, "
            "water, and carbon dioxide into glucose and oxygen, using "
            "chlorophyll in their leaves.",
            6.5,
        )
        assert label == "Focused"
        assert conf > 0.5

    def test_off_topic_rambling_is_distracted(self):
        label, _ = classify(
            "What were the main causes of World War I?",
            "Wait is that a bird outside? Sorry -- causes, um, there was an "
            "archduke I think, and also did you hear that noise?",
            14.0,
        )
        assert label == "Distracted"

    def test_long_engaged_answer_is_focused(self):
        label, _ = classify(
            "Tell me everything you know about how volcanoes form.",
            "Volcanoes form at tectonic plate boundaries where magma rises "
            "through the crust; there are shield volcanoes, stratovolcanoes, "
            "and cinder cones, each shaped by viscosity and eruption style.",
            11.0,
        )
        assert label == "Focused"


class TestFeatureWiring:
    """The classifier reads repetition_score / completeness_score from
    FeatureScores -- make sure those fields actually reach it."""

    def test_high_repetition_alone_triggers_impulsive(self):
        state = WorkflowState(teacher_prompt="How was your day?", student_response="fine", response_latency=5.0)
        state = state.model_copy(update=behavioral_signal_extractor(state))
        # Force the condition this test targets regardless of what the real
        # extractor computed for this particular string.
        state.features.repetition_score = 0.9
        state.features.completeness_score = 1.0
        state.features.engagement_score = 0.9  # would be "Focused" on engagement alone
        result = attention_state_classifier(state)
        assert result["attention_state"] == "Impulsive"

    def test_low_completeness_alone_triggers_impulsive(self):
        state = WorkflowState(teacher_prompt="How was your day?", student_response="fine", response_latency=5.0)
        state = state.model_copy(update=behavioral_signal_extractor(state))
        state.features.repetition_score = 0.0
        state.features.completeness_score = 0.05
        state.features.engagement_score = 0.9  # would be "Focused" on engagement alone
        result = attention_state_classifier(state)
        assert result["attention_state"] == "Impulsive"

    def test_high_prematurity_alone_triggers_impulsive(self):
        state = WorkflowState(teacher_prompt="How was your day?", student_response="fine", response_latency=5.0)
        state = state.model_copy(update=behavioral_signal_extractor(state))
        state.features.repetition_score = 0.0
        state.features.completeness_score = 1.0
        state.features.prematurity_score = 0.9
        state.features.engagement_score = 0.9  # would be "Focused" on engagement alone
        result = attention_state_classifier(state)
        assert result["attention_state"] == "Impulsive"
