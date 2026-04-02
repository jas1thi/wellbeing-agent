import os
from datetime import datetime
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

_model = None
_index_cache: dict | None = None


def _get_embedder() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _get_fingerprint(journal_dir: Path) -> str:
    """Return a fingerprint based on file names and modification times."""
    md_files = sorted(journal_dir.glob("*.md"))
    parts = [f"{f.name}:{f.stat().st_mtime_ns}" for f in md_files]
    return "|".join(parts)


def _build_index() -> dict | None:
    """Build and cache the FAISS index. Returns None if no content."""
    journal_dir = _get_journal_dir()
    fingerprint = _get_fingerprint(journal_dir)

    global _index_cache
    if _index_cache and _index_cache["fingerprint"] == fingerprint:
        return _index_cache

    md_files = sorted(journal_dir.glob("*.md"))
    if not md_files:
        return None

    chunks: list[str] = []
    sources: list[str] = []

    for f in md_files:
        text = f.read_text().strip()
        if not text:
            continue
        sections = [s.strip() for s in text.split("---") if s.strip()]
        for section in sections:
            # Skip chunks that are only image references
            non_image_lines = [l for l in section.splitlines() if l.strip() and not l.strip().startswith("![")]
            if not non_image_lines:
                continue
            chunks.append(section)
            sources.append(f.stem)

    if not chunks:
        return None

    embedder = _get_embedder()
    chunk_embeddings = embedder.encode(chunks, normalize_embeddings=True)

    dim = chunk_embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(np.asarray(chunk_embeddings, dtype=np.float32))

    _index_cache = {
        "fingerprint": fingerprint,
        "index": index,
        "chunks": chunks,
        "sources": sources,
    }
    return _index_cache


def invalidate_index():
    """Clear the cached index (called after saving a new journal)."""
    global _index_cache
    _index_cache = None


def _get_journal_dir() -> Path:
    journal_dir = Path(os.environ.get("JOURNAL_DIR", "./journals"))
    journal_dir.mkdir(parents=True, exist_ok=True)
    return journal_dir


def save_journal(entry: str, title: str = "") -> str:
    """Save a wellbeing journal entry for today and generate a cartoon.

    Args:
        entry: The formatted markdown journal entry to save.
        title: A short summary of the day's highlights for the cartoon image.

    Returns:
        Confirmation message with the file path.
    """
    from .image_gen import generate_day_cartoon

    now = datetime.now()
    journal_dir = _get_journal_dir()
    date_str = now.strftime("%Y-%m-%d")

    # If today's file already exists, append a numeric suffix
    file_path = journal_dir / f"{date_str}.md"
    counter = 2
    while file_path.exists():
        file_path = journal_dir / f"{date_str}-{counter}.md"
        counter += 1

    # Generate cartoon and append to entry if title provided
    if title:
        cartoon_result = generate_day_cartoon(title)
        if "![" in cartoon_result:
            # Extract the markdown image line from the result
            img_line = [l for l in cartoon_result.splitlines() if l.startswith("![")][0]
            entry = f"{entry}\n\n---\n{img_line}\n"

    with open(file_path, "w") as f:
        f.write(entry)

    invalidate_index()
    return f"Journal entry saved to {file_path}"


def read_journal(date: str = "") -> str:
    """Read a journal entry by date, or list recent entries.

    Args:
        date: Date in YYYY-MM-DD format. Leave empty to list the last 7 entries.

    Returns:
        The journal entry content or a list of recent entries.
    """
    journal_dir = _get_journal_dir()

    if date:
        file_path = journal_dir / f"{date}.md"
        if file_path.exists():
            return file_path.read_text()
        return f"No entry found for {date}."

    entries = sorted(journal_dir.glob("*.md"), reverse=True)[:7]
    if not entries:
        return "No journal entries yet."

    return "Recent entries:\n" + "\n".join(
        f"- {e.stem}" for e in entries
    )


def search_journals(query: str, top_k: int = 3) -> str:
    """Search through all journal entries using semantic similarity.

    Uses FAISS to find the most relevant journal passages for a given query.

    Args:
        query: The search query (e.g. "days I felt anxious", "morning runs").
        top_k: Number of top results to return (default 3).

    Returns:
        The most relevant journal passages with their source dates.
    """
    cache = _build_index()
    if cache is None:
        return "No journal content to search."

    index = cache["index"]
    chunks = cache["chunks"]
    sources = cache["sources"]

    embedder = _get_embedder()
    query_embedding = embedder.encode([query], normalize_embeddings=True)

    k = min(top_k, len(chunks))
    scores, indices = index.search(np.asarray(query_embedding, dtype=np.float32), k)

    results: list[str] = []
    for rank, (idx, score) in enumerate(zip(indices[0], scores[0]), 1):
        results.append(
            f"### Result {rank} (date: {sources[idx]}, score: {score:.3f})\n{chunks[idx]}"
        )

    return "\n\n---\n\n".join(results)
