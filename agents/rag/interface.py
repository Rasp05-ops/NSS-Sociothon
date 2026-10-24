"""Dependency-light rules retrieval with safe abstention.

The index is rebuilt when files listed by ``manifest.yaml`` change. Optional
PDF support is used when ``pypdf`` is installed; lexical retrieval remains
available for the mock/demo path and never invents citations.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import yaml

try:
    from rank_bm25 import BM25Okapi
except ImportError:
    BM25Okapi = None

from shared.schemas import Citation, RagAnswer

from ..llm import ask, LLMConfigurationError

ABSTAIN_THRESHOLD = 0.35
ROOT = Path(__file__).parent
MANIFEST = ROOT / "manifest.yaml"
PROMPT = ROOT.parent / "prompts" / "rag_answer.md"
STOPWORDS = {
    "a", "an", "and", "are", "can", "does", "for", "from", "how", "is",
    "of", "on", "or", "the", "this", "to", "what", "which", "who",
}


@dataclass(frozen=True)
class _Chunk:
    doc_id: str
    title: str
    clause: str | None
    text: str


_index: tuple[_Chunk, ...] | None = None
_signature: tuple[tuple[str, int], ...] | None = None
_bm25 = None
_embeddings: np.ndarray | None = None
_embedder = None


def _tokens(text: str) -> set[str]:
    return {
        token for token in re.findall(r"[a-z0-9]{2,}", text.lower())
        if token not in STOPWORDS
    }


def _files_signature(paths: list[Path]) -> tuple[tuple[str, int], ...]:
    return tuple((str(path), path.stat().st_mtime_ns if path.exists() else -1) for path in paths)


def _read_document(path: Path) -> str:
    if path.suffix.lower() in {".md", ".txt"}:
        return path.read_text(encoding="utf-8")
    try:
        from pypdf import PdfReader
    except ImportError:
        return ""
    return "\n".join(page.extract_text() or "" for page in PdfReader(str(path)).pages)


def _chunk(text: str, doc_id: str, title: str, mode: str) -> list[_Chunk]:
    if mode == "heading":
        sections = re.split(r"(?m)^(?=#{1,3}\s)", text)
    else:
        sections = re.split(r"(?im)^(?=(?:rule|section|chapter|clause)\s+[\w.-]+)", text)
    chunks: list[_Chunk] = []
    for section in sections:
        words = section.split()
        if len(words) < 8:
            continue
        heading = section.strip().splitlines()[0][:160]
        clause_match = re.search(
            r"(?i)\b(rule|section|chapter|clause)\s+(?:no\.?\s*)?[\w().-]+(?:\s*[-:]\s*[^.]{0,100})?",
            heading,
        )
        clause = clause_match.group(0).strip() if clause_match else None
        for start in range(0, len(words), 380):
            part = " ".join(words[start:start + 500])
            if len(part.split()) >= 8:
                chunks.append(_Chunk(doc_id, title, clause, part))
    return chunks


def _load_index() -> tuple[_Chunk, ...]:
    global _index, _signature, _bm25, _embeddings
    manifest = yaml.safe_load(MANIFEST.read_text(encoding="utf-8"))
    entries = manifest.get("docs", [])
    paths = [ROOT / entry["file"] for entry in entries]
    signature = _files_signature(paths)
    if _index is not None and signature == _signature:
        return _index
    chunks: list[_Chunk] = []
    for entry, path in zip(entries, paths):
        if path.exists():
            chunks.extend(_chunk(_read_document(path), entry["id"], entry["title"], entry.get("chunking", "clause")))
    _index, _signature = tuple(chunks), signature
    _bm25 = BM25Okapi([sorted(_tokens(chunk.text)) for chunk in _index]) if _index and BM25Okapi else None
    _embeddings = None
    return _index


def retrieve(query: str, k: int = 8) -> list[Citation]:
    chunks = _load_index()
    if not chunks or k <= 0:
        return []

    query_terms = sorted(_tokens(query))
    candidate_count = min(len(chunks), max(k * 3, 20))
    rankings: list[list[int]] = []
    relevance: dict[int, float] = {}

    if _bm25 is not None and query_terms:
        bm25_scores = _bm25.get_scores(query_terms)
        positive = np.flatnonzero(bm25_scores > 0)
        if positive.size:
            order = positive[np.argsort(bm25_scores[positive])[::-1]]
            rankings.append(list(order[:candidate_count]))
            max_bm25 = float(bm25_scores[order[0]])
            for index in order:
                relevance[int(index)] = max(relevance.get(int(index), 0.0), float(bm25_scores[index]) / max_bm25)

    dense_scores = _dense_scores(query, chunks)
    if dense_scores is not None:
        relevant = np.flatnonzero(dense_scores >= 0.6)
        if relevant.size:
            order = relevant[np.argsort(dense_scores[relevant])[::-1]]
            rankings.append(list(order[:candidate_count]))
            for index in order:
                relevance[int(index)] = max(relevance.get(int(index), 0.0), float(dense_scores[index]))

    if not rankings:
        return []

    rrf_k = 60
    fused: dict[int, float] = {}
    for ranking in rankings:
        for rank, index in enumerate(ranking, start=1):
            fused[index] = fused.get(index, 0.0) + 1.0 / (rrf_k + rank)
    ranked = sorted(fused, key=fused.get, reverse=True)[:k]
    return [
        Citation(
            doc_id=chunks[index].doc_id,
            title=chunks[index].title,
            clause=chunks[index].clause,
            snippet=chunks[index].text[:300],
            score=round(relevance.get(index, 0.0), 4),
        )
        for index in ranked
    ]


def _dense_scores(query: str, chunks: tuple[_Chunk, ...]) -> np.ndarray | None:
    global _embedder, _embeddings
    try:
        if _embedder is None:
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
        if _embeddings is None:
            _embeddings = _embedder.encode(
                [chunk.text for chunk in chunks],
                normalize_embeddings=True,
                show_progress_bar=False,
            )
        query_embedding = _embedder.encode([query], normalize_embeddings=True, show_progress_bar=False)[0]
        return np.asarray(_embeddings) @ np.asarray(query_embedding)
    except (ImportError, OSError, RuntimeError, ValueError):
        return None


def answer(question: str) -> RagAnswer:
    citations = retrieve(question)
    if not citations or citations[0].score < ABSTAIN_THRESHOLD:
        return RagAnswer(
            question=question,
            answer="I can't answer that from the indexed waste-management documents.",
            citations=citations,
            abstained=True,
        )
    context = "\n".join(
        f"[{c.doc_id}, {c.clause or 'document'}] {c.snippet}" for c in citations
    )
    prompt = f"{PROMPT.read_text(encoding='utf-8')}\n\nQuestion: {question}\nContext:\n{context}"
    try:
        generated = ask(prompt, system="You answer campus waste rules using only cited context.")
    except LLMConfigurationError as exc:
        return RagAnswer(
            question=question,
            answer=f"AI answer unavailable: {exc}",
            citations=citations,
            abstained=True,
        )
    words = generated.split()
    return RagAnswer(question=question, answer=" ".join(words[:120]), citations=citations)
