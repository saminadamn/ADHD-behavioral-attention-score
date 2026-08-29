import Link from "next/link";

const CONTRIBUTIONS = [
  {
    id: "C1",
    title: "Behavioral Attention Score (BAS)",
    body: "A novel continuous 0–100 score operationalising Gray & McNaughton's Behavioural Activation System as a real-time reward-driven motivational signal for classroom attention monitoring. Unlike discrete label classifiers, BAS captures intra-individual variability (IIV) as a trajectory rather than a snapshot.",
  },
  {
    id: "C2",
    title: "LangGraph Multi-Agent Architecture",
    body: "A modular, stateful 5-node LangGraph StateGraph pipeline. Each node is an independently testable agent with typed Pydantic state, enabling per-node unit testing and hot-swappable components. The pipeline is fully stateful across turns, supporting session-level analysis.",
  },
  {
    id: "C3",
    title: "RL-Inspired Reward Modeling",
    body: "A 16-entry transition-based reward table mapping (previous, current) attention state pairs to scalar rewards in [−8, +10]. This captures trajectory dynamics — e.g., Impulsive→Focused = +8 (recovery bonus) vs. Focused→Distracted = −6 — that single-state classifiers miss entirely.",
  },
  {
    id: "C4",
    title: "Synthetic ADHD Educational Dataset",
    body: "500 topic-aligned teacher–student interaction samples with per-label latency distributions calibrated from ADHD literature norms (Focused: μ=7.2s, Distracted: μ=18.0s, Impulsive: μ=0.9s). Balanced across three classes with controlled lexical variability.",
  },
  {
    id: "C5",
    title: "Adaptive Intervention Engine",
    body: "A 16-entry catalogue of evidence-based pedagogical interventions indexed by the Cartesian product of 4 BAS tiers × 4 attention states (including Auto). Each entry includes an intervention text and clinical rationale grounded in ADHD educational research.",
  },
];

const RESULTS = [
  { metric: "Accuracy",          value: "78.0%", note: "" },
  { metric: "Macro F1",          value: "0.764", note: "" },
  { metric: "Focused F1",        value: "0.722", note: "" },
  { metric: "Distracted F1",     value: "0.570", note: "class overlap with Focused" },
  { metric: "Impulsive F1",      value: "0.982", note: "high signal via word count + latency" },
  { metric: "ADHD-HI mean BAS",  value: "19.3",  note: "critical zone; 73% impulsive inputs" },
  { metric: "ADHD-C mean BAS",   value: "38.1",  note: "higher than Inattentive (recovery bonus)" },
  { metric: "Inattentive IIV",   value: "6.64",  note: "highest oscillatory variability" },
];

export default function ResearchPage() {
  return (
    <div className="max-w-content mx-auto px-6 pt-14 pb-20">

      {/* Header */}
      <div className="mb-10">
        <p className="label mb-3">Research Contributions</p>
        <h1 className="page-title mb-4">Novel Contributions</h1>
        <p className="text-sm text-text-muted max-w-prose">
          Five original contributions spanning AI for Health, natural language processing,
          and educational technology.
        </p>
      </div>

      {/* Contributions */}
      <div className="section">
        <p className="label mb-5">Contributions</p>
        <div className="space-y-7">
          {CONTRIBUTIONS.map((c) => (
            <div key={c.id} className="flex gap-6">
              <div className="flex-shrink-0 w-8 pt-0.5">
                <span className="font-mono text-xs font-bold text-accent">{c.id}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text mb-1">{c.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Objectives */}
      <div className="section">
        <p className="label mb-4">Research Objectives</p>
        <ol className="space-y-2 text-sm">
          {[
            "Model ADHD intra-individual variability (IIV) using continuous BAS trajectories rather than discrete categorical labels.",
            "Develop a modular multi-agent system decomposing the attention monitoring problem into independently improvable components.",
            "Bridge computational neuroscience theory (BAS/BIS) with practical classroom support tools.",
            "Produce a reproducible, open-source benchmark for ADHD educational interaction classification.",
          ].map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-text-subtle font-mono text-xs pt-0.5 flex-shrink-0">O{i+1}</span>
              <span className="text-text">{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Methodology */}
      <div className="section">
        <p className="label mb-4">Methodology</p>
        <div className="space-y-3 text-sm text-text">
          <p>
            <strong>Feature extraction.</strong>{" "}Five normalised signals extracted per turn:
            (1) word count, (2) TextBlob sentiment polarity normalised to [0,1],
            (3) cosine distance to teacher prompt embedding via all-MiniLM-L6-v2 (topic shift),
            (4) a composite engagement score (0.4×sentiment + 0.3×length_norm + 0.3×(1−topic_shift)),
            and (5) min-max normalised response latency inverted so short latency scores high.
          </p>
          <p>
            <strong>Classification.</strong>{" "}Priority rule: Impulsive if word_count ≤ 3 and latency_score ≥ 0.7;
            Distracted if topic_shift ≥ 0.6 or engagement ≤ 0.3; else Focused.
            Confidence derived from margin between top discriminant features.
          </p>
          <p>
            <strong>Reward and BAS update.</strong>{" "}A 4×3 transition matrix
            {" "}(None, Focused, Distracted, Impulsive) × (Focused, Distracted, Impulsive){" "}
            maps state transitions to rewards in [−8, +10].
            BAS_t = clamp(BAS_{"{t−1}"} + r_t, 0, 100), starting at 50.
            A 5-turn moving average smooths high-IIV sequences.
          </p>
          <p>
            <strong>Evaluation.</strong>{" "}Accuracy and per-class precision/recall/F1 on a held-out split
            of the 500-sample synthetic dataset. Phenotype simulation runs 4 probabilistic turn generators
            (Focused, Inattentive, Hyperactive-Impulsive, Combined) for 30 turns each and reports
            mean, min, max, final BAS, IIV, and state distribution.
          </p>
        </div>
      </div>

      {/* Results table */}
      <div className="section">
        <p className="label mb-4">Quantitative Results</p>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {RESULTS.map((r) => (
                <tr key={r.metric}>
                  <td className="font-medium">{r.metric}</td>
                  <td className="font-mono font-semibold text-accent">{r.value}</td>
                  <td className="text-text-muted text-xs">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted mt-3">
          → Full results dashboard with interactive charts: <Link href="/dashboard">Results →</Link>
        </p>
      </div>

      {/* Limitations */}
      <div className="section">
        <p className="label mb-4">Limitations</p>
        <ul className="space-y-2 text-sm text-text">
          {[
            "Synthetic dataset only — real classroom data exhibits greater lexical diversity and task-dependent variability.",
            "Rule-based classifier: thresholds not learned from labelled data; may not generalise across age groups or subjects.",
            "BAS is a computational proxy, not a direct neurobiological measurement; requires validation against standardised BIS/BAS psychometric scales.",
            "No participant-level baseline calibration; medication effects, chronotype, and ADHD subtype severity are not modelled.",
          ].map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-text-subtle flex-shrink-0 text-xs font-mono pt-0.5">L{i+1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Future work */}
      <div className="section">
        <p className="label mb-4">Future Work</p>
        <ul className="space-y-2 text-sm text-text">
          {[
            "Replace rule-based classifier with fine-tuned DistilBERT trained on labelled classroom interactions.",
            "Learn reward table via RLHF from teacher annotations of session quality.",
            "Extend memory beyond one turn: sliding-window trajectory features (slope, variability, change points).",
            "Multimodal fusion: acoustic features, physiological wearable signals, eye-tracking.",
            "Clinical validation study comparing BAS-guided vs standard teacher interventions on learning outcomes.",
          ].map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-text-subtle flex-shrink-0 text-xs font-mono pt-0.5">F{i+1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Citation */}
      <div className="section">
        <p className="label mb-4">Citation</p>
        <pre className="code-block">{`@software{parveen2024bas,
  author      = {Parveen, Samina},
  title       = {Behavioral Attention Score (BAS): A LangGraph Multi-Agent
                 Framework for Modeling ADHD Attentional Variability},
  year        = {2024},
  url         = {https://github.com/saminadamn/ADHD-behavioral-attention-score},
  institution = {BIT Mesra},
  supervisor  = {Dr. Itu Snigdh}
}`}</pre>
      </div>

    </div>
  );
}
