"""RAG 问答路由。"""

from __future__ import annotations

import json
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel, Field

from api.core.config import settings
from api.core.database import DatabasePool
from api.core.embedding import EmbeddingService
from api.core.llm_client import LLMClient
from api.core.vector_store import VectorStore
from api.services.rag_service import query_rag

router = APIRouter()


class RAGRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=20)


class Citation(BaseModel):
    textbook: str
    chapter: str
    snippet: str
    relevance: float


class RAGResponse(BaseModel):
    answer: str
    citations: list[Citation]
    source_chunks: list[str]


class IndexStatusResponse(BaseModel):
    indexed_textbooks: int
    total_chunks: int


class IndexRequest(BaseModel):
    textbook_ids: list[str] | None = None


class IndexResponse(BaseModel):
    task_id: str
    status: str


@router.post("/query", response_model=RAGResponse)
async def rag_query(request: RAGRequest):
    pool = await DatabasePool.get_pool()
    vector_store = VectorStore(pool)
    embedding_service = EmbeddingService()
    llm_client = LLMClient(api_key=settings.DASHSCOPE_API_KEY, model=settings.LLM_MODEL_NAME)

    result = await query_rag(
        vector_store=vector_store,
        embedding_service=embedding_service,
        llm_client=llm_client,
        question=request.question,
        top_k=request.top_k,
    )

    return RAGResponse(**result)


@router.get("/status", response_model=IndexStatusResponse)
async def get_index_status():
    pool = await DatabasePool.get_pool()
    vector_store = VectorStore(pool)
    stats = await vector_store.get_stats()
    return IndexStatusResponse(**stats)


@router.post("/index", response_model=IndexResponse)
async def build_rag_index(background_tasks: BackgroundTasks, request: IndexRequest):
    task_id = str(uuid4())

    background_tasks.add_task(
        _build_index_background,
        task_id=task_id,
        textbook_ids=request.textbook_ids,
    )

    return IndexResponse(task_id=task_id, status="processing")


async def _build_index_background(task_id: str, textbook_ids: list[str] | None = None):
    import logging
    logger = logging.getLogger(__name__)

    try:
        pool = await DatabasePool.get_pool()
        embedding_service = EmbeddingService()

        async with pool.acquire() as conn:
            if textbook_ids:
                chunks = await conn.fetch(
                    "SELECT id, textbook_id, chapter_id, content, metadata FROM chunks WHERE textbook_id = ANY($1::text[]) AND embedding IS NULL",
                    textbook_ids,
                )
            else:
                chunks = await conn.fetch(
                    "SELECT id, textbook_id, chapter_id, content, metadata FROM chunks WHERE embedding IS NULL"
                )

        if not chunks:
            logger.info("没有需要索引的 chunks")
            return

        texts = [c["content"] for c in chunks]
        embeddings = embedding_service.encode(texts, batch_size=20)

        vector_store = VectorStore(pool)
        chunks_to_add = []
        for chunk, emb in zip(chunks, embeddings):
            meta = dict(chunk["metadata"]) if chunk["metadata"] else {}
            chunks_to_add.append({
                "id": str(chunk["id"]),
                "textbook_id": chunk["textbook_id"],
                "chapter_id": chunk["chapter_id"],
                "content": chunk["content"],
                "metadata": meta,
                "embedding": emb,
            })

        await vector_store.add_chunks(chunks_to_add)
        logger.info("索引完成：添加 %d 个 chunks", len(chunks_to_add))

    except Exception as e:
        logger.error("索引构建失败: %s", e, exc_info=True)
