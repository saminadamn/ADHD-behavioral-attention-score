"""
Pydantic state models for the ADHD-BAS backend pipeline.
"""
from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field

AttentionLabel = Literal["Focused", "Distracted", "Impulsive"]


class FeatureScores(BaseModel):
    response_length: int
    sentiment: float = Field(ge=-1.0, le=1.0)
    topic_shift_score: float = Field(ge=0.0, le=1.0)
    engagement_score: float = Field(ge=0.0, le=1.0)
    latency_score: float = Field(ge=0.0, le=1.0)


class WorkflowState(BaseModel):
    teacher_prompt: str = ""
    student_response: str = ""
    response_latency: float = Field(default=0.0, ge=0.0)
    features: FeatureScores | None = None
    attention_state: AttentionLabel | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    reward: float = 0.0
    current_bas: float = Field(default=50.0, ge=0.0, le=100.0)
    bas_history: list[float] = Field(default_factory=list)
    previous_attention_state: AttentionLabel | None = None
    previous_reward: float = 0.0
    previous_bas: float = Field(default=50.0, ge=0.0, le=100.0)
    intervention: str = ""
    rationale: str = ""
    tier: str = ""
    error: str = ""
    messages: list[Any] = Field(default_factory=list)
