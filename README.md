# Behavioral Attention Score (BAS)

A LangGraph multi-agent backend + Next.js frontend that scores a student's attention state from a single classroom-style interaction (a teacher prompt, a student response, and the response latency) and recommends a tiered intervention in real time.

**Live demo:** frontend on Vercel, API on Render (see [Deployment](#deployment)).
**Author:** Samina Parveen · BIT Mesra · Supervisor: Dr. Itu Snigdh

> Research prototype trained on synthetic classroom data. It does not diagnose or assess ADHD in real individuals.

---

## What it does

Given one teacher–student exchange, the API:

1. Extracts five behavioral signals from the exchange (semantic similarity, topic shift, sentiment, response-length bucket, latency).
2. Classifies the turn into an attention state — **Focused**, **Distracted**, or **Impulsive**.
3. Computes a reward signal from the transition between the previous and current attention state.
4. Updates a running **Behavioral Attention Score (BAS)**, a 0–100 score with memory across turns.
5. Recommends one of four intervention tiers based on the current BAS.

Each stage is an independent, testable function wired into a single **LangGraph** pipeline — not a monolithic script — so any stage can be inspected, replaced, or unit-tested on its own.

## Architecture

```
Teacher prompt + student response + latency
                 │
                 ▼
   ┌─────────────────────────┐
   │ signal_extractor         │  five behavioral features
   ├─────────────────────────┤
   │ state_classifier         │  Focused / Distracted / Impulsive
   ├─────────────────────────┤
   │ reward_modeler           │  reward from state transition
   ├─────────────────────────┤
   │ bas_tracker              │  updates running BAS + history
   ├─────────────────────────┤
   │ intervention_generator   │  BAS → intervention tier
   └─────────────────────────┘
                 │
                 ▼
         FastAPI JSON response
```

`backend/core/pipeline.py` wires these five agents into a `StateGraph`; `backend/models/state.py` defines the shared `WorkflowState` that flows between them.

## Repository structure

```
backend/                   FastAPI service (deployed to Render)
    agents/                 the five pipeline stages above
        signal_extractor.py     sentence-transformer similarity, sentiment, topic shift
        state_classifier.py     rule-based attention-state classifier
        reward_modeler.py       transition-based reward signal
        bas_tracker.py          running BAS score + turn memory
        intervention_generator.py   BAS → tiered intervention
    api/routes/             FastAPI routers
        analysis.py              POST /analyze — run one turn through the pipeline
        dataset.py               GET  /dataset  — browse the synthetic dataset
        phenotype.py             POST /simulate — simulate a student phenotype
        intervention.py          POST /intervention, GET /results
    core/pipeline.py        LangGraph StateGraph construction + run_turn()
    models/state.py         Pydantic WorkflowState shared across agents
    scripts/generate_large_dataset.py   synthetic dataset generator
    data/synthetic_adhd.csv             generated dataset used by /dataset
    main.py                 FastAPI app, CORS, startup pre-warm

frontend/                  Next.js 15 app (deployed to Vercel)
    src/app/                 one page per route: dashboard, simulator, dataset,
                              analysis, interventions, methodology, architecture,
                              research, about
    src/lib/api.ts           typed client for the backend API
    src/lib/types.ts         shared request/response types

render.yaml                 Render Blueprint (rootDir: backend)
```

## Running locally

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python -c "import textblob; textblob.download_corpora()"   # first time only
cp .env.example .env
python -m uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# set NEXT_PUBLIC_API_URL=http://localhost:8000 in .env.local
npm install
npm run dev
# http://localhost:3000
```

### Regenerating the dataset

```bash
cd backend
python scripts/generate_large_dataset.py --samples 10000 --out data/synthetic_adhd.csv
```

## Deployment

- **Backend → Render.** `render.yaml` at the repo root is a Render Blueprint with `rootDir: backend`; Render installs `backend/requirements.txt`, pre-downloads the sentence-transformer model at build time, and runs `uvicorn main:app`.
- **Frontend → Vercel.** Set the project's **Root Directory** to `frontend` in the Vercel dashboard (this isn't stored in `vercel.json`), and set `NEXT_PUBLIC_API_URL` to the deployed Render URL.

## Tech stack

Python 3.11, FastAPI, LangGraph, Pydantic, Sentence-Transformers, TextBlob · Next.js 15, TypeScript, Tailwind CSS.

## Limitations

- Trained and evaluated entirely on **synthetic** classroom data — no real student data is used or collected.
- The attention-state classifier is rule-based over the extracted features, not a trained model; see `backend/agents/state_classifier.py`.
- Intervention tiers are hand-designed thresholds on BAS, not learned from outcome data.
- This is a research prototype, not a validated clinical or diagnostic tool.
