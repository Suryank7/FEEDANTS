"""
Main FastAPI application — Agentic AI RAG Chatbot.

Serves the REST API for the RAG chatbot powered by LangGraph,
ChromaDB, sentence-transformers, and Groq.
"""

import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings

# ─── Logging ────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-30s | %(levelname)-7s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown validation."""
    errors = settings.validate()
    if errors:
        for err in errors:
            logger.warning("[CONFIG] %s", err)
    else:
        logger.info("[CONFIG] Validated successfully.")

    # Check vector store health
    from app.retrieval.vector_store import vector_store
    health = vector_store.health_check()
    logger.info(
        "Vector store: %s (%d vectors)",
        health.get("status"),
        health.get("vector_count", 0),
    )
    if health.get("vector_count", 0) == 0:
        logger.warning(
            "Vector store is empty. Run 'python scripts/ingest.py' "
            "or POST /api/ingest to ingest the eBook."
        )
    yield


# ─── App Factory ────────────────────────────────────────────────────

def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""

    app = FastAPI(
        title="Agentic AI RAG Chatbot",
        description=(
            "A Retrieval-Augmented Generation chatbot that answers questions "
            "exclusively from the Agentic AI eBook. Built with LangGraph, "
            "ChromaDB, sentence-transformers, and Groq."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS for frontend access
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(router, prefix="/api")

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "message": "Agentic AI RAG Chatbot API",
            "docs": "/docs",
            "health": "/api/health",
        }

    return app


# Module-level app instance (for uvicorn)
app = create_app()
