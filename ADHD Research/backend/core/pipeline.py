"""
LangGraph pipeline for a single ADHD-BAS analysis turn.
"""
from __future__ import annotations
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def build_pipeline():
    from langgraph.graph import StateGraph, END
    from models.state import WorkflowState
    from agents.signal_extractor   import behavioral_signal_extractor
    from agents.state_classifier   import attention_state_classifier
    from agents.reward_modeler     import rl_reward_modeler
    from agents.bas_tracker        import bas_tracker, memory_update
    from agents.intervention_generator import intervention_generator

    def _route(state):
        return "abort" if state.error else "continue"

    g = StateGraph(WorkflowState)
    g.add_node("extractor",     behavioral_signal_extractor)
    g.add_node("classifier",    attention_state_classifier)
    g.add_node("reward",        rl_reward_modeler)
    g.add_node("bas_tracker",   bas_tracker)
    g.add_node("memory_update", memory_update)
    g.add_node("intervention",  intervention_generator)

    g.set_entry_point("extractor")
    g.add_conditional_edges("extractor",  _route, {"abort": END, "continue": "classifier"})
    g.add_conditional_edges("classifier", _route, {"abort": END, "continue": "reward"})
    g.add_conditional_edges("reward",     _route, {"abort": END, "continue": "bas_tracker"})
    g.add_edge("bas_tracker",   "memory_update")
    g.add_edge("memory_update", "intervention")
    g.add_edge("intervention",  END)

    logger.info("LangGraph pipeline compiled.")
    return g.compile()


def run_turn(
    teacher_prompt: str,
    student_response: str,
    response_latency: float,
    previous_attention_state: str | None,
    current_bas: float,
    bas_history: list[float],
) -> dict:
    """Run one turn through the full pipeline and return state dict."""
    from models.state import WorkflowState
    pipeline = build_pipeline()

    state = WorkflowState(
        teacher_prompt           = teacher_prompt,
        student_response         = student_response,
        response_latency         = response_latency,
        previous_attention_state = previous_attention_state,
        current_bas              = current_bas,
        bas_history              = bas_history,
        previous_bas             = current_bas,
    )
    result = pipeline.invoke(state)
    return result
