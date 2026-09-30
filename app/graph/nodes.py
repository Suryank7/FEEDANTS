"""
LangGraph Nodes — Individual processing steps in the RAG pipeline.

Each node is a pure function:  (state: RAGState) -> dict
The returned dict is merged into the shared state.
"""

import logging

from app.graph.state import RAGState
from app.retrieval.vector_store import vector_store
from app.generation.llm import generate_answer
from app.evaluation.grounding import (
    validate_context_relevance,
    compute_confidence,
    NOT_FOUND_RESPONSE,
)
from app.config import settings

logger = logging.getLogger(__name__)


# ─── Node 1: Query Processing ──────────────────────────────────────

def process_query(state: RAGState) -> dict:
    """
    Clean and prepare the user query for retrieval.

    Uses conversation history to resolve anaphora (e.g. "it", "that")
    by prepending relevant prior context to the query.
    """
    query = state.get("user_query", "").strip()
    history = state.get("conversation_history", [])

    if not query:
        return {"processed_query": query, "error": "Empty query received."}

    processed = query

    # Simple context-aware query rewriting for follow-up questions
    if history and len(query.split()) < 8:
        # Short queries after conversation may be follow-ups
        recent_context = []
        for turn in history[-3:]:  # last 3 turns
            if turn.get("role") == "user":
                recent_context.append(turn["content"])

        if recent_context:
            # Prepend recent topic for better retrieval
            topic = recent_context[-1]
            # Only augment if the query seems like a follow-up
            follow_up_indicators = [
                "it", "that", "this", "they", "those", "these",
                "how", "why", "what about", "and", "also",
                "more", "else", "other", "differ",
            ]
            if any(
                indicator in query.lower()
                for indicator in follow_up_indicators
            ):
                processed = f"{topic} — {query}"
                logger.info("Query augmented: '%s' → '%s'", query, processed)

    return {"processed_query": processed}


# ─── Node 2: Vector Retrieval ──────────────────────────────────────

def retrieve_context(state: RAGState) -> dict:
    """
    Embed the processed query and retrieve Top-K chunks from ChromaDB.
    """
    query = state.get("processed_query", state.get("user_query", ""))

    if not query:
        return {
            "retrieved_chunks": [],
            "retrieval_scores": [],
            "error": "No query to retrieve context for.",
        }

    try:
        chunks = vector_store.search(query, top_k=settings.TOP_K)
    except RuntimeError as exc:
        logger.error("Retrieval failed: %s", exc)
        return {
            "retrieved_chunks": [],
            "retrieval_scores": [],
            "error": f"Retrieval failed: {exc}",
        }

    scores = [c["score"] for c in chunks]

    logger.info(
        "Retrieved %d chunks (scores: %s)",
        len(chunks),
        [f"{s:.4f}" for s in scores],
    )

    return {
        "retrieved_chunks": [dict(c) for c in chunks],
        "retrieval_scores": scores,
    }


# ─── Node 3: Context Validation ───────────────────────────────────

def validate_context(state: RAGState) -> dict:
    """
    Check if retrieved chunks are relevant enough to generate an answer.
    """
    chunks = state.get("retrieved_chunks", [])

    validation = validate_context_relevance(chunks)

    return {
        "is_relevant": validation["is_relevant"],
        "relevant_chunks": validation["relevant_chunks"],
        "max_score": validation["max_score"],
        "avg_score": validation["avg_score"],
        "num_relevant": validation["num_relevant"],
    }


# ─── Node 4a: Generate Answer (relevant context found) ────────────

def generate_grounded_answer(state: RAGState) -> dict:
    """
    Use the LLM to generate a grounded answer from relevant context.
    """
    query = state.get("user_query", "")
    relevant_chunks = state.get("relevant_chunks", [])
    history = state.get("conversation_history", [])

    if not relevant_chunks:
        return {
            "generated_answer": NOT_FOUND_RESPONSE,
            "final_answer": NOT_FOUND_RESPONSE,
        }

    try:
        answer = generate_answer(
            query=query,
            context_chunks=relevant_chunks,
            conversation_history=history,
        )
    except RuntimeError as exc:
        logger.error("Generation failed: %s", exc)
        return {
            "generated_answer": "",
            "error": f"Answer generation failed: {exc}",
        }

    return {"generated_answer": answer}


# ─── Node 4b: Not Found Response ──────────────────────────────────

def return_not_found(state: RAGState) -> dict:
    """Return the standard out-of-knowledge-base response."""
    return {
        "generated_answer": NOT_FOUND_RESPONSE,
        "final_answer": NOT_FOUND_RESPONSE,
        "confidence": 0.0,
        "confidence_type": "no_relevant_context",
        "confidence_details": {},
        "sources": [],
    }


# ─── Node 5: Compute Confidence & Build Final Response ────────────

def build_response(state: RAGState) -> dict:
    """
    Compute confidence score, assemble source citations,
    and build the final structured response.
    """
    retrieved = state.get("retrieved_chunks", [])
    relevant = state.get("relevant_chunks", [])
    answer = state.get("generated_answer", "")
    error = state.get("error")

    if error and not answer:
        return {
            "final_answer": f"An error occurred: {error}",
            "confidence": 0.0,
            "confidence_type": "error",
            "confidence_details": {},
            "sources": [],
        }

    # Compute confidence
    validation_result = {
        "max_score": state.get("max_score", 0.0),
        "avg_score": state.get("avg_score", 0.0),
        "num_relevant": state.get("num_relevant", 0),
        "num_total": len(retrieved),
    }
    conf = compute_confidence(retrieved, validation_result)

    # Build source citations
    sources = []
    seen_pages = set()
    for chunk in relevant:
        page = chunk.get("page", 0)
        if page not in seen_pages:
            sources.append({
                "page": page,
                "section": chunk.get("section", "Unknown"),
                "score": chunk.get("score", 0.0),
            })
            seen_pages.add(page)

    return {
        "final_answer": answer,
        "confidence": conf["confidence"],
        "confidence_type": conf["confidence_type"],
        "confidence_details": conf,
        "sources": sources,
    }
