"""OWNER: B. RAG CONTRACT. Everyone codes against these two functions; B implements them.
Pipeline target: structure-aware chunks (by clause, parent/child) -> BM25 + bge embeddings -> RRF fusion
-> optional cross-encoder rerank -> answer with clause citations; ABSTAIN (abstained=True) when top score < threshold."""
from shared.schemas import Citation, RagAnswer

ABSTAIN_THRESHOLD = 0.35  # tune on agents/rag/eval_qa.json


def retrieve(query: str, k: int = 8) -> list[Citation]:
    raise NotImplementedError  # TODO(B)


def answer(question: str) -> RagAnswer:
    raise NotImplementedError  # TODO(B): retrieve -> llm.ask(prompts/rag_answer.md) -> RagAnswer(citations=...)
