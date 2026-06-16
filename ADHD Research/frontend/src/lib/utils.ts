import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AttentionLabel } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function labelColor(label: AttentionLabel | string): string {
  switch (label) {
    case "Focused":    return "#16A34A";
    case "Distracted": return "#B45309";
    case "Impulsive":  return "#DC2626";
    default:           return "#2563EB";
  }
}

export function labelBg(label: AttentionLabel | string): string {
  switch (label) {
    case "Focused":    return "bg-focused/10 text-focused border-focused/25";
    case "Distracted": return "bg-distracted/10 text-distracted border-distracted/25";
    case "Impulsive":  return "bg-impulsive/10 text-impulsive border-impulsive/25";
    default:           return "bg-accent/10 text-accent border-accent/25";
  }
}

export function tierColor(tier: string): string {
  switch (tier) {
    case "SUSTAIN":   return "#16A34A";
    case "ENCOURAGE": return "#2563EB";
    case "SIMPLIFY":  return "#B45309";
    case "BREAK":     return "#DC2626";
    default:          return "#6B7280";
  }
}

export function formatPct(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

export function formatBas(v: number): string {
  return v.toFixed(1);
}
