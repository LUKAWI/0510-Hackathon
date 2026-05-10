"""异步数据库连接池管理，集成 pgvector 类型注册。"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

import asyncpg
from pgvector.asyncpg import register_vector

from api.core.config import settings


class DatabasePool:
    """单例数据库连接池。"""

    _pool: asyncpg.Pool | None = None

    @classmethod
    async def initialize(cls) -> None:
        """创建连接池，每个连接自动注册 pgvector 类型。"""

        async def init_connection(conn: asyncpg.Connection) -> None:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            await register_vector(conn)

        cls._pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=5,
            max_size=20,
            max_inactive_connection_lifetime=300,
            init=init_connection,
            command_timeout=60,
        )

    @classmethod
    async def get_pool(cls) -> asyncpg.Pool:
        if cls._pool is None:
            raise RuntimeError("数据库连接池未初始化，请先调用 initialize()")
        return cls._pool

    @classmethod
    async def close(cls) -> None:
        if cls._pool is not None:
            await cls._pool.close()
            cls._pool = None


async def init_schema(conn: asyncpg.Connection) -> None:
    """创建数据库表和索引。"""

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS textbooks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename TEXT NOT NULL,
            title TEXT,
            total_chars INT DEFAULT 0,
            total_pages INT DEFAULT 0,
            status TEXT DEFAULT 'uploading',
            error_message TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS chapters (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            textbook_id UUID REFERENCES textbooks(id) ON DELETE CASCADE,
            chapter_index INT,
            title TEXT,
            page_start INT,
            page_end INT,
            content TEXT,
            char_count INT
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_units (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            textbook_id UUID REFERENCES textbooks(id) ON DELETE CASCADE,
            chapter_id UUID,
            name TEXT NOT NULL,
            definition TEXT,
            category TEXT,
            content TEXT,
            keywords TEXT[] DEFAULT '{}',
            importance_score FLOAT DEFAULT 0,
            embedding VECTOR(1024),
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS knowledge_edges (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
            target_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
            relation_type TEXT,
            description TEXT,
            confidence FLOAT DEFAULT 1.0
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            textbook_id TEXT NOT NULL,
            chapter_id TEXT,
            unit_id TEXT,
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            embedding VECTOR(1024),
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS alignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            unit_a_id UUID,
            unit_b_id UUID,
            similarity_score FLOAT,
            llm_judgment JSONB,
            action TEXT,
            decision_reason TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT now()
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS agent_memories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id TEXT NOT NULL,
            memory_type TEXT NOT NULL,
            content TEXT NOT NULL,
            importance FLOAT DEFAULT 0.5,
            embedding VECTOR(1024),
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT now(),
            last_accessed TIMESTAMPTZ DEFAULT now(),
            access_count INT DEFAULT 0
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS session_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id TEXT UNIQUE NOT NULL,
            interests TEXT[] DEFAULT '{}',
            preferences JSONB DEFAULT '{}',
            summary TEXT,
            updated_at TIMESTAMPTZ DEFAULT now()
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL DEFAULT '整合报告',
            content TEXT NOT NULL,
            format TEXT DEFAULT 'markdown',
            stats JSONB DEFAULT '{}',
            textbook_ids TEXT[] DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        )
    """)

    # HNSW 索引
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_ku_embedding
        ON knowledge_units USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)

    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_chunks_embedding
        ON chunks USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)

    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_memories_embedding
        ON agent_memories USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)

    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_chunks_textbook ON chunks(textbook_id)
    """)

    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_memories_session ON agent_memories(session_id, memory_type)
    """)

    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_ku_textbook ON knowledge_units(textbook_id)
    """)

    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_conversations_session
        ON conversations(session_id, created_at)
    """)


@asynccontextmanager
async def lifespan(app: object) -> AsyncIterator[None]:
    """FastAPI 生命周期管理：启动时初始化连接池和 schema，关闭时释放。"""
    import logging

    logger = logging.getLogger(__name__)

    logger.info("正在初始化数据库连接池...")
    await DatabasePool.initialize()

    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        await init_schema(conn)
    logger.info("数据库 schema 初始化完成")

    yield

    logger.info("正在关闭数据库连接池...")
    await DatabasePool.close()
    logger.info("数据库连接池已关闭")
