from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["phenotype"])

_PHENOTYPES: dict[str, list[str]] = {
    "Inattentive": [
        "Focused","Distracted","Distracted","Focused","Distracted",
        "Focused","Distracted","Distracted","Focused","Distracted",
        "Focused","Distracted","Focused","Distracted","Distracted",
        "Focused","Distracted","Focused","Distracted","Focused",
        "Distracted","Focused","Distracted","Focused","Distracted",
        "Focused","Distracted","Distracted","Focused","Distracted",
    ],
    "Hyperactive": [
        "Impulsive","Impulsive","Focused","Impulsive",
        "Impulsive","Impulsive","Focused","Impulsive",
        "Focused","Impulsive","Impulsive","Impulsive",
        "Focused","Impulsive","Impulsive","Impulsive",
        "Impulsive","Focused","Impulsive","Impulsive",
        "Impulsive","Focused","Impulsive","Impulsive",
        "Impulsive","Impulsive","Focused","Impulsive",
        "Impulsive","Focused",
    ],
    "Combined": [
        "Focused","Distracted","Impulsive","Distracted","Focused",
        "Impulsive","Distracted","Impulsive","Focused","Distracted",
        "Impulsive","Distracted","Focused","Impulsive","Distracted",
        "Focused","Distracted","Impulsive","Focused","Impulsive",
        "Distracted","Impulsive","Focused","Distracted","Impulsive",
        "Focused","Impulsive","Distracted","Focused","Impulsive",
    ],
    "Focused": [
        "Focused","Focused","Focused","Focused","Focused",
        "Focused","Focused","Distracted","Focused","Focused",
        "Focused","Focused","Focused","Focused","Focused",
        "Focused","Distracted","Focused","Focused","Focused",
        "Focused","Focused","Focused","Focused","Focused",
        "Focused","Focused","Focused","Distracted","Focused",
    ],
}


class SimulateRequest(BaseModel):
    phenotype: str = "Inattentive"


class SimulateResponse(BaseModel):
    phenotype:    str
    sequence:     list[str]
    bas_history:  list[float]
    rewards:      list[float]
    final_bas:    float
    mean_bas:     float
    min_bas:      float
    max_bas:      float
    iiv:          float
    n_focused:    int
    n_distracted: int
    n_impulsive:  int


@router.post("/simulate", response_model=SimulateResponse)
async def simulate(req: SimulateRequest):
    try:
        sequence = _PHENOTYPES.get(req.phenotype)
        if sequence is None:
            raise HTTPException(status_code=400, detail=f"Unknown phenotype: {req.phenotype}")

        from agents.bas_tracker import simulate_bas_trajectory
        result = simulate_bas_trajectory(sequence)
        return SimulateResponse(phenotype=req.phenotype, sequence=sequence, **result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/phenotypes")
async def list_phenotypes():
    return {"phenotypes": list(_PHENOTYPES.keys())}
