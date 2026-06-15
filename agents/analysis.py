"""Analysis agent: computes attentional variability metrics."""
import numpy as np

from models.state import AnalysisResult, PipelineState

_LAPSE_RT_THRESHOLD_MS = 600.0


def analysis_node(state: PipelineState) -> dict:
    """LangGraph node: derive variability metrics from raw trial data."""
    if not state.raw_samples:
        return {"error": "No samples to analyse."}

    rts = np.array([s.reaction_time_ms for s in state.raw_samples])
    inatt = np.array([s.inattention_score for s in state.raw_samples])

    mean_rt = float(np.mean(rts))
    std_rt = float(np.std(rts))
    iiv = std_rt / mean_rt if mean_rt > 0 else 0.0
    lapses = int(np.sum(rts > _LAPSE_RT_THRESHOLD_MS))

    bas = state.participant.bas_sensitivity if state.participant else 0.5
    bas_influence = float(np.mean(inatt) * bas)

    pid = state.participant.participant_id if state.participant else "?"
    summary = (
        f"Participant {pid} | IIV={iiv:.3f} | mean RT={mean_rt:.1f} ms | "
        f"SD={std_rt:.1f} ms | lapses={lapses} | BAS influence={bas_influence:.3f}"
    )

    return {
        "analysis": AnalysisResult(
            variability_index=round(iiv, 4),
            mean_rt=round(mean_rt, 2),
            std_rt=round(std_rt, 2),
            attention_lapses=lapses,
            bas_influence_score=round(bas_influence, 4),
            summary=summary,
        )
    }
