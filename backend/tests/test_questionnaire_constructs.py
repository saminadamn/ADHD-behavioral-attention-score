"""
Runs every case in tests/fixtures/questionnaire_cases.py through the full
signal_extractor -> state_classifier path and asserts the expected
attention_state. This is the regression-test counterpart to
scripts/validate_against_assessment_questionnaire.py, which runs the same
cases as a full multi-turn session and writes the human-readable report in
docs/questionnaire_validation.md -- read that file for what these cases are
and are not evidence of.
"""
import pytest
from models.state import WorkflowState
from agents.signal_extractor import behavioral_signal_extractor
from agents.state_classifier import attention_state_classifier
from tests.fixtures.questionnaire_cases import CASES


def classify(teacher_prompt: str, student_response: str, response_latency: float) -> str:
    state = WorkflowState(
        teacher_prompt=teacher_prompt,
        student_response=student_response,
        response_latency=response_latency,
    )
    state = state.model_copy(update=behavioral_signal_extractor(state))
    return attention_state_classifier(state)["attention_state"]


@pytest.mark.parametrize(
    "item,construct,prompt,response,latency,expected",
    CASES,
    ids=[case[0].replace(" ", "_").replace("/", "-") for case in CASES],
)
def test_questionnaire_construct_classification(item, construct, prompt, response, latency, expected):
    label = classify(prompt, response, latency)
    assert label == expected, (
        f"{item} ({construct}): expected {expected}, got {label}. "
        f"prompt={prompt!r} response={response!r} latency={latency}"
    )
