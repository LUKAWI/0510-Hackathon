"""多轮对话路由（集成记忆系统）。"""

from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

from api.core.config import settings
from api.core.database import DatabasePool
from api.core.embedding import EmbeddingService
from api.core.llm_client import LLMClient
from api.core.memory import MemoryManager
from api.core.vector_store import VectorStore
from api.services.chat_service import chat_with_memory

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid4()))
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    citations: list[dict]
    memories_used: list[str]
    new_memories: dict


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    llm_client = LLMClient(api_key=settings.DASHSCOPE_API_KEY, model=settings.LLM_MODEL_NAME)
    embedding_service = EmbeddingService()
    pool = await DatabasePool.get_pool()
    vector_store = VectorStore(pool)
    memory_manager = MemoryManager(llm_client=llm_client, embedding_service=embedding_service)

    result = await chat_with_memory(
        session_id=request.session_id,
        message=request.message,
        llm_client=llm_client,
        embedding_service=embedding_service,
        vector_store=vector_store,
        memory_manager=memory_manager,
    )

    return ChatResponse(
        session_id=request.session_id,
        reply=result["answer"],
        citations=result["citations"],
        memories_used=result["memories_used"],
        new_memories=result["new_memories"],
    )


@router.get("/history/{session_id}")
async def get_history(session_id: str):
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT role, content, metadata, created_at
            FROM conversations
            WHERE session_id = $1
            ORDER BY created_at
            """,
            session_id,
        )
    return [dict(r) for r in rows]


@router.get("/memories/{session_id}")
async def get_memories(session_id: str):
    llm_client = LLMClient(api_key=settings.DASHSCOPE_API_KEY)
    embedding_service = EmbeddingService()
    memory_manager = MemoryManager(llm_client=llm_client, embedding_service=embedding_service)

    profile = await memory_manager.get_user_profile(session_id)
    return {"session_id": session_id, "profile": profile}
