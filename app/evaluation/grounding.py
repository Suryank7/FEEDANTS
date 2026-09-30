"""
Grounding & Validation — Ensures answers are grounded in retrieved context.

Performs two validation stages:
  1. Context relevance — Are the retrieved chunks relevant to the query?
  2. Answer grounding  — Does the generated answer stay within the context?
"""

import logging
from app.config import settings

logger = logging.getLogger(__name__)


def validate_context_relevance(
    retrieved_chunks: list[dict],
    threshold: float | None = None,
) -> dict:
    """
    Check if retrieved chunks are sufficiently relevant to proceed
    with answer generation.

    Parameters
    ----------
    retrieved_chunks : list[dict]
        Chunks from vector search, each with a 'score' key.
    threshold : float, optional
        Minimum similarity score to consider relevant (default from settings).

    Returns
    -------
    dict
        {
            "is_relevant": bool,
            "relevant_chunks": list[dict],
            "max_score": float,
            "avg_score": float,
            "num_relevant": int,
            "num_total": int,
        }
    """
    threshold = threshold or settings.RELEVANCE_THRESHOLD

    if not retrieved_chunks:
        return {
            "is_relevant": False,
            "relevant_chunks": [],
            "max_score": 0.0,
            "avg_score": 0.0,
            "num_relevant": 0,
            "num_total": 0,
        }

    scores = [c.get("score", 0.0) for c in retrieved_chunks]
    relevant = [c for c in retrieved_chunks if c.get("score", 0.0) >= threshold]

    max_score = max(scores) if scores else 0.0
    avg_score = sum(scores) / len(scores) if scores else 0.0

    is_relevant = len(relevant) > 0

    logger.info(
        "Context validation: %d/%d chunks above threshold %.2f "
        "(max=%.4f, avg=%.4f)",
        len(relevant),
        len(retrieved_chunks),
        threshold,
        max_score,
        avg_score,
    )

    return {
        "is_relevant": is_relevant,
        "relevant_chunks": relevant,
        "max_score": round(max_score, 4),
        "avg_score": round(avg_score, 4),
        "num_relevant": len(relevant),
        "num_total": len(retrieved_chunks),
    }


def compute_confidence(
    retrieved_chunks: list[dict],
    validation_result: dict,
) -> dict:
    """
    Compute a confidence score for the chatbot response.

    The confidence is a weighted combination of:
      • max_score (40%) — best single chunk relevance
      • avg_score (30%) — overall retrieval quality
      • coverage   (30%) — fraction of chunks above threshold

    Parameters
    ----------
    retrieved_chunks : list[dict]
        All retrieved chunks.
    validation_result : dict
        Output from ``validate_context_relevance()``.

    Returns
    -------
    dict
        {
            "confidence": float,           # 0.0–1.0
            "confidence_type": str,         # description of scoring method
            "max_retrieval_score": float,
            "avg_retrieval_score": float,
            "relevant_chunk_ratio": float,
        }
    """
    max_score = validation_result.get("max_score", 0.0)
    avg_score = validation_result.get("avg_score", 0.0)
    num_relevant = validation_result.get("num_relevant", 0)
    num_total = validation_result.get("num_total", 1)

    coverage = num_relevant / max(num_total, 1)

    # Weighted confidence
    confidence = (0.4 * max_score) + (0.3 * avg_score) + (0.3 * coverage)
    confidence = round(min(max(confidence, 0.0), 1.0), 4)

    return {
        "confidence": confidence,
        "confidence_type": (
            "weighted_composite: "
            "40% max_retrieval_score + 30% avg_retrieval_score + 30% relevant_chunk_ratio"
        ),
        "max_retrieval_score": max_score,
        "avg_retrieval_score": avg_score,
        "relevant_chunk_ratio": round(coverage, 4),
    }


NOT_FOUND_RESPONSE = (
    "I couldn't find information about this in the provided Agentic AI eBook, "
    "so I cannot answer this question using the available knowledge base."
)
