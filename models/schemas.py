"""Pydantic schemas for LLM-structured outputs."""
from pydantic import BaseModel, Field


class BASInterpretation(BaseModel):
    """LLM-generated interpretation of BAS-driven attentional patterns."""
    reward_sensitivity_note: str = Field(
        description="How elevated BAS sensitivity may drive attention shifts toward rewards."
    )
    variability_explanation: str = Field(
        description="Mechanistic explanation of intra-individual reaction-time variability."
    )
    clinical_implications: list[str] = Field(
        description="Bullet-point list of clinical/intervention implications."
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description="Model confidence in this interpretation (0–1)."
    )


class ReportSection(BaseModel):
    title: str
    body: str
