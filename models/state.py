"""
models/state.py
---------------
Pydantic state models for the ADHD-BAS LangGraph workflows.

Two top-level state classes:
  - PipelineState       original CPT-variability pipeline
  - WorkflowState       classroom interaction / BAS reward workflow
"""

from __future__ import annotations

from typing import Annotated, Any, Literal
from pydantic import BaseModel, Field
from langgraph.graph.message import add_messages


# ===========================================================================
# Shared primitives (used by both workflows)
# ===========================================================================

class AttentionSample(BaseModel):
    """Single reaction-time trial from a CPT task."""
    trial_id: int
    reaction_time_ms: float
    accuracy: float            # 0.0 – 1.0
    inattention_score: float   # higher = more inattentive
    hyperactivity_score: float
    timestamp: str


class ParticipantProfile(BaseModel):
    """Baseline participant demographics and BAS/BIS scores."""
    participant_id: str
    age: int
    diagnosis: Literal["ADHD", "control"]
    medication_status: Literal["medicated", "unmedicated", "none"]
    bas_sensitivity: float = Field(ge=0.0, le=1.0)
    bis_sensitivity: float = Field(ge=0.0, le=1.0)


class AnalysisResult(BaseModel):
    """Metrics produced by the variability analysis agent."""
    variability_index: float
    mean_rt: float
    std_rt: float
    attention_lapses: int
    bas_influence_score: float
    summary: str


# ===========================================================================
# PipelineState — original CPT variability pipeline
# ===========================================================================

class PipelineState(BaseModel):
    """Shared state for the CPT attentional-variability LangGraph pipeline."""

    participant: ParticipantProfile | None = None
    raw_samples: list[AttentionSample] = Field(default_factory=list)
    analysis: AnalysisResult | None = None
    messages: Annotated[list[Any], add_messages] = Field(default_factory=list)
    report: str = ""
    error: str = ""


# ===========================================================================
# WorkflowState — classroom interaction / BAS reward pipeline
# ===========================================================================

# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

AttentionLabel = Literal["Focused", "Distracted", "Impulsive"]


class ConversationTurn(BaseModel):
    """A single teacher–student exchange."""
    turn_id: int
    teacher_prompt: str
    student_response: str
    response_latency_seconds: float


class FeatureScores(BaseModel):
    """
    Per-turn feature scores computed by the feature-extraction node.
    All continuous scores are normalised to [0.0, 1.0] unless stated.
    """
    response_length: int = Field(
        description="Character count of the student response."
    )
    sentiment: float = Field(
        ge=-1.0, le=1.0,
        description="Sentiment polarity: -1 = negative, 0 = neutral, +1 = positive.",
    )
    topic_shift_score: float = Field(
        ge=0.0, le=1.0,
        description="0 = fully on-topic, 1 = complete topic drift.",
    )
    engagement_score: float = Field(
        ge=0.0, le=1.0,
        description="Composite measure of response depth and relevance.",
    )
    latency_score: float = Field(
        ge=0.0, le=1.0,
        description="Normalised latency (0 = fastest/impulsive, 1 = slowest/distracted).",
    )


class AttentionState(BaseModel):
    """
    Classification output for the current turn.
    confidence reflects the model's certainty in the predicted label.
    """
    label: AttentionLabel
    confidence: float = Field(ge=0.0, le=1.0)


class BASState(BaseModel):
    """
    Behavioural Activation System score for the current turn.
    current_bas is the instantaneous estimate; bas_history accumulates
    across turns to reveal trajectory (arousal ramp-up, fatigue, etc.).
    """
    current_bas: float = Field(
        ge=0.0, le=100.0,
        description="Instantaneous BAS activation score for this turn (0-100 scale).",
    )
    bas_history: list[float] = Field(
        default_factory=list,
        description="Ordered BAS scores across all processed turns.",
    )


# ---------------------------------------------------------------------------
# Root workflow state
# ---------------------------------------------------------------------------

class WorkflowState(BaseModel):
    """
    Shared state for the classroom-interaction LangGraph workflow.

    Node responsibilities
    --------------------
    ingestion_node      -> populates conversation, teacher_prompt,
                           student_response, response_latency
    feature_node        -> populates features
    classifier_node     -> populates attention_state, confidence
    bas_node            -> populates current_bas, bas_history, reward
    report_node         -> populates report, error
    """

    # ---- Raw interaction ------------------------------------------------
    conversation: list[ConversationTurn] = Field(
        default_factory=list,
        description="Full history of teacher-student turns processed so far.",
    )
    teacher_prompt: str = Field(
        default="",
        description="The most recent teacher utterance.",
    )
    student_response: str = Field(
        default="",
        description="The most recent student utterance.",
    )
    response_latency: float = Field(
        default=0.0,
        ge=0.0,
        description="Latency in seconds before the student responded.",
    )

    # ---- Extracted features ---------------------------------------------
    features: FeatureScores | None = Field(
        default=None,
        description="Per-turn scores computed from the raw interaction.",
    )

    # ---- Attention classification ----------------------------------------
    attention_state: AttentionLabel | None = Field(
        default=None,
        description="Predicted attention label for the current turn.",
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Classifier confidence in the predicted attention_state.",
    )

    # ---- BAS reward signal ----------------------------------------------
    reward: float = Field(
        default=0.0,
        description=(
            "Scalar reward signal derived from the BAS score and attention outcome. "
            "Positive values encourage focused behaviour; negative values signal "
            "disengagement or impulsivity."
        ),
    )
    current_bas: float = Field(
        default=50.0,
        ge=0.0,
        le=100.0,
        description="Instantaneous BAS activation estimate (0-100 scale) for the current turn.",
    )
    bas_history: list[float] = Field(
        default_factory=list,
        description="Chronological BAS scores across all turns (appended each turn).",
    )

    # ---- Cross-turn memory (stateful graph) -----------------------------
    previous_attention_state: AttentionLabel | None = Field(
        default=None,
        description="Attention label from the immediately preceding turn.",
    )
    previous_reward: float = Field(
        default=0.0,
        description="Reward signal emitted on the immediately preceding turn.",
    )
    previous_bas: float = Field(
        default=50.0,
        ge=0.0,
        le=100.0,
        description="BAS score at the end of the immediately preceding turn.",
    )

    # ---- LangGraph message bus ------------------------------------------
    messages: Annotated[list[Any], add_messages] = Field(
        default_factory=list,
        description="LangChain/LangGraph message history for LLM nodes.",
    )

    # ---- Output ---------------------------------------------------------
    report: str = Field(
        default="",
        description="Final formatted report produced by the report node.",
    )
    error: str = Field(
        default="",
        description="Propagated error message; non-empty aborts downstream nodes.",
    )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def append_turn(
        self,
        teacher_prompt: str,
        student_response: str,
        response_latency: float,
    ) -> "WorkflowState":
        """Return a new state with the current turn appended to conversation."""
        turn = ConversationTurn(
            turn_id=len(self.conversation) + 1,
            teacher_prompt=teacher_prompt,
            student_response=student_response,
            response_latency_seconds=response_latency,
        )
        return self.model_copy(
            update={
                "conversation": self.conversation + [turn],
                "teacher_prompt": teacher_prompt,
                "student_response": student_response,
                "response_latency": response_latency,
            }
        )

    def append_bas(self, score: float) -> "WorkflowState":
        """Return a new state with score appended to bas_history."""
        return self.model_copy(
            update={
                "current_bas": score,
                "bas_history": self.bas_history + [score],
            }
        )

    @property
    def turn_count(self) -> int:
        return len(self.conversation)

    @property
    def mean_bas(self) -> float:
        if not self.bas_history:
            return 0.0
        return sum(self.bas_history) / len(self.bas_history)

    @property
    def bas_trend(self) -> float:
        """Slope of BAS over the last 5 turns (positive = escalating activation)."""
        window = self.bas_history[-5:]
        if len(window) < 2:
            return 0.0
        n = len(window)
        xs = list(range(n))
        x_mean = sum(xs) / n
        y_mean = sum(window) / n
        num = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, window))
        den = sum((x - x_mean) ** 2 for x in xs)
        return num / den if den != 0 else 0.0
