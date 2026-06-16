"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";
import { cn, labelBg, labelColor, tierColor, formatPct, formatBas } from "@/lib/utils";

const STAGES = ["Signal Extractor","State Classifier","Reward Modeler","BAS Tracker","Intervention Gen."];

const SAMPLES = [
  { prompt: "What is photosynthesis?", response: "Plants use sunlight, water, and CO2 to make glucose. It happens in the chloroplasts.", latency: 7.2 },
  { prompt: "Can you give an example of a metaphor?", response: "Oh, did you watch the game? I love football. The team was amazing yesterday!", latency: 18.0 },
  { prompt: "What is the speed of light?", response: "Fast!", latency: 0.9 },
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
      await new Promise((r) => setTimeout(r, 320));
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
      setError(e instanceof Error ? e.message : "API error");
    } finally {
      setLoading(false); setStage(-1);
    }
  }

  function reset() {
    setResult(null); setBasHistory([]); setPrevState(null);
    setTurnCount(0); setError(null);
  }

  const currentBas = basHistory.length ? basHistory[basHistory.length - 1] : 50;

  return (
    <div className="max-w-wide mx-auto px-6 pt-14 pb-20">

      {/* Header */}
      <div className="mb-10">
        <p className="label mb-3">Live Demo</p>
        <h1 className="page-title mb-2">Real-Time Attention Analysis</h1>
        <p className="text-sm text-text-muted">
          Submit classroom turns through the live 5-agent LangGraph pipeline. Session state is maintained
          across turns — reset to start a new session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Session state */}
          <div className="section pt-0 mt-0 border-t-0">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="metric">
                <p className="label">Turn</p>
                <p className="font-mono text-2xl font-bold text-text">{turnCount}</p>
              </div>
              <div className="metric">
                <p className="label">BAS</p>
                <p className="font-mono text-2xl font-bold" style={{ color: currentBas > 50 ? "#16A34A" : currentBas > 25 ? "#B45309" : "#DC2626" }}>
                  {formatBas(currentBas)}
                </p>
              </div>
              <div className="metric">
                <p className="label">Prev. State</p>
                <p className="font-mono text-sm font-semibold text-text mt-1">{prevState ?? "—"}</p>
              </div>
              <button onClick={reset} className="btn ml-auto text-xs">Reset session</button>
            </div>
          </div>

          {/* Sample quick-fill */}
          <div>
            <p className="label mb-2">Sample turns</p>
            <div className="flex gap-2 flex-wrap">
              {SAMPLES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(s.prompt); setResponse(s.response); setLatency(s.latency); }}
                  className="btn text-xs"
                >
                  Sample {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4 border border-border rounded p-5">
            <div>
              <label className="label mb-1.5 block">Teacher Prompt</label>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What is photosynthesis?"
                className="input"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Student Response</label>
              <textarea
                rows={3}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Plants use sunlight..."
                className="input resize-none"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="label">Response Latency</label>
                <span className="font-mono text-xs text-text">{latency.toFixed(1)}s</span>
              </div>
              <input
                type="range" min={0.1} max={30} step={0.1} value={latency}
                onChange={(e) => setLatency(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-[11px] text-text-muted mt-1">
                <span>0.1s — Impulsive</span>
                <span>30s — Distracted</span>
              </div>
            </div>
            <button
              onClick={analyze}
              disabled={loading || !prompt.trim() || !response.trim()}
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing…" : "Run Pipeline →"}
            </button>
          </div>

          {error && (
            <div className="border border-impulsive/30 rounded p-3 text-sm text-impulsive">
              Error: {error}
            </div>
          )}
        </div>

        {/* Right: pipeline status + results */}
        <div className="space-y-6">

          {/* Pipeline stages */}
          <div className="border border-border rounded p-4">
            <p className="label mb-4">Pipeline Status</p>
            <div className="space-y-1">
              {STAGES.map((s, i) => {
                const done   = result && i <= 4;
                const active = loading && i === stage;
                return (
                  <div
                    key={s}
                    className={cn(
                      "flex items-center gap-2.5 py-1.5 text-xs transition-colors",
                      done   ? "text-focused"  : "",
                      active ? "text-accent font-semibold" : "",
                      !done && !active ? "text-text-subtle" : ""
                    )}
                  >
                    <span className="font-mono w-4 flex-shrink-0">
                      {done ? "✓" : active ? "→" : String(i+1)}
                    </span>
                    <span>{s}</span>
                    {active && (
                      <span className="ml-auto w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4">

              <div className="border border-border rounded p-4">
                <p className="label mb-3">Classification</p>
                <table className="data-table">
                  <tbody>
                    <tr>
                      <td className="text-text-muted text-xs w-24">State</td>
                      <td>
                        <span className={cn("tag border", labelBg(result.attention_state))}>
                          {result.attention_state}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">Confidence</td>
                      <td className="font-mono font-semibold">{formatPct(result.confidence)}</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">Reward</td>
                      <td className="font-mono font-semibold" style={{ color: result.reward >= 0 ? "#16A34A" : "#DC2626" }}>
                        {result.reward >= 0 ? "+" : ""}{result.reward.toFixed(1)}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">BAS</td>
                      <td className="font-mono font-bold text-accent">{formatBas(result.current_bas)}</td>
                    </tr>
                    <tr>
                      <td className="text-text-muted text-xs">Tier</td>
                      <td className="font-semibold text-xs" style={{ color: tierColor(result.tier) }}>{result.tier}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border border-border rounded p-4">
                <p className="label mb-3">Features</p>
                <table className="data-table">
                  <tbody>
                    {[
                      { k: "Sentiment",     v: ((result.features.sentiment+1)/2).toFixed(3) },
                      { k: "Topic Shift",   v: result.features.topic_shift_score.toFixed(3) },
                      { k: "Engagement",    v: result.features.engagement_score.toFixed(3) },
                      { k: "Latency Score", v: result.features.latency_score.toFixed(3) },
                      { k: "Word Count",    v: String(result.features.response_length) },
                    ].map(({ k, v }) => (
                      <tr key={k}>
                        <td className="text-text-muted text-xs">{k}</td>
                        <td className="font-mono text-xs">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border border-border rounded p-4" style={{ borderLeftWidth: "2px", borderLeftColor: tierColor(result.tier) }}>
                <p className="label mb-2">Intervention</p>
                <p className="text-sm text-text leading-relaxed mb-2">{result.intervention}</p>
                <p className="text-xs text-text-muted leading-relaxed">{result.rationale}</p>
              </div>

              {basHistory.length > 1 && (
                <div className="border border-border rounded p-4">
                  <p className="label mb-3">BAS Trajectory</p>
                  <div className="flex items-end gap-0.5 h-10">
                    {basHistory.map((b, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all"
                        style={{
                          height: `${(b/100)*100}%`,
                          minHeight: "2px",
                          background: i === basHistory.length - 1 ? "#2563EB" : "#E5E7EB",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] text-text-muted mt-1">
                    <span>Turn 1</span>
                    <span>Turn {basHistory.length}</span>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
