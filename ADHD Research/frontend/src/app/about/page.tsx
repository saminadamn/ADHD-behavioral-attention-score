import Link from "next/link";

const STACK = [
  { layer: "Agent Orchestration", tech: "LangGraph 1.x",              role: "StateGraph pipeline, stateful multi-agent" },
  { layer: "State Schema",        tech: "Pydantic v2",                 role: "WorkflowState typed validation" },
  { layer: "NLP — Embeddings",    tech: "Sentence-Transformers",        role: "all-MiniLM-L6-v2, topic-shift cosine distance" },
  { layer: "NLP — Sentiment",     tech: "TextBlob",                    role: "polarity extraction, engagement composite" },
  { layer: "LLM Framework",       tech: "LangChain Core ≥1.4.7",       role: "chain primitives, prompt templates" },
  { layer: "Backend API",         tech: "FastAPI + Uvicorn",           role: "REST endpoints, async handlers" },
  { layer: "Compute",             tech: "NumPy · Pandas",              role: "feature math, data loading" },
  { layer: "Frontend",            tech: "Next.js 16 · TypeScript",     role: "SSR/SSG, API integration" },
  { layer: "Styling",             tech: "Tailwind CSS 3",              role: "design tokens, responsive layout" },
  { layer: "Charts",              tech: "Recharts",                    role: "BAS timelines, bar charts, area charts" },
  { layer: "Animation",           tech: "Framer Motion",               role: "page transitions (minimal)" },
  { layer: "Deployment — FE",     tech: "Vercel",                      role: "Next.js hosting, env vars" },
  { layer: "Deployment — BE",     tech: "Render",                      role: "FastAPI, 1GB model cache disk" },
  { layer: "Python runtime",      tech: "Python 3.11.9",               role: "pinned via runtime.txt (numpy wheel compat)" },
];

const DOMAINS = [
  "AI for Health",
  "Natural Language Processing",
  "Computational Neuroscience",
  "Educational Technology",
  "Multi-Agent Systems",
  "Reinforcement Learning",
  "Neurodevelopmental Disorders",
];

export default function AboutPage() {
  return (
    <div className="max-w-content mx-auto px-6 pt-14 pb-20">

      {/* Header */}
      <div className="mb-10">
        <p className="label mb-3">About</p>
        <h1 className="page-title mb-4">Research Team</h1>
      </div>

      {/* PI */}
      <div className="section">
        <p className="label mb-5">Principal Investigator</p>
        <div className="grid sm:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold text-text">Samina Parveen</h2>
            <p className="text-sm text-text-muted mt-1">B.Tech, Information Technology</p>
            <p className="text-sm text-text-muted">BIT Mesra, Ranchi, Jharkhand, India</p>
            <p className="text-sm mt-3">
              <span className="text-text-muted">Supervisor: </span>
              <span className="font-medium text-text">Dr. Itu Snigdh</span>
            </p>
            <p className="text-sm text-text-muted">Associate Professor, Dept. of CSE, BIT Mesra</p>
            <div className="flex flex-col gap-1 mt-4 text-sm">
              <a href="mailto:btech10007.23@bitmesra.ac.in">
                btech10007.23@bitmesra.ac.in
              </a>
              <a
                href="https://github.com/saminadamn"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/saminadamn ↗
              </a>
              <a
                href="https://github.com/saminadamn/ADHD-behavioral-attention-score"
                target="_blank"
                rel="noopener noreferrer"
              >
                Repository ↗
              </a>
            </div>
          </div>

          <div>
            <p className="label mb-3">Research Domains</p>
            <ul className="space-y-1">
              {DOMAINS.map((d) => (
                <li key={d} className="text-sm text-text flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Abstract */}
      <div className="section">
        <p className="label mb-4">Abstract</p>
        <div className="space-y-3 text-sm text-text leading-[1.8]">
          <p>
            Attention Deficit Hyperactivity Disorder (ADHD) is characterised by intra-individual variability (IIV) —
            moment-to-moment fluctuations in attentional capacity that standard psychometric instruments fail to capture
            in real time. This work presents the <strong>Behavioral Attention Score (BAS)</strong>, a novel continuous
            0–100 score that operationalises Gray &amp; McNaughton&apos;s Behavioural Activation System as a
            reward-driven motivational signal for monitoring attention during classroom interactions.
          </p>
          <p>
            We implement a five-agent <strong>LangGraph StateGraph</strong> pipeline that processes
            teacher–student exchanges turn-by-turn, extracting behavioural signals, classifying attention states
            (Focused, Distracted, Impulsive), computing RL-inspired transition rewards, and maintaining a cumulative
            BAS trajectory with moving-average smoothing.
          </p>
          <p>
            Evaluated on a 500-sample synthetic ADHD interaction dataset, the pipeline achieves 78% accuracy and
            macro F1 = 0.764. Phenotype simulation confirms ADHD-HI sequences collapse to mean BAS = 19.3,
            while Combined-type profiles exhibit counterintuitive resilience due to Impulsive→Focused
            recovery transitions (+8 reward). An adaptive intervention engine maps (BAS tier, attention state)
            pairs to 16 evidence-based pedagogical recommendations in real time.
          </p>
        </div>
      </div>

      {/* Tech stack */}
      <div className="section">
        <p className="label mb-4">Full Technology Stack</p>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Technology</th>
                <th>Role in system</th>
              </tr>
            </thead>
            <tbody>
              {STACK.map((s) => (
                <tr key={s.layer}>
                  <td className="text-text-muted text-xs whitespace-nowrap">{s.layer}</td>
                  <td className="font-mono text-xs font-medium">{s.tech}</td>
                  <td className="text-text-muted text-xs">{s.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explore */}
      <div className="section">
        <p className="label mb-4">Explore the Research</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { href: "/analysis",      label: "Live Demo",     desc: "Submit classroom turns through the live 5-agent pipeline." },
            { href: "/architecture",  label: "Architecture",  desc: "Detailed node-by-node pipeline documentation." },
            { href: "/dashboard",     label: "Results",       desc: "Evaluation metrics, charts, and confusion matrix." },
            { href: "/simulator",     label: "Simulator",     desc: "Run 30-turn simulations for 4 ADHD phenotypes." },
            { href: "/interventions", label: "Interventions", desc: "Explore the 16-entry pedagogical catalogue." },
            { href: "/dataset",       label: "Dataset",       desc: "Browse and filter the 500-sample dataset." },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block border border-border rounded p-4 hover:border-accent/50 hover:bg-surface transition-colors no-underline hover:no-underline group"
            >
              <p className="text-sm font-semibold text-text group-hover:text-accent transition-colors">{item.label} →</p>
              <p className="text-xs text-text-muted mt-1">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
