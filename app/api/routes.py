"""
FastAPI Routes — REST API endpoints for the RAG chatbot.
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.graph.workflow import rag_graph
from app.retrieval.vector_store import vector_store

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Request / Response Models ──────────────────────────────────────

class ChatRequest(BaseModel):
    """Request body for the /chat endpoint."""
    query: str = Field(..., min_length=1, max_length=2000, description="The user question.")
    conversation_history: list[dict] = Field(
        default_factory=list,
        description="Optional list of prior turns: [{role, content}, ...]",
    )


class SourceInfo(BaseModel):
    page: int
    section: str
    score: float


class RetrievedContext(BaseModel):
    chunk_id: str
    page: int
    section: str
    score: float
    content: str


class ChatResponse(BaseModel):
    """Structured response from the chatbot."""
    answer: str
    confidence: float
    confidence_type: str
    sources: list[SourceInfo]
    retrieved_context: list[RetrievedContext]


class HealthResponse(BaseModel):
    status: str
    vector_store: dict
    message: str


class IngestResponse(BaseModel):
    status: str
    chunks_ingested: int
    message: str


# ─── Endpoints ──────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Ask a question about the Agentic AI eBook.

    The chatbot will:
    1. Process the query
    2. Retrieve relevant chunks from the vector store
    3. Validate context relevance
    4. Generate a grounded answer (or decline if out-of-scope)
    5. Return the answer with confidence score and source citations

    **All answers are strictly grounded in the Agentic AI eBook.**
    """
    try:
        # Build initial state
        initial_state = {
            "user_query": request.query,
            "conversation_history": request.conversation_history,
        }

        # Run the LangGraph pipeline
        result = rag_graph.invoke(initial_state)

        # Build response
        retrieved = result.get("retrieved_chunks", [])
        retrieved_context = [
            RetrievedContext(
                chunk_id=c.get("chunk_id", "unknown"),
                page=c.get("page", 0),
                section=c.get("section", "Unknown"),
                score=c.get("score", 0.0),
                content=c.get("content", "")[:500],  # Truncate for response
            )
            for c in retrieved
        ]

        sources = [
            SourceInfo(**s) for s in result.get("sources", [])
        ]

        return ChatResponse(
            answer=result.get("final_answer", "An error occurred."),
            confidence=result.get("confidence", 0.0),
            confidence_type=result.get("confidence_type", "unknown"),
            sources=sources,
            retrieved_context=retrieved_context,
        )

    except Exception as exc:
        logger.exception("Chat endpoint error: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(exc)}",
        )


@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """Check the health of the application and vector store."""
    vs_health = vector_store.health_check()
    status = vs_health.get("status", "unknown")
    return HealthResponse(
        status=status,
        vector_store=vs_health,
        message=(
            "System is ready."
            if status == "healthy"
            else "System has issues — check vector_store details."
        ),
    )


@router.post("/ingest", response_model=IngestResponse, tags=["System"])
async def ingest() -> IngestResponse:
    """
    Trigger PDF ingestion pipeline.

    Downloads (if needed), extracts, chunks, embeds, and stores
    the Agentic AI eBook into the vector database.
    """
    try:
        from app.ingestion.loader import load_pdf
        from app.ingestion.chunker import chunk_pages

        logger.info("Starting ingestion pipeline…")

        # Step 1: Load PDF
        pages = load_pdf()
        logger.info("Loaded %d pages.", len(pages))

        # Step 2: Chunk
        chunks = chunk_pages(pages)
        logger.info("Created %d chunks.", len(chunks))

        # Step 3: Reset and upsert
        vector_store.reset()
        count = vector_store.upsert_chunks(chunks)

        return IngestResponse(
            status="success",
            chunks_ingested=count,
            message=f"Successfully ingested {count} chunks from {len(pages)} pages.",
        )
    except Exception as exc:
        logger.exception("Ingestion failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Ingestion failed: {str(exc)}",
        )
