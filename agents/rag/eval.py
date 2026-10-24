"""Small deterministic RAG evaluation runner.

Run with ``python -m agents.rag.eval`` after installing retrieval dependencies
and placing the manifest documents in ``agents/rag/corpus``.
"""
from __future__ import annotations

from .interface import answer


CASES = [
    ("How should wet food waste be handled?", True),
    ("What are the duties for segregating waste at source?", True),
    ("How should lithium batteries be disposed of?", True),
    ("What is the campus cricket score today?", False),
    ("What will the weather be tomorrow?", False),
]


def run() -> tuple[float, float]:
    in_scope = [answer(question) for question, _ in CASES[:3]]
    out_scope = [answer(question) for question, _ in CASES[3:]]
    hit_at_k = sum(bool(result.citations) and not result.abstained for result in in_scope) / len(in_scope)
    abstain_accuracy = sum(result.abstained for result in out_scope) / len(out_scope)
    print(f"hit@k={hit_at_k:.3f}")
    print(f"abstain_accuracy={abstain_accuracy:.3f}")
    return hit_at_k, abstain_accuracy


if __name__ == "__main__":
    run()
