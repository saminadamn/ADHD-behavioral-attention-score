"""
ADHD-BAS FastAPI Backend
"""
from __future__ import annotations
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

_CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001"
).split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ADHD-BAS API...")
    # Pre-warm the sentence-transformer model in background so first request is fast
    try:
        from agents.signal_extractor import _load_model
        _load_model()
    except Exception as e:
        logger.warning(f"Model pre-warm skipped: {e}")
    # Pre-compile the LangGraph pipeline
    try:
        from core.pipeline import build_pipeline
        build_pipeline()
        logger.info("Pipeline ready.")
    except Exception as e:
        logger.warning(f"Pipeline pre-compile skipped: {e}")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title        = "ADHD-BAS API",
    description  = "Behavioral Attention Score — LangGraph Multi-Agent Backend",
    version      = "1.0.0",
    lifespan     = lifespan,
    docs_url     = "/docs",
    redoc_url    = "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = _CORS_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

from api.routes.analysis     import router as analysis_router
from api.routes.dataset      import router as dataset_router
from api.routes.phenotype    import router as phenotype_router
from api.routes.intervention import router as intervention_router

app.include_router(analysis_router)
app.include_router(dataset_router)
app.include_router(phenotype_router)
app.include_router(intervention_router)


@app.get("/")
async def root():
    return {
        "name":    "ADHD-BAS API",
        "version": "1.0.0",
        "docs":    "/docs",
        "status":  "running",
    }
