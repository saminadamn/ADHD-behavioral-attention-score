import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BAS Research — Behavioral Attention Score",
  description:
    "A LangGraph-Based Framework for Modeling Attentional Variability in ADHD Through Educational Interactions. BIT Mesra, 2026.",
  openGraph: {
    title: "Behavioral Attention Score (BAS) — BIT Mesra Research, 2026",
    description:
      "AI for Health research project modeling ADHD attentional variability via multi-agent LangGraph pipeline.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-text min-h-screen antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
