from typing import Annotated, Any
from pydantic import BaseModel, Field
from langgraph.graph.message import add_messages


class AttentionSample(BaseModel):
    """Single attention measurement for one trial."""
    trial_id: int
    reaction_time_ms: float
    accuracy: float          # 0.0 – 1.0
    inattention_score: float # higher = more inattentive
    hyperactivity_score: float
    timestamp: str


class ParticipantProfile(BaseModel):
    """Baseline profile loaded from data/."""
    participant_id: str
    age: int
    diagnosis: str           # "ADHD" | "control"
    medication_status: str   # "medicated" | "unmedicated" | "none"
    bas_sensitivity: float   # Behavioural Activation System sensitivity 0–1
    bis_sensitivity: float   # Behavioural Inhibition System sensitivity 0–1


class AnalysisResult(BaseModel):
    """Output produced by the analysis agent."""
    variability_index: float
    mean_rt: float
    std_rt: float
    attention_lapses: int
    bas_influence_score: float
    summary: str


class PipelineState(BaseModel):
    """Shared state passed between all LangGraph nodes."""
    participant: ParticipantProfile | None = None
    raw_samples: list[AttentionSample] = Field(default_factory=list)
    analysis: AnalysisResult | None = None
    messages: Annotated[list[Any], add_messages] = Field(default_factory=list)
    report: str = ""
    error: str = ""
