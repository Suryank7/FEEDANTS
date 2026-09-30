"""
Tests for the document ingestion pipeline.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings


class TestLoader:
    """Tests for PDF loading and text extraction."""

    def test_pdf_exists(self):
        """Verify the eBook PDF exists at the configured path."""
        assert Path(settings.PDF_PATH).exists(), (
            f"PDF not found at {settings.PDF_PATH}"
        )

    def test_load_pdf_returns_pages(self):
        """load_pdf() should return a non-empty list of pages."""
        from app.ingestion.loader import load_pdf

        pages = load_pdf()
        assert len(pages) > 0, "Expected at least one page"
        assert all("text" in p and "page_number" in p for p in pages)

    def test_page_content_not_empty(self):
        """Each extracted page should have non-empty text."""
        from app.ingestion.loader import load_pdf

        pages = load_pdf()
        for page in pages:
            assert len(page["text"].strip()) > 0, (
                f"Page {page['page_number']} has empty text"
            )

    def test_page_numbers_sequential(self):
        """Page numbers should be sequential and 1-indexed."""
        from app.ingestion.loader import load_pdf

        pages = load_pdf()
        page_nums = [p["page_number"] for p in pages]
        assert page_nums[0] >= 1
        # Pages may be non-consecutive if blank pages were skipped
        assert all(a <= b for a, b in zip(page_nums, page_nums[1:]))


class TestChunker:
    """Tests for text chunking."""

    def test_chunk_pages_returns_chunks(self):
        """chunk_pages() should produce a non-empty list of chunks."""
        from app.ingestion.loader import load_pdf
        from app.ingestion.chunker import chunk_pages

        pages = load_pdf()
        chunks = chunk_pages(pages)
        assert len(chunks) > 0

    def test_chunks_have_required_metadata(self):
        """Each chunk must contain chunk_id, content, page, section."""
        from app.ingestion.loader import load_pdf
        from app.ingestion.chunker import chunk_pages

        pages = load_pdf()
        chunks = chunk_pages(pages)

        required_keys = {"chunk_id", "content", "page", "section", "document_name"}
        for chunk in chunks[:10]:  # check first 10
            assert required_keys.issubset(chunk.keys()), (
                f"Chunk {chunk.get('chunk_id')} missing keys: "
                f"{required_keys - chunk.keys()}"
            )

    def test_chunk_ids_unique(self):
        """Chunk IDs must be unique."""
        from app.ingestion.loader import load_pdf
        from app.ingestion.chunker import chunk_pages

        pages = load_pdf()
        chunks = chunk_pages(pages)
        ids = [c["chunk_id"] for c in chunks]
        assert len(ids) == len(set(ids)), "Duplicate chunk IDs found"

    def test_chunk_size_within_bounds(self):
        """Chunks should not massively exceed the configured chunk size."""
        from app.ingestion.loader import load_pdf
        from app.ingestion.chunker import chunk_pages

        pages = load_pdf()
        chunks = chunk_pages(pages)
        max_expected = settings.CHUNK_SIZE * 1.5  # allow some tolerance
        for chunk in chunks:
            assert len(chunk["content"]) <= max_expected, (
                f"Chunk {chunk['chunk_id']} exceeds max size: "
                f"{len(chunk['content'])} > {max_expected}"
            )


class TestEmbeddings:
    """Tests for the embedding model."""

    def test_embed_single_text(self):
        """embed_texts() should return a vector for a single text."""
        from app.ingestion.embeddings import embed_texts

        result = embed_texts(["Hello world"])
        assert len(result) == 1
        assert len(result[0]) > 0  # vector has non-zero dimension

    def test_embed_multiple_texts(self):
        """embed_texts() should return one vector per input text."""
        from app.ingestion.embeddings import embed_texts

        texts = ["Hello", "World", "Test"]
        result = embed_texts(texts)
        assert len(result) == 3

    def test_embedding_dimension(self):
        """Embedding dimension should match the model spec."""
        from app.ingestion.embeddings import embed_texts, get_embedding_dimension

        result = embed_texts(["test"])
        dim = get_embedding_dimension()
        assert len(result[0]) == dim

    def test_embed_empty_list(self):
        """embed_texts() with empty list should return empty list."""
        from app.ingestion.embeddings import embed_texts

        result = embed_texts([])
        assert result == []
