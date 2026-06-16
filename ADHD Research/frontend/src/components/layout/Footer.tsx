import Link from "next/link";

const RESEARCH_AREAS = [
  "Artificial Intelligence",
  "Natural Language Processing",
  "AI for Health",
  "Educational Technology",
  "Neurodevelopmental Disorders",
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-20">
      <div className="max-w-wide mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">

          {/* Institution */}
          <div>
            <p className="label mb-3">Institution</p>
            <p className="text-sm font-semibold text-text">BIT Mesra</p>
            <p className="text-sm text-text-muted">Birla Institute of Technology</p>
            <p className="text-sm text-text-muted">Ranchi, Jharkhand, India</p>
            <p className="text-sm text-text-muted mt-2">Research Project · 2026</p>
          </div>

          {/* Research Areas */}
          <div>
            <p className="label mb-3">Research Areas</p>
            <ul className="space-y-1">
              {RESEARCH_AREAS.map((area) => (
                <li key={area} className="text-sm text-text-muted">{area}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="label mb-3">Contact</p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-text">Samina Parveen</p>
                <p className="text-text-muted">B.Tech Information Technology</p>
                <a href="mailto:btech10007.23@bitmesra.ac.in" className="text-accent text-xs">
                  btech10007.23@bitmesra.ac.in
                </a>
              </div>
              <div className="pt-1">
                <p className="text-text-muted text-xs">Supervisor</p>
                <p className="font-medium text-text">Dr. Itu Snigdh</p>
                <p className="text-text-muted text-xs">Associate Professor, CSE</p>
              </div>
              <div className="flex gap-3 pt-2">
                <a
                  href="https://github.com/saminadamn/ADHD-behavioral-attention-score"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  GitHub ↗
                </a>
                <Link href="/analysis" className="text-xs text-accent hover:underline">
                  Live Demo ↗
                </Link>
                <Link href="/methodology" className="text-xs text-accent hover:underline">
                  Documentation ↗
                </Link>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-text-subtle">
          <p>© 2026 Samina Parveen, BIT Mesra. Research prototype — not for clinical use.</p>
          <p>Built with Next.js · FastAPI · LangGraph</p>
        </div>
      </div>
    </footer>
  );
}
