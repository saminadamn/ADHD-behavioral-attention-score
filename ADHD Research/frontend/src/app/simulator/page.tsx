"use client";
import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { api } from "@/lib/api";
import type { SimulateResponse } from "@/lib/types";
import { cn, labelColor } from "@/lib/utils";

const PHENOTYPES = [
  { id: "Focused",     label: "Neurotypical / Focused",           desc: "Predominantly focused. High sustained BAS, minimal IIV." },
  { id: "Inattentive", label: "ADHD-I (Inattentive)",             desc: "Focused/Distracted oscillation. High IIV, moderate BAS decay." },
  { id: "Hyperactive", label: "ADHD-HI (Hyperactive-Impulsive)",  desc: "Predominantly impulsive. BAS collapses rapidly. Mean ~19.3." },
  { id: "Combined",    label: "ADHD-C (Combined)",                desc: "All three states. Recovery transitions (+8) partially offset costs." },
];

const TIER_BANDS = [
  { y: 75, label: "SUSTAIN",   color: "#7C9A6D" },
  { y: 50, label: "ENCOURAGE", color: "#8B5CF6" },
  { y: 25, label: "SIMPLIFY",  color: "#C08457" },
];

const REWARD_TABLE: Record<string, Record<string, number>> = {
  Focused:    { Focused: 5, Distracted: -5, Impulsive: -3 },
  Distracted: { Focused: 3, Distracted: -4, Impulsive: -2 },
  Impulsive:  { Focused: 8, Distracted: -6, Impulsive: -8 },
  null:       { Focused: 2, Distracted: -2, Impulsive: -5 },
};

const TT = {
  contentStyle: {
    background: "#FFFFFF",
    border: "1px solid #E7E0F3",
    borderRadius: "6px",
    fontSize: "11px",
    boxShadow: "0 1px 4px rgba(45,36,56,0.08)",
  },
};

export default function SimulatorPage() {
  const [selected, setSelected] = useState("Inattentive");
  const [result, setResult]     = useState<SimulateResponse | null>(null);
  const [loading, setLoading]   = useState(false);

  async function run() {
    setLoading(true);
    try { setResult(await api.simulate(selected)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const basData = result
    ? result.bas_history.map((bas, i) => ({ turn: i + 1, bas: +bas.toFixed(1), state: result.sequence[i] }))
    : [];

  const rewardData = result
    ? result.sequence.map((state, i) => {
        const prev   = i === 0 ? "null" : result.sequence[i - 1];
        const reward = REWARD_TABLE[prev]?.[state] ?? 0;
        return { turn: i + 1, reward, state };
      })
    : [];

  const stateDist = result ? [
    { state: "Focused",    count: result.n_focused,                                              pct: +(result.n_focused   / result.sequence.length * 100).toFixed(0) },
    { state: "Distracted", count: result.sequence.filter(s => s === "Distracted").length,        pct: +(result.sequence.filter(s => s === "Distracted").length / result.sequence.length * 100).toFixed(0) },
    { state: "Impulsive",  count: result.n_impulsive,                                            pct: +(result.n_impulsive / result.sequence.length * 100).toFixed(0) },
  ] : [];

  return (
    <div className="max-w-wide mx-auto px-6 pt-12 pb-20">

      {/* Header */}
      <div className="mb-10 pb-8 border-b border-border">
        <p className="label mb-3">Phenotype Simulation · 2026</p>
        <h1 className="page-title mb-2">Simulate BAS Trajectories</h1>
        <p className="text-sm text-text-muted max-w-prose">
          Select a phenotype profile and run a 30-turn probabilistic simulation through the BAS pipeline.
          Each phenotype uses empirically-calibrated state transition probabilities from Gray &amp; McNaughton BAS/BIS theory.
        </p>
      </div>

      {/* Phenotype selector */}
      <div>
        <p className="label mb-4">Phenotype Selection</p>
        <div className="overflow-x-auto border border-border rounded-lg">
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
                  className={cn("cursor-pointer transition-colors", selected === p.id ? "bg-accent/8" : "")}
                >
                  <td>
                    <span className={cn(
                      "inline-block w-3 h-3 rounded-full border-2",
                      selected === p.id ? "bg-accent border-accent" : "border-border-strong"
                    )} />
                  </td>
                  <td className={cn("font-medium", selected === p.id ? "text-accent" : "")}>{p.label}</td>
                  <td className="text-xs text-text-muted">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5">
          <button onClick={run} disabled={loading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Simulating…" : "Run 30-Turn Simulation →"}
          </button>
        </div>
      </div>

      {/* Reward Table reference */}
      <div className="section">
        <p className="label mb-4">Table 1 — Reward Transition Matrix r(s_prev → s_curr)</p>
        <div className="overflow-x-auto border border-border rounded-lg max-w-sm">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-right pr-4">Prev ↓ / Curr →</th>
                <th style={{ color: "#7C9A6D" }}>Focused</th>
                <th style={{ color: "#C08457" }}>Distracted</th>
                <th style={{ color: "#B4534D" }}>Impulsive</th>
              </tr>
            </thead>
            <tbody>
              {[
                { prev: "Focused",    vals: [5, -5, -3] },
                { prev: "Distracted", vals: [3, -4, -2] },
                { prev: "Impulsive",  vals: [8, -6, -8] },
                { prev: "Initial",    vals: [2, -2, -5] },
              ].map((r) => (
                <tr key={r.prev}>
                  <td className="text-right pr-4 text-xs font-medium text-text-muted">{r.prev}</td>
                  {r.vals.map((v, i) => (
                    <td key={i} className="font-mono font-semibold" style={{ color: v >= 0 ? "#7C9A6D" : "#B4534D" }}>
                      {v >= 0 ? "+" : ""}{v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary stats */}
          <div className="section">
            <p className="label mb-4">Summary Statistics — {PHENOTYPES.find(p => p.id === selected)?.label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Mean BAS",  value: result.mean_bas.toFixed(1),  accent: true },
                { label: "Min BAS",   value: result.min_bas.toFixed(1),   accent: false },
                { label: "Max BAS",   value: result.max_bas.toFixed(1),   accent: false },
                { label: "IIV (σ)",   value: result.iiv.toFixed(3),        accent: false },
              ].map((s) => (
                <div key={s.label} className="metric">
                  <div className={cn("text-2xl font-bold font-mono tabular-nums", s.accent ? "text-accent" : "text-text")}>
                    {s.value}
                  </div>
                  <div className="label mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* BAS Curve */}
          <div className="section">
            <p className="text-sm font-semibold text-text mb-1">Figure 1 — BAS Trajectory (30 Turns)</p>
            <p className="text-xs text-text-muted mb-4">
              Dashed lines show tier boundaries: SUSTAIN (≥75), ENCOURAGE (50–74), SIMPLIFY (25–49), BREAK (&lt;25).
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={basData} margin={{ top: 8, right: 40, bottom: 16, left: 0 }}>
                <defs>
                  <linearGradient id="basGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#E7E0F3" />
                {TIER_BANDS.map((t) => (
                  <ReferenceLine
                    key={t.label}
                    y={t.y}
                    stroke={t.color}
                    strokeDasharray="3 5"
                    strokeOpacity={0.7}
                    label={{ value: t.label, fill: t.color, fontSize: 9, position: "right" }}
                  />
                ))}
                <XAxis dataKey="turn" tick={{ fill: "#9D90AC", fontSize: 11 }} label={{ value: "Turn", position: "insideBottom", offset: -6, fill: "#9D90AC", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#9D90AC", fontSize: 11 }} />
                <Tooltip
                  {...TT}
                  labelFormatter={(l) => { const d = basData[Number(l) - 1]; return d ? `Turn ${l} · ${d.state}` : `Turn ${l}`; }}
                  formatter={(v: number) => [v, "BAS"]}
                />
                <Area type="monotone" dataKey="bas" stroke="#8B5CF6" strokeWidth={1.5} fill="url(#basGrad)" dot={{ r: 2, fill: "#8B5CF6" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12">

            {/* Reward Curve */}
            <div>
              <p className="text-sm font-semibold text-text mb-1">Figure 2 — Transition Reward per Turn</p>
              <p className="text-xs text-text-muted mb-4">r(s_prev → s_curr) from the 4×3 reward table.</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rewardData}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E7E0F3" />
                  <XAxis dataKey="turn" tick={{ fill: "#9D90AC", fontSize: 10 }} />
                  <YAxis domain={[-10, 10]} tick={{ fill: "#9D90AC", fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="#E7E0F3" />
                  <Tooltip {...TT} formatter={(v: number) => [v >= 0 ? `+${v}` : v, "Reward"]} />
                  <Bar dataKey="reward" radius={[1, 1, 0, 0]}>
                    {rewardData.map((d, i) => (
                      <Cell key={i} fill={d.reward >= 0 ? "#7C9A6D" : "#B4534D"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* State Distribution */}
            <div>
              <p className="text-sm font-semibold text-text mb-1">Figure 3 — State Distribution</p>
              <p className="text-xs text-text-muted mb-4">Proportion of turns per attention state over 30-turn session.</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stateDist} layout="vertical">
                  <CartesianGrid strokeDasharray="2 4" stroke="#E7E0F3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#9D90AC", fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="state" tick={{ fill: "#9D90AC", fontSize: 10 }} width={72} />
                  <Tooltip {...TT} formatter={(v: number) => [`${v}%`, "Proportion"]} />
                  <Bar dataKey="pct" radius={[0, 2, 2, 0]}>
                    {stateDist.map((d, i) => (
                      <Cell key={i} fill={labelColor(d.state)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* State Heatmap */}
          <div className="section">
            <p className="text-sm font-semibold text-text mb-1">Figure 4 — Attention State Sequence Heatmap</p>
            <p className="text-xs text-text-muted mb-4">Each cell represents one turn. Hover for turn number and state.</p>
            <div className="flex flex-wrap gap-1">
              {result.sequence.map((s, i) => (
                <div
                  key={i}
                  title={`Turn ${i + 1}: ${s}`}
                  className="w-7 h-7 rounded flex items-center justify-center text-[9px] font-mono font-bold border flex-shrink-0"
                  style={{
                    background: `${labelColor(s)}18`,
                    borderColor: `${labelColor(s)}35`,
                    color: labelColor(s),
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-3 text-xs text-text-muted">
              {["Focused", "Distracted", "Impulsive"].map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: labelColor(s) }} />
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
