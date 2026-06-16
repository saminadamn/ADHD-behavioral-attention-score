"use client";
import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "motivation",      label: "Research Motivation" },
  { id: "dataset",         label: "Synthetic Dataset" },
  { id: "features",        label: "Behavioral Signal Extraction" },
  { id: "classification",  label: "Attention Classification" },
  { id: "reward",          label: "Reward Modeling" },
  { id: "bas",             label: "Behavioral Attention Score" },
  { id: "interventions",   label: "Intervention Generation" },
  { id: "evaluation",      label: "Evaluation Strategy" },
  { id: "limitations",     label: "Limitations" },
  { id: "future",          label: "Future Work" },
];

export default function MethodologyPage() {
  const [active, setActive] = useState("motivation");
  const containerRef        = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="max-w-wide mx-auto px-6 pt-12 pb-20">

      {/* Header */}
      <div className="mb-10 pb-8 border-b border-border">
        <p className="label mb-3">Methodology · 2026</p>
        <h1 className="page-title mb-2">System Methodology</h1>
        <p className="text-sm text-text-muted max-w-prose">
          Technical documentation of the BAS pipeline — data, feature extraction, classification,
          reward modeling, score computation, and intervention generation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10 items-start">

        {/* Sidebar ToC */}
        <nav className="lg:sticky lg:top-20 lg:self-start">
          <p className="label mb-3">Contents</p>
          <ul className="space-y-0.5">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <button
                  onClick={() => scrollTo(s.id)}
                  className={`
                    w-full text-left px-2 py-1.5 rounded text-xs transition-colors
                    ${active === s.id
                      ? "text-accent font-semibold bg-accent/8"
                      : "text-text-muted hover:text-text"}
                  `}
                >
                  <span className="text-text-subtle mr-1.5">{i + 1}.</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div ref={containerRef} className="space-y-16 min-w-0">

          {/* 1. Research Motivation */}
          <section id="motivation" className="scroll-mt-20">
            <p className="label mb-3">1. Research Motivation</p>
            <h2 className="section-title mb-4">Why a Real-Time Behavioral Attention Score?</h2>
            <div className="space-y-3 text-sm leading-[1.85] text-text max-w-prose">
              <p>
                Attention Deficit Hyperactivity Disorder (ADHD) is characterised by pronounced
                intra-individual variability (IIV) — moment-to-moment fluctuations in attentional
                capacity that standard diagnostic instruments, such as Conners&apos; Rating Scales
                or Continuous Performance Tests, are administered in clinical settings and fail to
                capture naturalistic educational contexts.
              </p>
              <p>
                Existing intelligent tutoring systems (ITS) treat attention as a binary state or rely
                on physiological sensors (EEG, GSR) that are impractical for classroom deployment.
                The gap motivates a purely behavioral, text-based proxy grounded in the theoretical
                framework most consistent with ADHD&apos;s motivational substrate:
                Gray &amp; McNaughton&apos;s <strong>Behavioral Activation System (BAS)</strong> theory,
                which characterises attention as reward-sensitive goal-directed behavior.
              </p>
              <p>
                By operationalising BAS as a continuous 0–100 score computed from linguistic and
                temporal features of classroom exchanges — without hardware beyond a standard
                student terminal — this project aims to produce a deployable, privacy-preserving
                attention monitoring pipeline for educational environments.
              </p>
            </div>
          </section>

          {/* 2. Synthetic Dataset */}
          <section id="dataset" className="scroll-mt-20 section">
            <p className="label mb-3">2. Synthetic Dataset</p>
            <h2 className="section-title mb-4">Data Generation and Structure</h2>
            <div className="space-y-3 text-sm leading-[1.85] text-text max-w-prose">
              <p>
                No real-world ADHD classroom transcript dataset exists at sufficient scale with
                ground-truth attention labels. We generate a balanced synthetic dataset of{" "}
                <strong>500 teacher–student interaction turns</strong> using a template-driven
                procedural generator with controlled feature distributions per attention class.
              </p>
              <p>
                Each sample encodes a <code className="font-mono text-xs bg-surface-2 px-1 rounded">teacher_prompt</code>,{" "}
                <code className="font-mono text-xs bg-surface-2 px-1 rounded">student_response</code>, and{" "}
                <code className="font-mono text-xs bg-surface-2 px-1 rounded">response_latency</code> (seconds).
                Ground-truth labels are Focused, Distracted, or Impulsive (equal distribution: ≈167 samples each).
              </p>
            </div>
            <div className="mt-6 overflow-x-auto border border-border rounded-lg">
              <table className="data-table max-w-lg">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Word Count</th>
                    <th>Latency (s)</th>
                    <th>Topic Shift</th>
                    <th>Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium" style={{ color: "#7C9A6D" }}>Focused</td>
                    <td className="font-mono text-xs">15–45</td>
                    <td className="font-mono text-xs">3–12</td>
                    <td className="font-mono text-xs">0.05–0.25</td>
                    <td className="font-mono text-xs">+0.1 to +0.5</td>
                  </tr>
                  <tr>
                    <td className="font-medium" style={{ color: "#C08457" }}>Distracted</td>
                    <td className="font-mono text-xs">10–40</td>
                    <td className="font-mono text-xs">12–25</td>
                    <td className="font-mono text-xs">0.50–0.90</td>
                    <td className="font-mono text-xs">−0.2 to +0.3</td>
                  </tr>
                  <tr>
                    <td className="font-medium" style={{ color: "#B4534D" }}>Impulsive</td>
                    <td className="font-mono text-xs">1–5</td>
                    <td className="font-mono text-xs">0.5–3</td>
                    <td className="font-mono text-xs">0.00–0.30</td>
                    <td className="font-mono text-xs">0.0 to +0.2</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Table 1 — Feature distribution ranges per attention class in the synthetic dataset.
            </p>
          </section>

          {/* 3. Feature Extraction */}
          <section id="features" className="scroll-mt-20 section">
            <p className="label mb-3">3. Behavioral Signal Extraction</p>
            <h2 className="section-title mb-4">Agent A1 — Feature Extractor</h2>
            <p className="text-sm leading-[1.85] text-text max-w-prose mb-5">
              Agent A1 extracts five numerical features from each interaction turn that serve as the
              input representation for downstream classification.
            </p>
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="data-table">
                <thead>
                  <tr><th>Feature</th><th>Method</th><th>Range</th><th>Rationale</th></tr>
                </thead>
                <tbody>
                  {[
                    { f: "Response Length",    m: "word_tokenize(response)",                                r: "[0, ∞]",  r2: "Impulsive responses are ultra-short (≤5 words)" },
                    { f: "Sentiment",          m: "TextBlob(response).sentiment.polarity",                  r: "[−1, +1]", r2: "Emotional tone correlates with engagement" },
                    { f: "Topic Shift Score",  m: "1 − cosine_sim(embed(prompt), embed(response))",         r: "[0, 1]",  r2: "High shift → off-topic / distracted content" },
                    { f: "Engagement Score",   m: "(response_length_norm × 0.4) + (sentiment_norm × 0.3) + ((1−topic_shift) × 0.3)", r: "[0, 1]", r2: "Composite — rewards on-topic verbose responses" },
                    { f: "Latency Score",      m: "1 − min(latency / 30, 1)",                              r: "[0, 1]",  r2: "Inverted: slow response → low score (distracted)" },
                  ].map((row) => (
                    <tr key={row.f}>
                      <td className="font-medium text-text text-xs whitespace-nowrap">{row.f}</td>
                      <td><code className="font-mono text-[10px] bg-surface-2 px-1 py-0.5 rounded">{row.m}</code></td>
                      <td className="font-mono text-xs">{row.r}</td>
                      <td className="text-xs text-text-muted">{row.r2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Embeddings use <code className="font-mono">all-MiniLM-L6-v2</code> via Sentence-Transformers.
            </p>
          </section>

          {/* 4. Classification */}
          <section id="classification" className="scroll-mt-20 section">
            <p className="label mb-3">4. Attention Classification</p>
            <h2 className="section-title mb-4">Agent A2 — Priority Rule-Based Classifier</h2>
            <div className="space-y-3 text-sm leading-[1.85] text-text max-w-prose">
              <p>
                A2 applies a three-tier priority rule system. Rules are evaluated in order; the first
                matching rule determines the class. Confidence reflects rule specificity, ranging from
                0.65 (catch-all) to 0.98 (high-specificity Impulsive rule).
              </p>
            </div>
            <pre className="code-block mt-5 text-[11px]">{`# Priority order — first match wins
if word_count <= 3 AND latency_score >= 0.7:
    state = "Impulsive"     confidence = 0.95

elif topic_shift_score >= 0.6 AND latency_score <= 0.4:
    state = "Distracted"    confidence = 0.85

elif engagement_score >= 0.55 AND topic_shift_score < 0.4:
    state = "Focused"       confidence = 0.80

elif word_count <= 5 AND latency_score >= 0.6:
    state = "Impulsive"     confidence = 0.80

elif topic_shift_score >= 0.5:
    state = "Distracted"    confidence = 0.75

else:
    state = "Focused"       confidence = 0.65`}
            </pre>
            <p className="text-xs text-text-muted mt-2">
              Rule 1 achieves near-perfect Impulsive F1 = 0.982. Rule 6 (catch-all Focused) is the
              primary source of Distracted false negatives.
            </p>
          </section>

          {/* 5. Reward Modeling */}
          <section id="reward" className="scroll-mt-20 section">
            <p className="label mb-3">5. Reward Modeling</p>
            <h2 className="section-title mb-4">Agent A3 — RL Reward Modeler</h2>
            <div className="space-y-3 text-sm leading-[1.85] text-text max-w-prose">
              <p>
                A3 computes a scalar reward <em>r ∈ [−8, +10]</em> based on the (previous state →
                current state) transition. The reward table encodes educational reinforcement theory:
                sustained focus is rewarded, impulsive escalation is heavily penalised, and recovery
                from impulsivity to focus receives the highest reward (+8) to reflect therapeutic value.
              </p>
              <p>
                On the first turn of a session (no prior state), cold-start values apply:{" "}
                Focused: +2, Distracted: −2, Impulsive: −5. These reflect baseline priors derived
                from ADHD prevalence in classroom settings (≈10% Focused at session open).
              </p>
            </div>
            <div className="mt-5 overflow-x-auto border border-border rounded-lg max-w-sm">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-right pr-4">Prev → Curr</th>
                    <th style={{ color: "#7C9A6D" }}>Focused</th>
                    <th style={{ color: "#C08457" }}>Distracted</th>
                    <th style={{ color: "#B4534D" }}>Impulsive</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { prev: "Focused",    r: [5, -5, -3] },
                    { prev: "Distracted", r: [3, -4, -2] },
                    { prev: "Impulsive",  r: [8, -6, -8] },
                    { prev: "Initial",    r: [2, -2, -5] },
                  ].map((row) => (
                    <tr key={row.prev}>
                      <td className="text-right pr-4 text-xs font-medium text-text-muted">{row.prev}</td>
                      {row.r.map((v, i) => (
                        <td key={i} className="font-mono font-semibold" style={{ color: v >= 0 ? "#7C9A6D" : "#B4534D" }}>
                          {v >= 0 ? "+" : ""}{v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. BAS */}
          <section id="bas" className="scroll-mt-20 section">
            <p className="label mb-3">6. Behavioral Attention Score</p>
            <h2 className="section-title mb-4">Agent A4 — BAS Tracker</h2>
            <div className="space-y-3 text-sm leading-[1.85] text-text max-w-prose">
              <p>
                A4 maintains the cumulative BAS as a bounded running sum. The update rule is:
              </p>
            </div>
            <pre className="code-block mt-4 text-[11px]">{`BAS_t = clamp(BAS_{t-1} + r_t, 0, 100)

# 5-turn moving average for smoothed display
BAS_smooth_t = mean(BAS_{t-4} ... BAS_t)

# IIV = intra-individual variability
IIV = std(reward_sequence)`}
            </pre>
            <p className="text-sm text-text mt-5 mb-4 max-w-prose leading-relaxed">
              The score is initialised at 50 (neutral baseline). Four tiers govern intervention selection:
            </p>
            <div className="overflow-x-auto border border-border rounded-lg max-w-sm">
              <table className="data-table">
                <thead><tr><th>Tier</th><th>BAS Range</th><th>Meaning</th></tr></thead>
                <tbody>
                  {[
                    { tier: "SUSTAIN",   range: "75–100", color: "#7C9A6D", meaning: "High engagement, reinforce" },
                    { tier: "ENCOURAGE", range: "50–74",  color: "#8B5CF6", meaning: "Adequate, mild encouragement" },
                    { tier: "SIMPLIFY",  range: "25–49",  color: "#C08457", meaning: "Flagging attention, scaffold" },
                    { tier: "BREAK",     range: "0–24",   color: "#B4534D", meaning: "Critical — sensory break needed" },
                  ].map((t) => (
                    <tr key={t.tier}>
                      <td className="font-semibold text-xs" style={{ color: t.color }}>{t.tier}</td>
                      <td className="font-mono text-xs">{t.range}</td>
                      <td className="text-xs text-text-muted">{t.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Interventions */}
          <section id="interventions" className="scroll-mt-20 section">
            <p className="label mb-3">7. Intervention Generation</p>
            <h2 className="section-title mb-4">Agent A5 — Intervention Generator</h2>
            <div className="space-y-3 text-sm leading-[1.85] text-text max-w-prose">
              <p>
                A5 indexes a 16-entry intervention catalogue keyed by{" "}
                <code className="font-mono text-xs bg-surface-2 px-1 rounded">(BAS_tier, attention_state)</code>.
                Entries are sourced from evidence-based ADHD classroom accommodation literature
                (DuPaul &amp; Stoner, 2003; Fabiano et al., 2009).
              </p>
              <p>
                Each intervention includes a short actionable recommendation (shown to the teacher)
                and a clinical rationale (linkable to BAS/BIS theory). The catalogue covers
                4 tiers × 3 states = 12 primary slots plus 4 override rules for extreme BAS values.
              </p>
            </div>
            <div className="mt-5 overflow-x-auto border border-border rounded-lg">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>State</th>
                    <th>Intervention (excerpt)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { tier: "SUSTAIN",   state: "Focused",    text: "Acknowledge engagement. Introduce higher-order questioning." },
                    { tier: "ENCOURAGE", state: "Distracted", text: "Redirect gently. Pose a closed question requiring a short answer." },
                    { tier: "SIMPLIFY",  state: "Impulsive",  text: "Pause the interaction. Validate energy; request a one-sentence answer." },
                    { tier: "BREAK",     state: "Impulsive",  text: "Offer a 2-minute movement or sensory break. Resume with micro-task." },
                    { tier: "BREAK",     state: "Distracted", text: "Switch modality (visual/hands-on). Reduce verbal load immediately." },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td className="text-xs font-semibold text-text-muted">{r.tier}</td>
                      <td className="text-xs">{r.state}</td>
                      <td className="text-xs text-text-muted">{r.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-muted mt-2">Representative entries from the 16-entry catalogue.</p>
          </section>

          {/* 8. Evaluation */}
          <section id="evaluation" className="scroll-mt-20 section">
            <p className="label mb-3">8. Evaluation Strategy</p>
            <h2 className="section-title mb-4">Metrics and Protocol</h2>
            <div className="space-y-3 text-sm leading-[1.85] text-text max-w-prose">
              <p>
                The pipeline is evaluated on a held-out 20% split (100 samples) of the 500-sample
                dataset. Ground-truth labels are generated by the same template engine with clean,
                discriminative feature ranges to ensure upper-bound classifier performance.
              </p>
              <p>
                Primary metrics: overall accuracy, macro-averaged Precision / Recall / F1.
                Per-class metrics are reported separately because class boundary ambiguity is
                scientifically informative (particularly Distracted vs. Focused confusion).
              </p>
              <p>
                BAS validity is assessed through phenotype simulation: 30-turn probabilistic sessions
                generate mean BAS profiles that should stratify by phenotype severity.
                IIV (reward standard deviation) should be highest for Inattentive and Combined types.
              </p>
            </div>
            <pre className="code-block mt-5 text-[11px]">{`# scikit-learn evaluation
from sklearn.metrics import accuracy_score, classification_report

report = classification_report(y_true, y_pred,
    target_names=["Focused", "Distracted", "Impulsive"],
    output_dict=True)

# BAS trajectory validity check
for phenotype in ["Focused", "Inattentive", "Hyperactive", "Combined"]:
    mean_bas = simulate(phenotype, turns=30).mean_bas
    assert phenotype_expected_order_holds(mean_bas)`}
            </pre>
          </section>

          {/* 9. Limitations */}
          <section id="limitations" className="scroll-mt-20 section">
            <p className="label mb-3">9. Limitations</p>
            <h2 className="section-title mb-4">Known Limitations and Caveats</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Synthetic Data",
                  body: "The 500-sample dataset is entirely synthetic. Real classroom transcripts would exhibit far greater linguistic diversity, code-switching, disfluencies, and contextual variability not captured by template generation.",
                },
                {
                  title: "Rule-Based Classifier",
                  body: "A2 uses deterministic priority rules, not a trained model. Rules are hand-designed around known Impulsive discriminators (word count, latency) and will generalise poorly to novel linguistic patterns.",
                },
                {
                  title: "Distracted-Focused Overlap",
                  body: "Macro F1 = 0.764 is substantially reduced by Distracted F1 = 0.570. Verbose, enthusiastic off-topic responses share feature values with Focused responses, creating an ambiguity that hand-coded rules cannot resolve.",
                },
                {
                  title: "Not a Clinical Tool",
                  body: "BAS is a computational proxy, not a diagnostic instrument. ADHD diagnosis requires multi-modal clinical assessment by a qualified practitioner. This system must not be used for diagnostic purposes.",
                },
                {
                  title: "Reward Table Calibration",
                  body: "Reward values (+5, −8, etc.) are theory-informed heuristics, not learned from longitudinal attention data. Miscalibration would propagate across the entire BAS trajectory.",
                },
              ].map((l) => (
                <div key={l.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-text-subtle mt-2" />
                  <div>
                    <p className="text-sm font-semibold text-text mb-0.5">{l.title}</p>
                    <p className="text-sm text-text-muted leading-relaxed">{l.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 10. Future Work */}
          <section id="future" className="scroll-mt-20 section">
            <p className="label mb-3">10. Future Work</p>
            <h2 className="section-title mb-4">Research Directions</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Real Data Collection",
                  body: "Collect anonymised, IRB-approved classroom transcripts with expert-annotated attention labels. Even 200 real samples would substantially validate or challenge the synthetic-data findings.",
                },
                {
                  title: "ML Classifier Replacement",
                  body: "Replace rule-based A2 with a fine-tuned sentence-level classifier (e.g., DistilBERT or a lightweight MLP over the 5 extracted features). Expected improvement: Distracted F1 from 0.570 → 0.75+.",
                },
                {
                  title: "Learned Reward Function",
                  body: "Learn the reward function via inverse reinforcement learning (IRL) from expert teacher behavior logs, replacing the hand-designed 4×3 table.",
                },
                {
                  title: "Multi-modal Extension",
                  body: "Integrate non-invasive signals: keystroke dynamics, mouse movement velocity, and webcam-based head pose estimation as auxiliary behavioral features.",
                },
                {
                  title: "Longitudinal Validation",
                  body: "Evaluate whether IIV (reward standard deviation) computed by the pipeline correlates with existing ADHD clinical scale scores (Conners-3, ADHD-RS-5) in a prospective study.",
                },
                {
                  title: "Teacher Dashboard",
                  body: "Design a real-time classroom view displaying per-student BAS timelines, enabling teachers to see live attention trajectories and accept/reject generated interventions.",
                },
              ].map((f, i) => (
                <div key={f.title} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded border border-accent/30 bg-accent/8 flex items-center justify-center text-[10px] font-bold text-accent mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text mb-0.5">{f.title}</p>
                    <p className="text-sm text-text-muted leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
