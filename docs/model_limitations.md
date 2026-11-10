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

## Second fix: latency relative to question complexity

A third test turn exposed a second gap, specifically on the "answers before
the question is finished" pattern: a 2-word, correct, complete answer given
in 0.6s to a long, multi-clause question (`"Twenty-five pi!"` to a
rambling, comma-heavy question about the area of a circle). Neither
`repetition_score` nor `completeness_score` fires here — the response is
coherent and complete — so it moved only to a low-confidence Impulsive
(40%) on the first fix, and to Distracted (59%) once engagement weights
were rebalanced for that fix, rather than to a clearly-correct label either
way.

### Root cause

`latency_score` was a flat normalization between 0.5s and 25s with no
reference to the question it was answering. A 0.6s answer to "Six times
seven?" and a 0.6s answer to a long, multi-part question score identically,
even though only one of those is plausible.

### Fix

Added `prematurity_score` (`backend/agents/signal_extractor.py`):
`_expected_response_time(prompt)` estimates a baseline from the prompt's
word count (reading time) and number of comma/semicolon/"and"-separated
clauses (thinking time); `_prematurity_score` scores how far the actual
latency falls below that baseline. Deliberately *not* blended into
`engagement_score` — a premature response can be otherwise coherent — so it
reaches `attention_state_classifier` as its own signal, treated as
impulsive on its own above a threshold, the same way `repetition_score`
and `completeness_score` already are.

### Result after this fix

The same turn now classifies as **Impulsive, 88% confidence**, reward +0 —
up from Distracted 59% (ambiguous) and, before the first fix, Focused 40%
(wrong) and Impulsive 40% (right label, too low-confidence to trust).

## Third fix: confidence-weighted reward

The reward model (`backend/agents/reward_modeler.py`) was a flat lookup
table keyed only on `(previous_state, current_state)` — a 51%-confidence
Distracted call and a 100%-confidence one moved BAS by exactly the same
amount, even though the classification itself is far less trustworthy at
51%.

### Fix

`compute_reward` now takes an optional `confidence` (default `1.0` for
callers with no real confidence to pass, e.g. `simulate_bas_trajectory`'s
synthetic label sequences) and scales the base reward by it, clamped to
`[0.5, 1.0]` since `attention_state_classifier` never reports below 0.5 —
so a transition classified at the classifier's own floor still carries half
the reward rather than being scaled to near-zero. `rl_reward_modeler` now
passes `state.confidence` through automatically.

Re-running the same questionnaire-derived turns end to end: a 64%-confidence
Distracted call now moves BAS by −3.87 instead of the flat −6.00; a
52%-confidence one by −3.12 instead of −6.00; a 100%-confidence Impulsive
call is unaffected (still the full −5.00).

## What's still a real limitation

- **The thinking-time baseline is a heuristic, not measured data.** The
  reading-speed and per-clause constants in `_expected_response_time` are
  reasonable estimates, not fit to any real response-time dataset — a
  genuinely fast but momentarily lucky guess on a hard question could still
  register as premature.
- **Still not a clinical tool.** None of the above makes this a substitute
  for the questionnaire it was stress-tested against — see the top-level
  README's limitations section.

## Regression coverage

`backend/tests/test_signal_extractor.py`, `test_state_classifier.py`, and
`test_reward_modeler.py` cover all four fixed cases above (run with
`python -m pytest backend/tests/ -v` after installing
`backend/requirements-dev.txt`), plus the cases that already worked before
each fix, to catch a future regression in either direction. Confirmed each
fix is actually caught by reverting the relevant file to its pre-fix
version and re-running — the tests fail (either an import error, since the
functions under test don't exist yet, or a `TypeError` on the new
`confidence` keyword argument).
