# System Architecture

## Overview

ADHD-BAS is a LangGraph multi-agent pipeline that processes classroom interaction sequences and outputs a real-time Behavioural Activation Score (BAS) for each student turn. The system is designed as a modular directed graph where each node is an independently testable agent.

## Pipeline Flow

```
START
  |
  v
[BehavioralSignalExtractor]   -- extracts five features from the turn
  |
  v
[AttentionStateClassifier]    -- classifies: Focused / Distracted / Impulsive
  |
  v
[RLRewardModeler]             -- computes transition-based reward
  |
  v
[BASTracker]                  -- updates BAS score (moving-average smoothed)
  |
  v
[MemoryUpdate]                -- writes previous_* fields for next turn
  |
  v
END
```

Error propagation: if any node sets `state.error`, `_route()` short-circuits to END, bypassing all downstream nodes.

## State Model (`models/state.py`)

All nodes share a single `WorkflowState` (Pydantic `BaseModel`). Each node returns a partial `dict` of fields it writes; LangGraph merges this into the state.

Key field groups:

| Group | Fields |
|---|---|
| Raw input | `teacher_prompt`, `student_response`, `response_latency` |
| Extracted features | `features` (FeatureScores) |
| Classification | `attention_state`, `confidence` |
| Reward | `reward` |
| BAS | `current_bas`, `bas_history` |
| Cross-turn memory | `previous_attention_state`, `previous_reward`, `previous_bas` |
| History | `conversation` (list of ConversationTurn) |

## Agents

### BehavioralSignalExtractor (`agents/signal_extractor.py`)
- **Input**: `teacher_prompt`, `student_response`, `response_latency`
- **Output**: `features` (FeatureScores)
- Uses `sentence-transformers/all-MiniLM-L6-v2` for semantic similarity (topic_shift_score). Singleton model via `@lru_cache`.

### AttentionStateClassifier (`agents/state_classifier.py`)
- **Input**: `features`
- **Output**: `attention_state`, `confidence`
- Rule-based priority: Impulsive > Distracted > Focused

### RLRewardModeler (`agents/reward_modeler.py`)
- **Input**: `attention_state`, `previous_attention_state`
- **Output**: `reward`
- Transition-based lookup table (16 entries). First-turn uses `None` row.

### BASTracker (`agents/bas_tracker.py`)
- **Input**: `current_bas` (previous), `reward`
- **Output**: `current_bas`, `bas_history`
- BAS = clamp(BAS + reward, 0, 100). Moving-average window = 5.

### InterventionGenerator (`agents/intervention_generator.py`)
- **Input**: `current_bas`, `attention_state`
- **Output**: `intervention`, `rationale`
- Four tiers: SUSTAIN (>75), ENCOURAGE (50–75), SIMPLIFY (25–50), BREAK (<=25). 16-entry catalogue.

### MemoryUpdate (`graphs/adhd_graph.py`)
- Copies `attention_state → previous_attention_state`, `reward → previous_reward`, `current_bas → previous_bas` so the next turn's RLRewardModeler sees them.

## Technology Stack

| Component | Library |
|---|---|
| Agent graph | LangGraph 1.x (`StateGraph`) |
| State validation | Pydantic v2 (`BaseModel`) |
| Semantic similarity | sentence-transformers (`all-MiniLM-L6-v2`) |
| Sentiment | TextBlob |
| Numerical | NumPy, SciPy |
| Visualisation | Matplotlib |
| Testing | Python stdlib (`unittest`-style scripts) |
