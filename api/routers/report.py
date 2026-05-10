"""整合报告路由：CRUD + 下载。"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from api.core.config import settings
from api.core.embedding import EmbeddingService
from api.core.llm_client import LLMClient
from api.services.report_service import (
    create_report,
    delete_report,
    get_report,
    list_reports,
    update_report,
)

router = APIRouter()


class ReportCreateRequest(BaseModel):
    textbook_ids: list[str] | None = None


class ReportUpdateRequest(BaseModel):
    title: str | None = None
    content: str | None = None


class ReportResponse(BaseModel):
    id: str
    title: str
    content: str
    stats: dict


@router.post("/generate", response_model=ReportResponse)
async def generate_report_endpoint(request: ReportCreateRequest):
    from api.services.integration_service import run_integration

    llm_client = LLMClient(api_key=settings.DASHSCOPE_API_KEY, model=settings.LLM_MODEL_NAME)
    embedding_service = EmbeddingService()

    integration_result = await run_integration(
        llm_client=llm_client,
        embedding_service=embedding_service,
        textbook_ids=request.textbook_ids,
    )

    report = await create_report(
        llm_client=llm_client,
        stats=integration_result["stats"],
        decisions=integration_result["decisions"],
        textbook_ids=request.textbook_ids,
    )

    return ReportResponse(**report)


@router.get("/list")
async def list_reports_endpoint():
    return await list_reports()


@router.get("/{report_id}")
async def get_report_endpoint(report_id: str):
    report = await get_report(report_id)
    if not report:
        raise HTTPException(404, "报告不存在")
    return report


@router.get("/{report_id}/download")
async def download_report_endpoint(report_id: str, format: str = "markdown"):
    report = await get_report(report_id)
    if not report:
        raise HTTPException(404, "报告不存在")

    content = report["content"]
    title = report["title"]

    if format == "txt":
        import re
        content = re.sub(r'[#*`\[\]()]', '', content)
        content = re.sub(r'\n{3,}', '\n\n', content)
        return PlainTextResponse(content, media_type="text/plain", headers={"Content-Disposition": f"attachment; filename={title}.txt"})
    else:
        return PlainTextResponse(content, media_type="text/markdown", headers={"Content-Disposition": f"attachment; filename={title}.md"})


@router.put("/{report_id}")
async def update_report_endpoint(report_id: str, request: ReportUpdateRequest):
    report = await update_report(report_id, title=request.title, content=request.content)
    if not report:
        raise HTTPException(404, "报告不存在或未修改")
    return report


@router.delete("/{report_id}")
async def delete_report_endpoint(report_id: str):
    deleted = await delete_report(report_id)
    if not deleted:
        raise HTTPException(404, "报告不存在")
    return {"message": "删除成功", "id": report_id}
