"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Play, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { SimulateResponse } from "@/lib/types";
import { cn, labelColor } from "@/lib/utils";

const PHENOTYPES = [
  {
    id: "Focused",
    label: "Neurotypical / Focused",
    desc: "Predominantly focused with very rare drift. High sustained BAS.",
    color: "#3CB48A",
    icon: "🟢",
  },
  {
    id: "Inattentive",
    label: "ADHD-I (Inattentive)",
    desc: "Focused/Distracted oscillation. IIV reflects attentional instability.",
    color: "#4A9FD8",
    icon: "🔵",
  },
  {
    id: "Hyperactive",
    label: "ADHD-HI (Hyperactive-Impulsive)",
    desc: "Predominantly impulsive bursts. BAS collapses rapidly under impulsive penalty.",
    color: "#E86060",
    icon: "🔴",
  },
  {
    id: "Combined",
    label: "ADHD-C (Combined)",
    desc: "All three states. Recovery transitions partially offset impulsive costs.",
    color: "#E8A020",
    icon: "🟡",
  },
];

const TIER_ZONES = [
  { y1: 75, y2: 100, label: "SUSTAIN",   fill: "#3CB48A", opacity: 0.04 },
  { y1: 50, y2: 75,  label: "ENCOURAGE", fill: "#4A9FD8", opacity: 0.04 },
  { y1: 25, y2: 50,  label: "SIMPLIFY",  fill: "#E8A020", opacity: 0.06 },
  { y1: 0,  y2: 25,  label: "BREAK",     fill: "#E86060", opacity: 0.06 },
];

const tooltipStyle = {
  background: "#FFFFFF",
  border: "1px solid #BDD4EC",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 4px 16px rgba(74,159,216,0.12)",
};

export default function SimulatorPage() {
  const [selected, setSelected]   = useState<string>("Inattentive");
  const [result, setResult]       = useState<SimulateResponse | null>(null);
  const [loading, setLoading]     = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await api.simulate(selected);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const chartData = result
    ? result.bas_history.map((bas, i) => ({
        turn: i + 1,
        bas: +bas.toFixed(1),
        reward: +result.rewards[i].toFixed(1),
        state: result.sequence[i],
      }))
    : [];

  const phenotype = PHENOTYPES.find((p) => p.id === selected)!;

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            ADHD Phenotype Simulator
          </div>
          <h1 className="section-title">Simulate ADHD Phenotypes</h1>
          <p className="section-subtitle mt-3">
            Select a phenotype profile and run it through the BAS pipeline to visualise attentional trajectories over 30 turns.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {PHENOTYPES.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={cn(
                "card text-left transition-all duration-200 hover:border-primary/30",
                selected === p.id ? "border-2" : ""
              )}
              style={selected === p.id ? { borderColor: p.color } : {}}
            >
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="text-sm font-bold text-slate-800 mb-1">{p.label}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{p.desc}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-10">
          <button
            onClick={run}
            disabled={loading}
            className="btn-primary text-base px-10 py-4 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Simulating...</>
            ) : (
              <><Play className="w-4 h-4" /> Run Simulation</>
            )}
          </button>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: "Mean BAS",   value: result.mean_bas.toFixed(1) },
                { label: "Min BAS",    value: result.min_bas.toFixed(1)  },
                { label: "Max BAS",    value: result.max_bas.toFixed(1)  },
                { label: "Final BAS",  value: result.final_bas.toFixed(1)},
                { label: "IIV",        value: result.iiv.toFixed(2)      },
                { label: "% Focused",  value: `${(result.n_focused   / result.sequence.length * 100).toFixed(0)}%` },
                { label: "% Impulsive",value: `${(result.n_impulsive / result.sequence.length * 100).toFixed(0)}%` },
              ].map((s) => (
                <div key={s.label} className="card text-center py-4">
                  <div className="text-xl font-bold" style={{ color: phenotype.color }}>{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-slate-700 mb-5">BAS Score — {phenotype.label}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="basGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={phenotype.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={phenotype.color} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF0" />
                  {TIER_ZONES.map((z) => (
                    <ReferenceLine key={z.label} y={z.y1} stroke={z.fill} strokeDasharray="4 4" strokeOpacity={0.5} />
                  ))}
                  <ReferenceLine y={50} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: "Baseline 50", fill: "#94A3B8", fontSize: 10 }} />
                  <XAxis dataKey="turn" tick={{ fill: "#94A3B8", fontSize: 11 }} label={{ value: "Turn", position: "insideBottom", offset: -4, fill: "#94A3B8", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number, name: string) => [v, name === "bas" ? "BAS" : name]}
                    labelFormatter={(l) => {
                      const d = chartData[l - 1];
                      return d ? `Turn ${l} · ${d.state}` : `Turn ${l}`;
                    }}
                  />
                  <Area type="monotone" dataKey="bas" stroke={phenotype.color} strokeWidth={2.5} fill="url(#basGrad)" dot={{ r: 3, fill: phenotype.color }} name="BAS" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-xs">
                {[
                  { label: "SUSTAIN (>75)",     color: "#3CB48A" },
                  { label: "ENCOURAGE (50-75)", color: "#4A9FD8" },
                  { label: "SIMPLIFY (25-50)",  color: "#E8A020" },
                  { label: "BREAK (≤25)",        color: "#E86060" },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded-full" style={{ background: t.color }} />
                    <span className="text-slate-500">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Attention State Sequence</h3>
              <div className="flex flex-wrap gap-1.5">
                {result.sequence.map((s, i) => (
                  <div
                    key={i}
                    title={`Turn ${i+1}: ${s}`}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${labelColor(s)}20`, border: `1px solid ${labelColor(s)}50`, color: labelColor(s) }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                {["Focused","Distracted","Impulsive"].map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: labelColor(s) }} />
                    <span className="text-slate-500">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
