"""
LangGraph Workflow — Compiles the RAG pipeline into an executable graph.

Architecture:
  ┌────────────────┐
  │ process_query   │
  └───────┬────────┘
          ↓
  ┌────────────────┐
  │ retrieve_context│
  └───────┬────────┘
          ↓
  ┌────────────────┐
  │ validate_context│
  └───────┬────────┘
          ↓
    ┌─────┴──────┐
    │ is_relevant?│
    └──┬──────┬──┘
   YES ↓      ↓ NO
  ┌──────────┐ ┌──────────────┐
  │ generate  │ │ return_not_  │
  │ _grounded │ │ found        │
  │ _answer   │ └──────┬───────┘
  └────┬─────┘        │
       ↓              │
  ┌──────────┐        │
  │ build_   │        │
  │ response │        │
  └────┬─────┘        │
       ↓              ↓
      END            END
"""

import logging

from langgraph.graph import StateGraph, END

from app.graph.state import RAGState
from app.graph.nodes import (
    process_query,
    retrieve_context,
    validate_context,
    generate_grounded_answer,
    return_not_found,
    build_response,
)

logger = logging.getLogger(__name__)


def _relevance_router(state: RAGState) -> str:
    """Route based on context relevance validation result."""
    if state.get("is_relevant", False):
        return "generate_grounded_answer"
    return "return_not_found"


def build_rag_graph() -> StateGraph:
    """
    Build and compile the LangGraph RAG workflow.

    Returns
    -------
    CompiledGraph
        A compiled LangGraph that can be invoked with ``graph.invoke(state)``.
    """
    graph = StateGraph(RAGState)

    # ── Add nodes ──
    graph.add_node("process_query", process_query)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("validate_context", validate_context)
    graph.add_node("generate_grounded_answer", generate_grounded_answer)
    graph.add_node("return_not_found", return_not_found)
    graph.add_node("build_response", build_response)

    # ── Define edges ──
    graph.set_entry_point("process_query")

    graph.add_edge("process_query", "retrieve_context")
    graph.add_edge("retrieve_context", "validate_context")

    # Conditional: route based on relevance
    graph.add_conditional_edges(
        "validate_context",
        _relevance_router,
        {
            "generate_grounded_answer": "generate_grounded_answer",
            "return_not_found": "return_not_found",
        },
    )

    graph.add_edge("generate_grounded_answer", "build_response")
    graph.add_edge("build_response", END)
    graph.add_edge("return_not_found", END)

    logger.info("RAG workflow graph compiled successfully.")
    return graph.compile()


# Module-level compiled graph
rag_graph = build_rag_graph()
