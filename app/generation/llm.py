"""
LLM Generation — Groq-powered answer generation with strict grounding.

Uses LangChain's ChatGroq wrapper for fast inference with
llama-3.1-8b-instant (configurable via settings).
"""

import logging
from functools import lru_cache

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from app.config import settings

logger = logging.getLogger(__name__)

# ─── System prompt enforcing strict grounding ───────────────────────

GROUNDED_SYSTEM_PROMPT = """You are an AI assistant that answers questions **exclusively** using the provided Agentic AI eBook context.

## STRICT RULES — you MUST follow every one:
1. Answer ONLY using the retrieved context supplied below.
2. Do NOT use outside knowledge, training data, or the internet.
3. Do NOT invent facts, examples, definitions, or explanations.
4. Do NOT assume or infer information that is not explicitly in the context.
5. If the context does not contain enough information to answer the question, respond EXACTLY:
   "I couldn't find information about this in the provided Agentic AI eBook, so I cannot answer this question using the available knowledge base."
6. NEVER fabricate citations, page numbers, or source references.
7. Preserve the meaning and accuracy of the source material.
8. When possible, reference which part of the context supports your answer.
9. Be concise, clear, and well-structured.
10. If only *part* of the question can be answered from the context, answer only that part and clearly state which part cannot be answered.

## RETRIEVED CONTEXT:
{context}

## SOURCE METADATA:
{sources}
"""


@lru_cache(maxsize=1)
def _get_llm() -> ChatGroq:
    """Initialise and cache the Groq LLM client."""
    if not settings.GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Please configure it in your .env file."
        )

    logger.info("Initialising Groq LLM: %s", settings.LLM_MODEL)
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.LLM_MODEL,
        temperature=settings.LLM_TEMPERATURE,
        max_tokens=settings.LLM_MAX_TOKENS,
    )


def generate_answer(
    query: str,
    context_chunks: list[dict],
    conversation_history: list[dict] | None = None,
) -> str:
    """
    Generate a grounded answer from the retrieved context.

    Parameters
    ----------
    query : str
        The user's question.
    context_chunks : list[dict]
        Retrieved chunks with content, page, section, score.
    conversation_history : list[dict], optional
        Previous conversation turns for multi-turn support.

    Returns
    -------
    str
        The LLM-generated grounded answer.

    Raises
    ------
    RuntimeError
        If the LLM fails to generate a response.
    """
    llm = _get_llm()

    # Build context string
    context_parts = []
    source_parts = []
    for i, chunk in enumerate(context_chunks, 1):
        context_parts.append(
            f"[Chunk {i}] (Page {chunk.get('page', '?')}, "
            f"Section: {chunk.get('section', 'Unknown')}):\n"
            f"{chunk.get('content', '')}"
        )
        source_parts.append(
            f"- Chunk {i}: Page {chunk.get('page', '?')}, "
            f"Section: {chunk.get('section', 'Unknown')}, "
            f"Relevance: {chunk.get('score', 0):.2f}"
        )

    context_str = "\n\n".join(context_parts) if context_parts else "No relevant context found."
    sources_str = "\n".join(source_parts) if source_parts else "No sources available."

    system_prompt = GROUNDED_SYSTEM_PROMPT.format(
        context=context_str,
        sources=sources_str,
    )

    messages = [SystemMessage(content=system_prompt)]

    # Add conversation history (factual answers only, not as knowledge source)
    if conversation_history:
        for turn in conversation_history[-settings.MAX_CONVERSATION_HISTORY :]:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            else:
                from langchain_core.messages import AIMessage
                messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=query))

    try:
        response = llm.invoke(messages)
        return response.content
    except Exception as exc:
        logger.error("LLM generation failed: %s", exc)
        raise RuntimeError(f"LLM generation failed: {exc}") from exc
