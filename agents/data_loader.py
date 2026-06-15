"""Data-loader agent: reads participant CSV and populates PipelineState."""
import os
import random
from datetime import datetime, timedelta

import pandas as pd

from models.state import AttentionSample, ParticipantProfile, PipelineState

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def _generate_synthetic_samples(
    participant: ParticipantProfile, n: int = 80
) -> list[AttentionSample]:
    """Generate synthetic CPT-style trial data influenced by BAS sensitivity."""
    rng = random.Random(hash(participant.participant_id))
    base_rt = 350 if participant.diagnosis == "ADHD" else 280
    base_acc = 0.78 if participant.diagnosis == "ADHD" else 0.92
    volatility = participant.bas_sensitivity * 120

    samples = []
    t0 = datetime.now()
    for i in range(n):
        rt = max(150.0, rng.gauss(base_rt + volatility * rng.uniform(-1, 1), volatility))
        acc = min(1.0, max(0.0, rng.gauss(base_acc, 0.12)))
        inatt = participant.bis_sensitivity * rng.uniform(0, 1)
        hyper = participant.bas_sensitivity * rng.uniform(0, 1)
        ts = (t0 + timedelta(seconds=i * 2)).isoformat()
        samples.append(
            AttentionSample(
                trial_id=i,
                reaction_time_ms=round(rt, 2),
                accuracy=round(acc, 3),
                inattention_score=round(inatt, 3),
                hyperactivity_score=round(hyper, 3),
                timestamp=ts,
            )
        )
    return samples


def data_loader_node(state: PipelineState) -> dict:
    """LangGraph node: load or generate participant data."""
    csv_path = os.path.join(_DATA_DIR, "participants.csv")

    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        row = df.iloc[0]
        participant = ParticipantProfile(
            participant_id=str(row["participant_id"]),
            age=int(row["age"]),
            diagnosis=str(row["diagnosis"]),
            medication_status=str(row["medication_status"]),
            bas_sensitivity=float(row["bas_sensitivity"]),
            bis_sensitivity=float(row["bis_sensitivity"]),
        )
    else:
        participant = ParticipantProfile(
            participant_id="P001",
            age=24,
            diagnosis="ADHD",
            medication_status="unmedicated",
            bas_sensitivity=0.82,
            bis_sensitivity=0.45,
        )

    samples = _generate_synthetic_samples(participant)
    return {"participant": participant, "raw_samples": samples}
