import Link from "next/link";

const METRICS = [
  { value: "500",   label: "Synthetic Interactions" },
  { value: "78.0%", label: "Accuracy" },
  { value: "0.764", label: "Macro F1" },
  { value: "5",     label: "LangGraph Agents" },
  { value: "16",    label: "Intervention Rules" },
];

const PIPELINE = [
  { step: null,  label: "Input",                           desc: "Teacher Prompt · Student Response · Response Latency", io: true },
  { step: "A1",  label: "Behavioral Signal Extractor",     desc: "5 NLP features: sentiment, engagement, topic shift, latency score, word count" },
  { step: "A2",  label: "Attention State Classifier",      desc: "Priority rule-based: Focused | Distracted | Impulsive  ·  + confidence" },
  { step: "A3",  label: "RL Reward Modeler",               desc: "4×3 transition reward table  ·  r ∈ [−8, +10]  ·  first-turn cold-start" },
  { step: "A4",  label: "BAS Tracker",                     desc: "BAS_t = clamp(BAS_{t−1} + r, 0, 100)  ·  5-turn moving avg  ·  IIV" },
  { step: "A5",  label: "Intervention Generator",          desc: "16-entry evidence-based catalogue  ·  indexed by (BAS tier, state)" },
  { step: null,  label: "Output",                          desc: "Pedagogical Intervention · Clinical Rationale · Updated BAS", io: true },
];

const FINDINGS = [
  {
    tag: "F1",
    title: "Impulsive behaviour is highly separable",
    body: "The Impulsive class achieves F1 = 0.982, driven by a near-perfect discrimination rule: word count ≤ 3 AND response latency ≥ 0.7 (normalised). This produces virtually no false positives against the Focused class.",
  },
  {
    tag: "F2",
    title: "Distracted responses overlap with Focused",
    body: "Distracted F1 = 0.570, reflecting genuine class boundary ambiguity. High-engagement distracted responses — off-topic but verbose and positive — are classified as Focused due to high engagement and sentiment scores.",
  },
  {
    tag: "F3",
    title: "BAS captures longitudinal attentional variability",
    body: "ADHD-HI phenotype simulations collapse to mean BAS = 19.3 (critical tier), while Neurotypical profiles sustain mean BAS = 72.4. Combined-type profiles counter-intuitively score higher than Inattentive due to Impulsive→Focused recovery transitions (+8 reward).",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-content mx-auto px-6 pt-12 pb-20">

      {/* ── Hero ───────────────────────────────────────── */}
      <div className="mb-12 pb-12 border-b border-border">
        <p className="label mb-4">Research Project · 2026 · BIT Mesra</p>

        <h1 className="page-title mb-4">
          Behavioral Attention Score (BAS)
        </h1>

        <p className="text-[1.05rem] text-text-muted leading-relaxed mb-8 max-w-prose">
          A LangGraph-Based Framework for Modeling Attentional Variability
          in ADHD Through Educational Interactions
        </p>

        {/* Authors */}
        <div className="flex flex-wrap gap-10 mb-8 text-sm">
          <div>
            <p className="font-semibold text-text">Samina Parveen</p>
            <p className="text-text-muted">B.Tech Information Technology</p>
            <p className="text-text-muted">BIT Mesra, Ranchi, India</p>
          </div>
          <div>
            <p className="label mb-1">Supervisor</p>
            <p className="font-semibold text-text">Dr. Itu Snigdh</p>
            <p className="text-text-muted">Associate Professor, Dept. of CSE</p>
            <p className="text-text-muted">BIT Mesra</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-3">
          <Link href="/analysis" className="btn-primary">Live Demo →</Link>
          <a
            href="https://github.com/saminadamn/ADHD-behavioral-attention-score"
            target="_blank" rel="noopener noreferrer"
            className="btn"
          >
            GitHub ↗
          </a>
          <Link href="/dashboard" className="btn">Results</Link>
          <Link href="/methodology" className="btn">Methodology</Link>
        </div>
      </div>

      {/* ── Abstract ───────────────────────────────────── */}
      <div className="mb-12">
        <p className="label mb-4">Abstract</p>
        <div className="space-y-3 text-[0.9375rem] leading-[1.8] text-text max-w-prose">
          <p>
            Attention Deficit Hyperactivity Disorder (ADHD) is characterised by pronounced
            intra-individual variability (IIV) in attentional capacity — moment-to-moment
            fluctuations that standard psychometric instruments fail to capture in real time.
            We introduce the <strong>Behavioral Attention Score (BAS)</strong>, a continuous
            0–100 computational proxy that operationalises Gray &amp; McNaughton&apos;s
            Behavioural Activation System theory as a real-time, reward-driven signal for
            monitoring student attention during classroom interactions.
          </p>
          <p>
            The BAS is computed by a five-node <strong>LangGraph 1.x StateGraph</strong> pipeline
            in which each node is an independently testable agent: a feature extractor leveraging
            Sentence-Transformers and TextBlob, a rule-based attention state classifier, a
            reinforcement-learning-inspired reward modeler with a 4×3 transition table, a stateful
            BAS tracker with moving-average smoothing, and an adaptive intervention generator
            indexing a 16-entry evidence-based pedagogical catalogue.
          </p>
          <p>
            Evaluated on a 500-sample synthetic dataset of teacher–student interaction turns, the
            pipeline achieves 78% accuracy and macro F1 = 0.764. Phenotype simulation reveals that
            ADHD-HI sequences collapse to mean BAS = 19.3 under 73% impulsive inputs, while
            Combined-type profiles exhibit paradoxical resilience due to high-value
            Impulsive→Focused recovery transitions.
          </p>
        </div>
      </div>

      {/* ── Key Metrics ────────────────────────────────── */}
      <div className="section">
        <p className="label mb-6">Key Metrics</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
          {METRICS.map((m) => (
            <div key={m.label} className="metric">
              <div className="text-2xl font-bold text-accent tabular-nums">{m.value}</div>
              <div className="label mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Architecture Overview ──────────────────────── */}
      <div className="section">
        <p className="label mb-2">Architecture Overview</p>
        <p className="text-sm text-text-muted mb-6">
          Five-node LangGraph StateGraph — each node is an independently testable agent.
          State is carried across turns via Pydantic v2 WorkflowState.
        </p>

        <div className="max-w-lg">
          {PIPELINE.map((p, i) => (
            <div key={i}>
              {p.io ? (
                <div className="pipeline-node-io">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{p.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{p.desc}</p>
                </div>
              ) : (
                <div className="pipeline-node shadow-card">
                  <div className="flex-shrink-0 w-7 h-7 rounded border border-accent/30 bg-accent/8
                                  flex items-center justify-center text-[10px] font-bold text-accent mt-0.5">
                    {p.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{p.label}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              )}
              {i < PIPELINE.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className="w-px h-4 bg-border-strong" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Key Findings ──────────────────────────────── */}
      <div className="section">
        <p className="label mb-6">Key Findings</p>
        <div className="space-y-6">
          {FINDINGS.map((f) => (
            <div key={f.tag} className="flex gap-5">
              <div className="flex-shrink-0">
                <span className="inline-flex w-7 h-7 rounded border border-accent/30 bg-accent/8
                                 items-center justify-center text-[10px] font-bold text-accent">
                  {f.tag}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text mb-1">{f.title}</p>
                <p className="text-sm text-text-muted leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Citation ──────────────────────────────────── */}
      <div className="section">
        <p className="label mb-4">Citation</p>
        <pre className="code-block">{`@software{parveen2026bas,
  author      = {Parveen, Samina},
  title       = {Behavioral Attention Score (BAS): A LangGraph-Based Framework
                 for Modeling Attentional Variability in ADHD Through
                 Educational Interactions},
  year        = {2026},
  url         = {https://github.com/saminadamn/ADHD-behavioral-attention-score},
  institution = {BIT Mesra, Ranchi, India},
  supervisor  = {Dr. Itu Snigdh}
}`}</pre>
      </div>

    </div>
  );
}
