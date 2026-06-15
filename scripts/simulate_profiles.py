"""
scripts/simulate_profiles.py
-----------------------------
Simulates three ADHD phenotype profiles through the BAS pipeline
and produces comparative visualisation plots.

Phenotypes
----------
Inattentive (ADHD-I)
    Predominantly Focused/Distracted cycling; impulsivity absent.
    Characteristic: sustained effort collapses into off-task drift.

Hyperactive-Impulsive (ADHD-HI)
    Predominantly Impulsive bursts with brief Focused windows.
    Characteristic: reward-seeking overrides response inhibition.

Combined (ADHD-C)
    Full triad: Focused periods disrupted by both Distracted drift
    and Impulsive outbursts.
    Characteristic: highest variability across all three dimensions.

Outputs
-------
outputs/figures/bas_profiles.png       three-panel BAS curves
outputs/figures/phenotype_radar.png    radar chart comparing key metrics
outputs/figures/phenotype_heatmap.png  turn-by-turn state heatmap
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import matplotlib.patches as mpatches
from matplotlib.lines import Line2D

from agents.reward_modeler import compute_reward
from agents.bas_tracker    import BAS_INITIAL, BAS_MIN, BAS_MAX, MA_WINDOW


def _ma_series(history: list[float], window: int) -> list[float]:
    """Return a moving-average series of the same length as history."""
    result = []
    for i in range(len(history)):
        start = max(0, i - window + 1)
        result.append(sum(history[start:i + 1]) / (i - start + 1))
    return result

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "outputs", "figures")

# ---------------------------------------------------------------------------
# Phenotype sequence definitions
# ---------------------------------------------------------------------------

PHENOTYPES: dict[str, list[str]] = {
    "Inattentive\n(ADHD-I)": [
        "Focused", "Distracted", "Distracted", "Focused", "Distracted",
        "Focused",  "Distracted", "Distracted", "Focused", "Distracted",
        "Focused",  "Distracted", "Focused",    "Distracted", "Distracted",
        "Focused",  "Distracted", "Focused",    "Distracted", "Focused",
        "Distracted","Focused",   "Distracted", "Focused",  "Distracted",
        "Focused",  "Distracted", "Distracted", "Focused",  "Distracted",
    ],
    "Hyperactive-Impulsive\n(ADHD-HI)": [
        "Impulsive", "Impulsive", "Focused", "Impulsive",
        "Impulsive", "Impulsive", "Focused", "Impulsive",
        "Focused",   "Impulsive", "Impulsive","Impulsive",
        "Focused",   "Impulsive", "Impulsive","Impulsive",
        "Impulsive", "Focused",   "Impulsive","Impulsive",
        "Impulsive", "Focused",   "Impulsive","Impulsive",
        "Impulsive", "Impulsive", "Focused",  "Impulsive",
        "Impulsive", "Focused",
    ],
    "Combined\n(ADHD-C)": [
        "Focused",    "Distracted", "Impulsive", "Distracted", "Focused",
        "Impulsive",  "Distracted", "Impulsive", "Focused",    "Distracted",
        "Impulsive",  "Distracted", "Focused",   "Impulsive",  "Distracted",
        "Focused",    "Distracted", "Impulsive", "Focused",    "Impulsive",
        "Distracted", "Impulsive",  "Focused",   "Distracted", "Impulsive",
        "Focused",    "Impulsive",  "Distracted","Focused",    "Impulsive",
    ],
}

LABEL_COLOR  = {"Focused": "#2196F3", "Distracted": "#FF9800", "Impulsive": "#F44336"}
PROFILE_COLOR = {
    "Inattentive\n(ADHD-I)":            "#9C27B0",
    "Hyperactive-Impulsive\n(ADHD-HI)": "#F44336",
    "Combined\n(ADHD-C)":               "#FF6F00",
}
PROFILE_LABEL = {k: k.replace("\n", " ") for k in PHENOTYPES}

# ---------------------------------------------------------------------------
# Simulation engine
# ---------------------------------------------------------------------------

def simulate(sequence: list[str]) -> dict:
    bas, history, rewards = BAS_INITIAL, [], []
    prev = None
    for label in sequence:
        reward = compute_reward(prev, label)
        bas    = float(np.clip(bas + reward, BAS_MIN, BAS_MAX))
        history.append(bas)
        rewards.append(reward)
        prev   = label

    ma   = _ma_series(history, MA_WINDOW)
    iiv  = float(np.std(rewards))        # reward volatility proxy
    auc  = float(np.trapezoid(history))   # area under BAS curve
    return {
        "sequence":    sequence,
        "bas_history": history,
        "rewards":     rewards,
        "ma":          ma,
        "final_bas":   history[-1],
        "mean_bas":    float(np.mean(history)),
        "min_bas":     float(np.min(history)),
        "max_bas":     float(np.max(history)),
        "iiv":         iiv,
        "auc":         auc,
        "n_focused":    sequence.count("Focused"),
        "n_distracted": sequence.count("Distracted"),
        "n_impulsive":  sequence.count("Impulsive"),
    }


# ---------------------------------------------------------------------------
# Plot 1 — BAS curves (3 panels stacked)
# ---------------------------------------------------------------------------

def plot_bas_profiles(results: dict[str, dict]) -> None:
    n_profiles = len(results)
    fig, axes  = plt.subplots(n_profiles, 1, figsize=(14, 4 * n_profiles),
                               sharex=False)
    fig.suptitle("BAS Score Over Time — ADHD Phenotype Comparison",
                 fontsize=14, fontweight="bold", y=1.01)

    for ax, (name, res) in zip(axes, results.items()):
        turns   = list(range(1, len(res["sequence"]) + 1))
        bas     = res["bas_history"]
        ma      = res["ma"]
        labels  = res["sequence"]
        color   = PROFILE_COLOR[name]

        # Shaded BAS zones
        ax.axhspan(70, 100, alpha=0.06, color="#2196F3")
        ax.axhspan( 0,  30, alpha=0.06, color="#F44336")
        ax.axhline(BAS_INITIAL, color="#9E9E9E", linewidth=0.8,
                   linestyle="--", alpha=0.7)

        # State-coloured scatter
        for label in ("Focused", "Distracted", "Impulsive"):
            idx = [i for i, l in enumerate(labels) if l == label]
            ax.scatter([turns[i] for i in idx], [bas[i] for i in idx],
                       color=LABEL_COLOR[label], s=55, zorder=4,
                       edgecolors="white", linewidths=0.5,
                       label=label, alpha=0.9)

        # Raw BAS + MA
        ax.plot(turns, bas, color=color, linewidth=1.0, alpha=0.45, zorder=2)
        ax.plot(turns, ma,  color=color, linewidth=2.5,
                label=f"MA-{MA_WINDOW}", zorder=3)

        # Stats annotation box
        stats = (f"Mean={res['mean_bas']:.1f}  "
                 f"Min={res['min_bas']:.1f}  "
                 f"Max={res['max_bas']:.1f}  "
                 f"Final={res['final_bas']:.1f}  "
                 f"IIV={res['iiv']:.2f}")
        ax.text(0.01, 0.97, stats, transform=ax.transAxes,
                fontsize=8, va="top", ha="left",
                bbox=dict(boxstyle="round,pad=0.3", fc="white", alpha=0.8))

        ax.set_title(PROFILE_LABEL[name], fontsize=11, fontweight="bold",
                     color=color, pad=4)
        ax.set_ylim(0, 108)
        ax.set_xlim(0.5, len(turns) + 0.5)
        ax.set_ylabel("BAS Score", fontsize=9)
        ax.grid(axis="y", linestyle=":", alpha=0.4)

        legend_patches = [
            mpatches.Patch(color=LABEL_COLOR[l], label=l)
            for l in ("Focused", "Distracted", "Impulsive")
        ]
        legend_patches.append(
            Line2D([0], [0], color=color, linewidth=2.5, label=f"MA-{MA_WINDOW}")
        )
        ax.legend(handles=legend_patches, fontsize=8, loc="upper right",
                  framealpha=0.9, ncol=4)

    axes[-1].set_xlabel("Turn", fontsize=11)
    plt.tight_layout()
    path = os.path.join(OUT_DIR, "bas_profiles.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  [saved] {path}")


# ---------------------------------------------------------------------------
# Plot 2 — Radar chart (phenotype comparison)
# ---------------------------------------------------------------------------

def plot_radar(results: dict[str, dict]) -> None:
    metrics = ["Mean BAS", "Min BAS", "Max BAS", "% Focused",
               "% Distracted", "% Impulsive", "Reward\nVolatility (IIV)"]
    n_metrics = len(metrics)
    angles    = np.linspace(0, 2 * np.pi, n_metrics, endpoint=False).tolist()
    angles   += angles[:1]   # close the polygon

    fig, ax = plt.subplots(figsize=(8, 8),
                            subplot_kw=dict(polar=True))

    for name, res in results.items():
        n = len(res["sequence"])
        values = [
            res["mean_bas"] / 100,
            res["min_bas"]  / 100,
            res["max_bas"]  / 100,
            res["n_focused"]    / n,
            res["n_distracted"] / n,
            res["n_impulsive"]  / n,
            min(res["iiv"] / 10, 1.0),   # normalise; max expected ~10
        ]
        values += values[:1]
        color = PROFILE_COLOR[name]
        label = PROFILE_LABEL[name]
        ax.plot(angles, values, color=color, linewidth=2.2, label=label)
        ax.fill(angles, values, color=color, alpha=0.12)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(metrics, fontsize=9)
    ax.set_yticks([0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["25%", "50%", "75%", "100%"], fontsize=7)
    ax.set_ylim(0, 1)
    ax.set_title("ADHD Phenotype Profile Comparison\n(radar, all axes 0–100%)",
                 fontsize=12, fontweight="bold", pad=20)
    ax.legend(loc="lower right", bbox_to_anchor=(1.35, -0.05),
              fontsize=9, framealpha=0.9)
    ax.grid(True, linestyle=":", alpha=0.5)

    path = os.path.join(OUT_DIR, "phenotype_radar.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  [saved] {path}")


# ---------------------------------------------------------------------------
# Plot 3 — Side-by-side state heatmap
# ---------------------------------------------------------------------------

def plot_heatmap(results: dict[str, dict]) -> None:
    STATE_IDX = {"Focused": 0, "Distracted": 1, "Impulsive": 2}
    import matplotlib.colors as mcolors
    CMAP      = mcolors.ListedColormap(
        [LABEL_COLOR["Focused"], LABEL_COLOR["Distracted"], LABEL_COLOR["Impulsive"]]
    )

    n_profiles = len(results)
    n_turns    = max(len(r["sequence"]) for r in results.values())

    fig, axes = plt.subplots(n_profiles, 1, figsize=(14, 2.5 * n_profiles),
                              sharex=True)
    fig.suptitle("Attention State Heatmap — Turn-by-Turn",
                 fontsize=13, fontweight="bold", y=1.01)

    for ax, (name, res) in zip(axes, results.items()):
        seq = res["sequence"]
        row = np.full((1, n_turns), np.nan)
        for i, label in enumerate(seq):
            row[0, i] = STATE_IDX[label]

        ax.imshow(row, aspect="auto", cmap=CMAP, vmin=0, vmax=2,
                  interpolation="nearest")

        # BAS overlay on twin axis
        ax2 = ax.twinx()
        turns = list(range(1, len(seq) + 1))
        ax2.plot(turns, res["bas_history"], color="white",
                 linewidth=2.0, alpha=0.85, zorder=3)
        ax2.plot(turns, res["ma"], color="#212121",
                 linewidth=1.5, linestyle="--", alpha=0.6, zorder=4,
                 label=f"MA-{MA_WINDOW}")
        ax2.set_ylim(0, 105)
        ax2.set_ylabel("BAS", fontsize=8, color="#444444")
        ax2.tick_params(axis="y", labelsize=7)

        ax.set_xlim(0.5, n_turns + 0.5)
        ax.set_yticks([])
        ax.set_title(PROFILE_LABEL[name], fontsize=10, fontweight="bold",
                     color=PROFILE_COLOR[name], pad=3)

    axes[-1].set_xlabel("Turn", fontsize=11)

    legend_patches = [
        mpatches.Patch(color=LABEL_COLOR[l], label=l)
        for l in ("Focused", "Distracted", "Impulsive")
    ]
    legend_patches.append(
        Line2D([0], [0], color="white", linewidth=2, label="BAS (white)")
    )
    legend_patches.append(
        Line2D([0], [0], color="#212121", linewidth=1.5, linestyle="--",
               label=f"MA-{MA_WINDOW}")
    )
    fig.legend(handles=legend_patches, loc="lower center",
               bbox_to_anchor=(0.5, -0.04), ncol=5, fontsize=9, framealpha=0.9)

    plt.tight_layout()
    path = os.path.join(OUT_DIR, "phenotype_heatmap.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  [saved] {path}")


# ---------------------------------------------------------------------------
# Console summary table
# ---------------------------------------------------------------------------

def print_summary(results: dict[str, dict]) -> None:
    print("\n" + "=" * 75)
    print("  ADHD Phenotype Simulation Summary")
    print("=" * 75)
    hdr = f"  {'Profile':<28} {'Mean':>6} {'Min':>6} {'Max':>6} {'Final':>6} " \
          f"{'IIV':>6} {'%F':>5} {'%D':>5} {'%I':>5}"
    print(hdr)
    print("  " + "-" * 72)
    for name, res in results.items():
        n   = len(res["sequence"])
        row = (
            f"  {PROFILE_LABEL[name]:<28}"
            f" {res['mean_bas']:>6.1f}"
            f" {res['min_bas']:>6.1f}"
            f" {res['max_bas']:>6.1f}"
            f" {res['final_bas']:>6.1f}"
            f" {res['iiv']:>6.2f}"
            f" {res['n_focused']/n*100:>4.0f}%"
            f" {res['n_distracted']/n*100:>4.0f}%"
            f" {res['n_impulsive']/n*100:>4.0f}%"
        )
        print(row)
    print("=" * 75)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    print("=" * 60)
    print("  ADHD Phenotype Simulator")
    print("=" * 60)

    results = {}
    for name, seq in PHENOTYPES.items():
        results[name] = simulate(seq)
        label = PROFILE_LABEL[name]
        print(f"  Simulated {label:<32}  "
              f"turns={len(seq)}  final BAS={results[name]['final_bas']:.1f}")

    print("\n  Generating figures...")
    plot_bas_profiles(results)
    plot_radar(results)
    plot_heatmap(results)

    print_summary(results)


if __name__ == "__main__":
    main()
