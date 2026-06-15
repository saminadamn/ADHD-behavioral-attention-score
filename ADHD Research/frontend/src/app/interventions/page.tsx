"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { InterventionResponse } from "@/lib/types";
import { cn, tierColor } from "@/lib/utils";

const STATES = [null, "Focused", "Distracted", "Impulsive"] as const;

const TIER_INFO = {
  SUSTAIN:  { emoji: "🚀", label: "Sustain",   range: "BAS > 75",   desc: "Engagement is strong. Maintain or increase task difficulty." },
  ENCOURAGE:{ emoji: "✨", label: "Encourage",  range: "50 < BAS ≤ 75", desc: "Moderate activation. Reinforce momentum with praise and structure." },
  SIMPLIFY: { emoji: "🔄", label: "Simplify",   range: "25 < BAS ≤ 50", desc: "Disengagement risk. Reduce cognitive load and complexity." },
  BREAK:    { emoji: "⏸️",  label: "Break",     range: "BAS ≤ 25",   desc: "Critical depletion. Rest before re-engagement is essential." },
};

export default function InterventionsPage() {
  const [bas,      setBas]      = useState(60);
  const [state,    setState]    = useState<string | null>(null);
  const [result,   setResult]   = useState<InterventionResponse | null>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.intervention(bas, state);
        setResult(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [bas, state]);

  const tier = result?.tier ?? "ENCOURAGE";
  const color = tierColor(tier);
  const info  = TIER_INFO[tier as keyof typeof TIER_INFO];

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Lightbulb className="w-3 h-3" /> Intervention Explorer
          </div>
          <h1 className="section-title">Adaptive Intervention Engine</h1>
          <p className="section-subtitle mt-3">
            Adjust the BAS slider and attention state to see real-time pedagogical recommendations from the intervention catalogue.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-6">
            {/* BAS slider */}
            <div className="card">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">BAS Score</label>
                <span className="text-2xl font-black" style={{ color }}>{bas}</span>
              </div>
              {/* Gradient track */}
              <div className="relative mb-2">
                <div className="h-3 rounded-full" style={{
                  background: "linear-gradient(to right, #EF4444, #F59E0B, #7C3AED, #10B981)"
                }} />
                <input
                  type="range" min={0} max={100} value={bas}
                  onChange={(e) => setBas(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-3"
                />
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>0 · BREAK</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100 · SUSTAIN</span>
              </div>

              {/* Tier indicator */}
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <span className="text-xl">{info?.emoji}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color }}>{info?.label} — {info?.range}</div>
                  <div className="text-xs text-slate-500">{info?.desc}</div>
                </div>
              </div>
            </div>

            {/* Attention state selector */}
            <div className="card">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Attention State</div>
              <div className="grid grid-cols-2 gap-2">
                {STATES.map((s) => {
                  const stateColor = s === "Focused" ? "#10B981" : s === "Distracted" ? "#F59E0B" : s === "Impulsive" ? "#EF4444" : "#7C3AED";
                  const active = state === s;
                  return (
                    <button
                      key={String(s)}
                      onClick={() => setState(s as never)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl text-sm font-medium border transition-all",
                        active ? "text-white" : "text-slate-400 border-border hover:border-border-light"
                      )}
                      style={active ? { borderColor: stateColor, background: `${stateColor}20`, color: stateColor } : {}}
                    >
                      {s ?? "Auto"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Presets</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Peak Focus",   bas: 88, state: "Focused"    },
                  { label: "Early Drift",  bas: 62, state: "Distracted" },
                  { label: "Low Impulse",  bas: 38, state: "Impulsive"  },
                  { label: "Critical Low", bas: 12, state: null         },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => { setBas(p.bas); setState(p.state as never); }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border text-slate-400 hover:text-white hover:border-border-light transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="card flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </motion.div>
              ) : result ? (
                <motion.div key={`${bas}-${state}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="card mb-4" style={{ borderLeft: `3px solid ${color}` }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommendation</div>
                      <span className="tag font-bold" style={{ background: `${color}20`, color }}>
                        {result.tier}
                      </span>
                    </div>
                    <p className="text-slate-100 leading-relaxed">{result.intervention}</p>
                  </div>

                  <div className="card">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Clinical Rationale</div>
                    <p className="text-sm text-slate-400 leading-relaxed">{result.rationale}</p>
                  </div>

                  <div className="card mt-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Behavioral Explanation</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-surface-2 rounded-xl p-3">
                        <div className="text-xs text-slate-500 mb-1">BAS Level</div>
                        <div className="font-bold" style={{ color }}>{bas}/100</div>
                      </div>
                      <div className="bg-surface-2 rounded-xl p-3">
                        <div className="text-xs text-slate-500 mb-1">Attention State</div>
                        <div className="font-bold text-white">{state ?? "Any"}</div>
                      </div>
                      <div className="bg-surface-2 rounded-xl p-3">
                        <div className="text-xs text-slate-500 mb-1">Tier</div>
                        <div className="font-bold" style={{ color }}>{result.tier}</div>
                      </div>
                      <div className="bg-surface-2 rounded-xl p-3">
                        <div className="text-xs text-slate-500 mb-1">Catalogue Entry</div>
                        <div className="font-bold text-xs text-white font-mono">{result.label}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
