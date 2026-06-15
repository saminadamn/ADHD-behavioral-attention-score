"""
InterventionGenerator — maps (BAS tier, attention_state) to a pedagogical intervention.
"""
from __future__ import annotations
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Intervention:
    tier:         str
    label:        str
    intervention: str
    rationale:    str


_CAT: dict[str, dict[str | None, Intervention]] = {
    "SUSTAIN": {
        None: Intervention("SUSTAIN", "SUSTAIN-DEFAULT",
            "Maintain current task difficulty. Consider introducing a slightly more complex extension question to sustain momentum.",
            "BAS above 75 indicates strong motivational activation. Continuing at current difficulty preserves the dopaminergic reinforcement loop without inducing avoidance."),
        "Focused": Intervention("SUSTAIN", "SUSTAIN-FOCUSED",
            "Extend the task with a deeper follow-up question. The student is in a focused, high-engagement state — capitalise on it.",
            "High BAS combined with a Focused state signals peak reward-learning alignment. This is the optimal window for more challenging material; cognitive load capacity is maximised."),
        "Distracted": Intervention("SUSTAIN", "SUSTAIN-DISTRACTED",
            "Gently redirect with a direct question tied to the original topic. BAS is high but attention has drifted — a brief re-anchor is sufficient.",
            "High BAS with a Distracted state suggests the student is motivated but reward salience has shifted to an off-task stimulus. A concise redirective prompt exploits existing activation."),
        "Impulsive": Intervention("SUSTAIN", "SUSTAIN-IMPULSIVE",
            "Acknowledge the quick answer and ask the student to expand: 'Good start — can you tell me more?' Slow the pace slightly.",
            "High BAS with Impulsive state reflects elevated reward-sensitivity causing response inhibition failures. Prompting elaboration re-engages prefrontal regulation without punishing enthusiasm."),
    },
    "ENCOURAGE": {
        None: Intervention("ENCOURAGE", "ENCOURAGE-DEFAULT",
            "Provide specific verbal praise for the student's most recent correct response and offer a structured hint for the next question.",
            "BAS in 50-75 range indicates moderate motivational activation. Targeted praise reinforces the reward circuit while a structured hint lowers perceived task cost, sustaining engagement."),
        "Focused": Intervention("ENCOURAGE", "ENCOURAGE-FOCUSED",
            "Affirm the student's effort explicitly ('You explained that really clearly') and maintain the current task without reducing difficulty.",
            "Moderate BAS with Focused state is stable but fragile. Explicit effort-attribution praise strengthens the internal reward signal and reduces BAS drift risk."),
        "Distracted": Intervention("ENCOURAGE", "ENCOURAGE-DISTRACTED",
            "Use a curiosity hook to pull the student back: reframe the topic as a puzzle or real-world connection.",
            "Moderate BAS with Distracted state suggests motivation is present but insufficiently coupled to the task. A novelty hook re-aligns BAS drive with academic content."),
        "Impulsive": Intervention("ENCOURAGE", "ENCOURAGE-IMPULSIVE",
            "Introduce a brief wait-time instruction: 'Take five seconds to think before answering.' Pair with positive framing of deliberate responses.",
            "Moderate BAS with Impulsive state indicates reward-seeking outpacing inhibitory control. Structured wait-time externally scaffolds the response inhibition the BIS system is failing to provide."),
    },
    "SIMPLIFY": {
        None: Intervention("SIMPLIFY", "SIMPLIFY-DEFAULT",
            "Break the current task into smaller sub-steps. Present only one component at a time and confirm understanding before proceeding.",
            "BAS in 25-50 range signals declining motivational activation. Reducing task complexity lowers the effort-to-reward ratio, preventing further BAS erosion."),
        "Focused": Intervention("SIMPLIFY", "SIMPLIFY-FOCUSED",
            "Keep the student on-task but reduce question depth: swap open-ended questions for guided multiple-choice to build confidence.",
            "Low-moderate BAS with Focused state suggests effort is sustained at a cost — motivational reserves depleting. Simplifying response format rebuilds reward frequency."),
        "Distracted": Intervention("SIMPLIFY", "SIMPLIFY-DISTRACTED",
            "Switch to a concrete, hands-on or visual task variant. Connect content to something personally relevant to the student.",
            "Low-moderate BAS with Distracted state indicates dual attentional and motivational dysregulation. Concrete stimuli provide stronger bottom-up attentional capture."),
        "Impulsive": Intervention("SIMPLIFY", "SIMPLIFY-IMPULSIVE",
            "Shift to a structured fill-in-the-blank format. Reduce open response requirements to lower frustration and impulsive error rate.",
            "Low-moderate BAS with Impulsive state reflects compensatory impulsive responses driven by low reward availability. Structured tasks reduce response ambiguity and inhibitory demand."),
    },
    "BREAK": {
        None: Intervention("BREAK", "BREAK-DEFAULT",
            "Recommend a short structured break of 3-5 minutes. Suggest a movement-based or mindfulness activity before resuming.",
            "BAS at or below 25 indicates critical motivational depletion. Continuing academic tasks risks reinforcing avoidance. A brief restorative pause allows catecholaminergic recovery."),
        "Focused": Intervention("BREAK", "BREAK-FOCUSED",
            "Offer a voluntary micro-break: 'You've been working really hard — take 3 minutes and then we will pick up where you left off.'",
            "Very low BAS despite Focused state suggests sustained effortful attention at the expense of motivational reserves — cognitive fatigue masking as engagement. Break prevents impending collapse."),
        "Distracted": Intervention("BREAK", "BREAK-DISTRACTED",
            "Explicitly end the current task segment. Offer brief physical activity (standing stretch, brief walk) and return with a simplified warm-up question.",
            "Very low BAS with Distracted state is a compounding dual-deficit pattern. Physical activity provides dopaminergic priming for re-engagement."),
        "Impulsive": Intervention("BREAK", "BREAK-IMPULSIVE",
            "Pause the session and offer a calming, low-stimulus break activity (quiet drawing, breathing exercise). Resume with a single, very concrete question.",
            "Very low BAS with Impulsive state indicates dysregulated arousal where impulsive responses serve as self-stimulatory compensation for reward deficits. Calm break reduces arousal dysregulation."),
    },
}


def get_tier(bas: float) -> str:
    if bas > 75:  return "SUSTAIN"
    if bas > 50:  return "ENCOURAGE"
    if bas > 25:  return "SIMPLIFY"
    return "BREAK"


def get_intervention(bas: float, attention_state: str | None = None) -> dict:
    tier  = get_tier(bas)
    entry = _CAT[tier].get(attention_state) or _CAT[tier][None]
    return {"intervention": entry.intervention, "rationale": entry.rationale, "tier": tier, "label": entry.label}


def intervention_generator(state) -> dict:
    result = get_intervention(state.current_bas, state.attention_state)
    return {"intervention": result["intervention"], "rationale": result["rationale"], "tier": result["tier"]}
