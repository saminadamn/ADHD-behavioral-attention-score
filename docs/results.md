# Results

## Classification Performance

Evaluated on 500 synthetic samples (`scripts/evaluate_pipeline.py`).

| Metric | Value |
|---|---|
| Accuracy | 78.0% |
| Macro Precision | 0.79 |
| Macro Recall | 0.78 |
| Macro F1 | 0.764 |

### Per-Class F1

| Class | Precision | Recall | F1 |
|---|---|---|---|
| Focused | 0.74 | 0.74 | 0.74 |
| Distracted | 0.63 | 0.52 | 0.57 |
| Impulsive | 0.98 | 0.98 | 0.98 |

**Impulsive** classification is near-perfect because the word-count and latency signals are highly discriminative for this class.

**Distracted** shows the lowest F1 (0.57) because the Distracted/Focused boundary is blurry when topic shift is moderate — some on-topic but disengaged responses fall near the 0.55 threshold.

## ADHD Phenotype Simulation

Simulated over 30 turns each (`scripts/simulate_profiles.py`).

| Profile | Mean BAS | Min BAS | Max BAS | Final BAS | IIV |
|---|---|---|---|---|---|
| Inattentive (ADHD-I) | 53.9 | 45.0 | 65.0 | 57.0 | 6.64 |
| Hyperactive-Impulsive (ADHD-HI) | 19.3 | 0.0 | 50.0 | 8.0 | 6.27 |
| Combined (ADHD-C) | 54.1 | 49.0 | 63.0 | 55.0 | 5.77 |

### Observations

- **ADHD-HI** shows the most severe BAS collapse (mean=19.3, final=8.0), consistent with the heavy impulsive penalty (-5 per Impulsive→Impulsive transition) accumulating over 73% Impulsive turns.
- **ADHD-I** oscillates in the moderate range (45–65) due to alternating Focused/Distracted transitions, each partially cancelling the other.
- **Combined (ADHD-C)** paradoxically shows a slightly higher mean BAS than Inattentive, because the recovery bonus from Impulsive→Focused (+8) partially offsets the cost of Impulsive turns. The triad of states creates more frequent recovery transitions.
- IIV (reward volatility) is highest in ADHD-I (6.64), reflecting the oscillating Focused/Distracted pattern.

## BAS Trajectory Figures

- `outputs/figures/bas_profiles.png` — per-phenotype BAS curve with MA-5 overlay and state-coloured scatter
- `outputs/figures/phenotype_radar.png` — radar chart comparing Mean BAS, Min/Max, % per state, IIV
- `outputs/figures/phenotype_heatmap.png` — turn-by-turn state heatmap with BAS overlay

## Intervention Tier Coverage

All 16 tier × state combinations pass the completeness test (non-empty intervention and rationale strings). Boundary checks at BAS = 25, 50, 75 all pass (24/24).
