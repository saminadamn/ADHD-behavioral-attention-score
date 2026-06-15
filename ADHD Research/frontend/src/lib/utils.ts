import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AttentionLabel } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function labelColor(label: AttentionLabel | string): string {
  switch (label) {
    case "Focused":    return "#10B981";
    case "Distracted": return "#F59E0B";
    case "Impulsive":  return "#EF4444";
    default:           return "#7C3AED";
  }
}

export function labelBg(label: AttentionLabel | string): string {
  switch (label) {
    case "Focused":    return "bg-focused/15 text-focused border-focused/30";
    case "Distracted": return "bg-distracted/15 text-distracted border-distracted/30";
    case "Impulsive":  return "bg-impulsive/15 text-impulsive border-impulsive/30";
    default:           return "bg-primary/15 text-primary border-primary/30";
  }
}

export function tierColor(tier: string): string {
  switch (tier) {
    case "SUSTAIN":   return "#10B981";
    case "ENCOURAGE": return "#7C3AED";
    case "SIMPLIFY":  return "#F59E0B";
    case "BREAK":     return "#EF4444";
    default:          return "#64748B";
  }
}

export function formatPct(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

export function formatBas(v: number): string {
  return v.toFixed(1);
}
