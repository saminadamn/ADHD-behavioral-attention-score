"""Visualiser agent: produces plots saved to outputs/."""
import os

import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import numpy as np

from models.state import PipelineState

_OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "outputs")


def visualiser_node(state: PipelineState) -> dict:
    """LangGraph node: generate and save attentional variability plots."""
    os.makedirs(_OUT_DIR, exist_ok=True)

    rts = [s.reaction_time_ms for s in state.raw_samples]
    accs = [s.accuracy for s in state.raw_samples]
    trials = list(range(len(rts)))

    fig = plt.figure(figsize=(14, 10))
    pid = state.participant.participant_id if state.participant else "?"
    diag = state.participant.diagnosis if state.participant else "?"
    fig.suptitle(
        f"ADHD-BAS Attentional Variability\nParticipant: {pid}  |  Diagnosis: {diag}",
        fontsize=13,
        fontweight="bold",
    )
    gs = gridspec.GridSpec(2, 2, figure=fig, hspace=0.4, wspace=0.35)

    ax1 = fig.add_subplot(gs[0, :])
    ax1.plot(trials, rts, alpha=0.6, linewidth=0.9, color="steelblue", label="RT (ms)")
    ax1.axhline(np.mean(rts), color="red", linestyle="--", linewidth=1.2,
                label=f"Mean RT={np.mean(rts):.0f} ms")
    ax1.axhline(600, color="orange", linestyle=":", linewidth=1.0,
                label="Lapse threshold (600 ms)")
    ax1.set_xlabel("Trial")
    ax1.set_ylabel("Reaction Time (ms)")
    ax1.set_title("Trial-by-Trial Reaction Time")
    ax1.legend(fontsize=8)

    ax2 = fig.add_subplot(gs[1, 0])
    ax2.hist(rts, bins=20, color="steelblue", edgecolor="white", alpha=0.85)
    ax2.set_xlabel("RT (ms)")
    ax2.set_ylabel("Frequency")
    ax2.set_title("RT Distribution")

    ax3 = fig.add_subplot(gs[1, 1])
    window = max(1, len(accs) // 10)
    rolling_acc = np.convolve(accs, np.ones(window) / window, mode="valid")
    ax3.plot(rolling_acc, color="seagreen", linewidth=1.5)
    ax3.set_ylim(0, 1)
    ax3.set_xlabel(f"Trial (smoothed, window={window})")
    ax3.set_ylabel("Accuracy")
    ax3.set_title(f"Accuracy (rolling {window}-trial avg)")

    out_path = os.path.join(_OUT_DIR, f"adhd_bas_{pid}.png")
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"[visualiser] Plot saved -> {out_path}")
    return {}
