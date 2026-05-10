"""整合操作路由。"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.core.config import settings
from api.core.embedding import EmbeddingService
from api.core.llm_client import LLMClient
from api.services.integration_service import run_integration, store_decisions

router = APIRouter()


class IntegrationRequest(BaseModel):
    textbook_ids: list[str] | None = None
    similarity_threshold: float = 0.75


class IntegrationResponse(BaseModel):
    candidates_found: int
    alignments_confirmed: int
    decisions: list[dict]
    stats: dict


@router.post("/run", response_model=IntegrationResponse)
async def run_integration_endpoint(request: IntegrationRequest):
    llm_client = LLMClient(api_key=settings.DASHSCOPE_API_KEY, model=settings.LLM_MODEL_NAME)
    embedding_service = EmbeddingService()

    result = await run_integration(
        llm_client=llm_client,
        embedding_service=embedding_service,
        textbook_ids=request.textbook_ids,
    )

    await store_decisions(result["decisions"])

    return IntegrationResponse(**result)


@router.get("/decisions")
async def get_decisions():
    from api.core.database import DatabasePool
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, unit_a_id, unit_b_id, action, decision_reason, created_at FROM alignments ORDER BY created_at DESC"
        )
    return [dict(r) for r in rows]
