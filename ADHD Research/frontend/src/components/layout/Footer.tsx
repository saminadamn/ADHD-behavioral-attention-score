import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-wide mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[13px] text-text-muted">
        <div className="space-y-0.5">
          <p>
            <span className="font-medium text-text">Samina Parveen</span>
            {" · "}B.Tech IT, BIT Mesra
            {" · "}Supervisor: Dr. Itu Snigdh
          </p>
          <p>
            <a href="mailto:btech10007.23@bitmesra.ac.in" className="hover:text-text">
              btech10007.23@bitmesra.ac.in
            </a>
            {" · "}Research prototype — not for clinical use.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/saminadamn/ADHD-behavioral-attention-score"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text transition-colors"
          >
            GitHub
          </a>
          <Link href="/research" className="hover:text-text transition-colors no-underline">
            Paper
          </Link>
          <Link href="/dashboard" className="hover:text-text transition-colors no-underline">
            Results
          </Link>
        </div>
      </div>
    </footer>
  );
}
