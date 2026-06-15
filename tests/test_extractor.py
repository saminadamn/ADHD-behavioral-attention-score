"""
tests/test_extractor.py
-----------------------
Step 5: Standalone test for BehavioralSignalExtractor.
Loads 10 samples from synthetic_adhd.csv (balanced across labels),
runs the extractor on each, and displays results as a DataFrame.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd

from models.state import WorkflowState
from agents.signal_extractor import behavioral_signal_extractor

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "synthetic_adhd.csv")
N_PER_LABEL = 4   # 4 Focused + 3 Distracted + 3 Impulsive = 10 total


def load_samples(path: str, n_per_label: int) -> pd.DataFrame:
    df = pd.read_csv(path)
    parts = []
    for label in ("Focused", "Distracted", "Impulsive"):
        subset = df[df["attention_label"] == label].head(n_per_label)
        parts.append(subset)
    return pd.concat(parts, ignore_index=True).head(10)


def run_extractor(row: pd.Series) -> dict:
    state = WorkflowState(
        teacher_prompt=row["teacher_prompt"],
        student_response=row["student_response"],
        response_latency=row["response_latency_seconds"],
    )
    result = behavioral_signal_extractor(state)
    f = result["features"]
    return {
        "id":                  row["id"],
        "true_label":          row["attention_label"],
        "response_length":     f.response_length,
        "sentiment":           f.sentiment,
        "topic_shift_score":   f.topic_shift_score,
        "engagement_score":    f.engagement_score,
        "latency_score":       f.latency_score,
    }


def main() -> None:
    print("=" * 70)
    print("  BehavioralSignalExtractor — Node 1 Test")
    print("=" * 70)

    samples = load_samples(CSV_PATH, N_PER_LABEL)
    print(f"\nLoaded {len(samples)} samples  ({samples['attention_label'].value_counts().to_dict()})\n")

    records = []
    for _, row in samples.iterrows():
        records.append(run_extractor(row))

    results = pd.DataFrame(records)

    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 120)
    pd.set_option("display.float_format", "{:.3f}".format)

    print("\n--- Full Results ---")
    print(results.to_string(index=False))

    print("\n--- Mean per label ---")
    numeric_cols = ["response_length", "sentiment", "topic_shift_score",
                    "engagement_score", "latency_score"]
    print(results.groupby("true_label")[numeric_cols].mean().round(3).to_string())

    print("\n--- Sanity checks ---")
    checks = {
        "Impulsive avg response_length < Focused":
            results[results.true_label=="Impulsive"]["response_length"].mean() <
            results[results.true_label=="Focused"]["response_length"].mean(),

        "Impulsive avg latency_score < Distracted":
            results[results.true_label=="Impulsive"]["latency_score"].mean() <
            results[results.true_label=="Distracted"]["latency_score"].mean(),

        "Focused avg engagement_score > Impulsive":
            results[results.true_label=="Focused"]["engagement_score"].mean() >
            results[results.true_label=="Impulsive"]["engagement_score"].mean(),

        "All topic_shift_score in [0,1]":
            results["topic_shift_score"].between(0, 1).all(),

        "All latency_score in [0,1]":
            results["latency_score"].between(0, 1).all(),
    }
    all_passed = True
    for check, passed in checks.items():
        status = "PASS" if passed else "FAIL"
        if not passed:
            all_passed = False
        print(f"  [{status}] {check}")

    print(f"\n{'All checks passed.' if all_passed else 'Some checks FAILED.'}")
    print("=" * 70)


if __name__ == "__main__":
    main()
