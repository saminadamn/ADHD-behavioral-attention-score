"use client";
import { useState, useEffect, useCallback } from "react";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
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

  const totalPages  = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="max-w-wide mx-auto px-6 pt-14 pb-20">

      {/* Header */}
      <div className="mb-10">
        <p className="label mb-3">Dataset Explorer</p>
        <h1 className="page-title mb-2">Synthetic ADHD Dataset</h1>
        <p className="text-sm text-text-muted">
          500 topic-aligned teacher–student interaction samples with per-label attention classification
          and response latency measurements calibrated from ADHD literature norms.
        </p>
      </div>

      {/* Stats table */}
      {stats && (
        <div className="section">
          <p className="label mb-4">Dataset Statistics</p>
          <div className="overflow-x-auto">
            <table className="data-table max-w-lg">
              <thead>
                <tr><th>Split</th><th>Count</th><th>Pct</th><th>Avg latency</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">All</td>
                  <td className="font-mono">{stats.total}</td>
                  <td className="font-mono text-text-muted">100%</td>
                  <td className="font-mono">{stats.avg_latency}s</td>
                </tr>
                <tr>
                  <td className="text-focused font-medium">Focused</td>
                  <td className="font-mono">{stats.focused}</td>
                  <td className="font-mono text-text-muted">{(stats.focused/stats.total*100).toFixed(0)}%</td>
                  <td className="font-mono text-text-muted">~7.2s</td>
                </tr>
                <tr>
                  <td className="text-distracted font-medium">Distracted</td>
                  <td className="font-mono">{stats.distracted}</td>
                  <td className="font-mono text-text-muted">{(stats.distracted/stats.total*100).toFixed(0)}%</td>
                  <td className="font-mono text-text-muted">~18.0s</td>
                </tr>
                <tr>
                  <td className="text-impulsive font-medium">Impulsive</td>
                  <td className="font-mono">{stats.impulsive}</td>
                  <td className="font-mono text-text-muted">{(stats.impulsive/stats.total*100).toFixed(0)}%</td>
                  <td className="font-mono text-text-muted">~0.9s</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Avg response length: <span className="font-mono">{stats.avg_resp_len} words</span>
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="section">
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Search prompts or responses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-1"
          />
          <div className="flex gap-1">
            {LABELS.map((l) => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded border transition-colors",
                  label === l
                    ? "bg-accent text-white border-accent"
                    : "border-border text-text-muted hover:text-text hover:border-border-strong bg-white"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-border rounded">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Teacher Prompt</th>
                <th>Student Response</th>
                <th className="w-20">Latency</th>
                <th className="w-28">Label</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-3 bg-surface-2 rounded animate-pulse" style={{ width: j===0?"1.5rem":j===3?"2.5rem":"75%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-text-muted">No records found.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs text-text-subtle">{r.id}</td>
                    <td className="max-w-xs truncate text-text" title={r.teacher_prompt}>{r.teacher_prompt}</td>
                    <td className="max-w-xs truncate text-text-muted" title={r.student_response}>{r.student_response}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs text-text-muted font-mono">
                        <Clock className="w-3 h-3" />{r.response_latency.toFixed(1)}s
                      </span>
                    </td>
                    <td>
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

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-text-muted text-xs">
            Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="p-1.5 rounded border border-border disabled:opacity-30 hover:bg-surface transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-text-muted font-mono">{currentPage} / {totalPages}</span>
            <button
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="p-1.5 rounded border border-border disabled:opacity-30 hover:bg-surface transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
