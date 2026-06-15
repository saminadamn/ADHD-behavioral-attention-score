# Behavioral Attention Score (BAS)

> A LangGraph-Based Multi-Agent Framework for Modeling ADHD Attentional Variability Through Educational Interactions

**Author:** Samina Parveen · BIT Mesra · Supervisor: Dr. Itu Snigdh  
**Stack:** Next.js 15 · FastAPI · LangGraph · Pydantic · Sentence-Transformers

---

## Quick Start (Local)

### 1. Backend

```bash
cd backend
python -m pip install -r requirements.txt

# Download TextBlob corpora (first time only)
python -c "import textblob; textblob.download_corpora()"

# Copy env
cp .env.example .env

# Run
python -m uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL=http://localhost:8000

npm install
npm run dev
# App: http://localhost:3000
```

---

## Deployment

### Backend → Render

1. Push the repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repo. Set **Root Directory** to `backend`.
4. Use these settings:

| Setting | Value |
|---|---|
| Runtime | Python 3 |
| Build Command | `pip install --prefer-binary -r requirements.txt && python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

5. Add environment variables:

```
CORS_ORIGINS=https://your-vercel-app.vercel.app
LOG_LEVEL=INFO
DATA_PATH=./data/synthetic_adhd.csv
TRANSFORMERS_CACHE=/opt/render/.cache/huggingface
```

6. Add a **Disk** (1 GB) mounted at `/opt/render/.cache` so the HuggingFace model persists across deploys.

> **Note:** First cold start takes ~60–90 s as the sentence-transformer model (90 MB) downloads. Subsequent starts are fast if the disk is attached.

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import your GitHub repo. Set **Root Directory** to `frontend`.
3. Add environment variable:

```
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com
```

4. Click **Deploy**. Vercel auto-detects Next.js.

---

### Docker (self-hosted)

```bash
# Backend
cd backend
docker build -t adhd-bas-backend .
docker run -p 8000:8000 \
  -e CORS_ORIGINS=http://localhost:3000 \
  adhd-bas-backend

# Frontend
cd frontend
docker build -t adhd-bas-frontend -f Dockerfile.frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8000 \
  adhd-bas-frontend
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/` | Service info |
| GET | `/api/health` | Health check |
| POST | `/api/analyze` | Run full 5-agent pipeline |
| GET | `/api/dataset` | Dataset with filtering & search |
| POST | `/api/simulate` | Phenotype BAS simulation |
| POST | `/api/intervention` | Get intervention for BAS + state |
| GET | `/api/results` | Pre-computed evaluation metrics |

Interactive docs: `https://your-backend.onrender.com/docs`

---

## Project Structure

```
ADHD Research/
├── adhd-bas/               # Research codebase (scripts, tests, docs)
│   ├── agents/             # LangGraph agents
│   ├── models/             # State models
│   ├── graphs/             # Pipeline definition
│   ├── scripts/            # Evaluation, simulation, visualisation
│   ├── data/               # Synthetic dataset
│   └── docs/               # Architecture, methodology, results
│
├── backend/                # FastAPI production backend
│   ├── agents/             # Self-contained agent copies
│   ├── core/               # LangGraph pipeline
│   ├── api/routes/         # REST endpoints
│   ├── models/             # Pydantic state
│   ├── data/               # Dataset CSV
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/               # Next.js 15 web application
    └── src/
        ├── app/            # 9 pages (App Router)
        ├── components/     # Navbar, Footer, UI
        └── lib/            # API client, types, utils
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with metrics and pipeline overview |
| `/architecture` | Interactive 5-agent pipeline diagram |
| `/dataset` | Searchable dataset explorer (500 samples) |
| `/analysis` | Live AI analysis — submit turns, see results |
| `/dashboard` | Evaluation charts and confusion matrix |
| `/simulator` | ADHD phenotype BAS trajectory simulator |
| `/interventions` | BAS slider + intervention explorer |
| `/research` | Novel contributions, methodology, results |
| `/about` | PI info, domains, abstract |

---

## Evaluation Results

| Metric | Value |
|---|---|
| Accuracy | 78.0% |
| Macro F1 | 0.764 |
| Impulsive F1 | 0.982 |
| Distracted F1 | 0.570 |
| Dataset Size | 500 |

---

## Citation

```bibtex
@software{parveen2024bas,
  author      = {Parveen, Samina},
  title       = {Behavioral Attention Score (BAS): A LangGraph-Based Multi-Agent
                 Framework for Modeling ADHD Attentional Variability},
  year        = {2024},
  url         = {https://github.com/saminadamn/ADHD-behavioral-attention-score},
  institution = {BIT Mesra},
  supervisor  = {Dr. Itu Snigdh}
}
```
