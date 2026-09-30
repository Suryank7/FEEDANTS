"""
Vector Store — ChromaDB integration for storing and retrieving document chunks.

Supports:
  • Upserting chunks with metadata
  • Semantic similarity search (Top-K)
  • Metadata filtering
  • Collection management
"""

import logging
from typing import Any, TypedDict

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings
from app.ingestion.chunker import DocumentChunk
from app.ingestion.embeddings import embed_texts, embed_query

logger = logging.getLogger(__name__)


class RetrievedChunk(TypedDict):
    """A chunk returned from vector search with its similarity score."""
    chunk_id: str
    content: str
    page: int
    section: str
    document_name: str
    score: float


class VectorStore:
    """ChromaDB-backed vector store for the Agentic AI eBook."""

    def __init__(
        self,
        persist_dir: str | None = None,
        collection_name: str | None = None,
    ):
        self._persist_dir = persist_dir or settings.CHROMA_PERSIST_DIR
        self._collection_name = collection_name or settings.CHROMA_COLLECTION_NAME
        self._client: chromadb.ClientAPI | None = None
        self._collection: chromadb.Collection | None = None

    # ------------------------------------------------------------------
    # Lazy initialisation
    # ------------------------------------------------------------------

    def _get_client(self) -> chromadb.ClientAPI:
        if self._client is None:
            logger.info("Initialising ChromaDB at %s", self._persist_dir)
            try:
                self._client = chromadb.PersistentClient(
                    path=self._persist_dir,
                )
            except Exception as exc:
                raise RuntimeError(
                    f"ChromaDB connection failed: {exc}"
                ) from exc
        return self._client

    def _get_collection(self) -> chromadb.Collection:
        if self._collection is None:
            client = self._get_client()
            self._collection = client.get_or_create_collection(
                name=self._collection_name,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info(
                "Collection '%s' ready (%d vectors).",
                self._collection_name,
                self._collection.count(),
            )
        return self._collection

    # ------------------------------------------------------------------
    # Upsert
    # ------------------------------------------------------------------

    def upsert_chunks(
        self,
        chunks: list[DocumentChunk],
        batch_size: int = 100,
    ) -> int:
        """
        Embed and upsert document chunks into ChromaDB.

        Returns the total number of chunks upserted.
        """
        if not chunks:
            logger.warning("No chunks to upsert.")
            return 0

        collection = self._get_collection()
        total = 0

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            texts = [c["content"] for c in batch]
            ids = [c["chunk_id"] for c in batch]
            metadatas = [
                {
                    "page": c["page"],
                    "section": c["section"],
                    "document_name": c["document_name"],
                    "chunk_id": c["chunk_id"],
                }
                for c in batch
            ]

            logger.info(
                "Embedding batch %d–%d of %d …",
                i + 1,
                min(i + batch_size, len(chunks)),
                len(chunks),
            )
            embeddings = embed_texts(texts)

            collection.upsert(
                ids=ids,
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
            )
            total += len(batch)

        logger.info("Upserted %d chunks. Collection now has %d vectors.", total, collection.count())
        return total

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(
        self,
        query: str,
        top_k: int | None = None,
        page_filter: int | None = None,
    ) -> list[RetrievedChunk]:
        """
        Perform semantic similarity search.

        Parameters
        ----------
        query : str
            Natural language query.
        top_k : int, optional
            Number of results (default from settings).
        page_filter : int, optional
            If set, only return results from this page number.

        Returns
        -------
        list[RetrievedChunk]
            Ranked list of chunks with similarity scores.
        """
        top_k = top_k or settings.TOP_K
        collection = self._get_collection()

        if collection.count() == 0:
            logger.warning("Vector store is empty — run ingestion first.")
            return []

        query_embedding = embed_query(query)

        where_filter = None
        if page_filter is not None:
            where_filter = {"page": page_filter}

        try:
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )
        except Exception as exc:
            logger.error("Vector search failed: %s", exc)
            raise RuntimeError(f"Vector search failed: {exc}") from exc

        retrieved: list[RetrievedChunk] = []

        if results and results["ids"] and results["ids"][0]:
            for idx, chunk_id in enumerate(results["ids"][0]):
                # ChromaDB returns cosine *distance*; convert to similarity
                distance = results["distances"][0][idx]
                similarity = 1.0 - distance  # cosine similarity

                meta = results["metadatas"][0][idx]
                content = results["documents"][0][idx]

                retrieved.append(
                    RetrievedChunk(
                        chunk_id=chunk_id,
                        content=content,
                        page=meta.get("page", 0),
                        section=meta.get("section", "Unknown"),
                        document_name=meta.get("document_name", "Unknown"),
                        score=round(similarity, 4),
                    )
                )

        # Sort by score descending
        retrieved.sort(key=lambda x: x["score"], reverse=True)
        return retrieved

    # ------------------------------------------------------------------
    # Utilities
    # ------------------------------------------------------------------

    def count(self) -> int:
        """Return the number of vectors in the collection."""
        return self._get_collection().count()

    def reset(self) -> None:
        """Delete and recreate the collection."""
        client = self._get_client()
        try:
            client.delete_collection(self._collection_name)
        except Exception:
            pass
        self._collection = None
        logger.info("Collection '%s' reset.", self._collection_name)

    def health_check(self) -> dict[str, Any]:
        """Return basic health info about the vector store."""
        try:
            count = self.count()
            return {
                "status": "healthy",
                "collection": self._collection_name,
                "vector_count": count,
                "persist_dir": self._persist_dir,
            }
        except Exception as exc:
            return {"status": "unhealthy", "error": str(exc)}


# Module-level singleton
vector_store = VectorStore()
