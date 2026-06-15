# Methodology

## Theoretical Grounding

### Behavioural Activation System (BAS)
The BAS (Gray & McNaughton, 2000) is a neurobiological motivational system sensitive to signals of reward and non-punishment. In ADHD, elevated BAS sensitivity is associated with impulsive reward-seeking, while depressed BAS is associated with motivational withdrawal and inattention (Nigg, 2001). ADHD-BAS operationalises BAS as a continuous score (0–100) updated turn-by-turn based on reinforcement learning reward signals.

### Intra-Individual Variability (IIV)
IIV — the within-person fluctuation in cognitive performance across trials — is a robust ADHD biomarker (Hultsch et al., 2008). In this system, IIV is approximated as the standard deviation of per-turn rewards across a session, capturing the degree of attentional instability.

### Attention State Classification
Classroom attention is modelled as three mutually exclusive states:

| State | Description |
|---|---|
| **Focused** | On-task, coherent, appropriately paced response |
| **Distracted** | Off-topic, semantically drifted, or slow response |
| **Impulsive** | Very short or very fast response reflecting response inhibition failure |

## Feature Extraction

Five features are computed per turn:

| Feature | Method | Range |
|---|---|---|
| `response_length` | Word count | Integer |
| `sentiment` | TextBlob polarity | -1 to +1 |
| `topic_shift_score` | 1 - cosine_similarity(prompt, response) via `all-MiniLM-L6-v2` | 0 to 1 |
| `engagement_score` | 0.4 * length_bucket + 0.6 * (1 - topic_shift) | 0 to 1 |
| `latency_score` | Min-max normalised latency (0.5–25 s range) | 0 to 1 |

## Classification Rules

Priority order: Impulsive > Distracted > Focused

**Impulsive**: `words < 6 OR latency_score < 0.12` (with `engagement < 0.45` guard to avoid classifying brief but on-topic responses as impulsive)

**Distracted**: `topic_shift > 0.55 OR (latency_score > 0.60 AND engagement < 0.55)`

**Focused**: default

Confidence is derived from the margin between the triggering signal and its threshold.

## Reward Function

Rewards are defined over all (previous, current) transition pairs:

|  | -> Focused | -> Distracted | -> Impulsive |
|---|---|---|---|
| **Focused** | +10 | -6 | -8 |
| **Distracted** | +8 | -4 | 0 |
| **Impulsive** | +8 | 0 | -5 |
| **(first turn)** | +5 | -2 | -3 |

Design rationale:
- Recovery from off-task states (`+8`) is rewarded nearly as highly as sustained focus (`+10`) to avoid discouraging students who re-engage.
- Distracted→Impulsive (`0`) avoids double-penalising already-declining BAS.
- First-turn rewards are attenuated to avoid over-weighting a single cold-start observation.

## BAS Update Rule

```
BAS_t = clamp(BAS_{t-1} + reward_t, 0, 100)
```

Initial BAS = 50 (neutral baseline). Moving-average window = 5 turns for trajectory smoothing.

## Synthetic Dataset

500 samples were generated with topic-aligned teacher prompt / student response pairs to ensure realistic semantic similarity scores. Label distribution: Focused 33%, Distracted 33%, Impulsive 33% (balanced). Latency is sampled from per-label Gaussian distributions parameterised on ADHD literature norms.
