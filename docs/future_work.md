# Future Work

## Short-Term (0–3 months)

### 1. Learned Attention Classifier
Replace the rule-based classifier with a fine-tuned transformer (e.g., DistilBERT or a small LLaMA variant) trained on labelled classroom interaction data. This would remove the dependency on manually chosen thresholds and extend to new subject domains automatically.

### 2. Reinforcement Learning from Human Feedback (RLHF) for Rewards
Replace the hand-designed reward table with rewards learned from teacher or expert annotations of session quality. A preference model trained on paired session outcomes would produce a more ecologically valid reward signal.

### 3. Real Data Collection and Validation
Partner with educational researchers to collect anonymised classroom interaction logs with teacher-labelled attention assessments. Validate the classification pipeline against expert labels and the BAS proxy against standardised BIS/BAS scales.

### 4. BAS Calibration Per Participant
Introduce a participant-level profile (age, diagnosis, medication, historical BAS baseline) to shift and scale the BAS update rule. This would allow the system to distinguish between a student whose BAS of 40 is typical for them versus one who normally scores 70.

## Medium-Term (3–9 months)

### 5. Multi-Turn Memory Window
Extend memory beyond one previous turn to a sliding window of N turns. Compute trajectory features (slope, variability, trend change points) and feed these into the classifier and reward model for richer contextual awareness.

### 6. Multimodal Signal Fusion
Integrate non-verbal signals alongside text:
- **Latency as ground truth** (already present)
- **Acoustic features** from speech (pause duration, speech rate, prosody) via a lightweight speech model
- **Physiological wearable data** (EDA, HR) if available in the deployment context

### 7. LLM-Backed Dynamic Interventions
Replace the static intervention catalogue with a prompt-conditioned LLM (e.g., Claude Haiku) that generates personalised, context-aware interventions based on the full session history, current BAS, and student profile. The static catalogue would serve as a fallback.

### 8. Teacher-Facing Dashboard
Build a lightweight real-time dashboard (e.g., Streamlit or React) that displays:
- Live BAS trajectory curve
- Current attention state with confidence
- Intervention recommendation
- Session-level IIV and trend summary

## Long-Term (9+ months)

### 9. Clinical Validation Study
Conduct a controlled study comparing BAS-guided interventions against standard teacher practice. Primary outcome: learning gain on post-session assessments. Secondary outcomes: time-on-task, teacher-rated engagement, student self-reported wellbeing.

### 10. Federated Learning for Privacy-Preserving Adaptation
Train participant-level models without centralising raw interaction data. Each school or device contributes gradient updates rather than raw text, preserving student privacy while improving global model accuracy over time.

### 11. Extension to Other Neurodevelopmental Conditions
The BAS framework is not ADHD-specific. Future work could extend the phenotype taxonomy to include ASD (sensory processing differences), dyscalculia (domain-specific cognitive load), and anxiety-driven avoidance, each requiring distinct reward calibration and intervention catalogues.

### 12. Longitudinal Trajectory Modelling
Track BAS across multiple sessions over weeks or months. Model longitudinal BAS trends as a function of intervention history, medication changes, and academic progress. This would enable early identification of students whose BAS trajectory predicts future academic disengagement.

## Open Research Questions

- Can IIV (as measured by reward volatility) predict ADHD diagnosis better than mean BAS?
- Is a 5-turn moving-average window optimal, or should the window adapt dynamically to session length?
- Do transition-based rewards outperform state-only rewards in predicting teacher-rated engagement?
- What is the minimum number of turns required for BAS estimates to stabilise?
