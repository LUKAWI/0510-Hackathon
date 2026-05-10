"""知识图谱路由。"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.services.graph_service import get_graph_by_textbook, get_merged_graph

router = APIRouter()


class GraphResponse(BaseModel):
    nodes: list[dict]
    edges: list[dict]


@router.get("/{textbook_id}", response_model=GraphResponse)
async def get_textbook_graph(textbook_id: str):
    data = await get_graph_by_textbook(textbook_id)
    return GraphResponse(**data)


@router.get("/merged/all", response_model=GraphResponse)
async def get_all_graphs():
    data = await get_merged_graph()
    return GraphResponse(**data)


@router.get("/node/{node_id}")
async def get_node_detail(node_id: str):
    from api.core.database import DatabasePool
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        unit = await conn.fetchrow(
            """
            SELECT u.id, u.name, u.definition, u.category, u.content, u.keywords,
                   u.importance_score, u.textbook_id, u.chapter_id,
                   t.title AS textbook_title
            FROM knowledge_units u
            LEFT JOIN textbooks t ON u.textbook_id = t.id
            WHERE u.id = $1
            """,
            node_id,
        )
        if not unit:
            raise HTTPException(404, "节点不存在")

        edges = await conn.fetch(
            """
            SELECT e.relation_type, e.description,
                   CASE WHEN e.source_id = $1 THEN t.name ELSE s.name END AS related_name,
                   CASE WHEN e.source_id = $1 THEN e.target_id ELSE e.source_id END AS related_id
            FROM knowledge_edges e
            JOIN knowledge_units s ON e.source_id = s.id
            JOIN knowledge_units t ON e.target_id = t.id
            WHERE e.source_id = $1 OR e.target_id = $1
            """,
            node_id,
        )

    result = dict(unit)
    result["related_nodes"] = [dict(e) for e in edges]
    return result


@router.get("/search/{keyword}")
async def search_nodes(keyword: str, limit: int = 20):
    from api.core.database import DatabasePool
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, name, definition, category, textbook_id
            FROM knowledge_units
            WHERE name ILIKE $1 OR definition ILIKE $1
            ORDER BY importance_score DESC
            LIMIT $2
            """,
            f"%{keyword}%",
            limit,
        )
    return [dict(r) for r in rows]
