"""
Embedding Module — Generates vector embeddings using sentence-transformers.

Uses the all-MiniLM-L6-v2 model by default (384-dim, fast, free).
The model is lazy-loaded and cached for the process lifetime.
"""

import logging
from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    """Load and cache the embedding model."""
    model_name = settings.EMBEDDING_MODEL
    logger.info("Loading embedding model: %s", model_name)
    model = SentenceTransformer(model_name)
    logger.info("Embedding model loaded. Dimension: %d", model.get_sentence_embedding_dimension())
    return model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings.

    Parameters
    ----------
    texts : list[str]
        Texts to embed.

    Returns
    -------
    list[list[float]]
        List of embedding vectors.

    Raises
    ------
    RuntimeError
        If the embedding model fails to load or encode.
    """
    if not texts:
        return []

    try:
        model = _get_model()
        embeddings = model.encode(
            texts,
            show_progress_bar=len(texts) > 50,
            batch_size=64,
            normalize_embeddings=True,  # cosine similarity via dot product
        )
        return embeddings.tolist()
    except Exception as exc:
        raise RuntimeError(f"Embedding generation failed: {exc}") from exc


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    result = embed_texts([query])
    return result[0]


def get_embedding_dimension() -> int:
    """Return the dimensionality of the embedding model."""
    return _get_model().get_sentence_embedding_dimension()
