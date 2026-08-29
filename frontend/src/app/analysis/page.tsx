"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";
import { cn, labelBg, labelColor, tierColor, formatPct, formatBas } from "@/lib/utils";

const STAGES = [
  { id: 1, label: "Behavioral Signal Extractor", desc: "NLP features" },
  { id: 2, label: "Attention State Classifier",  desc: "Focused / Distracted / Impulsive" },
  { id: 3, label: "RL Reward Modeler",           desc: "Transition reward r ∈ [−8, +10]" },
  { id: 4, label: "BAS Tracker",                 desc: "Cumulative score update" },
  { id: 5, label: "Intervention Generator",      desc: "Pedagogical recommendation" },
];

const SAMPLES = [
  { label: "Focused",    prompt: "What is photosynthesis?", response: "Plants use sunlight, water, and CO₂ to make glucose. The process occurs in chloroplasts.", latency: 7.2 },
  { label: "Distracted", prompt: "Can you give an example of a metaphor?", response: "Oh, did you watch the game? I love football. The team was amazing yesterday!", latency: 18.0 },
  { label: "Impulsive",  prompt: "What is the speed of light?", response: "Fast!", latency: 0.9 },
];

export default function AnalysisPage() {
  const [prompt, setPrompt]     = useState(SAMPLES[0].prompt);
  const [response, setResponse] = useState(SAMPLES[0].response);
  const [latency, setLatency]   = useState(SAMPLES[0].latency);
  const [loading, setLoading]   = useState(false);
  const [stage, setStage]       = useState(-1);
  const [result, setResult]     = useState<AnalyzeResponse | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [basHistory, setBasHistory] = useState<number[]>([]);
  const [prevState, setPrevState]   = useState<string | null>(null);
  const [turnCount, setTurnCount]   = useState(0);

  async function analyze() {
    if (!prompt.trim() || !response.trim()) return;
    setLoading(true); setError(null); setResult(null);
    for (let i = 0; i < STAGES.length; i++) {
      setStage(i);
      await new Promise((r) => setTimeout(r, 300));
    }
    try {
      const res = await api.analyze({
        teacher_prompt:           prompt,
        student_response:         response,
        response_latency:         latency,
        previous_attention_state: prevState as never,
        current_bas:              basHistory.length ? basHistory[basHistory.length - 1] : 50,
        bas_history:              basHistory,
      });
      setResult(res);
      setBasHistory(res.bas_history);
      setPrevState(res.attention_state);
      setTurnCount((c) => c + 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "API unavailable");
    } finally { setLoading(false); setStage(-1); }
  }

  function reset() {
    setResult(null); setBasHistory([]); setPrevState(null);
    setTurnCount(0); setError(null);
  }

  const currentBas = basHistory.length ? basHistory[basHistory.length - 1] : 50;

  return (
    <div className="max-w-wide mx-auto px-6 pt-12 pb-20">

      {/* Header */}
      <div className="mb-10 pb-8 border-b border-border">
        <p className="label mb-3">Live Demo</p>
        <h1 className="page-title mb-2">Real-Time Attention Analysis</h1>
        <p className="text-sm text-text-muted max-w-prose">
          Submit a classroom interaction turn through the live five-agent LangGraph pipeline.
          Session state — previous attention state and BAS history — is maintained across turns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">

        {/* ── LEFT: Form ─────────────────────────────── */}
        <div className="space-y-6">

          {/* Session status */}
          <div className="flex flex-wrap items-center gap-6 text-sm py-3 border-b border-border">
            <div className="metric">
              <div className="label mb-0.5">Session Turn</div>
              <div className="text-xl font-bold text-text font-mono">{turnCount}</div>
            </div>
            <div className="metric">
              <div className="label mb-0.5">Current BAS</div>
              <div
                className="text-xl font-bold font-mono"
                style={{ color: currentBas > 50 ? "#7C9A6D" : currentBas > 25 ? "#C08457" : "#B4534D" }}
              >
                {formatBas(currentBas)}
              </div>
            </div>
            <div className="metric">
              <div className="label mb-0.5">Previous State</div>
              <div className="text-sm font-semibold text-text font-mono mt-0.5">{prevState ?? "—"}</div>
            </div>
            <button onClick={reset} className="btn text-xs ml-auto">Reset Session</button>
          </div>

          {/* Sample quick-fill */}
          <div>
            <p className="label mb-2">Example Interactions</p>
            <div className="flex gap-2 flex-wrap">
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => { setPrompt(s.prompt); setResponse(s.response); setLatency(s.latency); }}
                  className="btn text-xs"
                >
                  {s.label} Example
                </button>
              ))}
            </div>
          </div>

          {/* Input form */}
          <div className="card card-body space-y-4">
            <div>
              <label className="label block mb-1.5">Teacher Prompt</label>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. What is photosynthesis?"
                className="input"
              />
            </div>

            <div>
              <label className="label block mb-1.5">Student Response</label>
              <textarea
                rows={3}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="e.g. Plants use sunlight to make glucose…"
                className="input resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label">Response Latency (seconds)</label>
                <span className="font-mono text-sm font-semibold text-text">{latency.toFixed(1)}s</span>
              </div>
              <input
                type="range" min={0.1} max={30} step={0.1} value={latency}
                onChange={(e) => setLatency(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[11px] text-text-muted mt-1">
                <span>0.1s — Impulsive signal</span>
                <span>30s — Distracted signal</span>
              </div>
            </div>

            <button
              onClick={analyze}
              disabled={loading || !prompt.trim() || !response.trim()}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing…" : "Analyze Interaction →"}
            </button>
          </div>

          {error && (
            <div className="border border-impulsive/30 bg-impulsive/5 rounded-md p-3 text-sm text-impulsive">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-5">
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-surface-2 flex items-center justify-between">
                  <p className="label">Classification Output</p>
                  <span className={cn("tag border", labelBg(result.attention_state))}>
                    {result.attention_state}
                  </span>
                </div>
                <table className="data-table">
                  <tbody>
                    <tr>
                      <td className="text-text-muted text-xs w-36">Attention State</td>
                      <td className="font-semibold" style={{ color: labelColor(result.attention_state) }}>{result.attention_state}</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">Confidence</td>
                      <td className="font-mono font-semibold">{formatPct(result.confidence)}</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">Transition Reward</td>
                      <td className="font-mono font-semibold" style={{ color: result.reward >= 0 ? "#7C9A6D" : "#B4534D" }}>
                        {result.reward >= 0 ? "+" : ""}{result.reward.toFixed(1)}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">BAS Score</td>
                      <td className="font-mono font-bold text-accent">{formatBas(result.current_bas)} / 100</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">Tier</td>
                      <td className="font-semibold text-xs" style={{ color: tierColor(result.tier) }}>{result.tier}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-surface-2">
                  <p className="label">Extracted Features</p>
                </div>
                <table className="data-table">
                  <thead>
                    <tr><th>Feature</th><th>Value</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-text-muted text-xs">Response Length</td>
                      <td className="font-mono">{result.features.response_length} words</td>
                      <td className="text-text-subtle text-xs">word count</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">Sentiment</td>
                      <td className="font-mono">{((result.features.sentiment+1)/2).toFixed(3)}</td>
                      <td className="text-text-subtle text-xs">TextBlob, [0,1]</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">Topic Shift Score</td>
                      <td className="font-mono">{result.features.topic_shift_score.toFixed(3)}</td>
                      <td className="text-text-subtle text-xs">cosine distance</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">Engagement Score</td>
                      <td className="font-mono">{result.features.engagement_score.toFixed(3)}</td>
                      <td className="text-text-subtle text-xs">composite</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">Latency Score</td>
                      <td className="font-mono">{result.features.latency_score.toFixed(3)}</td>
                      <td className="text-text-subtle text-xs">normalised, inverted</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="card card-body" style={{ borderLeft: `3px solid ${tierColor(result.tier)}` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="label">Intervention</p>
                  <span className="text-xs font-bold" style={{ color: tierColor(result.tier) }}>{result.tier}</span>
                </div>
                <p className="text-sm text-text leading-relaxed mb-2">{result.intervention}</p>
                <p className="text-xs text-text-muted leading-relaxed">{result.rationale}</p>
              </div>

              {basHistory.length > 1 && (
                <div className="card card-body">
                  <p className="label mb-3">BAS Trajectory</p>
                  <div className="flex items-end gap-0.5 h-12">
                    {basHistory.map((b, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${(b/100)*100}%`,
                          minHeight: "2px",
                          background: i === basHistory.length - 1 ? "#8B5CF6" : "#E7E0F3",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] text-text-muted mt-1.5">
                    <span>Turn 1</span>
                    <span>Turn {basHistory.length}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Pipeline status ─────────────────── */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-surface-2">
              <p className="label">Pipeline Progression</p>
            </div>
            <div className="p-4 space-y-0">
              {STAGES.map((s, i) => {
                const done   = !!result && i <= 4;
                const active = loading && i === stage;
                const pending = !result && !loading && i > stage;
                return (
                  <div key={s.id}>
                    <div className={cn(
                      "flex items-start gap-3 px-3 py-2.5 rounded-md transition-colors",
                      active ? "bg-accent/8" : ""
                    )}>
                      <span className={cn(
                        "flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center text-[10px] font-bold mt-0.5 transition-colors",
                        done   ? "bg-focused/15 border-focused/40 text-focused" :
                        active ? "border-accent bg-accent/10 text-accent" :
                                 "border-border text-text-subtle"
                      )}>
                        {done ? "✓" : s.id}
                      </span>
                      <div>
                        <p className={cn(
                          "text-xs font-medium transition-colors",
                          done   ? "text-text" :
                          active ? "text-accent" :
                                   "text-text-muted"
                        )}>
                          {s.label}
                        </p>
                        <p className="text-[11px] text-text-subtle">{s.desc}</p>
                      </div>
                      {active && (
                        <div className="ml-auto flex-shrink-0 w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin mt-1" />
                      )}
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className="flex justify-start ml-6 py-0.5">
                        <div className="w-px h-3 bg-border" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* API info */}
          <div className="mt-4 p-4 border border-border rounded-lg text-xs text-text-muted space-y-1">
            <p className="label mb-2">API Endpoint</p>
            <p className="font-mono">POST /analyze</p>
            <p className="font-mono">POST /intervention</p>
            <p className="mt-2">
              Backend deployed on Render.{" "}
              <a
                href="https://github.com/saminadamn/ADHD-behavioral-attention-score"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source ↗
              </a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
