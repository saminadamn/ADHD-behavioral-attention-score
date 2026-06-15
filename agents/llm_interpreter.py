"""LLM interpreter agent: uses OpenAI + LangChain to generate a BAS narrative."""
import os

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from models.state import PipelineState
from models.schemas import BASInterpretation

_parser = PydanticOutputParser(pydantic_object=BASInterpretation)

_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are a clinical neuroscience researcher specialising in ADHD and "
                "the Behavioural Activation System (BAS). Interpret the attentional "
                "variability metrics provided and generate a structured analysis."
                "\n\n{format_instructions}"
            ),
        ),
        (
            "human",
            (
                "Participant profile:\n{profile}\n\n"
                "Computed metrics:\n{metrics}\n\n"
                "Provide a structured BAS-focused interpretation."
            ),
        ),
    ]
).partial(format_instructions=_parser.get_format_instructions())


def llm_interpreter_node(state: PipelineState) -> dict:
    """LangGraph node: invoke LLM to interpret variability metrics."""
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        placeholder = BASInterpretation(
            reward_sensitivity_note="[Set OPENAI_API_KEY to enable LLM interpretation]",
            variability_explanation="Elevated IIV is a hallmark of ADHD attentional dysregulation.",
            clinical_implications=["Consider BAS-targeted CBT", "Monitor reward-seeking behaviour"],
            confidence=0.0,
        )
        return {"report": _format_report(state, placeholder)}

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3, api_key=api_key)
    chain = _PROMPT | llm | _parser

    profile_str = state.participant.model_dump_json(indent=2) if state.participant else "{}"
    metrics_str = state.analysis.model_dump_json(indent=2) if state.analysis else "{}"

    interpretation: BASInterpretation = chain.invoke(
        {"profile": profile_str, "metrics": metrics_str}
    )
    return {"report": _format_report(state, interpretation)}


def _format_report(state: PipelineState, interp: BASInterpretation) -> str:
    pid = state.participant.participant_id if state.participant else "Unknown"
    lines = [
        f"=== ADHD-BAS Report | Participant {pid} ===",
        "",
        f"[Metrics] {state.analysis.summary if state.analysis else 'N/A'}",
        "",
        "--- BAS Interpretation ---",
        f"Reward sensitivity: {interp.reward_sensitivity_note}",
        "",
        f"Variability explanation: {interp.variability_explanation}",
        "",
        "Clinical implications:",
    ]
    for item in interp.clinical_implications:
        lines.append(f"  * {item}")
    lines.append(f"\nConfidence: {interp.confidence:.0%}")
    return "\n".join(lines)
