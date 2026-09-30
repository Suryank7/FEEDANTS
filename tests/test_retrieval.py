"""
Tests for vector store retrieval.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


class TestVectorStore:
    """Tests for ChromaDB vector store operations."""

    def test_health_check(self):
        """Vector store health check should return a status."""
        from app.retrieval.vector_store import vector_store

        health = vector_store.health_check()
        assert "status" in health
        assert health["status"] in ("healthy", "unhealthy")

    def test_search_returns_results(self):
        """search() should return results if the store is populated."""
        from app.retrieval.vector_store import vector_store

        if vector_store.count() == 0:
            pytest.skip("Vector store is empty — run ingestion first.")

        results = vector_store.search("What is Agentic AI?", top_k=3)
        assert len(results) > 0

    def test_search_result_structure(self):
        """Each search result should have required fields."""
        from app.retrieval.vector_store import vector_store

        if vector_store.count() == 0:
            pytest.skip("Vector store is empty — run ingestion first.")

        results = vector_store.search("AI agents", top_k=3)
        required_keys = {"chunk_id", "content", "page", "section", "score"}
        for r in results:
            assert required_keys.issubset(r.keys()), (
                f"Missing keys: {required_keys - r.keys()}"
            )

    def test_search_scores_valid(self):
        """Similarity scores should be between -1 and 1 (cosine)."""
        from app.retrieval.vector_store import vector_store

        if vector_store.count() == 0:
            pytest.skip("Vector store is empty — run ingestion first.")

        results = vector_store.search("planning in AI", top_k=5)
        for r in results:
            assert -1.0 <= r["score"] <= 1.0, (
                f"Score {r['score']} out of range"
            )

    def test_search_sorted_by_score(self):
        """Results should be sorted by score descending."""
        from app.retrieval.vector_store import vector_store

        if vector_store.count() == 0:
            pytest.skip("Vector store is empty — run ingestion first.")

        results = vector_store.search("tools and agents", top_k=5)
        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_search_empty_store(self):
        """Searching an empty store should return an empty list."""
        from app.retrieval.vector_store import VectorStore

        store = VectorStore(
            persist_dir="./data/test_empty_store",
            collection_name="test_empty",
        )
        results = store.search("anything")
        assert results == []

    def test_top_k_limits_results(self):
        """Number of results should not exceed top_k."""
        from app.retrieval.vector_store import vector_store

        if vector_store.count() == 0:
            pytest.skip("Vector store is empty — run ingestion first.")

        k = 2
        results = vector_store.search("AI", top_k=k)
        assert len(results) <= k
