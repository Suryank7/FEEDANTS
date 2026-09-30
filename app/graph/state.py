"""
LangGraph State — Defines the typed state dict flowing through the RAG workflow.
"""

from typing import TypedDict, Annotated
from operator import add


class ConversationTurn(TypedDict):
    """A single turn in conversation history."""
    role: str       # "user" or "assistant"
    content: str


class RAGState(TypedDict, total=False):
    """
    The complete state flowing through the LangGraph RAG pipeline.

    Each node reads from and writes to this shared state dict.
    """
    # ── Input ──
    user_query: str
    conversation_history: list[ConversationTurn]

    # ── Query Processing ──
    processed_query: str

    # ── Retrieval ──
    retrieved_chunks: list[dict]        # RetrievedChunk dicts
    retrieval_scores: list[float]

    # ── Validation ──
    is_relevant: bool
    relevant_chunks: list[dict]
    max_score: float
    avg_score: float
    num_relevant: int

    # ── Generation ──
    generated_answer: str

    # ── Confidence ──
    confidence: float
    confidence_type: str
    confidence_details: dict

    # ── Final Output ──
    final_answer: str
    sources: list[dict]
    error: str | None
