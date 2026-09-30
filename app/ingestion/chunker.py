"""
Text Chunker — Splits extracted pages into semantically meaningful chunks.

Uses LangChain's RecursiveCharacterTextSplitter for intelligent boundary-aware
splitting while preserving document metadata (page number, section, chunk_id).
"""

import logging
import re
from typing import TypedDict

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.ingestion.loader import PageContent

logger = logging.getLogger(__name__)


class DocumentChunk(TypedDict):
    """Typed dict representing a single chunk with metadata."""
    chunk_id: str
    content: str
    page: int
    section: str
    document_name: str


def _detect_section(text: str) -> str:
    """Heuristic section/heading detection from text content."""
    lines = text.strip().split("\n")
    for line in lines[:5]:
        stripped = line.strip()
        if (
            5 < len(stripped) < 120
            and not stripped.endswith(".")
            and (stripped.istitle() or stripped.isupper())
        ):
            return stripped
    return "General Content"


def chunk_pages(
    pages: list[PageContent],
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[DocumentChunk]:
    """
    Split a list of ``PageContent`` dicts into smaller ``DocumentChunk``s.

    Parameters
    ----------
    pages : list[PageContent]
        Output from ``loader.load_pdf()``.
    chunk_size : int, optional
        Characters per chunk (default from settings).
    chunk_overlap : int, optional
        Overlap between chunks (default from settings).

    Returns
    -------
    list[DocumentChunk]
        Chunks with metadata ready for embedding.
    """
    chunk_size = chunk_size or settings.CHUNK_SIZE
    chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", ", ", " ", ""],
        length_function=len,
    )

    chunks: list[DocumentChunk] = []
    global_idx = 0

    for page in pages:
        text = page["text"]
        if not text.strip():
            continue

        section = _detect_section(text)
        splits = splitter.split_text(text)

        for split_text in splits:
            chunk_id = f"chunk_{global_idx:04d}"
            chunks.append(
                DocumentChunk(
                    chunk_id=chunk_id,
                    content=split_text.strip(),
                    page=page["page_number"],
                    section=section,
                    document_name=page["document_name"],
                )
            )
            global_idx += 1

    logger.info(
        "Created %d chunks from %d pages (size=%d, overlap=%d).",
        len(chunks),
        len(pages),
        chunk_size,
        chunk_overlap,
    )
    return chunks
