"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Clock, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { DatasetRecord, DatasetStats } from "@/lib/types";
import { cn, labelBg } from "@/lib/utils";

const LABELS = ["All", "Focused", "Distracted", "Impulsive"] as const;
const PAGE_SIZE = 20;

export default function DatasetPage() {
  const [records, setRecords]     = useState<DatasetRecord[]>([]);
  const [stats, setStats]         = useState<DatasetStats | null>(null);
  const [total, setTotal]         = useState(0);
  const [label, setLabel]         = useState<string>("All");
  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDs]  = useState("");
  const [offset, setOffset]       = useState(0);
  const [loading, setLoading]     = useState(true);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDs(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.dataset({
        label:  label === "All" ? undefined : label,
        search: debouncedSearch || undefined,
        limit:  PAGE_SIZE,
        offset,
      });
      setRecords(res.records);
      setStats(res.stats);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [label, debouncedSearch, offset]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setOffset(0); }, [label, debouncedSearch]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            Dataset Explorer
          </div>
          <h1 className="section-title">Synthetic ADHD Dataset</h1>
          <p className="section-subtitle mt-3">
            500 topic-aligned teacher–student interaction samples with attention labels and latency measurements.
          </p>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8"
          >
            {[
              { label: "Total",      value: stats.total,                      color: "text-white" },
              { label: "Focused",    value: stats.focused,                    color: "text-focused" },
              { label: "Distracted", value: stats.distracted,                 color: "text-distracted" },
              { label: "Impulsive",  value: stats.impulsive,                  color: "text-impulsive" },
              { label: "Avg Latency",value: `${stats.avg_latency}s`,          color: "text-accent" },
              { label: "Avg Length", value: `${stats.avg_resp_len} wds`,       color: "text-primary-light" },
            ].map((s) => (
              <div key={s.label} className="card text-center py-4">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search prompts or responses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {LABELS.map((l) => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
                  label === l
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "border-border text-slate-400 hover:text-white hover:border-border-light"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher Prompt</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Response</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Latency</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Label</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-surface-2 rounded animate-pulse" style={{ width: j === 0 ? "2rem" : j === 3 ? "3rem" : "80%" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">No records found.</td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-slate-600 text-xs font-mono">{r.id}</td>
                      <td className="px-4 py-3 text-slate-300 max-w-xs truncate" title={r.teacher_prompt}>{r.teacher_prompt}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={r.student_response}>{r.student_response}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />{r.response_latency.toFixed(1)}s
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("tag border", labelBg(r.attention_label))}>
                          {r.attention_label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="p-2 rounded-lg border border-border disabled:opacity-30 hover:border-border-light transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-400">{currentPage} / {totalPages}</span>
            <button
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="p-2 rounded-lg border border-border disabled:opacity-30 hover:border-border-light transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
