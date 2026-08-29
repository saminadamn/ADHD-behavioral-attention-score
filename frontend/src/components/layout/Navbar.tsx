"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",             label: "Home"        },
  { href: "/analysis",     label: "Live Demo"   },
  { href: "/simulator",    label: "Simulation"  },
  { href: "/dashboard",    label: "Results"     },
  { href: "/methodology",  label: "Methodology" },
  { href: "/about",        label: "About"       },
];

export function Navbar() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-wide mx-auto px-6 h-[52px] flex items-center gap-8">

        {/* Brand */}
        <Link
          href="/"
          className="flex-shrink-0 font-semibold text-sm text-text tracking-tight no-underline hover:no-underline"
        >
          BAS<span className="text-accent font-bold mx-0.5">·</span>Research
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {NAV.map((item) => {
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2.5 py-1.5 text-[13px] rounded-md transition-colors whitespace-nowrap no-underline hover:no-underline",
                  active
                    ? "text-accent font-semibold bg-accent/8"
                    : "text-text-muted hover:text-text hover:bg-surface-2"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* External */}
        <a
          href="https://github.com/saminadamn/ADHD-behavioral-attention-score"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-[13px] text-text-muted hover:text-text no-underline hover:no-underline transition-colors"
        >
          GitHub ↗
        </a>
      </div>
    </header>
  );
}
