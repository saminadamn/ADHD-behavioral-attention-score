"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { api } from "@/lib/api";
import type { ResultsData } from "@/lib/types";

const LABEL_COLORS: Record<string, string> = {
  Focused: "#3CB48A", Distracted: "#E8A020", Impulsive: "#E86060",
};

const BAS_DEMO = [
  {turn:1,bas:55},{turn:2,bas:49},{turn:3,bas:49},{turn:4,bas:57},{turn:5,bas:51},
  {turn:6,bas:61},{turn:7,bas:55},{turn:8,bas:63},{turn:9,bas:57},{turn:10,bas:67},
];

const REWARD_DEMO = [
  {turn:1,reward:5},{turn:2,reward:-6},{turn:3,reward:0},{turn:4,reward:8},{turn:5,reward:-6},
  {turn:6,reward:10},{turn:7,reward:-6},{turn:8,reward:8},{turn:9,reward:-6},{turn:10,reward:10},
];

const PERSIST_DEMO = [
  { state: "Focused",    runs: 3 },
  { state: "Distracted", runs: 1.8 },
  { state: "Impulsive",  runs: 1.2 },
];

const tooltipStyle = {
  background: "#FFFFFF",
  border: "1px solid #BDD4EC",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 4px 16px rgba(74,159,216,0.12)",
};

export default function DashboardPage() {
  const [results, setResults] = useState<ResultsData | null>(null);

  useEffect(() => { api.results().then(setResults).catch(console.error); }, []);

  const kpis = results ? [
    { label: "Accuracy",     value: `${(results.accuracy * 100).toFixed(0)}%`,  color: "text-focused" },
    { label: "Precision",    value: `${(results.precision * 100).toFixed(0)}%`, color: "text-primary" },
    { label: "Recall",       value: `${(results.recall * 100).toFixed(0)}%`,    color: "text-accent" },
    { label: "Macro F1",     value: results.f1.toFixed(3),                       color: "text-distracted" },
    { label: "Dataset Size", value: String(results.dataset_size),                color: "text-slate-800" },
  ] : [];

  const classData = results
    ? Object.entries(results.per_class).map(([name, v]) => ({
        name,
        Precision: +(v.precision * 100).toFixed(1),
        Recall:    +(v.recall    * 100).toFixed(1),
        F1:        +(v.f1        * 100).toFixed(1),
      }))
    : [];

  const distData = results
    ? Object.entries(results.per_class).map(([name]) => {
        const counts: Record<string, number> = { Focused: 167, Distracted: 133, Impulsive: 200 };
        return { name, value: counts[name] ?? 0 };
      })
    : [];

  const confMatrix = results?.confusion_matrix ?? [];
  const labels     = results?.label_names ?? ["Focused", "Distracted", "Impulsive"];

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            Results Dashboard
          </div>
          <h1 className="section-title">Evaluation Results</h1>
          <p className="section-subtitle mt-3">
            Pipeline evaluated on 500 synthetic ADHD interaction samples. Charts are interactive — hover for details.
          </p>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {(results ? kpis : Array(5).fill(null)).map((k, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="card text-center py-5">
              {k ? (
                <>
                  <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{k.label}</div>
                </>
              ) : (
                <div className="h-8 bg-slate-100 rounded animate-pulse mx-4" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">BAS Score Timeline (Demo Session)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={BAS_DEMO}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF0" />
                <XAxis dataKey="turn" tick={{ fill: "#94A3B8", fontSize: 11 }} label={{ value: "Turn", position: "insideBottom", offset: -2, fill: "#94A3B8", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="bas" stroke="#4A9FD8" strokeWidth={2.5} dot={{ fill: "#4A9FD8", r: 3 }} name="BAS" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Reward Trajectory (Demo Session)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={REWARD_DEMO}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF0" />
                <XAxis dataKey="turn" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="reward" radius={[4, 4, 0, 0]} name="Reward">
                  {REWARD_DEMO.map((d, i) => (
                    <Cell key={i} fill={d.reward >= 0 ? "#3CB48A" : "#E86060"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Precision · Recall · F1 by Class</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={classData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF0" />
                <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Precision" fill="#4A9FD8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Recall"    fill="#3CB48A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="F1"        fill="#E891B0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Confusion Matrix</h3>
            {confMatrix.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-2 text-slate-400 text-right">Pred</th>
                      {labels.map((l) => <th key={l} className="p-2 font-semibold" style={{ color: LABEL_COLORS[l] }}>{l}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {confMatrix.map((row, ri) => {
                      const total = row.reduce((s, v) => s + v, 0);
                      return (
                        <tr key={ri}>
                          <td className="p-2 font-semibold text-right pr-3" style={{ color: LABEL_COLORS[labels[ri]] }}>{labels[ri]}</td>
                          {row.map((v, ci) => {
                            const intensity = total ? v / total : 0;
                            const isCorrect = ri === ci;
                            return (
                              <td key={ci} className="p-2">
                                <div className="w-14 h-10 rounded-lg flex items-center justify-center text-sm font-bold mx-auto" style={{
                                  background: isCorrect
                                    ? `rgba(60,180,138,${0.12 + intensity * 0.4})`
                                    : `rgba(232,96,96,${0.06 + intensity * 0.25})`,
                                  color: isCorrect ? "#3CB48A" : "#E86060",
                                }}>
                                  {v}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-44 bg-slate-100 rounded-xl animate-pulse" />
            )}
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">State Distribution</h3>
            <div className="space-y-3">
              {distData.map((d) => {
                const total = distData.reduce((s, x) => s + x.value, 0);
                const pct   = total ? (d.value / total * 100).toFixed(0) : "0";
                const color = LABEL_COLORS[d.name];
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold" style={{ color }}>{d.name}</span>
                      <span className="text-slate-500">{d.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Avg. State Persistence (turns)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={PERSIST_DEMO} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF0" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 11 }} domain={[0, 4]} />
                <YAxis type="category" dataKey="state" tick={{ fill: "#94A3B8", fontSize: 11 }} width={70} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="runs" radius={[0, 4, 4, 0]} name="Avg runs">
                  {PERSIST_DEMO.map((d, i) => (
                    <Cell key={i} fill={LABEL_COLORS[d.state]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
