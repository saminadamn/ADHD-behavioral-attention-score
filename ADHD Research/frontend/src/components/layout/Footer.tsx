import Link from "next/link";
import { Brain, Github, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-800 text-sm">BAS Research</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Behavioral Attention Score — A LangGraph multi-agent framework for modeling ADHD
              attentional variability in educational settings.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Research</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {[
                ["/architecture", "System Architecture"],
                ["/dataset",      "Dataset Explorer"],
                ["/dashboard",    "Results Dashboard"],
                ["/research",     "Contributions"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-primary transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Contact</h4>
            <div className="space-y-2 text-sm text-slate-500">
              <p className="font-semibold text-slate-700">Samina Parveen</p>
              <p>BIT Mesra, Ranchi</p>
              <p>Supervisor: Dr. Itu Snigdh</p>
              <div className="flex items-center gap-3 mt-3">
                <a
                  href="https://github.com/saminadamn/ADHD-behavioral-attention-score"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a href="mailto:btech10007.23@bitmesra.ac.in" className="text-slate-400 hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2024 Samina Parveen · BIT Mesra. Research prototype — not for clinical use.</p>
          <p>Built with Next.js · FastAPI · LangGraph</p>
        </div>
      </div>
    </footer>
  );
}
