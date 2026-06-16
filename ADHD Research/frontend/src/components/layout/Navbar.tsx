"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",              label: "Overview"      },
  { href: "/architecture",  label: "Architecture"  },
  { href: "/analysis",      label: "Demo"          },
  { href: "/dashboard",     label: "Results"       },
  { href: "/dataset",       label: "Dataset"       },
  { href: "/simulator",     label: "Simulator"     },
  { href: "/interventions", label: "Interventions" },
  { href: "/research",      label: "Research"      },
  { href: "/about",         label: "About"         },
];

export function Navbar() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="max-w-wide mx-auto px-6 h-12 flex items-center gap-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex-shrink-0 text-sm font-semibold text-text tracking-tight no-underline hover:no-underline"
        >
          BAS<span className="text-accent font-bold">·</span>Research
        </Link>

        <span className="text-border-strong text-xs select-none">|</span>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
          {NAV.map((item) => {
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2 py-1 text-[13px] rounded transition-colors whitespace-nowrap no-underline hover:no-underline",
                  active
                    ? "text-accent font-semibold"
                    : "text-text-muted hover:text-text"
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
