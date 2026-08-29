"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { InterventionResponse } from "@/lib/types";
import { cn, tierColor } from "@/lib/utils";

const STATES = [null, "Focused", "Distracted", "Impulsive"] as const;

const TIER_TABLE = [
  { tier: "SUSTAIN",   range: "BAS > 75",       desc: "Engagement strong. Maintain or increase difficulty." },
  { tier: "ENCOURAGE", range: "50 < BAS ≤ 75",  desc: "Moderate activation. Reinforce with praise and structure." },
  { tier: "SIMPLIFY",  range: "25 < BAS ≤ 50",  desc: "Disengagement risk. Reduce cognitive load." },
  { tier: "BREAK",     range: "BAS ≤ 25",        desc: "Critical depletion. Rest before re-engagement." },
];

export default function InterventionsPage() {
  const [bas,     setBas]     = useState(60);
  const [state,   setState]   = useState<string | null>(null);
  const [result,  setResult]  = useState<InterventionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try { setResult(await api.intervention(bas, state)); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [bas, state]);

  const tier  = result?.tier ?? "ENCOURAGE";
  const color = tierColor(tier);

  return (
    <div className="max-w-content mx-auto px-6 pt-14 pb-20">

      {/* Header */}
      <div className="mb-10">
        <p className="label mb-3">Intervention Explorer</p>
        <h1 className="page-title mb-2">Adaptive Intervention Engine</h1>
        <p className="text-sm text-text-muted">
          The intervention catalogue maps each (BAS tier, attention state) pair to an evidence-based
          pedagogical recommendation. Adjust the controls to explore all 16 entries.
        </p>
      </div>

      {/* Tier reference table */}
      <div className="section">
        <p className="label mb-4">BAS Tier Definitions</p>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Tier</th><th>BAS Range</th><th>Clinical Guidance</th></tr>
            </thead>
            <tbody>
              {TIER_TABLE.map((t) => (
                <tr key={t.tier}>
                  <td className="font-semibold text-xs" style={{ color: tierColor(t.tier) }}>{t.tier}</td>
                  <td className="font-mono text-xs">{t.range}</td>
                  <td className="text-xs text-text-muted">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controls */}
      <div className="section">
        <div className="grid sm:grid-cols-2 gap-8">

          {/* BAS slider */}
          <div>
            <p className="label mb-3">BAS Score</p>
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-mono text-3xl font-bold" style={{ color }}>{bas}</span>
              <span className="text-xs font-semibold" style={{ color }}>{tier}</span>
            </div>
            <div className="relative">
              <div className="h-2 rounded-full" style={{
                background: "linear-gradient(to right, #DC2626 0%, #B45309 25%, #2563EB 50%, #16A34A 100%)"
              }} />
              <input
                type="range" min={0} max={100} value={bas}
                onChange={(e) => setBas(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
              />
            </div>
            <div className="flex justify-between text-[11px] text-text-muted mt-1">
              <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
            </div>

            <p className="label mt-5 mb-2">Attention State</p>
            <div className="flex flex-wrap gap-1.5">
              {STATES.map((s) => {
                const active = state === s;
                const sColor = s === "Focused" ? "#16A34A" : s === "Distracted" ? "#B45309" : s === "Impulsive" ? "#DC2626" : "#2563EB";
                return (
                  <button
                    key={String(s)}
                    onClick={() => setState(s as never)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded border transition-colors",
                      active ? "text-white" : "border-border text-text-muted hover:text-text hover:border-border-strong bg-white"
                    )}
                    style={active ? { background: sColor, borderColor: sColor } : {}}
                  >
                    {s ?? "Auto"}
                  </button>
                );
              })}
            </div>

            <p className="label mt-5 mb-2">Quick Presets</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Peak Focus",   bas: 88, state: "Focused"    },
                { label: "Early Drift",  bas: 62, state: "Distracted" },
                { label: "Low Impulse",  bas: 38, state: "Impulsive"  },
                { label: "Critical Low", bas: 12, state: null         },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setBas(p.bas); setState(p.state as never); }}
                  className="btn text-xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div>
            <p className="label mb-3">Recommendation</p>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-surface-2 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-surface-2 rounded animate-pulse" />
                <div className="h-4 bg-surface-2 rounded animate-pulse w-5/6" />
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div
                  className="border rounded p-4"
                  style={{ borderColor: `${color}40`, borderLeftWidth: "2px", borderLeftColor: color }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold" style={{ color }}>{result.tier}</span>
                    {state && <span className="badge">{state}</span>}
                  </div>
                  <p className="text-sm text-text leading-relaxed">{result.intervention}</p>
                </div>

                <div className="border border-border rounded p-4">
                  <p className="label mb-2">Clinical Rationale</p>
                  <p className="text-xs text-text-muted leading-relaxed">{result.rationale}</p>
                </div>

                <div className="border border-border rounded p-4">
                  <p className="label mb-3">State Summary</p>
                  <table className="data-table">
                    <tbody>
                      <tr>
                        <td className="text-xs text-text-muted">BAS Score</td>
                        <td className="font-mono font-semibold" style={{ color }}>{bas}/100</td>
                      </tr>
                      <tr>
                        <td className="text-xs text-text-muted">Tier</td>
                        <td className="font-semibold text-xs" style={{ color }}>{result.tier}</td>
                      </tr>
                      <tr>
                        <td className="text-xs text-text-muted">State</td>
                        <td className="font-mono text-xs">{state ?? "Any"}</td>
                      </tr>
                      <tr>
                        <td className="text-xs text-text-muted">Catalogue key</td>
                        <td className="font-mono text-xs">{result.label}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

    </div>
  );
}
