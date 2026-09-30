"""
Configuration module for the Agentic AI RAG Chatbot.
Loads environment variables and provides validated settings.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    """Application settings loaded from environment variables."""

    # --- Groq LLM ---
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.1"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "2048"))

    # --- Embedding Model ---
    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
    )

    # --- ChromaDB (local vector store) ---
    CHROMA_PERSIST_DIR: str = os.getenv(
        "CHROMA_PERSIST_DIR", str(PROJECT_ROOT / "data" / "chroma_db")
    )
    CHROMA_COLLECTION_NAME: str = os.getenv(
        "CHROMA_COLLECTION_NAME", "agentic_ai_ebook"
    )

    # --- PDF Source ---
    PDF_PATH: str = os.getenv(
        "PDF_PATH", str(PROJECT_ROOT / "Ebook-Agentic-AI.pdf")
    )
    PDF_URL: str = os.getenv(
        "PDF_URL", "https://konverge.ai/pdf/Ebook-Agentic-AI.pdf"
    )

    # --- Chunking ---
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "800"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "200"))

    # --- Retrieval ---
    TOP_K: int = int(os.getenv("TOP_K", "5"))
    RELEVANCE_THRESHOLD: float = float(os.getenv("RELEVANCE_THRESHOLD", "0.3"))

    # --- Conversation Memory ---
    MAX_CONVERSATION_HISTORY: int = int(
        os.getenv("MAX_CONVERSATION_HISTORY", "10")
    )

    # --- API ---
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    @classmethod
    def validate(cls) -> list[str]:
        """Validate required settings. Returns list of error messages."""
        errors = []
        if not cls.GROQ_API_KEY:
            errors.append(
                "GROQ_API_KEY is not set. Please set it in your .env file."
            )
        if not Path(cls.PDF_PATH).exists():
            errors.append(
                f"PDF not found at {cls.PDF_PATH}. "
                "Place the eBook PDF in the project root or set PDF_PATH."
            )
        return errors


settings = Settings()
