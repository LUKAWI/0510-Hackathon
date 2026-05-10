"""学科知识整合智能体 · FastAPI 后端入口"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from dotenv import load_dotenv

load_dotenv()

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from api.core.database import DatabasePool, init_schema, lifespan as db_lifespan
from api.core.exceptions import register_exception_handlers

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """应用生命周期：启动时初始化数据库，关闭时释放。"""
    logger.info("正在启动学科知识整合智能体后端...")
    await DatabasePool.initialize()

    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        await init_schema(conn)
    logger.info("数据库 schema 初始化完成")

    yield

    logger.info("正在关闭后端...")
    await DatabasePool.close()
    logger.info("后端已关闭")


app = FastAPI(
    title="学科知识整合智能体",
    description="加载多本教材，自动构建跨教材知识图谱，提供 RAG 问答与多轮对话能力",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 中间件（允许前端域名 + 本地开发）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "project-7d4ec.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册异常处理器
register_exception_handlers(app)


# ── 路由注册 ──────────────────────────────────────────────────────────────────

from api.routers import textbooks, graph, rag, chat, integration, report  # noqa: E402

app.include_router(textbooks.router, prefix="/api/textbooks", tags=["教材管理"])
app.include_router(graph.router, prefix="/api/graph", tags=["知识图谱"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG 问答"])
app.include_router(chat.router, prefix="/api/chat", tags=["多轮对话"])
app.include_router(integration.router, prefix="/api/integration", tags=["整合操作"])
app.include_router(report.router, prefix="/api/report", tags=["整合报告"])


# ── 根路由 ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root() -> dict[str, str]:
    return {"name": "学科知识整合智能体", "version": "1.0.0"}


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
