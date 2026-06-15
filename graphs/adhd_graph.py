"""
graphs/adhd_graph.py
--------------------
Step 10: Full LangGraph workflow — ADHD-BAS pipeline

Flow
----
START
  BehavioralSignalExtractor    (feature extraction)
  AttentionStateClassifier     (Focused / Distracted / Impulsive)
  RLRewardModeler              (transition reward signal)
  BASTracker                   (cumulative BAS score update)

Shared state: WorkflowState (models/state.py)
"""

from __future__ import annotations

import os, sys
# Ensure project root is on the path regardless of how this module is invoked
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from langgraph.graph import StateGraph, END

from models.state          import WorkflowState
from agents.signal_extractor  import behavioral_signal_extractor
from agents.state_classifier  import attention_state_classifier
from agents.reward_modeler    import rl_reward_modeler
from agents.bas_tracker       import bas_tracker


# ---------------------------------------------------------------------------
# Error guard — aborts downstream nodes if error is set
# ---------------------------------------------------------------------------

def _route(state: WorkflowState) -> str:
    return "abort" if state.error else "continue"


# ---------------------------------------------------------------------------
# Memory update node — copies current turn outputs into previous_* fields
# so the NEXT turn's reward_modeler sees them as transition context.
# ---------------------------------------------------------------------------

def memory_update(state: WorkflowState) -> dict:
    """LangGraph node — writes previous_* memory fields for the next turn."""
    return {
        "previous_attention_state": state.attention_state,
        "previous_reward":          state.reward,
        "previous_bas":             state.current_bas,
    }


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

def build_adhd_graph() -> StateGraph:
    graph = StateGraph(WorkflowState)

    graph.add_node("extractor",     behavioral_signal_extractor)
    graph.add_node("classifier",    attention_state_classifier)
    graph.add_node("reward",        rl_reward_modeler)
    graph.add_node("bas_tracker",   bas_tracker)
    graph.add_node("memory_update", memory_update)

    graph.set_entry_point("extractor")

    graph.add_conditional_edges("extractor",  _route, {"abort": END, "continue": "classifier"})
    graph.add_conditional_edges("classifier", _route, {"abort": END, "continue": "reward"})
    graph.add_conditional_edges("reward",     _route, {"abort": END, "continue": "bas_tracker"})
    graph.add_edge("bas_tracker",   "memory_update")
    graph.add_edge("memory_update", END)

    return graph.compile()


# ---------------------------------------------------------------------------
# Convenience runner — processes a single teacher/student turn
# ---------------------------------------------------------------------------

def run_turn(
    compiled_graph,
    state: WorkflowState,
    teacher_prompt: str,
    student_response: str,
    response_latency: float,
) -> WorkflowState:
    """
    Append a turn to state, run the full graph, return updated WorkflowState.
    Designed for multi-turn sequential use.
    """
    updated = state.append_turn(teacher_prompt, student_response, response_latency)
    result  = compiled_graph.invoke(updated)
    # LangGraph 1.x returns dict — reconstruct Pydantic model
    return WorkflowState(**result)


# ---------------------------------------------------------------------------
# Demo entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    pipeline = build_adhd_graph()
    state    = WorkflowState()

    TURNS = [
        ("What is photosynthesis?",
         "Photosynthesis is the process by which plants use sunlight, water, and CO2 to produce glucose.",
         7.2),
        ("Can you give me an example of a simile?",
         "Oh, I don't know... did you watch the football match last night? I love football.",
         19.5),
        ("What is the formula for the area of a circle?",
         "Pi r squared!",
         1.3),
        ("What were the causes of World War I?",
         "The main causes were nationalism, imperialism, militarism, and the alliance system, triggered by the assassination of Archduke Franz Ferdinand.",
         9.1),
        ("Describe mitosis in your own words.",
         "Uh... cells split? I keep forgetting. Is this going to be on the test? My sister had the same test last year.",
         22.0),
    ]

    print("\n" + "=" * 70)
    print("  ADHD-BAS Full Pipeline - Multi-Turn Demo")
    print("=" * 70)

    for i, (prompt, response, latency) in enumerate(TURNS, 1):
        print(f"\n{'-'*70}")
        print(f"  Turn {i}")
        print(f"  Teacher  : {prompt}")
        print(f"  Student  : {response[:80]}{'...' if len(response) > 80 else ''}")
        print(f"  Latency  : {latency}s")
        state = run_turn(pipeline, state, prompt, response, latency)
        print(f"  -> State : {state.attention_state} ({state.confidence:.0%})  "
              f"reward={state.reward:+.1f}  BAS={state.current_bas:.1f}  "
              f"MA={state.mean_bas:.1f}  trend={state.bas_trend:+.3f}")

    print(f"\n{'='*70}")
    print(f"  Final BAS        : {state.current_bas:.1f}")
    print(f"  BAS trajectory   : {[round(b, 1) for b in state.bas_history]}")
    print(f"  Mean BAS         : {state.mean_bas:.1f}")
    print(f"  BAS trend        : {state.bas_trend:+.3f}")
    print(f"  Total turns      : {state.turn_count}")
    print("=" * 70)
