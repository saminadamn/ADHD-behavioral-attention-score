"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",              label: "Home" },
  { href: "/architecture",  label: "Architecture" },
  { href: "/dataset",       label: "Dataset" },
  { href: "/analysis",      label: "Live Analysis" },
  { href: "/dashboard",     label: "Results" },
  { href: "/simulator",     label: "Simulator" },
  { href: "/interventions", label: "Interventions" },
  { href: "/research",      label: "Research" },
  { href: "/about",         label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/85 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm tracking-tight">
              BAS <span className="text-primary font-normal hidden sm:inline">Research</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link href="/analysis" className="hidden sm:flex btn-primary text-xs px-4 py-2">
              Try Demo <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border bg-white/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/analysis" className="btn-primary mt-2 justify-center" onClick={() => setOpen(false)}>
              Try Demo <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
