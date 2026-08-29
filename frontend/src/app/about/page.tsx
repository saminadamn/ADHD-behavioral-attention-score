import Link from "next/link";

const RESEARCH_AREAS = [
  { label: "Artificial Intelligence",       desc: "Multi-agent systems, LangGraph orchestration" },
  { label: "Natural Language Processing",   desc: "Semantic similarity, sentiment analysis, text classification" },
  { label: "AI for Health",                 desc: "Computational proxies for neurodevelopmental disorders" },
  { label: "Educational Technology",        desc: "Real-time classroom interaction analysis" },
  { label: "Neurodevelopmental Disorders",  desc: "ADHD attentional variability, BAS/BIS theory" },
  { label: "Reinforcement Learning",        desc: "Reward modeling, state transition dynamics" },
];

const TECH_STACK = [
  { layer: "Agent Orchestration", tech: "LangGraph 1.x",          role: "StateGraph pipeline, stateful multi-agent" },
  { layer: "State Schema",        tech: "Pydantic v2",            role: "WorkflowState typed validation" },
  { layer: "Embeddings",          tech: "Sentence-Transformers",  role: "all-MiniLM-L6-v2, cosine topic-shift" },
  { layer: "Sentiment",           tech: "TextBlob",               role: "Polarity extraction, engagement composite" },
  { layer: "LLM Framework",       tech: "LangChain Core ≥1.4.7", role: "Chain primitives, message types" },
  { layer: "Backend API",         tech: "FastAPI + Uvicorn",      role: "REST endpoints, async ASGI server" },
  { layer: "Compute",             tech: "NumPy · Pandas",         role: "Feature math, data loading" },
  { layer: "Frontend",            tech: "Next.js 16 · TypeScript", role: "SSR/SSG, Vercel deployment" },
  { layer: "Styling",             tech: "Tailwind CSS 3",         role: "Design tokens, responsive layout" },
  { layer: "Charts",              tech: "Recharts",               role: "BAS timelines, bar charts, area charts" },
  { layer: "Deploy — Frontend",   tech: "Vercel",                 role: "Next.js hosting, environment variables" },
  { layer: "Deploy — Backend",    tech: "Render",                 role: "FastAPI, 1 GB model cache disk" },
  { layer: "Python Runtime",      tech: "Python 3.11.9",          role: "Pinned via runtime.txt (numpy wheel compat)" },
];

const LINKS = [
  { label: "GitHub Repository", href: "https://github.com/saminadamn/ADHD-behavioral-attention-score", external: true },
  { label: "Live Demo", href: "/analysis", external: false },
  { label: "Methodology", href: "/methodology", external: false },
  { label: "Results Dashboard", href: "/dashboard", external: false },
  { label: "Phenotype Simulator", href: "/simulator", external: false },
];

export default function AboutPage() {
  return (
    <div className="max-w-content mx-auto px-6 pt-12 pb-20">

      {/* Header */}
      <div className="mb-12 pb-12 border-b border-border">
        <p className="label mb-4">About · 2026</p>
        <h1 className="page-title mb-2">Research Team</h1>
        <p className="text-sm text-text-muted">
          Behavioral Attention Score (BAS) · BIT Mesra
        </p>
      </div>

      {/* PI */}
      <div className="mb-12">
        <p className="label mb-5">Principal Investigator</p>
        <div className="grid sm:grid-cols-2 gap-10">
          <div>
            <h2 className="text-lg font-semibold text-text">Samina Parveen</h2>
            <p className="text-sm text-text-muted mt-1">B.Tech, Information Technology</p>
            <p className="text-sm text-text-muted">BIT Mesra, Ranchi, Jharkhand, India</p>

            <div className="mt-4 space-y-1 text-sm">
              <a href="mailto:btech10007.23@bitmesra.ac.in" className="block">
                btech10007.23@bitmesra.ac.in
              </a>
              <a
                href="https://github.com/saminadamn"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/saminadamn ↗
              </a>
            </div>
          </div>

          <div>
            <p className="label mb-3">Supervisor</p>
            <h3 className="text-base font-semibold text-text">Dr. Itu Snigdh</h3>
            <p className="text-sm text-text-muted">Associate Professor</p>
            <p className="text-sm text-text-muted">Department of Computer Science &amp; Engineering</p>
            <p className="text-sm text-text-muted">BIT Mesra, Ranchi, India</p>
          </div>
        </div>
      </div>

      {/* Research Areas */}
      <div className="section">
        <p className="label mb-5">Research Areas</p>
        <div className="space-y-3">
          {RESEARCH_AREAS.map((r) => (
            <div key={r.label} className="flex gap-4">
              <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />
              <div>
                <p className="text-sm font-medium text-text">{r.label}</p>
                <p className="text-xs text-text-muted">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Abstract */}
      <div className="section">
        <p className="label mb-4">Project Abstract</p>
        <div className="space-y-3 text-sm text-text leading-[1.8] max-w-prose">
          <p>
            Attention Deficit Hyperactivity Disorder (ADHD) is characterised by intra-individual
            variability (IIV) — moment-to-moment fluctuations in attentional capacity that standard
            psychometric instruments fail to capture in real time. This project presents the{" "}
            <strong>Behavioral Attention Score (BAS)</strong>, a continuous 0–100 score that
            operationalises Gray &amp; McNaughton&apos;s Behavioural Activation System as a
            reward-driven motivational signal for classroom attention monitoring.
          </p>
          <p>
            A five-agent LangGraph StateGraph pipeline processes teacher–student exchanges
            turn-by-turn, extracting behavioural signals, classifying attention states, computing
            RL-inspired rewards, maintaining a cumulative BAS trajectory, and generating
            real-time pedagogical interventions. Evaluated on 500 synthetic interaction samples,
            the pipeline achieves 78% accuracy and macro F1 = 0.764.
          </p>
        </div>
      </div>

      {/* Tech stack */}
      <div className="section">
        <p className="label mb-4">Technology Stack</p>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="data-table">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Technology</th>
                <th>Role in System</th>
              </tr>
            </thead>
            <tbody>
              {TECH_STACK.map((s) => (
                <tr key={s.layer}>
                  <td className="text-xs text-text-muted whitespace-nowrap">{s.layer}</td>
                  <td className="font-mono text-xs font-medium text-text">{s.tech}</td>
                  <td className="text-xs text-text-muted">{s.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Links */}
      <div className="section">
        <p className="label mb-4">Project Links</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {LINKS.map((l) => (
            l.external ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block card card-body py-4 hover:shadow-card-hover transition-shadow no-underline hover:no-underline group"
              >
                <p className="text-sm font-semibold text-text group-hover:text-accent transition-colors">{l.label} ↗</p>
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className="block card card-body py-4 hover:shadow-card-hover transition-shadow no-underline hover:no-underline group"
              >
                <p className="text-sm font-semibold text-text group-hover:text-accent transition-colors">{l.label} →</p>
              </Link>
            )
          ))}
        </div>
      </div>

    </div>
  );
}
