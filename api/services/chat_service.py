"""增强对话服务：集成记忆系统的 RAG 问答。"""

from __future__ import annotations

import json
import logging
from uuid import uuid4

import asyncpg

from api.core.database import DatabasePool
from api.core.embedding import EmbeddingService
from api.core.llm_client import LLMClient
from api.core.memory import MemoryManager
from api.core.vector_store import VectorStore

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """你是一个医学教材问答助手，具备记忆能力。

## 回答要求
1. 只基于提供的上下文回答，不使用自身知识
2. 每个回答附带来源引用，格式为 [教材名称, 第 X 章, 第 X 页]
3. 结合用户画像和记忆，提供个性化的回答
4. 如果上下文中找不到答案，回复"当前知识库中未找到相关信息"
5. 回答要准确、简洁、有条理

## 用户画像与记忆
{memory_context}"""

RAG_WITH_HISTORY_PROMPT = """请基于教材内容和对话历史回答问题。

## 对话历史
{history}

## 教材上下文
{context}

## 用户问题
{question}

## 回答"""


def format_history(messages: list[dict], max_turns: int = 10) -> str:
    """格式化对话历史。"""
    recent = messages[-max_turns:] if len(messages) > max_turns else messages
    parts: list[str] = []
    for msg in recent:
        role = "用户" if msg["role"] == "user" else "助手"
        content = msg.get("content", "")[:500]
        parts.append(f"{role}: {content}")
    return "\n".join(parts) if parts else "暂无对话历史"


def format_chunks(chunks: list[dict]) -> str:
    """格式化检索到的知识块。"""
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


async def get_conversation_history(
    pool: asyncpg.Pool,
    session_id: str,
    limit: int = 20,
) -> list[dict]:
    """获取对话历史。"""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT role, content, created_at
            FROM conversations
            WHERE session_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            """,
            session_id, limit,
        )
    return [dict(r) for r in reversed(rows)]


async def store_message(
    pool: asyncpg.Pool,
    session_id: str,
    role: str,
    content: str,
    metadata: dict | None = None,
) -> None:
    """存储消息到数据库。"""
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO conversations (id, session_id, role, content, metadata)
            VALUES ($1, $2, $3, $4, $5::jsonb)
            """,
            uuid4(), session_id, role, content,
            json.dumps(metadata, ensure_ascii=False) if metadata else "{}",
        )


async def chat_with_memory(
    session_id: str,
    message: str,
    llm_client: LLMClient,
    embedding_service: EmbeddingService,
    vector_store: VectorStore,
    memory_manager: MemoryManager,
) -> dict:
    """带记忆的 RAG 对话。

    Returns:
        {
            "answer": str,
            "citations": list[dict],
            "memories_used": list[str],
            "new_memories": dict
        }
    """
    pool = await DatabasePool.get_pool()

    await store_message(pool, session_id, "user", message)

    history = await get_conversation_history(pool, session_id, limit=20)
    history_str = format_history(history)

    memory_context = await memory_manager.get_memory_context(session_id, message)

    system_prompt = CHAT_SYSTEM_PROMPT.format(memory_context=memory_context)

    query_embedding = embedding_service.encode_single(message)
    chunks = await vector_store.search(
        query_embedding=query_embedding,
        top_k=5,
        similarity_threshold=0.3,
    )

    if not chunks:
        context = "当前知识库中未找到相关内容。"
    else:
        context = format_chunks(chunks)

    prompt = RAG_WITH_HISTORY_PROMPT.format(
        history=history_str,
        context=context,
        question=message,
    )

    answer = llm_client.generate(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.1,
        max_tokens=2000,
    )

    citations: list[dict] = []
    for chunk in chunks:
        meta = chunk.get("metadata", {})
        citations.append({
            "textbook": meta.get("textbook", meta.get("source", "未知")),
            "chapter": meta.get("chapter", ""),
            "snippet": chunk.get("content", "")[:200],
            "relevance": round(chunk.get("similarity", 0), 3),
        })

    await store_message(pool, session_id, "assistant", answer, {"citations": citations})

    new_memories = await memory_manager.extract_memories(session_id, message, answer)

    return {
        "answer": answer,
        "citations": citations,
        "memories_used": memory_context.split("\n") if memory_context != "暂无用户记忆" else [],
        "new_memories": new_memories,
    }
