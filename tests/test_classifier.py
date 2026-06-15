"""
tests/test_classifier.py
------------------------
Step 7: Test AttentionStateClassifier in isolation.
Runs the extractor → classifier pipeline on 15 samples (5 per label)
and reports per-label accuracy + confusion matrix.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd

from models.state import WorkflowState
from agents.signal_extractor import behavioral_signal_extractor
from agents.state_classifier import attention_state_classifier

CSV_PATH    = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "synthetic_adhd.csv")
N_PER_LABEL = 5


def load_samples(path: str, n: int) -> pd.DataFrame:
    df   = pd.read_csv(path)
    parts = [df[df["attention_label"] == l].head(n) for l in ("Focused", "Distracted", "Impulsive")]
    return pd.concat(parts, ignore_index=True)


def run_pipeline(row: pd.Series) -> dict:
    state = WorkflowState(
        teacher_prompt    = row["teacher_prompt"],
        student_response  = row["student_response"],
        response_latency  = row["response_latency_seconds"],
    )
    # Node 1 — extractor
    ext_update = behavioral_signal_extractor(state)
    state      = state.model_copy(update=ext_update)

    # Node 2 — classifier
    cls_update = attention_state_classifier(state)
    return {
        "id":               row["id"],
        "true_label":       row["attention_label"],
        "predicted_label":  cls_update.get("attention_state", "ERROR"),
        "confidence":       cls_update.get("confidence", 0.0),
        "topic_shift":      state.features.topic_shift_score,
        "engagement":       state.features.engagement_score,
        "latency":          state.features.latency_score,
        "words":            state.features.response_length,
    }


def print_confusion(df: pd.DataFrame) -> None:
    labels = ["Focused", "Distracted", "Impulsive"]
    print(f"\n  {'':>12}", end="")
    for l in labels:
        print(f"  {l:>12}", end="")
    print("  <- Predicted")
    print(f"  {'True':>12}" + "-" * 42)

    for true in labels:
        print(f"  {true:>12}", end="")
        subset = df[df["true_label"] == true]
        for pred in labels:
            count = (subset["predicted_label"] == pred).sum()
            print(f"  {count:>12}", end="")
        print()


def main() -> None:
    print("=" * 70)
    print("  AttentionStateClassifier — Node 2 Test")
    print("=" * 70)

    samples = load_samples(CSV_PATH, N_PER_LABEL)
    print(f"\nRunning pipeline on {len(samples)} samples...\n")

    records = [run_pipeline(row) for _, row in samples.iterrows()]
    results = pd.DataFrame(records)

    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 120)
    pd.set_option("display.float_format", "{:.3f}".format)

    print("\n--- Per-sample Results ---")
    display_cols = ["id", "true_label", "predicted_label", "confidence",
                    "words", "topic_shift", "engagement", "latency"]
    print(results[display_cols].to_string(index=False))

    print("\n--- Confusion Matrix ---")
    print_confusion(results)

    correct = (results["true_label"] == results["predicted_label"]).sum()
    total   = len(results)
    acc     = correct / total

    print(f"\n--- Per-label Accuracy ---")
    for label in ("Focused", "Distracted", "Impulsive"):
        sub  = results[results["true_label"] == label]
        hits = (sub["true_label"] == sub["predicted_label"]).sum()
        print(f"  {label:<12}: {hits}/{len(sub)}  ({hits/len(sub):.0%})")

    print(f"\n  Overall accuracy: {correct}/{total}  ({acc:.0%})")

    print("\n--- Confidence Stats ---")
    print(results.groupby("true_label")["confidence"].describe().round(3).to_string())
    print("=" * 70)


if __name__ == "__main__":
    main()
