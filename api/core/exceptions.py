"""自定义异常类和 FastAPI 异常处理器。"""

from __future__ import annotations

import logging
from typing import Any

import asyncpg
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class DatabaseError(Exception):
    """数据库操作错误。"""

    def __init__(self, message: str, detail: str | None = None) -> None:
        self.message = message
        self.detail = detail
        super().__init__(message)


class VectorSearchError(DatabaseError):
    """向量检索错误。"""


class DocumentProcessingError(Exception):
    """文档处理错误。"""

    def __init__(self, message: str, filename: str | None = None) -> None:
        self.message = message
        self.filename = filename
        super().__init__(message)


class LLMError(Exception):
    """LLM 调用错误。"""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def database_error_handler(request: Request, exc: DatabaseError) -> JSONResponse:
    logger.error("数据库错误: %s", exc.message, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "database_error", "message": exc.message, "detail": exc.detail},
    )


async def asyncpg_exception_handler(request: Request, exc: asyncpg.PostgresError) -> JSONResponse:
    logger.error("PostgreSQL 错误: %s", exc, exc_info=True)

    if isinstance(exc, asyncpg.UniqueViolationError):
        return JSONResponse(status_code=409, content={"error": "conflict", "message": "资源已存在"})
    if isinstance(exc, asyncpg.ForeignKeyViolationError):
        return JSONResponse(status_code=400, content={"error": "reference_error", "message": "引用的资源不存在"})
    if isinstance(exc, asyncpg.ConnectionDoesNotExistError):
        return JSONResponse(status_code=503, content={"error": "service_unavailable", "message": "数据库连接丢失，请重试"})

    return JSONResponse(status_code=500, content={"error": "database_error", "message": "数据库操作失败"})


async def document_processing_error_handler(request: Request, exc: DocumentProcessingError) -> JSONResponse:
    logger.error("文档处理错误: %s (文件: %s)", exc.message, exc.filename)
    return JSONResponse(
        status_code=422,
        content={"error": "processing_error", "message": exc.message, "filename": exc.filename},
    )


async def llm_error_handler(request: Request, exc: LLMError) -> JSONResponse:
    logger.error("LLM 调用错误: %s", exc.message)
    return JSONResponse(
        status_code=502,
        content={"error": "llm_error", "message": exc.message},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.critical("未处理的异常: %s", exc, exc_info=True)
    return JSONResponse(status_code=500, content={"error": "internal_error", "message": "服务器内部错误"})


def register_exception_handlers(app: Any) -> None:
    """注册所有异常处理器到 FastAPI 应用。"""
    app.add_exception_handler(DatabaseError, database_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(asyncpg.PostgresError, asyncpg_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(DocumentProcessingError, document_processing_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(LLMError, llm_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, generic_exception_handler)  # type: ignore[arg-type]
