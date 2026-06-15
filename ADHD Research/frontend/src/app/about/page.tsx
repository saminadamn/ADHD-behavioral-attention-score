"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Github, Mail, University, BookOpen, Brain, Globe, ExternalLink } from "lucide-react";

const DOMAINS = [
  { label: "AI for Health",               color: "#7C3AED", icon: "🧬" },
  { label: "Natural Language Processing", color: "#06B6D4", icon: "💬" },
  { label: "Educational Technology",      color: "#10B981", icon: "🎓" },
  { label: "Neurodevelopmental Disorders",color: "#F59E0B", icon: "🧠" },
  { label: "Reinforcement Learning",      color: "#EF4444", icon: "🎮" },
  { label: "Multi-Agent Systems",         color: "#8B5CF6", icon: "🤖" },
];

const STACK = [
  { category: "Agent Orchestration",  items: ["LangGraph 1.x", "LangChain Core"] },
  { category: "State Modeling",       items: ["Pydantic v2", "Python 3.11+"] },
  { category: "NLP / ML",             items: ["Sentence-Transformers", "TextBlob", "all-MiniLM-L6-v2"] },
  { category: "Backend API",          items: ["FastAPI", "Uvicorn", "NumPy / Pandas"] },
  { category: "Frontend",             items: ["Next.js 15", "TypeScript", "Tailwind CSS", "Framer Motion"] },
  { category: "Deployment",           items: ["Vercel (frontend)", "Render (backend)", "Docker"] },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            About the Research
          </div>
          <h1 className="section-title">Principal Investigator</h1>
        </motion.div>

        {/* PI card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card border-primary/20 mb-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-primary/30">
            SP
          </div>
          <h2 className="text-2xl font-bold text-white">Samina Parveen</h2>
          <p className="text-slate-400 mt-1">B.Tech, Information Technology</p>

          <div className="flex items-center justify-center gap-1.5 mt-3 text-sm text-slate-400">
            <University className="w-4 h-4 text-primary-light" />
            <span>BIT Mesra, Ranchi, India</span>
          </div>

          <div className="mt-2 text-sm text-slate-400">
            <span className="text-slate-500">Supervisor: </span>
            <span className="font-semibold text-slate-200">Dr. Itu Snigdh</span>
            <span className="text-slate-600"> · Associate Professor, CSE</span>
          </div>

          <div className="flex items-center justify-center gap-4 mt-5">
            <a
              href="https://github.com/saminadamn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:border-border-light text-slate-400 hover:text-white text-sm transition-all"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a
              href="https://github.com/saminadamn/ADHD-behavioral-attention-score"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:border-border-light text-slate-400 hover:text-white text-sm transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Repository
            </a>
          </div>
        </motion.div>

        {/* Research domains */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Research Domains</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DOMAINS.map((d, i) => (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card flex items-center gap-3 py-4"
              >
                <span className="text-xl">{d.icon}</span>
                <span className="text-sm font-medium text-slate-300">{d.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Technology stack */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Full Technology Stack</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {STACK.map((s, i) => (
              <motion.div
                key={s.category}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card"
              >
                <div className="text-xs font-semibold text-primary-light uppercase tracking-wider mb-3">{s.category}</div>
                <div className="space-y-1.5">
                  {s.items.map((item) => (
                    <div key={item} className="text-sm text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Abstract */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card border-primary/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-primary-light" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Abstract</h3>
          </div>
          <p className="text-slate-400 leading-relaxed text-sm">
            Attention Deficit Hyperactivity Disorder (ADHD) is characterised by intra-individual variability (IIV) —
            moment-to-moment fluctuations in attentional capacity that standard psychometric instruments fail to capture
            in real time. This work presents the <span className="text-slate-200 font-semibold">Behavioral Attention Score (BAS)</span>,
            a novel computational proxy that operationalises Gray & McNaughton's Behavioural Activation System as a
            continuous reward-driven score for monitoring attention during classroom interactions.
          </p>
          <p className="text-slate-400 leading-relaxed text-sm mt-3">
            We implement a five-agent <span className="text-slate-200 font-semibold">LangGraph StateGraph</span> pipeline that
            processes teacher–student exchanges turn-by-turn, extracting behavioural signals, classifying attention states
            (Focused, Distracted, Impulsive), computing reinforcement-learning-inspired transition rewards, and
            maintaining a cumulative BAS trajectory with moving-average smoothing.
          </p>
          <p className="text-slate-400 leading-relaxed text-sm mt-3">
            Evaluated on a 500-sample synthetic ADHD interaction dataset, the pipeline achieves 78% accuracy and macro
            F1 = 0.764. Phenotype simulation confirms that ADHD-HI sequences produce rapid BAS collapse (mean = 19.3),
            while Combined-type profiles show counterintuitive resilience due to frequent Impulsive→Focused recovery
            transitions. An adaptive intervention engine maps the resulting (BAS tier, attention state) pair to one of
            16 evidence-based pedagogical recommendations in real time.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
