"""pgvector 向量存储层，封装 chunk 的写入和相似度检索。"""

from __future__ import annotations

import logging
from typing import Any
from uuid import uuid4

import asyncpg
from pgvector.asyncpg import register_vector

logger = logging.getLogger(__name__)


class VectorStore:
    """基于 pgvector 的向量存储。"""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def add_chunks(
        self,
        chunks: list[dict[str, Any]],
        batch_size: int = 100,
    ) -> int:
        """批量写入 chunks 到数据库。

        Args:
            chunks: 每个 chunk 需包含 content, embedding, textbook_id, metadata
            batch_size: 每批写入数量

        Returns:
            写入的 chunk 总数
        """
        total = 0
        async with self.pool.acquire() as conn:
            await register_vector(conn)

            for i in range(0, len(chunks), batch_size):
                batch = chunks[i : i + batch_size]
                await conn.executemany(
                    """
                    INSERT INTO chunks (id, textbook_id, chapter_id, unit_id, content, metadata, embedding)
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::vector)
                    """,
                    [
                        (
                            chunk.get("id", uuid4()),
                            chunk["textbook_id"],
                            chunk.get("chapter_id"),
                            chunk.get("unit_id"),
                            chunk["content"],
                            chunk.get("metadata", "{}"),
                            chunk["embedding"],
                        )
                        for chunk in batch
                    ],
                )
                total += len(batch)

        return total

    async def search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        textbook_filter: list[str] | None = None,
        similarity_threshold: float = 0.3,
    ) -> list[dict[str, Any]]:
        """向量相似度检索。

        Args:
            query_embedding: 查询向量
            top_k: 返回数量
            textbook_filter: 可选，按教材 ID 过滤
            similarity_threshold: 最低相似度阈值

        Returns:
            检索结果列表，包含 content, metadata, similarity
        """
        async with self.pool.acquire() as conn:
            await register_vector(conn)
            await conn.execute("SET hnsw.ef_search = 100")

            if textbook_filter:
                rows = await conn.fetch(
                    """
                    SELECT id, textbook_id, chapter_id, unit_id, content, metadata,
                           1 - (embedding <=> $1::vector) AS similarity
                    FROM chunks
                    WHERE textbook_id = ANY($2::text[])
                      AND 1 - (embedding <=> $1::vector) >= $3
                    ORDER BY embedding <=> $1::vector
                    LIMIT $4
                    """,
                    query_embedding,
                    textbook_filter,
                    similarity_threshold,
                    top_k,
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT id, textbook_id, chapter_id, unit_id, content, metadata,
                           1 - (embedding <=> $1::vector) AS similarity
                    FROM chunks
                    WHERE 1 - (embedding <=> $1::vector) >= $2
                    ORDER BY embedding <=> $1::vector
                    LIMIT $3
                    """,
                    query_embedding,
                    similarity_threshold,
                    top_k,
                )

        return [dict(row) for row in rows]

    async def get_stats(self) -> dict[str, int]:
        """获取索引统计信息。"""
        async with self.pool.acquire() as conn:
            textbook_count = await conn.fetchval("SELECT COUNT(DISTINCT textbook_id) FROM chunks")
            chunk_count = await conn.fetchval("SELECT COUNT(*) FROM chunks")

        return {
            "indexed_textbooks": textbook_count or 0,
            "total_chunks": chunk_count or 0,
        }

    async def delete_by_textbook(self, textbook_id: str) -> int:
        """删除指定教材的所有 chunks。"""
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM chunks WHERE textbook_id = $1",
                textbook_id,
            )
        # result 形如 "DELETE 42"
        return int(result.split()[-1]) if result else 0
