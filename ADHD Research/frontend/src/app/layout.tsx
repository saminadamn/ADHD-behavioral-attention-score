import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "BAS — Behavioral Attention Score",
  description:
    "A LangGraph-Based Multi-Agent Framework for Modeling ADHD Attentional Variability Through Educational Interactions",
  openGraph: {
    title: "Behavioral Attention Score (BAS)",
    description: "AI for Health research platform — ADHD attentional variability modeling",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-200 min-h-screen antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
