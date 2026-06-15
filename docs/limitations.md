# Limitations

## 1. Synthetic Data Only
The current evaluation uses a synthetically generated dataset. Real classroom interaction data would exhibit messier linguistic patterns, greater vocabulary diversity, and task-dependent latency profiles that the synthetic generator cannot fully replicate. Performance on real data may differ significantly from the 78% accuracy reported here.

## 2. Rule-Based Classifier
The attention state classifier uses hand-crafted thresholds (e.g., `words < 6`, `topic_shift > 0.55`) derived from literature intuition rather than learned from labelled data. These thresholds are not optimised and will not generalise across all subject domains, age groups, or languages. A learned classifier (e.g., fine-tuned transformer) would be more robust.

## 3. Distracted/Focused Boundary Ambiguity
The lowest-performing class (Distracted F1 = 0.57) highlights a fundamental challenge: brief, on-topic responses and slow, off-topic responses can both fall in the Distracted zone under the current feature set. Richer features (e.g., semantic coherence across multiple turns, gaze or physiological signals) would improve discrimination.

## 4. BAS Is a Proxy, Not a Measurement
The BAS score produced by this system is a computational proxy derived from attention state transitions — it does not directly measure neurobiological BAS sensitivity. Clinical use would require validation against standardised BAS scales (e.g., BIS/BAS Scales, Carver & White, 1994) and physiological markers.

## 5. Reward Table Is Hand-Designed
The reward values (+10, -6, etc.) are intuition-based approximations. In a production system, rewards should be learned from expert-labelled session outcomes or calibrated against post-session performance metrics (e.g., learning gain, task completion rate).

## 6. No Temporal Context Beyond One Turn
The `previous_attention_state` stores only the immediately preceding turn. Longer-range patterns (e.g., three consecutive Distracted turns predicting BAS collapse) are not captured. A recurrent or windowed memory architecture would address this.

## 7. Fixed Intervention Catalogue
The 16 catalogue interventions are static text. A production system should adapt tone, language complexity, and specificity to the individual student, ideally using an LLM with a student model as context.

## 8. Single Modality
The system relies exclusively on text. Real-time classroom monitoring would benefit from multimodal signals: eye tracking, physiological arousal (EDA, heart rate), facial expression, or EEG-based attention indices.

## 9. No Medication or Individual Baseline Modelling
ADHD presentations vary substantially across individuals and are moderated by medication status, sleep, and time-of-day effects. The current system applies a uniform BAS model without participant-level calibration.

## 10. Ethical and Privacy Considerations
Deploying attention monitoring in classrooms raises significant ethical concerns: student surveillance, consent, data security, and potential stigmatisation. Any real-world deployment must be co-designed with students, parents, educators, and ethics boards.
