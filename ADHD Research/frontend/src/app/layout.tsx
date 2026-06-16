import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BAS — Behavioral Attention Score",
  description:
    "A LangGraph multi-agent framework for modeling ADHD attentional variability through educational interactions.",
  openGraph: {
    title: "Behavioral Attention Score (BAS)",
    description: "AI for Health research — ADHD attentional variability modeling via LangGraph.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-text min-h-screen antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
