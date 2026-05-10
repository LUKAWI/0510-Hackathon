"""教材管理路由。"""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from pydantic import BaseModel

from api.core.database import DatabasePool
from api.core.embedding import EmbeddingService
from api.core.vector_store import VectorStore
from api.services.parse_service import parse_file

logger = logging.getLogger(__name__)
router = APIRouter()


class TextbookInfo(BaseModel):
    id: str
    filename: str
    title: str
    total_chars: int
    total_pages: int
    status: str


class UploadResponse(BaseModel):
    task_id: str
    textbook_id: str
    filename: str
    status: str


@router.get("/", response_model=list[TextbookInfo])
async def list_textbooks():
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, filename, title, total_chars, total_pages, status FROM textbooks ORDER BY created_at DESC"
        )
    return [TextbookInfo(**dict(r)) for r in rows]


@router.post("/upload", response_model=UploadResponse)
async def upload_textbook(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., max_length=250 * 1024 * 1024),
):
    allowed_types = {".pdf", ".md", ".txt", ".docx"}
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed_types:
        raise HTTPException(400, f"不支持的文件格式: {suffix}，支持: {', '.join(allowed_types)}")

    textbook_id = str(uuid4())
    task_id = str(uuid4())
    filename = file.filename or "unknown"

    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO textbooks (id, filename, title, status) VALUES ($1, $2, $3, $4)",
            textbook_id, filename, Path(filename).stem, "parsing",
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    background_tasks.add_task(
        _process_textbook_background,
        task_id=task_id,
        textbook_id=textbook_id,
        file_path=tmp_path,
        filename=filename,
    )

    return UploadResponse(task_id=task_id, textbook_id=textbook_id, filename=filename, status="parsing")


@router.get("/{textbook_id}", response_model=TextbookInfo)
async def get_textbook(textbook_id: str):
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, filename, title, total_chars, total_pages, status FROM textbooks WHERE id = $1",
            textbook_id,
        )
    if not row:
        raise HTTPException(404, "教材不存在")
    return TextbookInfo(**dict(row))


@router.delete("/{textbook_id}")
async def delete_textbook(textbook_id: str):
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM textbooks WHERE id = $1", textbook_id)
    if result == "DELETE 0":
        raise HTTPException(404, "教材不存在")
    return {"message": "删除成功"}


async def _process_textbook_background(
    task_id: str,
    textbook_id: str,
    file_path: str,
    filename: str,
):
    try:
        chapters, total_chars = parse_file(file_path)
        pool = await DatabasePool.get_pool()

        async with pool.acquire() as conn:
            for ch in chapters:
                await conn.execute(
                    """
                    INSERT INTO chapters (id, textbook_id, chapter_index, title, page_start, page_end, content, char_count)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    """,
                    uuid4(), textbook_id, ch["chapter_index"], ch["title"],
                    ch.get("page_start", 0), ch.get("page_end", 0),
                    ch["content"], ch["char_count"],
                )

            await conn.execute(
                "UPDATE textbooks SET status = 'ready', total_chars = $1, total_pages = $2 WHERE id = $3",
                total_chars, len(chapters), textbook_id,
            )

        embedding_service = EmbeddingService()
        chunks_to_embed: list[dict] = []
        for ch in chapters:
            text = ch["content"]
            chunk_size = 500
            for i in range(0, len(text), chunk_size - 80):
                chunk_text = text[i:i + chunk_size]
                if chunk_text.strip():
                    chunks_to_embed.append({
                        "textbook_id": textbook_id,
                        "chapter_id": str(ch.get("chapter_index", "")),
                        "content": chunk_text,
                        "metadata": {"textbook": filename, "chapter": ch["title"]},
                    })

        if chunks_to_embed:
            texts = [c["content"] for c in chunks_to_embed]
            embeddings = embedding_service.encode(texts, batch_size=32)

            for chunk, emb in zip(chunks_to_embed, embeddings):
                chunk["embedding"] = emb

            vector_store = VectorStore(pool)
            await vector_store.add_chunks(chunks_to_embed)

        logger.info("教材处理完成: %s, %d 章节, %d 字", filename, len(chapters), total_chars)

    except Exception as e:
        logger.error("教材处理失败: %s - %s", filename, e, exc_info=True)
        pool = await DatabasePool.get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE textbooks SET status = 'error', error_message = $1 WHERE id = $2",
                str(e), textbook_id,
            )
