"""Agent 记忆管理模块：三层记忆架构 (Working/Short-term/Long-term)。"""

from __future__ import annotations

import json
import logging
from uuid import uuid4

from api.core.database import DatabasePool
from api.core.embedding import EmbeddingService
from api.core.llm_client import LLMClient

logger = logging.getLogger(__name__)

MEMORY_EXTRACTION_PROMPT = """从以下对话中提取关键信息，用于构建用户画像和长期记忆。

## 对话内容
{conversation}

## 提取要求
1. 用户的兴趣领域（如：心血管、神经科学、病理学等）
2. 用户的学习目标（如：准备考试、理解概念、临床应用等）
3. 用户的偏好（如：喜欢详细解释、偏好图表、需要例子等）
4. 关键知识点或问题（用户特别关注的内容）
5. 用户的知识水平（初学者/中级/高级）

## 输出格式（JSON）
{{
  "interests": ["领域1", "领域2"],
  "goals": ["目标1", "目标2"],
  "preferences": {{
    "detail_level": "detailed|concise|mixed",
    "learning_style": "visual|textual|example-based|mixed",
    "response_format": "structured|conversational|bullet-points"
  }},
  "key_facts": ["事实1", "事实2"],
  "knowledge_level": "beginner|intermediate|advanced",
  "confidence": 0.0-1.0
}}"""

MEMORY_SEARCH_PROMPT = """根据用户当前的问题，生成最相关的记忆检索查询。

## 用户问题
{question}

## 当前用户画像
{user_profile}

## 要求
生成 1-3 个简短的检索查询，用于从记忆库中找到相关信息。
每个查询应该关注问题的不同方面。

## 输出格式（JSON）
{{
  "queries": ["查询1", "查询2", "查询3"]
}}"""


class MemoryManager:
    """Agent 记忆管理器。"""

    def __init__(self, llm_client: LLMClient, embedding_service: EmbeddingService) -> None:
        self.llm = llm_client
        self.embedder = embedding_service

    async def extract_memories(
        self,
        session_id: str,
        user_message: str,
        assistant_reply: str,
    ) -> dict:
        """从对话中提取记忆。"""
        conversation = f"用户: {user_message}\n助手: {assistant_reply}"
        prompt = MEMORY_EXTRACTION_PROMPT.format(conversation=conversation[:2000])

        result = self.llm.generate_json(prompt=prompt, max_retries=2)
        if result is None:
            return {"interests": [], "goals": [], "preferences": {}, "key_facts": []}

        await self._store_extracted_memories(session_id, result)
        await self._update_user_profile(session_id, result)

        logger.info("提取记忆: session=%s, interests=%d, facts=%d",
                    session_id, len(result.get("interests", [])), len(result.get("key_facts", [])))
        return result

    async def _store_extracted_memories(self, session_id: str, extracted: dict) -> None:
        """将提取的记忆存储到数据库。"""
        pool = await DatabasePool.get_pool()

        memories_to_store: list[tuple[str, str, float]] = []

        for interest in extracted.get("interests", []):
            memories_to_store.append((f"用户对{interest}感兴趣", "interest", 0.7))

        for goal in extracted.get("goals", []):
            memories_to_store.append((f"用户的学习目标: {goal}", "goal", 0.8))

        for fact in extracted.get("key_facts", []):
            memories_to_store.append((fact, "fact", 0.6))

        if not memories_to_store:
            return

        texts = [m[0] for m in memories_to_store]
        embeddings = self.embedder.encode(texts, batch_size=16)

        async with pool.acquire() as conn:
            for (content, mem_type, importance), embedding in zip(memories_to_store, embeddings):
                await conn.execute(
                    """
                    INSERT INTO agent_memories (id, session_id, memory_type, content, importance, embedding)
                    VALUES ($1, $2, $3, $4, $5, $6::vector)
                    """,
                    uuid4(), session_id, mem_type, content, importance, embedding,
                )

    async def _update_user_profile(self, session_id: str, extracted: dict) -> None:
        """更新用户画像。"""
        pool = await DatabasePool.get_pool()

        async with pool.acquire() as conn:
            existing = await conn.fetchrow(
                "SELECT interests, preferences FROM session_profiles WHERE session_id = $1",
                session_id,
            )

            if existing:
                old_interests = set(existing["interests"] or [])
                new_interests = set(extracted.get("interests", []))
                all_interests = list(old_interests | new_interests)

                old_prefs = dict(existing["preferences"] or {})
                new_prefs = extracted.get("preferences", {})
                merged_prefs = {**old_prefs, **new_prefs}

                await conn.execute(
                    """
                    UPDATE session_profiles
                    SET interests = $2, preferences = $3::jsonb, updated_at = now()
                    WHERE session_id = $1
                    """,
                    session_id, all_interests, json.dumps(merged_prefs, ensure_ascii=False),
                )
            else:
                await conn.execute(
                    """
                    INSERT INTO session_profiles (id, session_id, interests, preferences)
                    VALUES ($1, $2, $3, $4::jsonb)
                    """,
                    uuid4(), session_id,
                    extracted.get("interests", []),
                    json.dumps(extracted.get("preferences", {}), ensure_ascii=False),
                )

    async def search_memories(
        self,
        session_id: str,
        query: str,
        top_k: int = 5,
    ) -> list[dict]:
        """搜索相关记忆。"""
        query_embedding = self.embedder.encode_single(query)

        pool = await DatabasePool.get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, memory_type, content, importance,
                       1 - (embedding <=> $1::vector) AS similarity
                FROM agent_memories
                WHERE session_id = $2
                  AND 1 - (embedding <=> $1::vector) >= 0.3
                ORDER BY embedding <=> $1::vector
                LIMIT $3
                """,
                query_embedding, session_id, top_k,
            )

            if rows:
                ids = [r["id"] for r in rows]
                await conn.execute(
                    """
                    UPDATE agent_memories
                    SET last_accessed = now(), access_count = access_count + 1
                    WHERE id = ANY($1::uuid[])
                    """,
                    ids,
                )

        return [dict(r) for r in rows]

    async def get_user_profile(self, session_id: str) -> dict:
        """获取用户画像。"""
        pool = await DatabasePool.get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT interests, preferences, summary FROM session_profiles WHERE session_id = $1",
                session_id,
            )

        if not row:
            return {"interests": [], "preferences": {}, "summary": None}

        return {
            "interests": row["interests"] or [],
            "preferences": dict(row["preferences"] or {}),
            "summary": row["summary"],
        }

    async def get_memory_context(
        self,
        session_id: str,
        query: str,
        max_chars: int = 1000,
    ) -> str:
        """获取记忆上下文字符串，用于注入 RAG 提示词。"""
        profile = await self.get_user_profile(session_id)
        memories = await self.search_memories(session_id, query, top_k=5)

        parts: list[str] = []

        if profile.get("interests"):
            parts.append(f"用户兴趣领域: {', '.join(profile['interests'])}")

        if profile.get("preferences"):
            prefs = profile["preferences"]
            if prefs.get("detail_level"):
                parts.append(f"偏好详细程度: {prefs['detail_level']}")
            if prefs.get("learning_style"):
                parts.append(f"学习风格: {prefs['learning_style']}")

        if memories:
            parts.append("相关记忆:")
            for mem in memories:
                parts.append(f"- [{mem['memory_type']}] {mem['content']}")

        context = "\n".join(parts)
        return context[:max_chars] if context else "暂无用户记忆"

    async def generate_search_queries(
        self,
        session_id: str,
        question: str,
    ) -> list[str]:
        """根据用户问题和画像生成记忆检索查询。"""
        profile = await self.get_user_profile(session_id)
        profile_str = f"兴趣: {', '.join(profile.get('interests', ['未知']))}"

        prompt = MEMORY_SEARCH_PROMPT.format(
            question=question,
            user_profile=profile_str,
        )

        result = self.llm.generate_json(prompt=prompt, max_retries=2)
        if result and "queries" in result:
            return result["queries"]

        return [question]
