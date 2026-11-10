# Known limitation: hyperactivity/impulsivity blind spot

## How this was found

The backend's five behavioral signals (`backend/agents/signal_extractor.py`)
and rule-based classifier (`backend/agents/state_classifier.py`) were stress-
tested against turns written to embody specific constructs from a standard
50-item clinical ADHD assessment (DSM-5-TR / ASRS-style inattention and
hyperactivity-impulsivity items — see sections A and B of a typical
screening instrument). This is not a validation study against the
questionnaire itself — the model takes one classroom turn
(`teacher_prompt` + `student_response` + `response_latency`), not a 50-item
self-report — but each test turn was constructed to isolate one clinical
construct, to see whether the model's signals move the way that construct
implies.

## What broke

Two turns were misclassified as **Focused** with a *positive* reward, which
is the worst possible failure mode (pushes BAS up and recommends no
intervention) on inputs that, clinically, are the clearest hyperactivity/
impulsivity markers in the questionnaire:

| Turn | Clinical construct | Response | Result (before) |
|---|---|---|---|
| "My favorite animal is" | Starts a task, doesn't finish it (inattention item 4) | Trails off mid-sentence | **Focused**, 70% conf, reward +8 |
| "canwegonowcanwegonow okay fine can we go" | Can't wait turn; rushed, fidgety (hyperactivity items 10/17) | Garbled, run-on, disengaged | **Focused**, 81% conf, reward +8 |

### Root cause

`engagement_score` was a blend of only two signals:

```python
engagement = 0.4 * _length_bucket(words) + 0.6 * (1.0 - topic_shift)
```

Neither signal can tell "short and fast because fluent/confident" apart from
"short and fast because rushed/disengaged." A terse, low-latency response
scores *identically* on both axes whether it's a confident one-word answer
or an impulsive blurt — and sentence-embedding similarity between a garbled
fragment and the prompt was, by chance, high enough in both cases above to
push `topic_shift` down and `engagement_score` up past the classifier's
"Focused" threshold.

## Fix

Added two signals that target exactly what `engagement_score` couldn't see
(`backend/agents/signal_extractor.py`):

- **`repetition_score`** — detects repeated whole words or a repeated
  sub-string inside a single word (e.g. `"canwegonowcanwegonow"` repeating
  `"canwegonow"`), a direct proxy for blurted/garbled text.
- **`completeness_score`** — detects whether a response ends on
  sentence-final punctuation vs. trailing off on a filler word
  (`"is"`, `"the"`, `"and"`, ...) or mid-word, a direct proxy for "started
  but didn't finish."

`engagement_score` now blends four signals instead of two, and
`attention_state_classifier` treats high repetition or low completeness as
an impulsivity signal **on its own**, independent of the engagement blend,
so a response can no longer "launder" repetition or incompleteness into a
Focused classification just by also being short and topically adjacent.

### Result after the fix

| Turn | Result (after) |
|---|---|
| "My favorite animal is" | **Impulsive**, 90% conf, reward +0 |
| "canwegonowcanwegonow okay fine can we go" | **Impulsive**, 100% conf, reward +0 |

Both moved out of the dangerous "Focused + positive reward" failure mode.

## What's still a real limitation

- **A fast-but-complete answer stays genuinely ambiguous.** A third test turn
  — a 2-word, correct, complete answer given in 0.6s to a long question (a
  textbook "answers before the question is finished" case) — moved from
  low-confidence Impulsive (40%) to Distracted (59%) rather than to a
  clearly-correct label. Neither `repetition_score` nor `completeness_score`
  fires here, because the response is neither repetitive nor incomplete —
  it's just abnormally fast relative to the question's complexity, which
  none of the five signals measure. Fixing this needs a feature comparing
  latency to the prompt's expected reading/processing time, not just a flat
  0.5–25s normalization.
- **The reward model is a flat lookup table** keyed only on
  `(previous_state, current_state)` (`backend/agents/reward_modeler.py`), not
  on classification confidence or feature magnitude. A 51%-confidence
  Distracted call and a 100%-confidence one produce the same reward.
- **No automated tests exist for this pipeline** (`backend/` has none at
  the module level) — this limitation and its fix were verified manually
  against a fixed set of constructed turns, not a regression suite. Adding
  `backend/tests/test_signal_extractor.py` and
  `backend/tests/test_state_classifier.py` covering at least the cases above
  would catch a future regression on this exact failure mode.
- **Still not a clinical tool.** None of the above makes this a substitute
  for the questionnaire it was stress-tested against — see the top-level
  README's limitations section.
