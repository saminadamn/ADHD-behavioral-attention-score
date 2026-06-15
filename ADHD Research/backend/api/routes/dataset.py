from __future__ import annotations
import os
import logging
from functools import lru_cache
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["dataset"])
logger = logging.getLogger(__name__)

DATA_PATH = os.getenv("DATA_PATH", "./data/synthetic_adhd.csv")


@lru_cache(maxsize=1)
def _load_dataset():
    import pandas as pd
    path = DATA_PATH
    if not os.path.exists(path):
        path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "synthetic_adhd.csv")
    df = pd.read_csv(path)
    df.columns = df.columns.str.lower().str.strip()
    return df


class DatasetRecord(BaseModel):
    id:                  int
    teacher_prompt:      str
    student_response:    str
    response_latency:    float
    attention_label:     str


class DatasetStats(BaseModel):
    total:          int
    focused:        int
    distracted:     int
    impulsive:      int
    avg_latency:    float
    avg_resp_len:   float


class DatasetResponse(BaseModel):
    records:  list[DatasetRecord]
    stats:    DatasetStats
    total:    int
    offset:   int
    limit:    int


@router.get("/dataset", response_model=DatasetResponse)
async def get_dataset(
    label:  str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit:  int        = Query(default=50, le=200),
    offset: int        = Query(default=0, ge=0),
):
    try:
        df = _load_dataset().copy()

        # statistics on full dataset
        stats = DatasetStats(
            total       = len(df),
            focused     = int((df["attention_label"] == "Focused").sum()),
            distracted  = int((df["attention_label"] == "Distracted").sum()),
            impulsive   = int((df["attention_label"] == "Impulsive").sum()),
            avg_latency = round(float(df["response_latency_seconds"].mean()), 2),
            avg_resp_len= round(float(df["student_response"].apply(lambda x: len(str(x).split())).mean()), 1),
        )

        if label and label in ("Focused", "Distracted", "Impulsive"):
            df = df[df["attention_label"] == label]
        if search:
            mask = (
                df["teacher_prompt"].str.contains(search, case=False, na=False) |
                df["student_response"].str.contains(search, case=False, na=False)
            )
            df = df[mask]

        total   = len(df)
        page_df = df.iloc[offset: offset + limit]

        records = [
            DatasetRecord(
                id               = int(row.get("id", i)),
                teacher_prompt   = str(row.get("teacher_prompt", "")),
                student_response = str(row.get("student_response", "")),
                response_latency = float(row.get("response_latency_seconds", 0.0)),
                attention_label  = str(row.get("attention_label", "")),
            )
            for i, row in page_df.iterrows()
        ]

        return DatasetResponse(records=records, stats=stats, total=total, offset=offset, limit=limit)
    except Exception as e:
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))
