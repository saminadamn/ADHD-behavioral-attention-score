"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle, Circle, AlertCircle, RotateCcw, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";
import { cn, labelBg, labelColor, tierColor, formatPct, formatBas } from "@/lib/utils";

const STAGES = [
  "Signal Extractor",
  "State Classifier",
  "Reward Modeler",
  "BAS Tracker",
  "Intervention Gen.",
];

const SAMPLE_TURNS = [
  { prompt: "What is photosynthesis?", response: "Plants use sunlight, water, and CO2 to make glucose. It happens in the chloroplasts.", latency: 7.2 },
  { prompt: "Can you give an example of a metaphor?", response: "Oh, did you watch the game? I love football. The team was amazing yesterday!", latency: 18.0 },
  { prompt: "What is the speed of light?", response: "Fast!", latency: 0.9 },
];

function FeatureBar({ label, value, max = 1 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-mono">{value.toFixed(3)}</span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
        />
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [prompt, setPrompt]     = useState(SAMPLE_TURNS[0].prompt);
  const [response, setResponse] = useState(SAMPLE_TURNS[0].response);
  const [latency, setLatency]   = useState(SAMPLE_TURNS[0].latency);
  const [loading, setLoading]   = useState(false);
  const [stage, setStage]       = useState(-1);
  const [result, setResult]     = useState<AnalyzeResponse | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [basHistory, setBasHistory] = useState<number[]>([]);
  const [prevState, setPrevState]   = useState<string | null>(null);
  const [turnCount, setTurnCount]   = useState(0);

  async function analyze() {
    if (!prompt.trim() || !response.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    // animate pipeline stages
    for (let i = 0; i < STAGES.length; i++) {
      setStage(i);
      await new Promise((r) => setTimeout(r, 350));
    }

    try {
      const res = await api.analyze({
        teacher_prompt:            prompt,
        student_response:          response,
        response_latency:          latency,
        previous_attention_state:  prevState as never,
        current_bas:               basHistory.length ? basHistory[basHistory.length - 1] : 50,
        bas_history:               basHistory,
      });
      setResult(res);
      setBasHistory(res.bas_history);
      setPrevState(res.attention_state);
      setTurnCount((c) => c + 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "API error");
    } finally {
      setLoading(false);
      setStage(-1);
    }
  }

  function reset() {
    setResult(null);
    setBasHistory([]);
    setPrevState(null);
    setTurnCount(0);
    setError(null);
  }

  const currentBas = basHistory.length ? basHistory[basHistory.length - 1] : 50;

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Zap className="w-3 h-3" /> Live AI Analysis
          </div>
          <h1 className="section-title">Real-Time Attention Modeling</h1>
          <p className="section-subtitle mt-3">
            Submit classroom turns and watch the 5-agent pipeline classify attention, compute reward, and update the BAS score.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — form */}
          <div className="lg:col-span-3 space-y-5">
            {/* Session info */}
            <div className="flex items-center gap-3">
              <div className="flex-1 card py-3 text-center">
                <div className="text-xl font-bold text-white">{turnCount}</div>
                <div className="text-xs text-slate-500">Turns</div>
              </div>
              <div className="flex-1 card py-3 text-center">
                <div className="text-xl font-bold" style={{ color: currentBas > 50 ? "#10B981" : currentBas > 25 ? "#F59E0B" : "#EF4444" }}>
                  {formatBas(currentBas)}
                </div>
                <div className="text-xs text-slate-500">Current BAS</div>
              </div>
              <div className="flex-1 card py-3 text-center">
                <div className={cn("text-sm font-bold", prevState ? "" : "text-slate-500")}>
                  {prevState ?? "—"}
                </div>
                <div className="text-xs text-slate-500">Prev State</div>
              </div>
              <button onClick={reset} className="p-3 rounded-xl border border-border hover:border-border-light text-slate-500 hover:text-white transition-all" title="Reset session">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Sample quick-fill */}
            <div>
              <div className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Quick fill — samples</div>
              <div className="flex gap-2 flex-wrap">
                {SAMPLE_TURNS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setPrompt(s.prompt); setResponse(s.response); setLatency(s.latency); }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border text-slate-400 hover:border-primary/40 hover:text-primary transition-all"
                  >
                    Sample {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="card space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Teacher Prompt
                </label>
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What is photosynthesis?"
                  className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Student Response
                </label>
                <textarea
                  rows={3}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Plants use sunlight..."
                  className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-sm text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Response Latency (seconds)</span>
                  <span className="font-mono text-white">{latency.toFixed(1)}s</span>
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={30}
                  step={0.1}
                  value={latency}
                  onChange={(e) => setLatency(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>0.1s (Impulsive)</span>
                  <span>30s (Distracted)</span>
                </div>
              </div>
              <button
                onClick={analyze}
                disabled={loading || !prompt.trim() || !response.trim()}
                className="w-full btn-primary justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed py-3.5"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Analyze Attention
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right — pipeline + results */}
          <div className="lg:col-span-2 space-y-5">
            {/* Pipeline stages */}
            <div className="card">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Pipeline</div>
              <div className="space-y-2.5">
                {STAGES.map((s, i) => {
                  const done    = result && i <= 4;
                  const active  = loading && i === stage;
                  const pending = loading && i > stage;
                  return (
                    <div key={s} className={cn(
                      "flex items-center gap-3 py-2 px-3 rounded-xl transition-all",
                      active  ? "bg-primary/10 border border-primary/30" : "",
                      done    ? "opacity-70" : "",
                      pending ? "opacity-40" : "",
                    )}>
                      {done ? (
                        <CheckCircle className="w-4 h-4 text-focused flex-shrink-0" />
                      ) : active ? (
                        <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      )}
                      <span className={cn("text-sm", active ? "text-white font-medium" : "text-slate-400")}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="card border-impulsive/30 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-impulsive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-impulsive">{error}</p>
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Attention state */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attention State</div>
                      <span className={cn("tag border", labelBg(result.attention_state))}>
                        {result.attention_state}
                      </span>
                    </div>
                    <div className="flex items-end gap-4">
                      <div>
                        <div className="text-3xl font-black" style={{ color: labelColor(result.attention_state) }}>
                          {formatPct(result.confidence)}
                        </div>
                        <div className="text-xs text-slate-500">confidence</div>
                      </div>
                      <div>
                        <div className="text-3xl font-black text-white">{formatBas(result.current_bas)}</div>
                        <div className="text-xs text-slate-500">BAS score</div>
                      </div>
                      <div>
                        <div className={cn("text-2xl font-bold", result.reward >= 0 ? "text-focused" : "text-impulsive")}>
                          {result.reward >= 0 ? "+" : ""}{result.reward.toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-500">reward</div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="card space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Extracted Features</div>
                    <FeatureBar label="Sentiment"         value={(result.features.sentiment + 1) / 2} />
                    <FeatureBar label="Topic Shift"       value={result.features.topic_shift_score} />
                    <FeatureBar label="Engagement"        value={result.features.engagement_score} />
                    <FeatureBar label="Latency Score"     value={result.features.latency_score} />
                    <div className="flex justify-between text-xs text-slate-400 pt-1 border-t border-border">
                      <span>Response length</span>
                      <span className="font-mono text-white">{result.features.response_length} words</span>
                    </div>
                  </div>

                  {/* Intervention */}
                  <div className="card" style={{ borderLeft: `3px solid ${tierColor(result.tier)}` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Intervention</div>
                      <span className="tag text-white" style={{ background: `${tierColor(result.tier)}25`, color: tierColor(result.tier) }}>
                        {result.tier}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed mb-3">{result.intervention}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{result.rationale}</p>
                  </div>

                  {/* BAS trajectory mini */}
                  {basHistory.length > 1 && (
                    <div className="card">
                      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5" /> BAS Trajectory
                      </div>
                      <div className="flex items-end gap-1 h-12">
                        {basHistory.map((b, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t transition-all"
                            style={{
                              height: `${(b / 100) * 100}%`,
                              background: i === basHistory.length - 1
                                ? `linear-gradient(to top, #7C3AED, #06B6D4)`
                                : "#1E1E30",
                              minHeight: "2px",
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>Turn 1</span>
                        <span>Turn {basHistory.length}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
