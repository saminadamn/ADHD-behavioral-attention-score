from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["intervention"])


class InterventionRequest(BaseModel):
    current_bas:     float = Field(default=50.0, ge=0.0, le=100.0)
    attention_state: str | None = None


class InterventionResponse(BaseModel):
    intervention: str
    rationale:    str
    tier:         str
    label:        str


_RESULTS_STATIC = {
    "accuracy":   0.78,
    "precision":  0.79,
    "recall":     0.78,
    "f1":         0.764,
    "dataset_size": 500,
    "per_class": {
        "Focused":    {"precision": 0.74, "recall": 0.74, "f1": 0.740},
        "Distracted": {"precision": 0.63, "recall": 0.52, "f1": 0.570},
        "Impulsive":  {"precision": 0.98, "recall": 0.98, "f1": 0.982},
    },
    "confusion_matrix": [
        [123, 29,  14],
        [41,  87,   5],
        [3,    3, 195],
    ],
    "label_names": ["Focused", "Distracted", "Impulsive"],
}


@router.post("/intervention", response_model=InterventionResponse)
async def get_intervention(req: InterventionRequest):
    try:
        from agents.intervention_generator import get_intervention
        result = get_intervention(req.current_bas, req.attention_state)
        return InterventionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results")
async def get_results():
    return _RESULTS_STATIC
