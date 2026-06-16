import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AttentionLabel } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function labelColor(label: AttentionLabel | string): string {
  switch (label) {
    case "Focused":    return "#7C9A6D";
    case "Distracted": return "#C08457";
    case "Impulsive":  return "#B4534D";
    default:           return "#8B5CF6";
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
    case "SUSTAIN":   return "#7C9A6D";
    case "ENCOURAGE": return "#8B5CF6";
    case "SIMPLIFY":  return "#C08457";
    case "BREAK":     return "#B4534D";
    default:          return "#6E617D";
  }
}

export function formatPct(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

export function formatBas(v: number): string {
  return v.toFixed(1);
}
