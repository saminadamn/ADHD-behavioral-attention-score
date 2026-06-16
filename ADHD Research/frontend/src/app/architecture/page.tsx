"use client";
import { useState } from "react";

const NODES = [
  {
    id: "input",
    step: "0",
    label: "Input",
    sublabel: "WorkflowState initialisation",
    desc: "Each classroom turn provides three inputs: the teacher's question, the student's verbatim response, and the measured response latency in seconds.",
    input: "teacher_prompt: str, student_response: str, response_latency: float",
    output: "WorkflowState (Pydantic model, all fields Optional initially)",
    algorithms: ["String ingestion", "Pydantic v2 state construction", "Turn-level stateful carry-forward"],
  },
  {
    id: "extractor",
    step: "1",
    label: "Behavioral Signal Extractor",
    sublabel: "Agent 1",
    desc: "Extracts five normalised feature scores from the raw interaction using NLP and semantic similarity models.",
    input: "teacher_prompt, student_response, response_latency",
    output: "FeatureScores: {response_length, sentiment, topic_shift_score, engagement_score, latency_score}",
    algorithms: [
      "Sentence-Transformers (all-MiniLM-L6-v2) — cosine distance for topic shift",
      "TextBlob sentiment polarity normalised to [0, 1]",
      "Min-max latency normalisation, inverted (short = high score)",
      "Engagement composite: 0.4×sentiment + 0.3×length_norm + 0.3×(1−topic_shift)",
    ],
  },
  {
    id: "classifier",
    step: "2",
    label: "Attention State Classifier",
    sublabel: "Agent 2",
    desc: "Applies a rule-based priority classifier mapping feature scores to one of three ADHD attention states with a margin-derived confidence value.",
    input: "FeatureScores",
    output: "attention_state: Literal['Focused','Distracted','Impulsive'], confidence: float",
    algorithms: [
      "Priority order: Impulsive > Distracted > Focused",
      "Impulsive: word_count ≤ 3 AND latency_score ≥ 0.7",
      "Distracted: topic_shift_score ≥ 0.6 OR engagement_score ≤ 0.3",
      "Margin-derived confidence from discriminant feature gaps",
    ],
  },
  {
    id: "reward",
    step: "3",
    label: "RL Reward Modeler",
    sublabel: "Agent 3",
    desc: "Computes a scalar reward from the transition between the previous and current attention state using a hand-designed 4×3 reward table.",
    input: "attention_state, previous_attention_state (None on first turn)",
    output: "reward: float ∈ [−8, +10]",
    algorithms: [
      "4×3 transition reward table: (previous_state | None, Focused, Distracted, Impulsive) × (current_state)",
      "Notable entries: Impulsive→Focused = +8, Focused→Focused = +10, Focused→Distracted = −6",
      "First-turn cold-start: previous = None row (rewards attenuated)",
      "Stateful LangGraph node — carries previous_attention_state across turns",
    ],
  },
  {
    id: "bas",
    step: "4",
    label: "BAS Tracker",
    sublabel: "Agent 4",
    desc: "Maintains the cumulative Behavioural Activation Score clamped to [0, 100], with a 5-turn moving average for trajectory smoothing and IIV computation.",
    input: "current_bas: float, reward: float, bas_history: list[float]",
    output: "current_bas (updated), bas_history (appended), moving_avg_5, iiv (reward std dev)",
    algorithms: [
      "BAS update rule: BAS_t = clamp(BAS_{t−1} + r_t, 0, 100)",
      "Initial BAS = 50 (neutral)",
      "Moving average window = 5 turns",
      "IIV = standard deviation of reward sequence (oscillatory instability proxy)",
    ],
  },
  {
    id: "intervention",
    step: "5",
    label: "Intervention Generator",
    sublabel: "Agent 5",
    desc: "Selects a pedagogical intervention from a 16-entry catalogue indexed by the Cartesian product of BAS tier and current attention state.",
    input: "current_bas: float, attention_state: str",
    output: "intervention: str, rationale: str, tier: Literal['SUSTAIN','ENCOURAGE','SIMPLIFY','BREAK']",
    algorithms: [
      "Four-tier BAS classification: SUSTAIN (>75), ENCOURAGE (50–75), SIMPLIFY (25–50), BREAK (≤25)",
      "16-entry catalogue: 4 tiers × 4 states (Focused, Distracted, Impulsive, Auto)",
      "State-specific refinement within tier — e.g., ENCOURAGE+Impulsive vs ENCOURAGE+Distracted differ",
    ],
  },
];

const TECH_STACK = [
  { name: "LangGraph 1.x",           role: "StateGraph orchestration, stateful edges, compile+invoke" },
  { name: "Pydantic v2",             role: "WorkflowState schema, typed validation, partial updates" },
  { name: "Sentence-Transformers",   role: "all-MiniLM-L6-v2 embeddings, cosine similarity" },
  { name: "TextBlob",                role: "Sentiment polarity extraction" },
  { name: "LangChain Core ≥1.4.7",   role: "Runnable primitives, message types" },
  { name: "FastAPI",                 role: "REST API — /analyze, /simulate, /intervention, /dataset, /results" },
  { name: "Uvicorn",                 role: "ASGI server (host=0.0.0.0, $PORT on Render)" },
  { name: "Next.js 16",             role: "Frontend SSR/SSG, Vercel deployment" },
];

export default function ArchitecturePage() {
  const [selected, setSelected] = useState<string | null>("extractor");
  const node = NODES.find(n => n.id === selected);

  return (
    <div className="max-w-wide mx-auto px-6 pt-14 pb-20">

      {/* Header */}
      <div className="mb-10">
        <p className="label mb-3">System Architecture</p>
        <h1 className="page-title mb-2">LangGraph Multi-Agent Pipeline</h1>
        <p className="text-sm text-text-muted">
          Five-node StateGraph. Click any row to expand its input/output contract and algorithms.
        </p>
      </div>

      {/* Pipeline table — clickable rows */}
      <div className="section">
        <p className="label mb-4">Pipeline Nodes</p>
        <div className="overflow-x-auto border border-border rounded">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">Step</th>
                <th>Node</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {NODES.map((n) => (
                <tr
                  key={n.id}
                  onClick={() => setSelected(selected === n.id ? null : n.id)}
                  className={`cursor-pointer transition-colors ${
                    selected === n.id ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="font-mono text-accent text-xs font-bold">{n.step}</td>
                  <td className="font-medium">{n.label}</td>
                  <td className="text-text-muted text-xs">{n.sublabel} — {n.desc.substring(0, 80)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {node && (
        <div className="section">
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-mono text-xs font-bold text-accent">Step {node.step}</span>
            <h2 className="text-lg font-semibold text-text">{node.label}</h2>
          </div>
          <p className="text-sm text-text-muted mb-6 leading-relaxed max-w-prose">{node.desc}</p>
          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <p className="label mb-2">Input</p>
              <pre className="code-block text-xs">{node.input}</pre>
            </div>
            <div>
              <p className="label mb-2">Output</p>
              <pre className="code-block text-xs">{node.output}</pre>
            </div>
            <div>
              <p className="label mb-2">Algorithms</p>
              <ul className="space-y-1.5">
                {node.algorithms.map((a) => (
                  <li key={a} className="flex gap-2 text-xs text-text-muted leading-relaxed">
                    <span className="text-accent flex-shrink-0">·</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* State schema */}
      <div className="section">
        <p className="label mb-4">WorkflowState Schema</p>
        <pre className="code-block">{`class WorkflowState(BaseModel):
    # Inputs
    teacher_prompt:           str
    student_response:         str
    response_latency:         float
    previous_attention_state: Optional[str]   = None
    current_bas:              float           = 50.0
    bas_history:              list[float]     = []

    # Agent 1 outputs
    features: Optional[FeatureScores]         = None

    # Agent 2 outputs
    attention_state:          Optional[str]   = None
    confidence:               float           = 0.0

    # Agent 3 outputs
    reward:                   float           = 0.0

    # Agent 4 outputs
    bas_history:              list[float]     = []

    # Agent 5 outputs
    intervention:             Optional[str]   = None
    rationale:                Optional[str]   = None
    tier:                     Optional[str]   = None`}
        </pre>
      </div>

      {/* Tech stack table */}
      <div className="section">
        <p className="label mb-4">Technology Stack</p>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Library / Framework</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {TECH_STACK.map((t) => (
                <tr key={t.name}>
                  <td className="font-mono text-xs font-medium">{t.name}</td>
                  <td className="text-xs text-text-muted">{t.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
