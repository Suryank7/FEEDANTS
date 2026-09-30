"""
Ingestion Script — Ingest the Agentic AI eBook into ChromaDB.

Usage:
    python scripts/ingest.py
    python scripts/ingest.py --pdf path/to/custom.pdf
    python scripts/ingest.py --reset  (clear existing data first)
"""

import argparse
import logging
import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.ingestion.loader import load_pdf
from app.ingestion.chunker import chunk_pages
from app.retrieval.vector_store import VectorStore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-30s | %(levelname)-7s | %(message)s",
)
logger = logging.getLogger("ingest")


def main():
    parser = argparse.ArgumentParser(description="Ingest Agentic AI eBook into vector store.")
    parser.add_argument("--pdf", type=str, default=None, help="Path to PDF file.")
    parser.add_argument("--reset", action="store_true", help="Reset the collection before ingesting.")
    parser.add_argument("--chunk-size", type=int, default=None, help="Chunk size in characters.")
    parser.add_argument("--chunk-overlap", type=int, default=None, help="Chunk overlap in characters.")
    args = parser.parse_args()

    # Reconfigure stdout for utf-8 if supported
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print("=" * 60)
    print("  Agentic AI eBook - Ingestion Pipeline")
    print("=" * 60)
    print()

    # -- Step 1: Load PDF --
    print("[Step 1/4] Loading PDF...")
    start = time.time()
    try:
        pages = load_pdf(args.pdf)
    except (FileNotFoundError, RuntimeError) as exc:
        print(f"[ERROR] Failed to load PDF: {exc}")
        sys.exit(1)
    print(f"   [OK] Extracted {len(pages)} pages in {time.time() - start:.1f}s")
    print()

    # -- Step 2: Chunk Text --
    print("[Step 2/4] Chunking text...")
    start = time.time()
    chunks = chunk_pages(
        pages,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
    )
    print(f"   [OK] Created {len(chunks)} chunks in {time.time() - start:.1f}s")
    print()

    # Show sample chunks
    print("[INFO] Sample chunks:")
    for chunk in chunks[:3]:
        print(f"   [{chunk['chunk_id']}] Page {chunk['page']} | {chunk['section'][:40]}")
        print(f"   {chunk['content'][:100]}...")
        print()

    # -- Step 3: Embed & Store --
    print("[Step 3/4] Generating embeddings & storing in ChromaDB...")
    start = time.time()

    store = VectorStore()

    if args.reset:
        print("   [INFO] Resetting collection...")
        store.reset()

    count = store.upsert_chunks(chunks)
    elapsed = time.time() - start
    print(f"   [OK] Upserted {count} chunks in {elapsed:.1f}s")
    print(f"   Total vectors in collection: {store.count()}")
    print()

    # -- Step 4: Verify --
    print("[Step 4/4] Verification - running test query...")
    test_results = store.search("What is Agentic AI?", top_k=3)
    print(f"   Query: 'What is Agentic AI?'")
    for r in test_results:
        print(f"   Score: {r['score']:.4f} | Page {r['page']} | {r['content'][:80]}...")
    print()

    print("=" * 60)
    print("  [SUCCESS] Ingestion complete!")
    print(f"  Chunks: {count} | Pages: {len(pages)}")
    print(f"  Store:  {settings.CHROMA_PERSIST_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
