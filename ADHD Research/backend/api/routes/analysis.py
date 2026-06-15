from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["analysis"])


class AnalyzeRequest(BaseModel):
    teacher_prompt:           str
    student_response:         str
    response_latency:         float = Field(default=5.0, ge=0.0, le=120.0)
    previous_attention_state: str | None = None
    current_bas:              float = Field(default=50.0, ge=0.0, le=100.0)
    bas_history:              list[float] = Field(default_factory=list)


class FeatureScoresOut(BaseModel):
    response_length:   int
    sentiment:         float
    topic_shift_score: float
    engagement_score:  float
    latency_score:     float


class AnalyzeResponse(BaseModel):
    features:          FeatureScoresOut
    attention_state:   str
    confidence:        float
    reward:            float
    current_bas:       float
    bas_history:       list[float]
    previous_attention_state: str | None
    intervention:      str
    rationale:         str
    tier:              str


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    try:
        from core.pipeline import run_turn
        result = run_turn(
            teacher_prompt           = req.teacher_prompt,
            student_response         = req.student_response,
            response_latency         = req.response_latency,
            previous_attention_state = req.previous_attention_state,
            current_bas              = req.current_bas,
            bas_history              = req.bas_history,
        )
        f = result.get("features") or {}
        if hasattr(f, "model_dump"):
            f = f.model_dump()

        return AnalyzeResponse(
            features         = FeatureScoresOut(**f) if isinstance(f, dict) else FeatureScoresOut(
                response_length=f.response_length, sentiment=f.sentiment,
                topic_shift_score=f.topic_shift_score, engagement_score=f.engagement_score,
                latency_score=f.latency_score),
            attention_state  = result.get("attention_state") or "Focused",
            confidence       = result.get("confidence", 0.5),
            reward           = result.get("reward", 0.0),
            current_bas      = result.get("current_bas", req.current_bas),
            bas_history      = result.get("bas_history", []),
            previous_attention_state = result.get("previous_attention_state"),
            intervention     = result.get("intervention", ""),
            rationale        = result.get("rationale", ""),
            tier             = result.get("tier", ""),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    return {"status": "ok", "service": "ADHD-BAS API"}
