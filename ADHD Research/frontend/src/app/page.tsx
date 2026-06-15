"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Brain, Zap, Target, BarChart2, ChevronRight, ArrowRight,
  Users, BookOpen, Activity, Layers,
} from "lucide-react";

const METRICS = [
  { label: "Dataset Size",   value: "500",   suffix: " samples", color: "from-purple-600 to-purple-400" },
  { label: "Accuracy",       value: "78",    suffix: "%",        color: "from-cyan-600 to-cyan-400" },
  { label: "Macro F1",       value: "0.764", suffix: "",         color: "from-emerald-600 to-emerald-400" },
  { label: "States Modeled", value: "3",     suffix: "",         color: "from-amber-600 to-amber-400" },
  { label: "Agents",         value: "5",     suffix: "",         color: "from-rose-600 to-rose-400" },
];

const WHY = [
  {
    icon: Brain,
    title: "ADHD Attentional Variability",
    desc: "ADHD is characterised by intra-individual variability (IIV) — moment-to-moment fluctuations in attention that standard assessments miss. Our framework models this dynamic instability in real time.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: BookOpen,
    title: "Educational Support",
    desc: "Teachers face the challenge of detecting disengagement before it compounds. BAS provides turn-level attention labels with evidence-based intervention recommendations, actionable within the classroom.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icon: Activity,
    title: "Behavioral Modeling",
    desc: "By operationalising the Behavioural Activation System as a continuous reward-driven score, we connect computational neuroscience theory with practical educational support tools.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Layers,
    title: "AI for Health",
    desc: "Multi-agent LangGraph architectures open new avenues for neurodevelopmental health monitoring — interpretable, modular, and extensible to clinical settings beyond the classroom.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
];

const PIPELINE = [
  { name: "Signal Extractor",   desc: "Feature extraction from interaction", color: "#7C3AED" },
  { name: "State Classifier",   desc: "Focused / Distracted / Impulsive",   color: "#8B5CF6" },
  { name: "Reward Modeler",     desc: "RL-inspired transition rewards",      color: "#06B6D4" },
  { name: "BAS Tracker",        desc: "Cumulative score with MA smoothing",  color: "#10B981" },
  { name: "Intervention Gen.",  desc: "Pedagogical recommendations",         color: "#F59E0B" },
];

const fade = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

export default function LandingPage() {
  return (
    <div className="pt-16 overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center justify-center">
        {/* Background glow */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-8"
          >
            <Zap className="w-3 h-3" />
            AI for Health · NLP · Educational Technology
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight"
          >
            Behavioral{" "}
            <span className="bg-gradient-to-r from-primary-light via-accent to-emerald-400 bg-clip-text text-transparent">
              Attention
            </span>{" "}
            Score
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            A LangGraph-Based Multi-Agent Framework for Modeling{" "}
            <span className="text-slate-200">ADHD Attentional Variability</span> Through
            Educational Interactions
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Link href="/analysis" className="btn-primary text-base px-8 py-4">
              <Zap className="w-4 h-4" /> Live Analysis
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/research" className="btn-secondary text-base px-8 py-4">
              Explore Research <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Metric cards */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            {METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.07 }}
                className="glass rounded-2xl p-4 text-center hover:border-border-light transition-all duration-300 group"
              >
                <div className={`text-2xl font-black bg-gradient-to-r ${m.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform`}>
                  {m.value}{m.suffix}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{m.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pipeline mini-diagram */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fade} className="section-title">
              5-Agent Pipeline
            </motion.h2>
            <motion.p variants={fade} className="section-subtitle mx-auto">
              Each turn flows through a LangGraph StateGraph — extracting signals, classifying
              attention, computing rewards and updating the BAS in real time.
            </motion.p>
          </motion.div>

          <div className="flex flex-col items-center gap-2">
            {PIPELINE.map((node, i) => (
              <motion.div
                key={node.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="w-full max-w-lg"
              >
                <div
                  className="glass rounded-xl px-6 py-4 flex items-center gap-4 hover:border-border-light transition-all cursor-default"
                  style={{ borderLeft: `3px solid ${node.color}` }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: node.color }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{node.name}</div>
                    <div className="text-xs text-slate-500">{node.desc}</div>
                  </div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="w-px h-4 bg-border-light" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/architecture" className="btn-secondary text-sm">
              View Full Architecture <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-20 px-4 sm:px-6 bg-surface/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="text-center mb-14"
          >
            <motion.div variants={fade} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-4">
              <Target className="w-3 h-3" /> Research Motivation
            </motion.div>
            <motion.h2 variants={fade} className="section-title">Why This Matters</motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {WHY.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card hover:border-border-light transition-all duration-300 group"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5"
          >
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30">
              <BarChart2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Try the Live Demo
            </h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Enter a teacher prompt and student response. The 5-agent pipeline will classify
              attention, compute reward, update the BAS score and generate an intervention
              recommendation — all in real time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/analysis" className="btn-primary">
                <Zap className="w-4 h-4" /> Start Analysis
              </Link>
              <Link href="/simulator" className="btn-secondary">
                <Users className="w-4 h-4" /> Phenotype Simulator
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
