"use client";
import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { api } from "@/lib/api";
import type { SimulateResponse } from "@/lib/types";
import { cn, labelColor } from "@/lib/utils";

const PHENOTYPES = [
  { id: "Focused",     label: "Neurotypical / Focused",        desc: "Predominantly focused. High sustained BAS, minimal IIV." },
  { id: "Inattentive", label: "ADHD-I (Inattentive)",          desc: "Focused/Distracted oscillation. High IIV, moderate BAS decay." },
  { id: "Hyperactive", label: "ADHD-HI (Hyperactive-Impulsive)", desc: "Predominantly impulsive. BAS collapses rapidly. Mean ~19.3." },
  { id: "Combined",    label: "ADHD-C (Combined)",             desc: "All three states. Recovery transitions (+8) partially offset costs." },
];

const TIER_LINES = [
  { y: 75,  label: "SUSTAIN",    color: "#16A34A" },
  { y: 50,  label: "ENCOURAGE",  color: "#2563EB" },
  { y: 25,  label: "SIMPLIFY",   color: "#B45309" },
];

const TT = {
  contentStyle: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "11px", boxShadow: "none" },
};

export default function SimulatorPage() {
  const [selected, setSelected] = useState<string>("Inattentive");
  const [result, setResult]     = useState<SimulateResponse | null>(null);
  const [loading, setLoading]   = useState(false);

  async function run() {
    setLoading(true);
    try { setResult(await api.simulate(selected)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const chartData = result
    ? result.bas_history.map((bas, i) => ({
        turn: i + 1,
        bas:  +bas.toFixed(1),
        state: result.sequence[i],
      }))
    : [];

  return (
    <div className="max-w-wide mx-auto px-6 pt-14 pb-20">

      {/* Header */}
      <div className="mb-10">
        <p className="label mb-3">ADHD Phenotype Simulator</p>
        <h1 className="page-title mb-2">Simulate BAS Trajectories</h1>
        <p className="text-sm text-text-muted">
          Select a phenotype profile and run a 30-turn probabilistic simulation through the BAS pipeline.
          Each phenotype uses empirically-calibrated state transition probabilities.
        </p>
      </div>

      {/* Phenotype selector as a table */}
      <div className="section">
        <p className="label mb-4">Phenotype Selection</p>
        <div className="overflow-x-auto border border-border rounded">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>Profile</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {PHENOTYPES.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={cn("cursor-pointer transition-colors", selected === p.id ? "bg-accent/5" : "")}
                >
                  <td>
                    <span className={cn(
                      "inline-block w-3 h-3 rounded-full border",
                      selected === p.id ? "bg-accent border-accent" : "border-border-strong"
                    )} />
                  </td>
                  <td className="font-medium">{p.label}</td>
                  <td className="text-xs text-text-muted">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <button
            onClick={run}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "Simulating…" : "Run 30-Turn Simulation →"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Stats table */}
          <div className="section">
            <p className="label mb-4">Summary Statistics</p>
            <div className="overflow-x-auto">
              <table className="data-table max-w-lg">
                <thead>
                  <tr><th>Statistic</th><th>Value</th></tr>
                </thead>
                <tbody>
                  {[
                    { label: "Mean BAS",         value: result.mean_bas.toFixed(2) },
                    { label: "Min BAS",           value: result.min_bas.toFixed(2) },
                    { label: "Max BAS",           value: result.max_bas.toFixed(2) },
                    { label: "Final BAS",         value: result.final_bas.toFixed(2) },
                    { label: "IIV (reward std)", value: result.iiv.toFixed(3) },
                    { label: "% Focused",         value: `${(result.n_focused   /result.sequence.length*100).toFixed(0)}%` },
                    { label: "% Distracted",      value: `${(result.sequence.filter(s=>s==="Distracted").length/result.sequence.length*100).toFixed(0)}%` },
                    { label: "% Impulsive",       value: `${(result.n_impulsive/result.sequence.length*100).toFixed(0)}%` },
                  ].map((s) => (
                    <tr key={s.label}>
                      <td>{s.label}</td>
                      <td className="font-mono font-semibold text-accent">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BAS trajectory chart */}
          <div className="section">
            <p className="label mb-4">BAS Trajectory — 30 Turns</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 16, left: 0 }}>
                <defs>
                  <linearGradient id="basGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#E5E7EB" />
                {TIER_LINES.map((t) => (
                  <ReferenceLine
                    key={t.label}
                    y={t.y}
                    stroke={t.color}
                    strokeDasharray="3 5"
                    strokeOpacity={0.6}
                    label={{ value: t.label, fill: t.color, fontSize: 9, position: "right" }}
                  />
                ))}
                <XAxis
                  dataKey="turn"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  label={{ value: "Turn", position: "insideBottom", offset: -6, fill: "#9CA3AF", fontSize: 11 }}
                />
                <YAxis domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <Tooltip
                  {...TT}
                  labelFormatter={(l) => {
                    const d = chartData[l - 1];
                    return d ? `Turn ${l} · ${d.state}` : `Turn ${l}`;
                  }}
                  formatter={(v: number) => [v, "BAS"]}
                />
                <Area type="monotone" dataKey="bas" stroke="#2563EB" strokeWidth={1.5} fill="url(#basGrad)" dot={{ r: 2, fill: "#2563EB" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sequence heatmap */}
          <div className="section">
            <p className="label mb-4">Attention State Sequence</p>
            <div className="flex flex-wrap gap-1">
              {result.sequence.map((s, i) => (
                <div
                  key={i}
                  title={`Turn ${i+1}: ${s}`}
                  className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-mono font-bold border flex-shrink-0"
                  style={{
                    background: `${labelColor(s)}12`,
                    borderColor: `${labelColor(s)}30`,
                    color: labelColor(s),
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="flex gap-5 mt-3 text-xs text-text-muted">
              {["Focused","Distracted","Impulsive"].map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: labelColor(s) }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
