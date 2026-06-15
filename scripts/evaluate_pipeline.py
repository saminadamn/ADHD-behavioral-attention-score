"""
scripts/evaluate_pipeline.py
-----------------------------
Runs the full synthetic dataset through:
    Node 1 - BehavioralSignalExtractor
    Node 2 - AttentionStateClassifier

Outputs
-------
outputs/results/classification_report.txt   full sklearn classification report
outputs/results/metrics.csv                 per-label + macro/weighted metrics
outputs/figures/confusion_matrix.png        annotated confusion matrix heatmap
"""

from __future__ import annotations

import os
import sys
import time
import csv
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

from models.state import WorkflowState
from agents.signal_extractor import behavioral_signal_extractor
from agents.state_classifier import attention_state_classifier

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT        = os.path.join(os.path.dirname(__file__), "..")
CSV_PATH    = os.path.join(ROOT, "data", "raw", "synthetic_adhd.csv")
OUT_RESULTS = os.path.join(ROOT, "outputs", "results")
OUT_FIGURES = os.path.join(ROOT, "outputs", "figures")
REPORT_PATH = os.path.join(OUT_RESULTS, "classification_report.txt")
METRICS_CSV = os.path.join(OUT_RESULTS, "metrics.csv")
CM_PNG      = os.path.join(OUT_FIGURES, "confusion_matrix.png")

LABELS      = ["Focused", "Distracted", "Impulsive"]
LABEL_COLORS = {
    "Focused":    "#2196F3",
    "Distracted": "#FF9800",
    "Impulsive":  "#F44336",
}

# ---------------------------------------------------------------------------
# Pipeline runner
# ---------------------------------------------------------------------------

def run_sample(row: pd.Series) -> dict:
    """Run extractor + classifier on one CSV row. Returns result dict."""
    state = WorkflowState(
        teacher_prompt   = str(row["teacher_prompt"]),
        student_response = str(row["student_response"]),
        response_latency = float(row["response_latency_seconds"]),
    )

    ext_result = behavioral_signal_extractor(state)
    if "error" in ext_result:
        return {"id": row["id"], "true": row["attention_label"],
                "pred": "ERROR", "confidence": 0.0, **{}}

    state = state.model_copy(update=ext_result)
    cls_result = attention_state_classifier(state)

    f = state.features
    return {
        "id":                 int(row["id"]),
        "true_label":         str(row["attention_label"]),
        "predicted_label":    str(cls_result.get("attention_state", "ERROR")),
        "confidence":         float(cls_result.get("confidence", 0.0)),
        "response_length":    f.response_length,
        "sentiment":          f.sentiment,
        "topic_shift_score":  f.topic_shift_score,
        "engagement_score":   f.engagement_score,
        "latency_score":      f.latency_score,
    }


# ---------------------------------------------------------------------------
# Progress bar
# ---------------------------------------------------------------------------

def _progress(current: int, total: int, bar_width: int = 40) -> None:
    pct    = current / total
    filled = int(pct * bar_width)
    bar    = "#" * filled + "-" * (bar_width - filled)
    print(f"\r  [{bar}] {current:>4}/{total}  ({pct:.0%})", end="", flush=True)


# ---------------------------------------------------------------------------
# Metric helpers
# ---------------------------------------------------------------------------

def compute_metrics(y_true: list, y_pred: list) -> dict:
    acc = accuracy_score(y_true, y_pred)
    report_str = classification_report(
        y_true, y_pred, target_names=LABELS, digits=4, zero_division=0
    )
    per_label = {}
    for avg in ("macro", "weighted"):
        per_label[avg] = {
            "precision": precision_score(y_true, y_pred, average=avg, zero_division=0),
            "recall":    recall_score(y_true, y_pred, average=avg, zero_division=0),
            "f1":        f1_score(y_true, y_pred, average=avg, zero_division=0),
        }
    for label in LABELS:
        per_label[label] = {
            "precision": precision_score(y_true, y_pred, labels=[label], average="macro", zero_division=0),
            "recall":    recall_score(y_true, y_pred, labels=[label], average="macro", zero_division=0),
            "f1":        f1_score(y_true, y_pred, labels=[label], average="macro", zero_division=0),
        }
    cm = confusion_matrix(y_true, y_pred, labels=LABELS)
    return {"accuracy": acc, "report_str": report_str, "per_label": per_label, "cm": cm}


# ---------------------------------------------------------------------------
# Save: classification report txt
# ---------------------------------------------------------------------------

def save_report(metrics: dict, results_df: pd.DataFrame, elapsed: float) -> None:
    os.makedirs(OUT_RESULTS, exist_ok=True)
    n = len(results_df)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = [
        "=" * 65,
        "  ADHD-BAS Pipeline Evaluation Report",
        f"  Generated : {timestamp}",
        f"  Dataset   : synthetic_adhd.csv  ({n} samples)",
        f"  Runtime   : {elapsed:.1f}s  ({elapsed/n*1000:.0f}ms/sample avg)",
        "=" * 65,
        "",
        "--- Classification Report ---",
        "",
        metrics["report_str"],
        "",
        "--- Overall Accuracy ---",
        f"  {metrics['accuracy']:.4f}  ({metrics['accuracy']:.1%})",
        "",
        "--- Macro-Averaged Metrics ---",
        f"  Precision : {metrics['per_label']['macro']['precision']:.4f}",
        f"  Recall    : {metrics['per_label']['macro']['recall']:.4f}",
        f"  F1 Score  : {metrics['per_label']['macro']['f1']:.4f}",
        "",
        "--- Weighted-Averaged Metrics ---",
        f"  Precision : {metrics['per_label']['weighted']['precision']:.4f}",
        f"  Recall    : {metrics['per_label']['weighted']['recall']:.4f}",
        f"  F1 Score  : {metrics['per_label']['weighted']['f1']:.4f}",
        "",
        "--- Confusion Matrix (rows=True, cols=Predicted) ---",
        "",
        f"  {'':>12}  " + "  ".join(f"{l:>12}" for l in LABELS),
    ]
    cm = metrics["cm"]
    for i, true_label in enumerate(LABELS):
        row_str = "  ".join(f"{cm[i,j]:>12}" for j in range(len(LABELS)))
        lines.append(f"  {true_label:>12}  {row_str}")

    lines += [
        "",
        "--- Confidence Statistics per True Label ---",
        "",
    ]
    conf_stats = results_df.groupby("true_label")["confidence"].describe().round(4)
    lines.append(conf_stats.to_string())
    lines += ["", "=" * 65]

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\n  [saved] {REPORT_PATH}")


# ---------------------------------------------------------------------------
# Save: metrics CSV
# ---------------------------------------------------------------------------

def save_metrics_csv(metrics: dict) -> None:
    os.makedirs(OUT_RESULTS, exist_ok=True)
    rows = []
    # Overall
    rows.append({
        "label": "overall", "average": "all",
        "precision": "N/A", "recall": "N/A", "f1": "N/A",
        "accuracy": round(metrics["accuracy"], 4),
    })
    # Per-label
    for label in LABELS:
        m = metrics["per_label"][label]
        rows.append({
            "label": label, "average": "per-class",
            "precision": round(m["precision"], 4),
            "recall":    round(m["recall"], 4),
            "f1":        round(m["f1"], 4),
            "accuracy":  "N/A",
        })
    # Macro + weighted
    for avg in ("macro", "weighted"):
        m = metrics["per_label"][avg]
        rows.append({
            "label": avg, "average": avg,
            "precision": round(m["precision"], 4),
            "recall":    round(m["recall"], 4),
            "f1":        round(m["f1"], 4),
            "accuracy":  "N/A",
        })

    fieldnames = ["label", "average", "precision", "recall", "f1", "accuracy"]
    with open(METRICS_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"  [saved] {METRICS_CSV}")


# ---------------------------------------------------------------------------
# Save: confusion matrix PNG
# ---------------------------------------------------------------------------

def save_confusion_matrix(metrics: dict, n_samples: int) -> None:
    os.makedirs(OUT_FIGURES, exist_ok=True)
    cm      = metrics["cm"]
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle(
        "AttentionStateClassifier — Confusion Matrix\n"
        f"ADHD-BAS Pipeline  |  n={n_samples} samples  |  "
        f"Accuracy={metrics['accuracy']:.1%}  |  "
        f"Macro-F1={metrics['per_label']['macro']['f1']:.3f}",
        fontsize=12, fontweight="bold", y=1.01,
    )

    for ax, data, title, fmt, vmax in [
        (axes[0], cm,      "Raw Counts",        "d",    cm.max()),
        (axes[1], cm_norm, "Row-Normalised (%)", ".2%",  1.0),
    ]:
        im = ax.imshow(data, interpolation="nearest", cmap="Blues", vmin=0, vmax=vmax)
        fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
        ax.set(
            xticks=range(len(LABELS)),
            yticks=range(len(LABELS)),
            xticklabels=LABELS,
            yticklabels=LABELS,
            xlabel="Predicted label",
            ylabel="True label",
            title=title,
        )
        ax.xaxis.set_label_position("bottom")
        ax.xaxis.tick_bottom()

        thresh = data.max() / 2.0
        for i in range(len(LABELS)):
            for j in range(len(LABELS)):
                val     = data[i, j]
                txt     = format(val, fmt)
                color   = "white" if val > thresh else "black"
                weight  = "bold" if i == j else "normal"
                ax.text(j, i, txt, ha="center", va="center",
                        color=color, fontsize=11, fontweight=weight)

    # Per-label F1 bar inset
    ax3 = fig.add_axes([0.38, 0.15, 0.22, 0.55])
    f1_vals  = [metrics["per_label"][l]["f1"] for l in LABELS]
    colors   = [LABEL_COLORS[l] for l in LABELS]
    bars     = ax3.barh(LABELS, f1_vals, color=colors, edgecolor="white", height=0.5)
    ax3.set_xlim(0, 1.05)
    ax3.set_xlabel("F1 Score", fontsize=9)
    ax3.set_title("Per-class F1", fontsize=9, fontweight="bold")
    ax3.xaxis.set_major_formatter(mticker.PercentFormatter(xmax=1))
    ax3.tick_params(axis="both", labelsize=8)
    for bar, val in zip(bars, f1_vals):
        ax3.text(val + 0.02, bar.get_y() + bar.get_height() / 2,
                 f"{val:.2f}", va="center", fontsize=8)
    ax3.set_facecolor("#f8f8f8")
    ax3.spines[["top", "right"]].set_visible(False)

    plt.tight_layout()
    fig.savefig(CM_PNG, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  [saved] {CM_PNG}")


# ---------------------------------------------------------------------------
# Console summary
# ---------------------------------------------------------------------------

def print_summary(metrics: dict, results_df: pd.DataFrame, elapsed: float) -> None:
    n       = len(results_df)
    acc     = metrics["accuracy"]
    macro   = metrics["per_label"]["macro"]
    cm      = metrics["cm"]

    print("\n" + "=" * 65)
    print("  EVALUATION SUMMARY")
    print("=" * 65)
    print(f"\n  Samples evaluated : {n}")
    print(f"  Runtime           : {elapsed:.1f}s  ({elapsed/n*1000:.0f}ms/sample)")
    print(f"\n  Accuracy          : {acc:.4f}  ({acc:.1%})")
    print(f"  Macro Precision   : {macro['precision']:.4f}")
    print(f"  Macro Recall      : {macro['recall']:.4f}")
    print(f"  Macro F1          : {macro['f1']:.4f}")

    print("\n  --- Per-class Metrics ---")
    print(f"  {'Class':<14} {'Precision':>10} {'Recall':>10} {'F1':>10} {'Support':>10}")
    print(f"  {'-'*14}  {'-'*9}  {'-'*9}  {'-'*9}  {'-'*9}")
    for i, label in enumerate(LABELS):
        m       = metrics["per_label"][label]
        support = int(cm[i].sum())
        print(f"  {label:<14} {m['precision']:>10.4f} {m['recall']:>10.4f} "
              f"{m['f1']:>10.4f} {support:>10}")

    print("\n  --- Confusion Matrix (raw counts) ---")
    print(f"  {'':>14}", end="")
    for l in LABELS:
        print(f"  {l:>12}", end="")
    print("  <- Predicted")
    for i, true_label in enumerate(LABELS):
        print(f"  {true_label:>14}", end="")
        for j in range(len(LABELS)):
            mark = " *" if i == j else "  "
            print(f"  {cm[i,j]:>11}{mark}", end="")
        print()

    print("\n  --- Confidence Distribution per True Label ---")
    conf_stats = (
        results_df.groupby("true_label")["confidence"]
        .agg(["mean", "std", "min", "max"])
        .round(3)
    )
    print(conf_stats.to_string())
    print("\n" + "=" * 65)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--quiet", "-q", action="store_true",
                        help="Suppress per-sample extractor/classifier logs")
    args = parser.parse_args()

    if args.quiet:
        import agents.signal_extractor as _se
        import agents.state_classifier as _sc
        _se._log_extraction = lambda *a, **kw: None
        _sc._log            = lambda *a, **kw: None

    print("=" * 65)
    print("  ADHD-BAS Pipeline Evaluation")
    print("=" * 65)

    df = pd.read_csv(CSV_PATH)
    n  = len(df)
    print(f"\n  Dataset  : {CSV_PATH}")
    print(f"  Samples  : {n}")
    print(f"  Labels   : {df['attention_label'].value_counts().to_dict()}")
    print(f"\n  Running pipeline (this may take a minute)...\n")

    records    = []
    t_start    = time.time()

    for idx, (_, row) in enumerate(df.iterrows(), 1):
        records.append(run_sample(row))
        if idx % 10 == 0 or idx == n:
            _progress(idx, n)

    elapsed = time.time() - t_start
    print()  # newline after progress bar

    results_df = pd.DataFrame(records)
    y_true     = results_df["true_label"].tolist()
    y_pred     = results_df["predicted_label"].tolist()

    metrics = compute_metrics(y_true, y_pred)

    # --- Outputs ---
    save_report(metrics, results_df, elapsed)
    save_metrics_csv(metrics)
    save_confusion_matrix(metrics, n)

    print_summary(metrics, results_df, elapsed)

    print("\n  Outputs written to:")
    print(f"    {REPORT_PATH}")
    print(f"    {METRICS_CSV}")
    print(f"    {CM_PNG}")
    print()


if __name__ == "__main__":
    main()
