<div align="center">

# Behavioral Attention Score (BAS)
### A LangGraph-Based Multi-Agent Framework for Modeling ADHD Attentional Variability

[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.x-FF6B35?style=flat-square)](https://github.com/langchain-ai/langgraph)
[![LangChain](https://img.shields.io/badge/LangChain-1.x-1C3C3C?style=flat-square)](https://langchain.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Research%20Prototype-orange?style=flat-square)]()

*A computational neuroscience research prototype for quantifying and interpreting attentional variability in ADHD through multi-agent AI pipelines.*

</div>

---

## Abstract

Attention-Deficit/Hyperactivity Disorder (ADHD) is characterised not merely by inattention but by **intra-individual variability (IIV)** — moment-to-moment fluctuations in cognitive performance that are absent in neurotypical populations. This variability is hypothesised to reflect dysregulation of the **Behavioural Activation System (BAS)**, a neurobiological reward-sensitivity circuit that drives impulsive attention shifts toward salient stimuli.

The **Behavioral Attention Score (BAS)** framework introduces a modular, LangGraph-based multi-agent pipeline that:

1. Ingests Continuous Performance Task (CPT)-style trial data (real or synthetic)
2. Computes established IIV metrics: coefficient of variation, attention lapses, and BAS influence scores
3. Invokes a large language model (GPT-4o-mini via LangChain) to generate structured, clinically interpretable BAS narratives using Pydantic-validated output schemas
4. Produces publication-ready visualisations of attentional dynamics

This prototype serves as a foundation for scalable, AI-augmented cognitive profiling in clinical and research settings.

---

## Research Motivation

> *"The single most consistent neuropsychological finding in ADHD is not mean-level performance deficits, but the abnormal variability of performance."*
> — Castellanos & Tannock (2002), *Nature Reviews Neuroscience*

Traditional ADHD assessment relies on clinical observation and static psychometric scores. These approaches fail to capture the **temporal dynamics** of attentional fluctuation — the very signature that most strongly distinguishes ADHD from neurotypical profiles.

The **BAS framework** is motivated by three converging lines of evidence:

| Evidence Stream | Key Finding | Implication |
|---|---|---|
| Neuropsychology | IIV in RT is the strongest ADHD biomarker (Fuermaier et al., 2021) | IIV should be the primary modelled outcome |
| Motivational theory | Elevated BAS sensitivity drives reward-oriented attention shifts (Gray & McNaughton, 2000) | BAS score must modulate trial generation |
| AI interpretability | LLMs can generate structured clinical narratives from numeric biomarkers (Thirunavukarasu et al., 2023) | Chain-of-thought prompting enables explainable outputs |

---

## Architecture

### Pipeline Overview

The framework implements a **directed acyclic graph** of four specialised agents, each responsible for a discrete processing stage. State is passed immutably between nodes via LangGraph's `StateGraph`.

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                     ADHD-BAS Pipeline                          │
 │                                                                 │
 │  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐   │
 │  │             │    │             │    │                  │   │
 │  │ data_loader │───►│  analysis   │───►│ llm_interpreter  │   │
 │  │             │    │             │    │                  │   │
 │  └─────────────┘    └─────────────┘    └────────┬─────────┘   │
 │         │                  │                    │              │
 │    CSV / synthetic    IIV · lapses ·        GPT-4o-mini        │
 │    CPT trial data     BAS score ·           structured         │
 │    (80 trials)        mean RT · SD          BAS narrative      │
 │                                                 │              │
 │                                        ┌────────▼─────────┐   │
 │                                        │                  │   │
 │                                        │   visualiser     │   │
 │                                        │                  │   │
 │                                        └──────────────────┘   │
 │                                        RT time-series ·        │
 │                                        histogram ·             │
 │                                        accuracy plot           │
 └─────────────────────────────────────────────────────────────────┘
```

### State Schema

All nodes share a single `PipelineState` (Pydantic `BaseModel`) that propagates through the graph:

```
PipelineState
├── participant       : ParticipantProfile   (ID, age, diagnosis, BAS/BIS scores)
├── raw_samples       : list[AttentionSample] (per-trial RT, accuracy, inattention)
├── analysis          : AnalysisResult        (IIV, mean RT, SD, lapses, BAS score)
├── report            : str                   (formatted LLM narrative)
├── messages          : list[AnyMessage]      (LangGraph message history)
└── error             : str                   (propagated error signal)
```

### Agent Responsibilities

```
agents/
├── data_loader.py       Reads participants.csv or synthesises 80 BAS-modulated CPT trials
│                        BAS sensitivity directly scales RT noise amplitude
│
├── analysis.py          Computes IIV (coefficient of variation), attention lapses (RT > 600 ms),
│                        mean RT, SD, and BAS influence score (inattention × BAS sensitivity)
│
├── llm_interpreter.py   Constructs a LangChain prompt chain:
│                        ChatPromptTemplate | ChatOpenAI | PydanticOutputParser → BASInterpretation
│                        Gracefully degrades without OPENAI_API_KEY
│
└── visualiser.py        Matplotlib 3-panel figure:
                         [0,:] RT time-series with mean and lapse threshold
                         [1,0] RT histogram
                         [1,1] Rolling accuracy (window = n_trials / 10)
```

---

## Folder Structure

```
adhd-bas/
│
├── data/
│   └── participants.csv          # Participant demographics and BAS/BIS scores
│
├── outputs/
│   └── adhd_bas_<pid>.png        # Generated variability plots (gitignored)
│
├── agents/
│   ├── __init__.py
│   ├── data_loader.py            # Node 1 — data ingestion and synthesis
│   ├── analysis.py               # Node 2 — variability metric computation
│   ├── llm_interpreter.py        # Node 3 — LLM-driven BAS interpretation
│   └── visualiser.py             # Node 4 — publication-ready plots
│
├── graphs/
│   ├── __init__.py
│   └── pipeline.py               # StateGraph definition and edge routing
│
├── models/
│   ├── __init__.py
│   ├── state.py                  # PipelineState, ParticipantProfile, AnalysisResult
│   └── schemas.py                # Pydantic schemas for LLM structured output
│
├── main.py                       # Entry point
├── requirements.txt
├── .env.example
└── README.md
```

---

## Installation

### Prerequisites

- Python 3.11 or higher
- An OpenAI API key (optional — pipeline runs in offline mode without one)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/saminadamn/ADHD-behavioral-attention-score.git
cd ADHD-behavioral-attention-score

# 2. Create a virtual environment
python -m venv .venv

# Activate — Windows
.venv\Scripts\activate

# Activate — macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install --prefer-binary -r requirements.txt

# 4. Configure environment
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux
```

Edit `.env` and add your OpenAI key:

```env
OPENAI_API_KEY=sk-...
```

### Run

```bash
python main.py
```

Expected output:

```
============================================================
  ADHD-BAS  |  Attentional Variability Research Prototype
============================================================
[visualiser] Plot saved -> outputs/adhd_bas_P001.png

=== ADHD-BAS Report | Participant P001 ===

[Metrics] Participant P001 | IIV=0.314 | mean RT=363.2 ms | SD=114.2 ms | lapses=2 | BAS influence=0.186

--- BAS Interpretation ---
Reward sensitivity: Elevated BAS sensitivity in this participant suggests heightened
                    reactivity to reward cues, producing abrupt attentional reorienting.
...

[Done] Check outputs/ for visualisation plots.
```

---

## Participant Data Format

Add rows to `data/participants.csv` to process real participants:

| Column | Type | Description |
|---|---|---|
| `participant_id` | `str` | Unique identifier (e.g. `P001`) |
| `age` | `int` | Age in years |
| `diagnosis` | `str` | `ADHD` or `control` |
| `medication_status` | `str` | `medicated`, `unmedicated`, or `none` |
| `bas_sensitivity` | `float` | BAS sensitivity score, 0.0–1.0 |
| `bis_sensitivity` | `float` | BIS sensitivity score, 0.0–1.0 |

When no CSV is present, the pipeline synthesises a default ADHD participant (`P001`, BAS=0.82).

---

## Key Metrics

| Metric | Formula | Interpretation |
|---|---|---|
| **IIV** | `SD(RT) / mean(RT)` | Coefficient of variation; elevated in ADHD |
| **Attention lapses** | `count(RT > 600 ms)` | Trials indicating complete attentional disengagement |
| **BAS influence score** | `mean(inattention) × BAS sensitivity` | Proxy for reward-sensitivity contribution to variability |
| **Mean RT** | `mean(RT)` | Overall processing speed |

---

## Future Work

- [ ] **Real CPT integration** — ingest `.csv` exports from Conners' CPT-3 and TOVA
- [ ] **Group-level analysis** — ADHD vs. control IIV comparison with Cohen's d effect sizes
- [ ] **Medication moderation** — model medicated vs. unmedicated BAS influence trajectories
- [ ] **Temporal modelling** — replace synthetic noise with a Hidden Markov Model of attention states (on-task / mind-wandering / lapse)
- [ ] **Multi-participant graphs** — extend StateGraph to fan-out across participant cohorts in parallel
- [ ] **Interactive dashboard** — Streamlit interface for clinicians to upload CPT data and receive real-time BAS reports
- [ ] **Fine-tuned interpreter** — replace zero-shot GPT-4o-mini with a fine-tuned model trained on clinical ADHD case notes
- [ ] **BIS/BAS dissociation** — extend the model to separately quantify inhibition-related and activation-related variability components

---

## Dependencies

| Package | Version | Role |
|---|---|---|
| `langgraph` | >=1.x | Multi-agent state graph orchestration |
| `langchain` | >=1.x | Prompt chaining and output parsing |
| `langchain-openai` | >=1.x | OpenAI chat model integration |
| `openai` | >=2.x | GPT-4o-mini API client |
| `pydantic` | >=2.7 | State and schema validation |
| `pandas` | >=2.0 | Participant CSV ingestion |
| `matplotlib` | >=3.8 | Attentional variability plots |
| `numpy` | >=1.26 | Numerical metric computation |
| `python-dotenv` | >=1.0 | Environment variable management |

---

## Citation

If you use this framework in your research, please cite:

```bibtex
@software{parveen2025adhdbas,
  author       = {Parveen, Samina},
  title        = {{Behavioral Attention Score (BAS): A LangGraph-Based
                   Multi-Agent Framework for Modeling ADHD Attentional Variability}},
  year         = {2025},
  publisher    = {GitHub},
  url          = {https://github.com/saminadamn/ADHD-behavioral-attention-score}
}
```

### Key References

```
Castellanos, F. X., & Tannock, R. (2002).
  Neuroscience of attention-deficit/hyperactivity disorder: The search for endophenotypes.
  Nature Reviews Neuroscience, 3(8), 617–628.

Gray, J. A., & McNaughton, N. (2000).
  The Neuropsychology of Anxiety: An Enquiry into the Functions of the Septo-Hippocampal System.
  Oxford University Press.

Sonuga-Barke, E. J. S. (2005).
  Causal heterogeneity in attention-deficit/hyperactivity disorder:
  A double dissociation of temporal and motivational dysfunction.
  Biological Psychiatry, 57(11), 1231–1238.

Fuermaier, A. B. M., et al. (2021).
  Intraindividual variability in inhibition as a neuropsychological marker of ADHD.
  Psychological Medicine, 51(3), 436–444.

Thirunavukarasu, A. J., et al. (2023).
  Large language models in medicine.
  Nature Medicine, 29, 1930–1940.
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

Developed as part of a computational neuroscience research initiative.

*Behavioral Attention Score (BAS) — modeling the mind's variability, one trial at a time.*

</div>
