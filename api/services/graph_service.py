"""知识图谱服务：构建和查询知识图谱。"""

from __future__ import annotations

import logging
from uuid import uuid4

import asyncpg

from api.core.database import DatabasePool

logger = logging.getLogger(__name__)


async def store_knowledge_units(
    units: list[dict],
    textbook_id: str,
    chapter_id: str | None = None,
) -> list[str]:
    """存储知识单元到数据库，返回生成的 ID 列表。"""
    pool = await DatabasePool.get_pool()
    unit_ids: list[str] = []

    async with pool.acquire() as conn:
        for unit in units:
            unit_id = unit.get("id", str(uuid4()))
            await conn.execute(
                """
                INSERT INTO knowledge_units (id, textbook_id, chapter_id, name, definition, category, content, keywords)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """,
                uuid4() if not unit_id else unit_id,
                textbook_id,
                chapter_id,
                unit.get("name", ""),
                unit.get("definition", ""),
                unit.get("category", "概念"),
                unit.get("content", ""),
                unit.get("keywords", []),
            )
            unit_ids.append(unit_id)

    logger.info("存储了 %d 个知识单元", len(unit_ids))
    return unit_ids


async def store_relationships(relationships: list[dict], unit_name_to_id: dict[str, str]) -> int:
    """存储知识关系到数据库。"""
    pool = await DatabasePool.get_pool()
    count = 0

    async with pool.acquire() as conn:
        for rel in relationships:
            source_name = rel.get("source_name", "")
            target_name = rel.get("target_name", "")
            source_id = unit_name_to_id.get(source_name)
            target_id = unit_name_to_id.get(target_name)

            if not source_id or not target_id:
                logger.warning("跳过关系 %s -> %s (ID 未找到)", source_name, target_name)
                continue

            await conn.execute(
                """
                INSERT INTO knowledge_edges (id, source_id, target_id, relation_type, description, confidence)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                uuid4(),
                source_id,
                target_id,
                rel.get("relation_type", "parallel"),
                rel.get("description", ""),
                0.9,
            )
            count += 1

    logger.info("存储了 %d 个关系", count)
    return count


async def get_graph_by_textbook(textbook_id: str) -> dict:
    """获取指定教材的知识图谱数据。"""
    pool = await DatabasePool.get_pool()

    async with pool.acquire() as conn:
        units = await conn.fetch(
            """
            SELECT id, name, definition, category, keywords, importance_score
            FROM knowledge_units
            WHERE textbook_id = $1
            ORDER BY created_at
            """,
            textbook_id,
        )

        edges = await conn.fetch(
            """
            SELECT e.source_id, e.target_id, e.relation_type, e.description,
                   s.name AS source_name, t.name AS target_name
            FROM knowledge_edges e
            JOIN knowledge_units s ON e.source_id = s.id
            JOIN knowledge_units t ON e.target_id = t.id
            WHERE s.textbook_id = $1 OR t.textbook_id = $1
            """,
            textbook_id,
        )

    nodes = [
        {
            "id": str(u["id"]),
            "label": u["name"],
            "type": u["category"],
            "definition": u["definition"],
            "keywords": u["keywords"],
            "importance": u["importance_score"],
        }
        for u in units
    ]

    edge_list = [
        {
            "source": str(e["source_id"]),
            "target": str(e["target_id"]),
            "relation": e["relation_type"],
            "description": e["description"],
            "source_name": e["source_name"],
            "target_name": e["target_name"],
        }
        for e in edges
    ]

    return {"nodes": nodes, "edges": edge_list}


async def get_merged_graph() -> dict:
    """获取所有教材的合并知识图谱。"""
    pool = await DatabasePool.get_pool()

    async with pool.acquire() as conn:
        units = await conn.fetch(
            """
            SELECT id, name, definition, category, keywords, textbook_id, importance_score
            FROM knowledge_units
            ORDER BY created_at
            """
        )

        edges = await conn.fetch(
            """
            SELECT e.source_id, e.target_id, e.relation_type, e.description,
                   s.name AS source_name, t.name AS target_name
            FROM knowledge_edges e
            JOIN knowledge_units s ON e.source_id = s.id
            JOIN knowledge_units t ON e.target_id = t.id
            """
        )

    nodes = [
        {
            "id": str(u["id"]),
            "label": u["name"],
            "type": u["category"],
            "textbook_id": u["textbook_id"],
            "keywords": u["keywords"],
        }
        for u in units
    ]

    edge_list = [
        {
            "source": str(e["source_id"]),
            "target": str(e["target_id"]),
            "relation": e["relation_type"],
            "description": e["description"],
        }
        for e in edges
    ]

    return {"nodes": nodes, "edges": edge_list}
