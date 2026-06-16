import Link from "next/link";

const METRICS = [
  { label: "Overall accuracy",       value: "78.0%",    note: "500-sample synthetic dataset" },
  { label: "Macro F1",               value: "0.764",    note: "3-class weighted" },
  { label: "Impulsive F1",           value: "0.982",    note: "highest signal discrimination" },
  { label: "Distracted F1",          value: "0.570",    note: "class overlap with Focused" },
  { label: "Pipeline nodes",         value: "5",        note: "LangGraph StateGraph agents" },
  { label: "Dataset size",           value: "500",      note: "synthetic interaction turns" },
  { label: "Intervention entries",   value: "16",       note: "BAS tier × attention state" },
  { label: "BAS range",              value: "[0, 100]", note: "clamped cumulative score" },
];

const PIPELINE = [
  { step: "1", name: "Behavioral Signal Extractor", desc: "Extracts 5 normalised features: response length, TextBlob sentiment, topic-shift score (all-MiniLM-L6-v2), engagement composite, and latency score." },
  { step: "2", name: "Attention State Classifier",  desc: "Rule-based priority classifier maps features to Focused | Distracted | Impulsive with margin-derived confidence. Priority: Impulsive > Distracted > Focused." },
  { step: "3", name: "RL Reward Modeler",           desc: "Computes scalar reward from a 4×3 transition table (previous_state → current_state). Range: −8 to +10. First-turn cold-start handled via None row." },
  { step: "4", name: "BAS Tracker",                 desc: "Updates cumulative score: BAS_t = clamp(BAS_{t−1} + r, 0, 100). Maintains 5-turn moving average and IIV (reward std dev)." },
  { step: "5", name: "Intervention Generator",      desc: "Indexes a 16-entry evidence-based catalogue by (tier, state) pair. Tiers: SUSTAIN (>75), ENCOURAGE (50–75), SIMPLIFY (25–50), BREAK (≤25)." },
];

export default function HomePage() {
  return (
    <div className="max-w-content mx-auto px-6 pt-14 pb-20">

      {/* Paper header */}
      <div className="mb-10">
        <p className="label mb-3">Preprint · 2024 · BIT Mesra</p>
        <h1 className="page-title mb-4">
          Behavioral Attention Score (BAS): A LangGraph Multi-Agent Framework
          for Modeling ADHD Attentional Variability
        </h1>
        <p className="text-sm text-text-muted">
          <span className="text-text font-medium">Samina Parveen</span>
          {" "}·{" "}B.Tech Information Technology, BIT Mesra, Ranchi, India
          <br />
          Supervisor:{" "}
          <span className="text-text">Dr. Itu Snigdh</span>{" "}
          · Associate Professor, Department of CSE
        </p>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link href="/analysis" className="btn-primary">Live Demo →</Link>
        <a
          href="https://github.com/saminadamn/ADHD-behavioral-attention-score"
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
        >
          GitHub ↗
        </a>
        <Link href="/dashboard" className="btn">Results</Link>
        <Link href="/architecture" className="btn">Architecture</Link>
        <Link href="/dataset" className="btn">Dataset</Link>
        <Link href="/research" className="btn">Paper</Link>
      </div>

      {/* Abstract */}
      <div className="section">
        <p className="label mb-4">Abstract</p>
        <div className="space-y-3 text-sm leading-[1.8] text-text">
          <p>
            Attention Deficit Hyperactivity Disorder (ADHD) is characterised by pronounced intra-individual
            variability (IIV) in attentional capacity — moment-to-moment fluctuations that static psychometric
            instruments cannot capture in real time. We present the{" "}
            <strong>Behavioral Attention Score (BAS)</strong>, a continuous 0–100 computational proxy that
            operationalises Gray &amp; McNaughton&apos;s Behavioural Activation System theory as a real-time,
            reward-driven motivational signal for monitoring attention during classroom interactions.
          </p>
          <p>
            The BAS is computed by a five-node{" "}
            <strong>LangGraph 1.x StateGraph</strong> pipeline in which each node is an independently
            testable agent: (1) a feature extractor leveraging Sentence-Transformers and TextBlob,
            (2) a rule-based attention state classifier, (3) a reinforcement-learning-inspired reward
            modeler with a 4×3 transition table, (4) a stateful BAS tracker with moving-average smoothing,
            and (5) an adaptive intervention generator indexing a 16-entry evidence-based catalogue.
          </p>
          <p>
            Evaluated on a 500-sample synthetic dataset of teacher–student interaction turns, the pipeline
            achieves 78% accuracy and macro F1 = 0.764. Phenotype simulation reveals that ADHD-HI sequences
            collapse to mean BAS = 19.3 under 73% impulsive inputs, while Combined-type profiles exhibit
            paradoxical resilience due to high-value Impulsive→Focused recovery transitions (+8 reward).
          </p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="section">
        <p className="label mb-4">Key Metrics</p>
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
              {METRICS.map((m) => (
                <tr key={m.label}>
                  <td className="font-medium">{m.label}</td>
                  <td className="font-mono font-semibold text-accent">{m.value}</td>
                  <td className="text-text-muted text-xs">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline */}
      <div className="section">
        <p className="label mb-4">Pipeline — Five Agents in Sequence</p>
        <div className="space-y-0">
          {PIPELINE.map((p) => (
            <div key={p.step} className="flex gap-5 py-4 border-b border-border last:border-0">
              <div className="flex-shrink-0 w-6 h-6 rounded-full border border-accent text-accent text-xs font-bold flex items-center justify-center mt-0.5">
                {p.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-text">{p.name}</p>
                <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contributions */}
      <div className="section">
        <p className="label mb-4">Contributions</p>
        <ol className="space-y-2 text-sm">
          {[
            "Novel BAS score operationalising BAS/BIS theory as a continuous classroom attention signal.",
            "Modular LangGraph multi-agent architecture with independently testable nodes.",
            "RL-inspired 16-entry reward table capturing attentional trajectory dynamics.",
            "500-sample synthetic ADHD educational interaction dataset with latency distributions.",
            "Adaptive 16-entry intervention catalogue indexed by (BAS tier, attention state).",
          ].map((c, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-text-subtle flex-shrink-0 font-mono text-xs pt-0.5">C{i+1}</span>
              <span className="text-text">{c}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Deployment */}
      <div className="section">
        <p className="label mb-4">Deployment</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Platform</th>
              <th>Stack</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-medium">Frontend</td>
              <td>Vercel</td>
              <td className="font-mono text-xs text-text-muted">Next.js 16 · TypeScript · Tailwind</td>
            </tr>
            <tr>
              <td className="font-medium">Backend API</td>
              <td>Render</td>
              <td className="font-mono text-xs text-text-muted">FastAPI · Uvicorn · Python 3.11</td>
            </tr>
            <tr>
              <td className="font-medium">NLP Models</td>
              <td>Render disk cache</td>
              <td className="font-mono text-xs text-text-muted">all-MiniLM-L6-v2 · TextBlob</td>
            </tr>
            <tr>
              <td className="font-medium">Orchestration</td>
              <td>—</td>
              <td className="font-mono text-xs text-text-muted">LangGraph 1.x · LangChain Core</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
