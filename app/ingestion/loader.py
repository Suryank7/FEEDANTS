"""
PDF Loader — Downloads (if needed) and extracts text from the Agentic AI eBook.

Responsibilities:
  • Check for a local copy of the PDF; download from URL if missing.
  • Extract text page-by-page with metadata (page number, document name).
  • Basic text cleaning (collapse whitespace, strip control characters).
"""

import re
import logging
import requests
from pathlib import Path
from typing import TypedDict

import fitz  # PyMuPDF — fast, dependency‑light PDF extraction

from app.config import settings

logger = logging.getLogger(__name__)


class PageContent(TypedDict):
    """Typed dict for a single page of extracted text."""
    page_number: int
    text: str
    document_name: str


def download_pdf(url: str, dest: str) -> str:
    """Download PDF from *url* to *dest* path. Returns the path on success."""
    logger.info("Downloading PDF from %s …", url)
    try:
        resp = requests.get(url, timeout=120, stream=True)
        resp.raise_for_status()
        Path(dest).parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as fh:
            for chunk in resp.iter_content(chunk_size=8192):
                fh.write(chunk)
        logger.info("PDF saved to %s", dest)
        return dest
    except requests.RequestException as exc:
        raise RuntimeError(
            f"Failed to download PDF from {url}: {exc}"
        ) from exc


def _clean_text(text: str) -> str:
    """Normalise extracted text: collapse whitespace, strip junk chars."""
    # Remove non-printable / control chars except newline & tab
    text = re.sub(r"[^\S\n\t]+", " ", text)
    # Collapse multiple blank lines into two
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _detect_section(text: str) -> str:
    """Heuristic: try to grab the first heading-like line as section title."""
    lines = text.strip().split("\n")
    for line in lines[:5]:
        stripped = line.strip()
        # Heading heuristic: short, title-cased or all-caps, no trailing period
        if (
            5 < len(stripped) < 120
            and not stripped.endswith(".")
            and (stripped.istitle() or stripped.isupper())
        ):
            return stripped
    return "Unknown Section"


def load_pdf(pdf_path: str | None = None) -> list[PageContent]:
    """
    Load the Agentic AI eBook PDF and return a list of PageContent dicts.

    If *pdf_path* is ``None``, ``settings.PDF_PATH`` is used. When the file
    does not exist locally, an automatic download from ``settings.PDF_URL``
    is attempted.

    Raises
    ------
    RuntimeError
        If the PDF cannot be found, downloaded, or opened.
    FileNotFoundError
        If the path is invalid and download is not possible.
    """
    path = pdf_path or settings.PDF_PATH

    if not Path(path).exists():
        logger.warning("PDF not found at %s — attempting download.", path)
        path = download_pdf(settings.PDF_URL, path)

    if not Path(path).exists():
        raise FileNotFoundError(f"PDF not found at {path}")

    logger.info("Opening PDF: %s", path)
    try:
        doc = fitz.open(path)
    except Exception as exc:
        raise RuntimeError(f"Failed to open PDF: {exc}") from exc

    if doc.page_count == 0:
        raise RuntimeError("PDF has zero pages — nothing to extract.")

    doc_name = Path(path).stem
    pages: list[PageContent] = []

    for page_num in range(doc.page_count):
        page = doc[page_num]
        raw_text = page.get_text("text")
        cleaned = _clean_text(raw_text)
        if cleaned:  # skip blank pages
            pages.append(
                PageContent(
                    page_number=page_num + 1,  # 1-indexed
                    text=cleaned,
                    document_name=doc_name,
                )
            )

    total_pages = doc.page_count
    doc.close()
    logger.info(
        "Extracted %d non-empty pages from %d total pages.",
        len(pages),
        total_pages,
    )
    return pages
