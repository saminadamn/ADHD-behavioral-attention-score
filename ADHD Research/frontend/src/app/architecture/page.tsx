"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Database, Cpu, GitBranch, BarChart2, Lightbulb, ArrowDown } from "lucide-react";

const NODES = [
  {
    id: "input",
    label: "Teacher Prompt",
    sublabel: "Student Response · Latency",
    icon: Database,
    color: "#64748B",
    description: "Each classroom turn provides three inputs: the teacher's question, the student's verbatim response, and the measured response latency in seconds.",
    input: "Raw text strings + latency float",
    output: "WorkflowState initialization",
    algorithms: ["String processing", "Turn ingestion"],
  },
  {
    id: "extractor",
    label: "Behavioral Signal Extractor",
    sublabel: "Agent 1",
    icon: Cpu,
    color: "#4A9FD8",
    description: "Extracts five normalised feature scores from the raw interaction turn using NLP and semantic similarity models.",
    input: "teacher_prompt, student_response, response_latency",
    output: "FeatureScores(response_length, sentiment, topic_shift_score, engagement_score, latency_score)",
    algorithms: ["Sentence-Transformers (all-MiniLM-L6-v2)", "TextBlob sentiment analysis", "Min-max latency normalisation"],
  },
  {
    id: "classifier",
    label: "Attention State Classifier",
    sublabel: "Agent 2",
    icon: GitBranch,
    color: "#6DB8E8",
    description: "Applies a rule-based priority classifier to map feature scores to one of three ADHD attention states.",
    input: "FeatureScores",
    output: "attention_state (Focused | Distracted | Impulsive), confidence",
    algorithms: ["Priority rules: Impulsive > Distracted > Focused", "Threshold-based discrimination", "Margin-derived confidence scoring"],
  },
  {
    id: "reward",
    label: "RL Reward Modeler",
    sublabel: "Agent 3",
    icon: BarChart2,
    color: "#3CB48A",
    description: "Computes a scalar reward from the transition between the previous and current attention state using a hand-designed reward table.",
    input: "attention_state, previous_attention_state",
    output: "reward (float, range -8 to +10)",
    algorithms: ["Transition-based reward table (4x3)", "Memory-augmented stateful LangGraph node", "First-turn cold-start handling"],
  },
  {
    id: "bas",
    label: "BAS Tracker",
    sublabel: "Agent 4",
    icon: BarChart2,
    color: "#E8A020",
    description: "Maintains the cumulative Behavioural Activation Score, clamped to [0, 100], with a 5-turn moving-average for trajectory smoothing.",
    input: "current_bas, reward",
    output: "current_bas (updated), bas_history",
    algorithms: ["BAS update rule: BAS_t = clamp(BAS_{t-1} + r, 0, 100)", "Moving-average window = 5", "IIV computation (reward std dev)"],
  },
  {
    id: "intervention",
    label: "Intervention Generator",
    sublabel: "Agent 5",
    icon: Lightbulb,
    color: "#E891B0",
    description: "Selects a pedagogical intervention from a 16-entry catalogue indexed by BAS tier and attention state.",
    input: "current_bas, attention_state",
    output: "intervention (str), rationale (str), tier (SUSTAIN | ENCOURAGE | SIMPLIFY | BREAK)",
    algorithms: ["Four-tier BAS classification", "16-entry intervention catalogue", "State-specific refinement within tier"],
  },
];

const TECH = [
  { name: "LangGraph 1.x",          desc: "StateGraph orchestration", color: "#4A9FD8" },
  { name: "Pydantic v2",             desc: "State validation",         color: "#6DB8E8" },
  { name: "Sentence-Transformers",   desc: "Semantic similarity",      color: "#3CB48A" },
  { name: "TextBlob",                desc: "Sentiment analysis",       color: "#E8A020" },
  { name: "FastAPI",                 desc: "REST API backend",         color: "#E86060" },
  { name: "Next.js 16",             desc: "Frontend framework",       color: "#64748B" },
];

export default function ArchitecturePage() {
  const [selected, setSelected] = useState<(typeof NODES)[0] | null>(null);

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            System Architecture
          </div>
          <h1 className="section-title">LangGraph Multi-Agent Pipeline</h1>
          <p className="section-subtitle mx-auto mt-3">
            Click any node to explore its purpose, inputs, outputs, and algorithms.
          </p>
        </motion.div>

        {/* Pipeline */}
        <div className="flex flex-col items-center gap-3 mb-16">
          {NODES.map((node, i) => {
            const Icon = node.icon;
            return (
              <motion.div key={node.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="w-full max-w-xl">
                <button
                  onClick={() => setSelected(selected?.id === node.id ? null : node)}
                  className="w-full bg-white rounded-2xl px-6 py-4 flex items-center gap-4 border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left group"
                  style={{ borderLeft: `3px solid ${node.color}` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${node.color}15`, border: `1px solid ${node.color}30` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: node.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">{node.label}</div>
                    <div className="text-xs text-slate-500">{node.sublabel}</div>
                  </div>
                  <div className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={{ background: `${node.color}15`, color: node.color }}>
                    Details
                  </div>
                </button>
                {i < NODES.length - 1 && (
                  <div className="flex justify-center my-1.5">
                    <ArrowDown className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card mb-12"
              style={{ borderLeft: `3px solid ${selected.color}` }}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selected.label}</h3>
                  <p className="text-slate-600 mt-1.5 text-sm leading-relaxed max-w-2xl">{selected.description}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0 ml-4">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Input</div>
                  <p className="text-sm text-slate-700 font-mono">{selected.input}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Output</div>
                  <p className="text-sm text-slate-700 font-mono">{selected.output}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Algorithms</div>
                  <ul className="space-y-1">
                    {selected.algorithms.map((a) => (
                      <li key={a} className="text-sm text-slate-600 flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 flex-shrink-0">·</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tech stack */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Technology Stack</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TECH.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-4 text-center border border-border shadow-sm">
                <div className="text-sm font-bold text-slate-800 mb-1">{t.name}</div>
                <div className="text-xs text-slate-500">{t.desc}</div>
                <div className="mt-2 h-0.5 rounded-full mx-auto w-8" style={{ background: t.color }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
