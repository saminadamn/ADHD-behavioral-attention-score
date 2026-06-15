import type {
  AnalyzeRequest, AnalyzeResponse,
  DatasetResponse, SimulateResponse,
  InterventionResponse, ResultsData,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts?.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API error");
  }
  return res.json();
}

export const api = {
  health: () => request<{ status: string }>("/api/health"),

  analyze: (body: AnalyzeRequest) =>
    request<AnalyzeResponse>("/api/analyze", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  dataset: (params?: {
    label?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.label)  q.set("label",  params.label);
    if (params?.search) q.set("search", params.search);
    if (params?.limit)  q.set("limit",  String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    return request<DatasetResponse>(`/api/dataset${q.toString() ? "?" + q : ""}`);
  },

  simulate: (phenotype: string) =>
    request<SimulateResponse>("/api/simulate", {
      method: "POST",
      body: JSON.stringify({ phenotype }),
    }),

  intervention: (current_bas: number, attention_state?: string | null) =>
    request<InterventionResponse>("/api/intervention", {
      method: "POST",
      body: JSON.stringify({ current_bas, attention_state }),
    }),

  results: () => request<ResultsData>("/api/results"),
};
