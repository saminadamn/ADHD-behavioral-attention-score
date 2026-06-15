"""LangGraph pipeline: wires the four agents into a directed graph."""
from langgraph.graph import StateGraph, END

from models.state import PipelineState
from agents.data_loader import data_loader_node
from agents.analysis import analysis_node
from agents.llm_interpreter import llm_interpreter_node
from agents.visualiser import visualiser_node


def _should_abort(state: PipelineState) -> str:
    return "abort" if state.error else "continue"


def build_pipeline() -> StateGraph:
    graph = StateGraph(PipelineState)

    graph.add_node("data_loader", data_loader_node)
    graph.add_node("analysis", analysis_node)
    graph.add_node("llm_interpreter", llm_interpreter_node)
    graph.add_node("visualiser", visualiser_node)

    graph.set_entry_point("data_loader")

    graph.add_conditional_edges(
        "data_loader",
        _should_abort,
        {"abort": END, "continue": "analysis"},
    )
    graph.add_conditional_edges(
        "analysis",
        _should_abort,
        {"abort": END, "continue": "llm_interpreter"},
    )
    graph.add_edge("llm_interpreter", "visualiser")
    graph.add_edge("visualiser", END)

    return graph.compile()
