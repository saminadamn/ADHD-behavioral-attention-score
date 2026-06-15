"""
scripts/visualize_bas.py
------------------------
Runs 60 samples from synthetic_adhd.csv through the full pipeline
(Extractor -> Classifier -> RewardModeler -> BASTracker) and produces:

    outputs/figures/bas_curve.png          BAS score over time
    outputs/figures/reward_curve.png       Reward trajectory
    outputs/figures/state_transitions.png  Attention state over time
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
from matplotlib.colors import LinearSegmentedColormap
from collections import Counter

# Silence per-sample logs
import agents.signal_extractor as _se
import agents.state_classifier as _sc
_se._log_extraction = lambda *a, **kw: None
_sc._log            = lambda *a, **kw: None

from models.state        import WorkflowState
from agents.signal_extractor import behavioral_signal_extractor
from agents.state_classifier import attention_state_classifier
from agents.reward_modeler   import compute_reward
from agents.bas_tracker      import BAS_INITIAL, BAS_MIN, BAS_MAX, MA_WINDOW

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

ROOT        = os.path.join(os.path.dirname(__file__), "..")
CSV_PATH    = os.path.join(ROOT, "data", "raw", "synthetic_adhd.csv")
OUT_DIR     = os.path.join(ROOT, "outputs", "figures")
N_SAMPLES   = 60    # turns to simulate

LABEL_COLOR = {
    "Focused":    "#2196F3",
    "Distracted": "#FF9800",
    "Impulsive":  "#F44336",
}
LABEL_MARKER = {"Focused": "o", "Distracted": "s", "Impulsive": "^"}

# ---------------------------------------------------------------------------
# Step 1 — Run pipeline and collect turn-level data
# ---------------------------------------------------------------------------

def run_pipeline(n: int = N_SAMPLES) -> pd.DataFrame:
    df      = pd.read_csv(CSV_PATH).sample(n=n, random_state=42).reset_index(drop=True)
    records = []
    bas     = BAS_INITIAL
    prev    = None

    print(f"  Running pipeline on {n} samples...")
    for idx, row in df.iterrows():
        state = WorkflowState(
            teacher_prompt   = str(row["teacher_prompt"]),
            student_response = str(row["student_response"]),
            response_latency = float(row["response_latency_seconds"]),
        )
        ext = behavioral_signal_extractor(state)
        state = state.model_copy(update=ext)
        cls = attention_state_classifier(state)

        pred_label = cls.get("attention_state", "Focused")
        reward     = compute_reward(prev, pred_label)
        bas        = float(np.clip(bas + reward, BAS_MIN, BAS_MAX))

        records.append({
            "turn":          idx + 1,
            "true_label":    row["attention_label"],
            "pred_label":    pred_label,
            "confidence":    cls.get("confidence", 0.0),
            "reward":        reward,
            "bas":           bas,
            "topic_shift":   state.features.topic_shift_score,
            "engagement":    state.features.engagement_score,
            "latency":       state.features.latency_score,
            "words":         state.features.response_length,
        })
        prev = pred_label
        print(f"\r    [{idx+1:>3}/{n}]  {pred_label:<12}  reward={reward:+.1f}  BAS={bas:.1f}", end="", flush=True)

    print()
    return pd.DataFrame(records)


def moving_average(arr: list[float], window: int) -> np.ndarray:
    out = np.full(len(arr), np.nan)
    for i in range(window - 1, len(arr)):
        out[i] = np.mean(arr[i - window + 1 : i + 1])
    return out


# ---------------------------------------------------------------------------
# Plot 1 — BAS over time
# ---------------------------------------------------------------------------

def plot_bas_curve(df: pd.DataFrame) -> None:
    turns  = df["turn"].tolist()
    bas    = df["bas"].tolist()
    labels = df["pred_label"].tolist()
    ma     = moving_average(bas, MA_WINDOW)

    fig, axes = plt.subplots(2, 1, figsize=(14, 8),
                             gridspec_kw={"height_ratios": [3, 1], "hspace": 0.08})
    ax, ax_raster = axes

    # --- Shaded zones ---
    ax.axhspan(70, 100, alpha=0.06, color="#2196F3", label="High BAS zone (>70)")
    ax.axhspan(30,  70, alpha=0.04, color="#9E9E9E")
    ax.axhspan( 0,  30, alpha=0.06, color="#F44336", label="Low BAS zone (<30)")
    ax.axhline(BAS_INITIAL, color="#9E9E9E", linewidth=0.8, linestyle="--", label=f"Baseline ({BAS_INITIAL})")

    # --- BAS line ---
    ax.plot(turns, bas, color="#546E7A", linewidth=1.2, alpha=0.5, zorder=2)

    # --- Moving average ---
    ax.plot(turns, ma, color="#1A237E", linewidth=2.2, label=f"MA-{MA_WINDOW}", zorder=3)

    # --- Scatter coloured by predicted label ---
    for label in ("Focused", "Distracted", "Impulsive"):
        idx   = [i for i, l in enumerate(labels) if l == label]
        xvals = [turns[i] for i in idx]
        yvals = [bas[i] for i in idx]
        ax.scatter(xvals, yvals,
                   color=LABEL_COLOR[label],
                   marker=LABEL_MARKER[label],
                   s=55, zorder=4, label=label, edgecolors="white", linewidths=0.5)

    ax.set_ylabel("BAS Score", fontsize=11)
    ax.set_ylim(0, 105)
    ax.set_xlim(0.5, len(turns) + 0.5)
    ax.set_title("Behavioural Activation System (BAS) Score Over Time\n"
                 f"n={len(turns)} conversational turns  |  "
                 f"Final BAS={bas[-1]:.1f}  |  Mean={np.mean(bas):.1f}  |  "
                 f"MA-{MA_WINDOW} trend={'+' if ma[-1] > ma[MA_WINDOW-1] else ''}"
                 f"{ma[-1]-ma[MA_WINDOW-1]:.1f}",
                 fontsize=11, fontweight="bold")
    ax.legend(loc="upper right", fontsize=8, framealpha=0.9)
    ax.tick_params(labelbottom=False)
    ax.grid(axis="y", linestyle=":", alpha=0.4)

    # --- Raster stripe ---
    for i, (t, l) in enumerate(zip(turns, labels)):
        ax_raster.axvspan(t - 0.5, t + 0.5, color=LABEL_COLOR[l], alpha=0.75)
    ax_raster.set_xlim(0.5, len(turns) + 0.5)
    ax_raster.set_yticks([])
    ax_raster.set_xlabel("Turn", fontsize=11)
    ax_raster.set_ylabel("State", fontsize=8)
    ax_raster.set_title("Predicted attention state per turn", fontsize=8, pad=2)

    legend_patches = [mpatches.Patch(color=LABEL_COLOR[l], label=l) for l in LABEL_COLOR]
    ax_raster.legend(handles=legend_patches, loc="lower right", fontsize=7,
                     framealpha=0.9, ncol=3)

    path = os.path.join(OUT_DIR, "bas_curve.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  [saved] {path}")


# ---------------------------------------------------------------------------
# Plot 2 — Reward trajectory
# ---------------------------------------------------------------------------

def plot_reward_curve(df: pd.DataFrame) -> None:
    turns   = df["turn"].tolist()
    rewards = df["reward"].tolist()
    labels  = df["pred_label"].tolist()
    cumsum  = list(np.cumsum(rewards))
    ma_r    = moving_average(rewards, MA_WINDOW)

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 8),
                                    gridspec_kw={"height_ratios": [1.6, 1], "hspace": 0.35})

    # --- Top: per-turn reward bar chart ---
    bar_colors = [LABEL_COLOR[l] for l in labels]
    bars = ax1.bar(turns, rewards, color=bar_colors, width=0.7, edgecolor="white",
                   linewidth=0.3, zorder=2)
    ax1.axhline(0, color="black", linewidth=0.8, zorder=3)
    ax1.plot(turns, ma_r, color="#1A237E", linewidth=2.0,
             label=f"MA-{MA_WINDOW}", zorder=4)

    # Annotate extreme bars
    for t, r, lbl in zip(turns, rewards, labels):
        if abs(r) >= 8:
            ax1.text(t, r + (0.4 if r > 0 else -0.6), f"{r:+.0f}",
                     ha="center", va="bottom" if r > 0 else "top",
                     fontsize=7, fontweight="bold", color=LABEL_COLOR[lbl])

    ax1.set_ylabel("Reward", fontsize=11)
    ax1.set_title("Per-Turn RL Reward Signal", fontsize=11, fontweight="bold")
    ax1.set_xlim(0.5, len(turns) + 0.5)
    ax1.set_ylim(min(rewards) - 2, max(rewards) + 2)
    ax1.grid(axis="y", linestyle=":", alpha=0.4)

    legend_patches = [mpatches.Patch(color=LABEL_COLOR[l], label=l) for l in LABEL_COLOR]
    legend_patches.append(plt.Line2D([0], [0], color="#1A237E", linewidth=2, label=f"MA-{MA_WINDOW}"))
    ax1.legend(handles=legend_patches, fontsize=8, framealpha=0.9, ncol=4)

    # --- Bottom: cumulative reward ---
    ax2.fill_between(turns, cumsum, 0,
                     where=[c >= 0 for c in cumsum],
                     color="#4CAF50", alpha=0.35, label="Cumulative positive")
    ax2.fill_between(turns, cumsum, 0,
                     where=[c < 0 for c in cumsum],
                     color="#F44336", alpha=0.35, label="Cumulative negative")
    ax2.plot(turns, cumsum, color="#212121", linewidth=1.8, zorder=3)
    ax2.axhline(0, color="black", linewidth=0.8)
    ax2.scatter(turns[-1], cumsum[-1], color="#212121", s=60, zorder=5)
    ax2.text(turns[-1] + 0.5, cumsum[-1], f"  {cumsum[-1]:+.0f}",
             va="center", fontsize=9, fontweight="bold")

    ax2.set_ylabel("Cumulative Reward", fontsize=11)
    ax2.set_xlabel("Turn", fontsize=11)
    ax2.set_title("Cumulative Reward Trajectory", fontsize=11, fontweight="bold")
    ax2.set_xlim(0.5, len(turns) + 0.5)
    ax2.grid(axis="y", linestyle=":", alpha=0.4)
    ax2.legend(fontsize=8, framealpha=0.9)

    path = os.path.join(OUT_DIR, "reward_curve.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  [saved] {path}")


# ---------------------------------------------------------------------------
# Plot 3 — State transitions
# ---------------------------------------------------------------------------

def plot_state_transitions(df: pd.DataFrame) -> None:
    labels  = df["pred_label"].tolist()
    turns   = df["turn"].tolist()
    bas_arr = df["bas"].tolist()
    conf    = df["confidence"].tolist()
    n       = len(labels)

    LABEL_IDX = {"Focused": 2, "Distracted": 1, "Impulsive": 0}
    LABEL_NAME = {2: "Focused", 1: "Distracted", 0: "Impulsive"}

    fig = plt.figure(figsize=(15, 10))
    gs  = gridspec.GridSpec(3, 3, figure=fig, hspace=0.45, wspace=0.4)

    # ── A: State timeline (step plot) ──────────────────────────────────
    ax_main = fig.add_subplot(gs[0, :])
    y_vals  = [LABEL_IDX[l] for l in labels]

    ax_main.step(turns, y_vals, where="post", color="#546E7A", linewidth=1.0, alpha=0.5)
    for label, idx in LABEL_IDX.items():
        mask  = [i for i, l in enumerate(labels) if l == label]
        xvals = [turns[i] for i in mask]
        yvals = [idx] * len(mask)
        sizes = [c * 80 for c in [conf[i] for i in mask]]
        ax_main.scatter(xvals, yvals, c=LABEL_COLOR[label],
                        s=sizes, zorder=3, edgecolors="white",
                        linewidths=0.4, label=label, marker=LABEL_MARKER[label])

    ax_main.set_yticks([0, 1, 2])
    ax_main.set_yticklabels(["Impulsive", "Distracted", "Focused"], fontsize=9)
    ax_main.set_xlabel("Turn", fontsize=10)
    ax_main.set_xlim(0.5, n + 0.5)
    ax_main.set_title("Attention State Timeline  (marker size = classifier confidence)",
                       fontsize=11, fontweight="bold")
    ax_main.grid(axis="y", linestyle=":", alpha=0.35)
    ax_main.legend(fontsize=8, loc="upper right", framealpha=0.9)

    # ── B: Transition frequency heatmap ────────────────────────────────
    ax_hm = fig.add_subplot(gs[1, 0])
    ORDERED = ["Focused", "Distracted", "Impulsive"]
    trans   = np.zeros((3, 3), dtype=int)
    for i in range(n - 1):
        r = ORDERED.index(labels[i])
        c = ORDERED.index(labels[i + 1])
        trans[r, c] += 1

    trans_norm = trans.astype(float)
    row_sums   = trans.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1
    trans_norm = trans_norm / row_sums

    im = ax_hm.imshow(trans_norm, cmap="Blues", vmin=0, vmax=1)
    fig.colorbar(im, ax=ax_hm, fraction=0.046)
    ax_hm.set(xticks=range(3), yticks=range(3),
               xticklabels=ORDERED, yticklabels=ORDERED,
               xlabel="Next state", ylabel="Current state",
               title="Transition Matrix\n(row-normalised)")
    ax_hm.tick_params(axis="x", rotation=15, labelsize=8)
    ax_hm.tick_params(axis="y", labelsize=8)
    for r in range(3):
        for c in range(3):
            val   = trans_norm[r, c]
            color = "white" if val > 0.5 else "black"
            ax_hm.text(c, r, f"{val:.2f}", ha="center", va="center",
                       fontsize=9, color=color,
                       fontweight="bold" if r == c else "normal")

    # ── C: State distribution pie ───────────────────────────────────────
    ax_pie = fig.add_subplot(gs[1, 1])
    counts = Counter(labels)
    sizes  = [counts.get(l, 0) for l in ORDERED]
    colors = [LABEL_COLOR[l] for l in ORDERED]
    wedges, texts, autotexts = ax_pie.pie(
        sizes, labels=ORDERED, colors=colors,
        autopct="%1.0f%%", startangle=90,
        wedgeprops={"edgecolor": "white", "linewidth": 1.5},
    )
    for at in autotexts:
        at.set_fontsize(9)
    ax_pie.set_title("State Distribution\n(predicted)", fontsize=10, fontweight="bold")

    # ── D: BAS by state (violin / box) ──────────────────────────────────
    ax_vio = fig.add_subplot(gs[1, 2])
    data_by_label = {l: [] for l in ORDERED}
    for i, l in enumerate(labels):
        data_by_label[l].append(bas_arr[i])

    vp = ax_vio.violinplot(
        [data_by_label[l] for l in ORDERED],
        positions=range(3), widths=0.6, showmedians=True,
    )
    for i, (body, label) in enumerate(zip(vp["bodies"], ORDERED)):
        body.set_facecolor(LABEL_COLOR[label])
        body.set_alpha(0.7)
    vp["cmedians"].set_color("black")
    vp["cmedians"].set_linewidth(1.5)
    ax_vio.set_xticks(range(3))
    ax_vio.set_xticklabels(ORDERED, fontsize=8)
    ax_vio.set_ylabel("BAS Score", fontsize=9)
    ax_vio.set_title("BAS Distribution\nby Predicted State", fontsize=10, fontweight="bold")
    ax_vio.grid(axis="y", linestyle=":", alpha=0.4)

    # ── E: Self-transition vs switch rate over time (rolling) ───────────
    ax_roll = fig.add_subplot(gs[2, :2])
    window  = 10
    same    = [int(labels[i] == labels[i-1]) for i in range(1, n)]
    roll_persistence = [np.mean(same[max(0, i-window):i+1]) for i in range(len(same))]
    ax_roll.plot(turns[1:], roll_persistence, color="#7B1FA2", linewidth=2.0)
    ax_roll.fill_between(turns[1:], roll_persistence, alpha=0.15, color="#7B1FA2")
    ax_roll.axhline(np.mean(same), color="#7B1FA2", linestyle="--",
                    linewidth=1.0, label=f"Mean={np.mean(same):.2f}")
    ax_roll.set_ylim(0, 1.05)
    ax_roll.set_xlabel("Turn", fontsize=10)
    ax_roll.set_ylabel("State Persistence Rate", fontsize=10)
    ax_roll.set_title(f"Rolling State Persistence (window={window})\n"
                      "1 = same state as previous turn", fontsize=10, fontweight="bold")
    ax_roll.legend(fontsize=8)
    ax_roll.grid(linestyle=":", alpha=0.4)
    ax_roll.set_xlim(0.5, n + 0.5)

    # ── F: Transition sankey-style chord counts ─────────────────────────
    ax_bar = fig.add_subplot(gs[2, 2])
    pairs  = [f"{labels[i][0]}->{labels[i+1][0]}" for i in range(n-1)]
    pair_counts = Counter(pairs)
    pair_labels = sorted(pair_counts, key=pair_counts.get, reverse=True)[:8]
    pair_values = [pair_counts[p] for p in pair_labels]
    bar_colors_t = []
    for p in pair_labels:
        src = {"F": "Focused", "D": "Distracted", "I": "Impulsive"}[p[0]]
        bar_colors_t.append(LABEL_COLOR[src])
    ax_bar.barh(pair_labels[::-1], pair_values[::-1],
                color=bar_colors_t[::-1], edgecolor="white", height=0.6)
    ax_bar.set_xlabel("Count", fontsize=9)
    ax_bar.set_title("Top Transition\nPairs (F/D/I)", fontsize=10, fontweight="bold")
    ax_bar.tick_params(axis="y", labelsize=8)
    ax_bar.grid(axis="x", linestyle=":", alpha=0.4)
    ax_bar.spines[["top", "right"]].set_visible(False)

    fig.suptitle("ADHD-BAS — Attention State Transitions\n"
                 f"n={n} turns  |  "
                 f"Focused={counts.get('Focused', 0)}  "
                 f"Distracted={counts.get('Distracted', 0)}  "
                 f"Impulsive={counts.get('Impulsive', 0)}",
                 fontsize=13, fontweight="bold", y=1.01)

    path = os.path.join(OUT_DIR, "state_transitions.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  [saved] {path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)

    print("=" * 60)
    print("  ADHD-BAS Visualization")
    print("=" * 60)

    df = run_pipeline(N_SAMPLES)

    print("\n  Generating plots...")
    plot_bas_curve(df)
    plot_reward_curve(df)
    plot_state_transitions(df)

    # Console summary
    counts  = df["pred_label"].value_counts().to_dict()
    bas_arr = df["bas"].tolist()
    rewards = df["reward"].tolist()

    print("\n--- Session Summary ---")
    print(f"  Turns      : {N_SAMPLES}")
    print(f"  Focused    : {counts.get('Focused',    0)}  ({counts.get('Focused',    0)/N_SAMPLES:.0%})")
    print(f"  Distracted : {counts.get('Distracted', 0)}  ({counts.get('Distracted', 0)/N_SAMPLES:.0%})")
    print(f"  Impulsive  : {counts.get('Impulsive',  0)}  ({counts.get('Impulsive',  0)/N_SAMPLES:.0%})")
    print(f"  Start BAS  : {BAS_INITIAL:.1f}")
    print(f"  Final BAS  : {bas_arr[-1]:.1f}")
    print(f"  Mean BAS   : {np.mean(bas_arr):.1f}")
    print(f"  Total Rwd  : {sum(rewards):+.1f}")
    print(f"  Mean Rwd   : {np.mean(rewards):+.2f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
