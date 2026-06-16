"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { api } from "@/lib/api";
import type { ResultsData } from "@/lib/types";

const LABEL_COLORS: Record<string, string> = {
  Focused: "#16A34A", Distracted: "#B45309", Impulsive: "#DC2626",
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

const TT = {
  contentStyle: { background: "#fff", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px", boxShadow: "none" },
};

export default function DashboardPage() {
  const [results, setResults] = useState<ResultsData | null>(null);

  useEffect(() => { api.results().then(setResults).catch(console.error); }, []);

  const classData = results
    ? Object.entries(results.per_class).map(([name, v]) => ({
        name,
        Precision: +(v.precision * 100).toFixed(1),
        Recall:    +(v.recall    * 100).toFixed(1),
        F1:        +(v.f1        * 100).toFixed(1),
      }))
    : [];

  const confMatrix = results?.confusion_matrix ?? [];
  const labels     = results?.label_names ?? ["Focused", "Distracted", "Impulsive"];

  return (
    <div className="max-w-wide mx-auto px-6 pt-14 pb-20">

      {/* Header */}
      <div className="mb-10">
        <p className="label mb-3">Evaluation Results</p>
        <h1 className="page-title mb-2">Results Dashboard</h1>
        <p className="text-sm text-text-muted">
          Pipeline evaluated on 500 synthetic ADHD interaction samples. Hover charts for exact values.
        </p>
      </div>

      {/* KPI table */}
      <div className="section">
        <p className="label mb-4">Summary Metrics</p>
        {results ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Overall</th>
                  <th>Focused</th>
                  <th>Distracted</th>
                  <th>Impulsive</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Accuracy</td>
                  <td className="font-mono font-semibold text-accent">{(results.accuracy*100).toFixed(1)}%</td>
                  <td>—</td><td>—</td><td>—</td>
                </tr>
                <tr>
                  <td className="font-medium">Precision</td>
                  <td className="font-mono">{(results.precision*100).toFixed(1)}%</td>
                  {labels.map(l => (
                    <td key={l} className="font-mono">{(results.per_class[l]?.precision*100).toFixed(1)}%</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-medium">Recall</td>
                  <td className="font-mono">{(results.recall*100).toFixed(1)}%</td>
                  {labels.map(l => (
                    <td key={l} className="font-mono">{(results.per_class[l]?.recall*100).toFixed(1)}%</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-medium">F1 Score</td>
                  <td className="font-mono font-semibold text-accent">{results.f1.toFixed(3)}</td>
                  {labels.map(l => (
                    <td key={l} className="font-mono">{results.per_class[l]?.f1.toFixed(3)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-8 bg-surface rounded animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* Confusion matrix */}
      <div className="section">
        <p className="label mb-4">Confusion Matrix</p>
        {confMatrix.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table max-w-sm">
              <thead>
                <tr>
                  <th className="text-right">Predicted →</th>
                  {labels.map(l => (
                    <th key={l} style={{ color: LABEL_COLORS[l] }}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confMatrix.map((row, ri) => {
                  const total = row.reduce((s, v) => s + v, 0);
                  return (
                    <tr key={ri}>
                      <td className="font-semibold text-right pr-4 text-xs" style={{ color: LABEL_COLORS[labels[ri]] }}>
                        {labels[ri]}
                      </td>
                      {row.map((v, ci) => {
                        const pct = total ? v / total : 0;
                        const isCorrect = ri === ci;
                        return (
                          <td key={ci} className="text-center">
                            <span
                              className="inline-block w-14 py-1.5 rounded text-xs font-semibold"
                              style={{
                                background: isCorrect
                                  ? `rgba(22,163,74,${0.1 + pct*0.4})`
                                  : `rgba(220,38,38,${0.05 + pct*0.2})`,
                                color: isCorrect ? "#16A34A" : pct > 0.1 ? "#DC2626" : "#9CA3AF",
                              }}
                            >
                              {v}
                            </span>
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
          <div className="h-32 bg-surface rounded animate-pulse" />
        )}
      </div>

      {/* Charts grid */}
      <div className="section">
        <p className="label mb-6">Charts</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* BAS timeline */}
          <div>
            <p className="text-sm font-semibold text-text mb-4">BAS Score Timeline — Demo Session</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={BAS_DEMO}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E5E7EB" />
                <XAxis dataKey="turn" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <YAxis domain={[0,100]} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <Tooltip {...TT} />
                <Line type="monotone" dataKey="bas" stroke="#2563EB" strokeWidth={2} dot={{ fill: "#2563EB", r: 3 }} name="BAS" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Reward trajectory */}
          <div>
            <p className="text-sm font-semibold text-text mb-4">Reward Trajectory — Demo Session</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={REWARD_DEMO}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E5E7EB" />
                <XAxis dataKey="turn" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <Tooltip {...TT} />
                <Bar dataKey="reward" radius={[2,2,0,0]} name="Reward">
                  {REWARD_DEMO.map((d, i) => (
                    <Cell key={i} fill={d.reward >= 0 ? "#16A34A" : "#DC2626"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per-class bar chart */}
          <div>
            <p className="text-sm font-semibold text-text mb-4">Precision · Recall · F1 by Class</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={classData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="2 4" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <YAxis domain={[0,100]} tick={{ fill: "#9CA3AF", fontSize: 11 }} unit="%" />
                <Tooltip {...TT} formatter={(v: number) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Precision" fill="#2563EB"  radius={[2,2,0,0]} />
                <Bar dataKey="Recall"    fill="#111827"  radius={[2,2,0,0]} />
                <Bar dataKey="F1"        fill="#6B7280"  radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* State persistence */}
          <div>
            <p className="text-sm font-semibold text-text mb-4">Avg. State Persistence (turns)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={PERSIST_DEMO} layout="vertical">
                <CartesianGrid strokeDasharray="2 4" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 11 }} domain={[0,4]} />
                <YAxis type="category" dataKey="state" tick={{ fill: "#9CA3AF", fontSize: 11 }} width={72} />
                <Tooltip {...TT} />
                <Bar dataKey="runs" radius={[0,2,2,0]} name="Avg runs">
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
