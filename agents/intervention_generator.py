"""
agents/intervention_generator.py
---------------------------------
LangGraph node: InterventionGenerator

Reads current_bas and attention_state from WorkflowState and emits a
pedagogical intervention recommendation with a clinical rationale.

Decision logic
--------------
BAS tier is determined first (primary signal), then refined by attention
state (secondary signal) to select the most contextually appropriate
intervention within that tier.

Tier thresholds
---------------
  BAS > 75      SUSTAIN   — engagement is strong; maintain or increase challenge
  50 < BAS <= 75  ENCOURAGE — momentum present but needs reinforcement
  25 < BAS <= 50  SIMPLIFY  — disengagement risk; reduce cognitive load
  BAS <= 25     BREAK     — threshold crossed; rest before re-engagement

Writes (into WorkflowState via dict update)
------
  intervention  str   recommended teacher action
  rationale     str   clinical explanation for the recommendation
"""

from __future__ import annotations

from dataclasses import dataclass
from models.state import AttentionLabel, WorkflowState


# ---------------------------------------------------------------------------
# Intervention catalogue
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Intervention:
    tier:         str
    label:        str   # short tag shown in logs
    intervention: str   # teacher-facing recommendation
    rationale:    str   # clinical explanation


# Each tier has a default entry (key=None) and per-state overrides.
_CATALOGUE: dict[str, dict[str | None, Intervention]] = {

    "SUSTAIN": {
        None: Intervention(
            tier="SUSTAIN",
            label="SUSTAIN-DEFAULT",
            intervention=(
                "Maintain current task difficulty. The student is performing well — "
                "consider introducing a slightly more complex extension question to "
                "sustain momentum."
            ),
            rationale=(
                "BAS score above 75 indicates strong motivational activation and "
                "reward-engagement coupling. Continuing at current difficulty preserves "
                "the dopaminergic reinforcement loop without inducing avoidance."
            ),
        ),
        "Focused": Intervention(
            tier="SUSTAIN",
            label="SUSTAIN-FOCUSED",
            intervention=(
                "Extend the task with a deeper follow-up question. The student is "
                "in a focused, high-engagement state — capitalise on it."
            ),
            rationale=(
                "High BAS combined with a Focused state signals peak reward-learning "
                "alignment. This is the optimal window to introduce more challenging "
                "material; cognitive load capacity is maximised."
            ),
        ),
        "Distracted": Intervention(
            tier="SUSTAIN",
            label="SUSTAIN-DISTRACTED",
            intervention=(
                "Gently redirect with a direct question tied to the original topic. "
                "The student's BAS is high but attention has drifted — a brief "
                "re-anchor is sufficient."
            ),
            rationale=(
                "High BAS with a Distracted state suggests the student is still "
                "motivated but reward salience has shifted to an off-task stimulus. "
                "A concise redirective prompt exploits existing activation rather "
                "than requiring motivational re-building."
            ),
        ),
        "Impulsive": Intervention(
            tier="SUSTAIN",
            label="SUSTAIN-IMPULSIVE",
            intervention=(
                "Acknowledge the quick answer and ask the student to expand: "
                "'Good start — can you tell me more?' Slow the pace slightly."
            ),
            rationale=(
                "High BAS with an Impulsive state reflects elevated reward-sensitivity "
                "causing response inhibition failures. Prompting elaboration re-engages "
                "prefrontal regulation without punishing enthusiasm."
            ),
        ),
    },

    "ENCOURAGE": {
        None: Intervention(
            tier="ENCOURAGE",
            label="ENCOURAGE-DEFAULT",
            intervention=(
                "Provide specific verbal praise for the student's most recent correct "
                "response and offer a structured hint for the next question."
            ),
            rationale=(
                "BAS in the 50–75 range indicates moderate motivational activation. "
                "Targeted praise reinforces the reward circuit while a structured "
                "hint lowers perceived task cost, sustaining engagement."
            ),
        ),
        "Focused": Intervention(
            tier="ENCOURAGE",
            label="ENCOURAGE-FOCUSED",
            intervention=(
                "Affirm the student's effort explicitly ('You explained that really "
                "clearly') and maintain the current task without reducing difficulty."
            ),
            rationale=(
                "Moderate BAS with a Focused state is a stable but fragile condition. "
                "Explicit effort-attribution praise strengthens the internal reward "
                "signal and reduces the risk of BAS drift toward disengagement."
            ),
        ),
        "Distracted": Intervention(
            tier="ENCOURAGE",
            label="ENCOURAGE-DISTRACTED",
            intervention=(
                "Use a curiosity hook to pull the student back: reframe the topic as "
                "a puzzle or real-world connection. ('This actually explains why "
                "phones need cooling fans — want to know how?')"
            ),
            rationale=(
                "Moderate BAS with a Distracted state suggests motivational activation "
                "is present but insufficiently coupled to the task stimulus. A novelty "
                "or relevance hook re-aligns BAS drive with academic content."
            ),
        ),
        "Impulsive": Intervention(
            tier="ENCOURAGE",
            label="ENCOURAGE-IMPULSIVE",
            intervention=(
                "Introduce a brief wait-time instruction: 'Take five seconds to think "
                "before answering.' Pair this with positive framing of deliberate "
                "responses."
            ),
            rationale=(
                "Moderate BAS with an Impulsive state indicates reward-seeking is "
                "outpacing inhibitory control. Structured wait-time externally "
                "scaffolds the response inhibition that the BIS system is failing "
                "to provide internally."
            ),
        ),
    },

    "SIMPLIFY": {
        None: Intervention(
            tier="SIMPLIFY",
            label="SIMPLIFY-DEFAULT",
            intervention=(
                "Break the current task into smaller sub-steps. Present only one "
                "component at a time and confirm understanding before proceeding."
            ),
            rationale=(
                "BAS in the 25–50 range signals declining motivational activation. "
                "Reducing task complexity lowers the effort-to-reward ratio, "
                "preventing further BAS erosion and avoidance behaviour."
            ),
        ),
        "Focused": Intervention(
            tier="SIMPLIFY",
            label="SIMPLIFY-FOCUSED",
            intervention=(
                "Keep the student on-task but reduce question depth: swap open-ended "
                "questions for guided multiple-choice to build confidence and "
                "momentum."
            ),
            rationale=(
                "Low-moderate BAS with a Focused state suggests effort is being "
                "sustained but at a cost — motivational reserves are depleting. "
                "Simplifying response format reduces processing load and rebuilds "
                "reward frequency."
            ),
        ),
        "Distracted": Intervention(
            tier="SIMPLIFY",
            label="SIMPLIFY-DISTRACTED",
            intervention=(
                "Switch to a concrete, hands-on or visual task variant. Reduce "
                "abstract language and connect content to something personally "
                "relevant to the student."
            ),
            rationale=(
                "Low-moderate BAS with a Distracted state indicates both motivational "
                "and attentional dysregulation. Concrete and personally relevant "
                "stimuli provide stronger bottom-up attentional capture to compensate "
                "for weakened top-down control."
            ),
        ),
        "Impulsive": Intervention(
            tier="SIMPLIFY",
            label="SIMPLIFY-IMPULSIVE",
            intervention=(
                "Shift to a structured fill-in-the-blank or sentence-completion "
                "format. Reduce open response requirements to lower frustration and "
                "impulsive error rate."
            ),
            rationale=(
                "Low-moderate BAS with an Impulsive state reflects a compensatory "
                "impulsive response pattern driven by low reward availability. "
                "Highly structured tasks reduce response ambiguity and the associated "
                "inhibitory demand."
            ),
        ),
    },

    "BREAK": {
        None: Intervention(
            tier="BREAK",
            label="BREAK-DEFAULT",
            intervention=(
                "Recommend a short structured break of 3–5 minutes. Suggest a "
                "movement-based or mindfulness activity before resuming. Do not "
                "introduce new content until the break is complete."
            ),
            rationale=(
                "BAS at or below 25 indicates critical motivational depletion. "
                "Continuing academic tasks risks reinforcing avoidance and further "
                "reducing BAS baseline. A brief restorative pause allows "
                "catecholaminergic recovery before re-engagement."
            ),
        ),
        "Focused": Intervention(
            tier="BREAK",
            label="BREAK-FOCUSED",
            intervention=(
                "Offer a voluntary micro-break: 'You've been working really hard — "
                "take 3 minutes and then we will pick up where you left off.' "
                "Preserve the student's sense of progress."
            ),
            rationale=(
                "Very low BAS despite a Focused state suggests sustained effortful "
                "attention at the expense of motivational reserves — a pattern "
                "associated with cognitive fatigue masking as engagement. "
                "A break prevents impending attention collapse."
            ),
        ),
        "Distracted": Intervention(
            tier="BREAK",
            label="BREAK-DISTRACTED",
            intervention=(
                "Explicitly end the current task segment. Offer a brief physical "
                "activity (standing stretch, brief walk) and return with a "
                "simplified warm-up question."
            ),
            rationale=(
                "Very low BAS with a Distracted state is a compounding dual-deficit "
                "pattern. Without a break, attentional drift will intensify and "
                "the session will yield minimal learning. Physical activity provides "
                "dopaminergic priming for re-engagement."
            ),
        ),
        "Impulsive": Intervention(
            tier="BREAK",
            label="BREAK-IMPULSIVE",
            intervention=(
                "Pause the session and offer a calming, low-stimulus break activity "
                "(quiet drawing, breathing exercise). Avoid screen-based distractions "
                "during the break. Resume with a single, very concrete question."
            ),
            rationale=(
                "Very low BAS with an Impulsive state indicates a dysregulated "
                "arousal state where impulsive responses serve as self-stimulatory "
                "compensation for reward deficits. A calm break reduces arousal "
                "dysregulation before resuming structured learning."
            ),
        ),
    },
}


# ---------------------------------------------------------------------------
# BAS tier classifier
# ---------------------------------------------------------------------------

def _get_tier(bas: float) -> str:
    if bas > 75:
        return "SUSTAIN"
    if bas > 50:
        return "ENCOURAGE"
    if bas > 25:
        return "SIMPLIFY"
    return "BREAK"


# ---------------------------------------------------------------------------
# LangGraph node
# ---------------------------------------------------------------------------

def intervention_generator(state: WorkflowState) -> dict:
    """
    LangGraph node — InterventionGenerator.

    Reads  : state.current_bas, state.attention_state
    Writes : intervention (str), rationale (str)
    """
    bas            = state.current_bas
    attention      = state.attention_state   # may be None if classifier not run

    tier           = _get_tier(bas)
    tier_catalogue = _CATALOGUE[tier]

    # Prefer a state-specific entry; fall back to tier default
    entry: Intervention = tier_catalogue.get(attention) or tier_catalogue[None]

    _log(bas, attention, tier, entry)

    return {
        "intervention": entry.intervention,
        "rationale":    entry.rationale,
    }


# ---------------------------------------------------------------------------
# Public helpers (used by tests / multi-agent orchestrators)
# ---------------------------------------------------------------------------

def get_intervention(
    bas: float,
    attention_state: AttentionLabel | None = None,
) -> dict[str, str]:
    """Direct call without WorkflowState — useful for standalone tests."""
    tier  = _get_tier(bas)
    entry = _CATALOGUE[tier].get(attention_state) or _CATALOGUE[tier][None]
    return {"intervention": entry.intervention, "rationale": entry.rationale}


def get_tier(bas: float) -> str:
    """Return the BAS tier label for a given score."""
    return _get_tier(bas)


# ---------------------------------------------------------------------------
# Debug logger
# ---------------------------------------------------------------------------

_TIER_COLORS = {
    "SUSTAIN":  "[HIGH ]",
    "ENCOURAGE": "[MID  ]",
    "SIMPLIFY": "[LOW  ]",
    "BREAK":    "[CRIT ]",
}

def _log(
    bas: float,
    attention: str | None,
    tier: str,
    entry: Intervention,
) -> None:
    tag  = _TIER_COLORS.get(tier, "[?    ]")
    attn = attention or "unknown"
    bar_width = 25
    filled    = round((bas / 100) * bar_width)
    bar       = "[" + "#" * filled + "-" * (bar_width - filled) + f"] {bas:.1f}"
    print(
        f"[intervention] {tag}  BAS={bar}  state={attn:<12}  "
        f"-> {entry.label}"
    )
