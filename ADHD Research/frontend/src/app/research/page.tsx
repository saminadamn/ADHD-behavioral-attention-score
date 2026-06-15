"use client";
import { motion } from "framer-motion";
import { Star, BookOpen, Target, BarChart2, AlertTriangle, Lightbulb } from "lucide-react";

const CONTRIBUTIONS = [
  {
    number: "01",
    title: "Behavioral Attention Score (BAS)",
    desc: "A novel continuous 0–100 score that operationalises Gray & McNaughton's Behavioural Activation System as a real-time reward-driven motivational signal for classroom attention monitoring.",
    color: "#7C3AED",
  },
  {
    number: "02",
    title: "LangGraph Multi-Agent Architecture",
    desc: "A modular, stateful 5-node LangGraph StateGraph pipeline — each node an independently testable agent — that processes classroom turn-by-turn rather than as a batch.",
    color: "#06B6D4",
  },
  {
    number: "03",
    title: "Reinforcement-Learning-Inspired Reward Modeling",
    desc: "A 16-entry transition-based reward table mapping (previous, current) attention state pairs to scalar rewards, capturing the trajectory dynamics that single-state approaches miss.",
    color: "#10B981",
  },
  {
    number: "04",
    title: "Synthetic ADHD Educational Dataset",
    desc: "500 topic-aligned teacher–student interaction samples with per-label latency distributions based on ADHD literature norms, suitable for pipeline benchmarking.",
    color: "#F59E0B",
  },
  {
    number: "05",
    title: "Adaptive Intervention Engine",
    desc: "A 16-entry catalogue of evidence-based pedagogical interventions indexed by BAS tier and attention state, providing context-sensitive teacher guidance at the turn level.",
    color: "#EF4444",
  },
];

const SECTIONS = [
  {
    icon: Target,
    title: "Research Objectives",
    color: "text-primary-light",
    bg: "bg-primary/10",
    items: [
      "Model intra-individual variability (IIV) in ADHD using continuous BAS trajectories rather than discrete categorical labels.",
      "Develop a modular multi-agent system that decomposes the attention monitoring problem into independently improvable components.",
      "Bridge computational neuroscience theory (BAS/BIS) with practical classroom support tools.",
      "Produce a reproducible, open-source benchmark for ADHD educational interaction classification.",
    ],
  },
  {
    icon: BookOpen,
    title: "Methodology Summary",
    color: "text-accent",
    bg: "bg-accent/10",
    items: [
      "Feature extraction: 5 signals (response length, TextBlob sentiment, semantic topic shift via all-MiniLM-L6-v2, composite engagement, normalised latency).",
      "Classification: rule-based priority classifier (Impulsive > Distracted > Focused) with threshold-derived confidence.",
      "Reward: 4×3 transition table; first-turn handled via None row. BAS = clamp(BAS_{t-1} + r, 0, 100).",
      "Evaluation: 500 synthetic samples, 78% accuracy, macro F1 = 0.764; Impulsive F1 = 0.982 (high signal-to-noise), Distracted F1 = 0.570 (class overlap).",
    ],
  },
  {
    icon: BarChart2,
    title: "Key Results",
    color: "text-focused",
    bg: "bg-focused/10",
    items: [
      "Overall accuracy: 78% on 500 balanced synthetic samples.",
      "Impulsive classification achieves F1 = 0.982 via word-count + latency discrimination.",
      "ADHD-HI phenotype shows mean BAS = 19.3 (critical zone) under 73% impulsive sequence, confirming rapid motivational depletion.",
      "Combined phenotype paradoxically shows higher mean BAS than Inattentive due to recovery transition bonuses (Impulsive→Focused = +8).",
      "IIV (reward std dev) is highest in Inattentive (6.64), capturing oscillatory attentional instability.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Limitations",
    color: "text-distracted",
    bg: "bg-distracted/10",
    items: [
      "Synthetic dataset only — real classroom data would exhibit greater lexical diversity and task-dependent variability.",
      "Rule-based classifier: thresholds not learned from labelled data and may not generalise across domains.",
      "BAS is a computational proxy, not a direct neurobiological measurement; requires validation against standardised BIS/BAS scales.",
      "No participant-level baseline calibration; medication, age, and time-of-day effects are not modelled.",
    ],
  },
  {
    icon: Lightbulb,
    title: "Future Work",
    color: "text-primary-light",
    bg: "bg-primary/10",
    items: [
      "Replace rule-based classifier with fine-tuned DistilBERT trained on labelled classroom interactions.",
      "Learn reward table via RLHF from teacher annotations of session quality.",
      "Extend memory beyond one turn: sliding-window trajectory features (slope, variability, change points).",
      "Multimodal fusion: acoustic features, physiological wearable signals, eye-tracking.",
      "Clinical validation study comparing BAS-guided vs standard teacher interventions on learning gain.",
    ],
  },
];

export default function ResearchPage() {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Star className="w-3 h-3" /> Research Contributions
          </div>
          <h1 className="section-title">Novel Contributions</h1>
          <p className="section-subtitle mx-auto mt-3">
            Five original contributions to AI for Health, NLP, and Educational Technology.
          </p>
        </motion.div>

        {/* Contributions */}
        <div className="space-y-4 mb-16">
          {CONTRIBUTIONS.map((c, i) => (
            <motion.div
              key={c.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card flex gap-6 hover:border-border-light transition-all"
            >
              <div className="flex-shrink-0 text-4xl font-black opacity-20" style={{ color: c.color }}>
                {c.number}
              </div>
              <div>
                <div className="text-base font-bold text-white mb-1.5" style={{ color: c.color }}>{c.title}</div>
                <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Deep sections */}
        <div className="space-y-6">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="card"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{s.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-400 leading-relaxed">
                      <span className={`${s.color} mt-0.5 flex-shrink-0`}>·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Citation */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 card border-primary/20"
        >
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Citation</div>
          <pre className="text-xs font-mono text-slate-400 bg-surface-2 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">{`@software{parveen2024bas,
  author    = {Parveen, Samina},
  title     = {Behavioral Attention Score (BAS): A LangGraph-Based Multi-Agent
               Framework for Modeling ADHD Attentional Variability},
  year      = {2024},
  url       = {https://github.com/saminadamn/ADHD-behavioral-attention-score},
  institution = {BIT Mesra},
  supervisor  = {Dr. Itu Snigdh}
}`}</pre>
        </motion.div>
      </div>
    </div>
  );
}
