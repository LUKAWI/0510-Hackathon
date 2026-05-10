"""RAG 问答服务：向量检索 + LLM 生成。"""

from __future__ import annotations

import logging

import asyncpg

from api.core.embedding import EmbeddingService
from api.core.llm_client import LLMClient
from api.core.vector_store import VectorStore

logger = logging.getLogger(__name__)

RAG_SYSTEM_PROMPT = """你是一个医学教材问答助手。请严格基于提供的教材内容回答问题。

## 回答要求
1. 只基于提供的上下文回答，不使用自身知识
2. 每个回答附带来源引用，格式为 [教材名称, 第 X 章, 第 X 页]
3. 如果上下文中找不到答案，回复"当前知识库中未找到相关信息"
4. 回答要准确、简洁、有条理"""

RAG_PROMPT = """请基于以下教材内容回答问题。

## 教材上下文
{context}

## 用户问题
{question}

## 回答"""


def format_context(chunks: list[dict]) -> str:
    """将检索到的 chunks 格式化为上下文字符串。"""
    parts: list[str] = []
    for i, chunk in enumerate(chunks):
        meta = chunk.get("metadata", {})
        textbook = meta.get("textbook", meta.get("source", "未知教材"))
        chapter = meta.get("chapter", "未知章节")
        similarity = chunk.get("similarity", 0)

        parts.append(
            f"[来源 {i + 1}] 《{textbook}》{chapter} (相似度: {similarity:.2f})\n"
            f"{chunk.get('content', '')}"
        )

    return "\n\n---\n\n".join(parts)


async def query_rag(
    vector_store: VectorStore,
    embedding_service: EmbeddingService,
    llm_client: LLMClient,
    question: str,
    top_k: int = 5,
    pool: asyncpg.Pool | None = None,
) -> dict:
    """执行 RAG 问答。

    Returns:
        {
            "answer": str,
            "citations": [{"textbook": str, "chapter": str, "snippet": str, "relevance": float}],
            "source_chunks": [str],
            "graph_context": { ... } | None,
        }
    """
    query_embedding = embedding_service.encode_single(question)

    chunks = await vector_store.search(
        query_embedding=query_embedding,
        top_k=top_k,
        similarity_threshold=0.3,
    )

    if not chunks:
        return {
            "answer": "当前知识库中未找到相关信息。请先上传教材并建立索引。",
            "citations": [],
            "source_chunks": [],
            "graph_context": None,
        }

    unit_ids: list[str] = []
    for chunk in chunks:
        uid = chunk.get("unit_id")
        if uid:
            unit_ids.append(uid)

    graph_context: dict | None = None
    if unit_ids and pool:
        async with pool.acquire() as conn:
            units = await conn.fetch(
                "SELECT id, name, category FROM knowledge_units WHERE id = ANY($1::uuid[])",
                unit_ids,
            )
            edges = await conn.fetch(
                "SELECT e.source_id, e.target_id, e.relation_type FROM knowledge_edges e "
                "WHERE e.source_id = ANY($1::uuid[]) OR e.target_id = ANY($1::uuid[])",
                [str(u["id"]) for u in units],
            )

        if units:
            graph_context = {
                "nodes": [{"id": str(n["id"]), "label": n["name"], "type": n["category"]} for n in units],
                "edges": [{"source": str(e["source_id"]), "target": str(e["target_id"]), "relation": e["relation_type"]} for e in edges],
            }

    context = format_context(chunks)
    prompt = RAG_PROMPT.format(context=context, question=question)

    answer = llm_client.generate(
        prompt=prompt,
        system_prompt=RAG_SYSTEM_PROMPT,
        temperature=0.1,
        max_tokens=2000,
    )

    citations: list[dict] = []
    source_chunks: list[str] = []
    for chunk in chunks:
        meta = chunk.get("metadata", {})
        citations.append({
            "textbook": meta.get("textbook", meta.get("source", "未知")),
            "chapter": meta.get("chapter", ""),
            "snippet": chunk.get("content", "")[:200],
            "relevance": round(chunk.get("similarity", 0), 3),
        })
        source_chunks.append(chunk.get("content", ""))

    return {
        "answer": answer,
        "citations": citations,
        "source_chunks": source_chunks,
        "graph_context": graph_context,
    }
