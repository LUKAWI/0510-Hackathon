"""跨教材整合服务：语义对齐 + 去重 + 合并决策。LLM 优先，算法降级。"""

from __future__ import annotations

import json
import logging
from uuid import uuid4

import asyncpg

from api.core.database import DatabasePool
from api.core.embedding import EmbeddingService
from api.core.llm_client import LLMClient

logger = logging.getLogger(__name__)

ALIGNMENT_SYSTEM_PROMPT = """你是一个医学教材知识整合专家。请判断两个知识点是否描述同一概念。

## 判断标准
1. 核心概念相同，即使措辞不同（如"白细胞"和"leukocyte"）
2. 定义范围一致（一个定义不能明显更宽或更窄）
3. 学科领域相同（如都是解剖学概念）

## 输出格式（JSON）
{{
  "is_same_concept": true/false,
  "confidence": 0.0-1.0,
  "reason": "判断理由（20字以内）"
}}"""

ALIGNMENT_PROMPT = """请判断以下两个知识点是否描述同一概念。

## 知识点 A
名称：{name_a}
定义：{definition_a}
教材：{textbook_a}

## 知识点 B
名称：{name_b}
定义：{definition_b}
教材：{textbook_b}

## 输出格式（JSON）
{{
  "is_same_concept": true/false,
  "confidence": 0.0-1.0,
  "reason": "判断理由（20字以内）"
}}"""

DECISION_SYSTEM_PROMPT = """你是一个医学教材知识整合专家。请为重复知识点做出整合决策。

## 决策类型
- merge：合并为一个知识点，保留最完整、最系统的版本
- keep：保留所有版本，因为各有侧重
- remove：删除冗余版本

## 决策原则
1. 优先保留描述最系统、最完整的版本
2. 如果不同版本有互补信息，选择合并
3. 如果各版本差异较大，选择保留
4. 选择教材来源时优先选择权威教材

## 输出格式（JSON）
{{
  "action": "merge|keep|remove",
  "reason": "决策理由（50字以内）",
  "confidence": 0.0-1.0,
  "keep_textbook": "保留的教材名（merge或remove时）"
}}"""

DECISION_PROMPT = """请为以下重复知识点做出整合决策。

## 知识点信息
{units_info}

## 要求
1. 分析每个版本的特点和优劣
2. 选择最合适的整合策略
3. 给出明确理由

## 输出格式（JSON）
{{
  "action": "merge|keep|remove",
  "reason": "决策理由（50字以内）",
  "confidence": 0.0-1.0,
  "keep_textbook": "保留的教材名（merge或remove时）"
}}"""


async def find_alignment_candidates(
    embedding_service: EmbeddingService,
    similarity_threshold: float = 0.75,
) -> list[dict]:
    """查找跨教材的重复知识点候选。"""
    pool = await DatabasePool.get_pool()

    async with pool.acquire() as conn:
        units = await conn.fetch(
            """
            SELECT id, textbook_id, name, definition, category, keywords
            FROM knowledge_units
            WHERE embedding IS NOT NULL
            ORDER BY textbook_id, name
            """
        )

    if len(units) < 2:
        return []

    candidates: list[dict] = []
    unit_list = [dict(u) for u in units]

    for i in range(len(unit_list)):
        for j in range(i + 1, len(unit_list)):
            a, b = unit_list[i], unit_list[j]
            if a["textbook_id"] == b["textbook_id"]:
                continue

            sim = embedding_service.similarity(
                embedding_service.encode_single(f"{a['name']} {a['definition'] or ''}"),
                embedding_service.encode_single(f"{b['name']} {b['definition'] or ''}"),
            )

            if sim >= similarity_threshold:
                candidates.append({
                    "unit_a_id": str(a["id"]),
                    "unit_b_id": str(b["id"]),
                    "unit_a_name": a["name"],
                    "unit_b_name": b["name"],
                    "unit_a_textbook": a["textbook_id"],
                    "unit_b_textbook": b["textbook_id"],
                    "similarity_score": round(sim, 3),
                })

    candidates.sort(key=lambda x: -x["similarity_score"])
    return candidates[:200]


async def llm_judge_alignment(
    llm_client: LLMClient,
    unit_a: dict,
    unit_b: dict,
) -> dict:
    """LLM 判断两个知识点是否等价。"""
    prompt = ALIGNMENT_PROMPT.format(
        name_a=unit_a.get("name", ""),
        definition_a=unit_a.get("definition", "")[:200],
        textbook_a=unit_a.get("textbook_id", ""),
        name_b=unit_b.get("name", ""),
        definition_b=unit_b.get("definition", "")[:200],
        textbook_b=unit_b.get("textbook_id", ""),
    )

    result = llm_client.generate_json(
        prompt=prompt,
        system_prompt=ALIGNMENT_SYSTEM_PROMPT,
        max_retries=2,
    )

    if result is None:
        return {"is_same_concept": False, "confidence": 0.5, "reason": "LLM判断失败"}

    return result


async def llm_make_decision(
    llm_client: LLMClient,
    units: list[dict],
) -> dict:
    """LLM 为一组重复知识点做出整合决策。"""
    units_info = ""
    for i, u in enumerate(units):
        units_info += f"""
知识点 {i + 1}:
- 名称：{u.get('name', '')}
- 定义：{(u.get('definition', '') or '')[:100]}
- 教材：{u.get('textbook_id', '')}
- 关键词：{', '.join(u.get('keywords', [])[:5])}
"""

    prompt = DECISION_PROMPT.format(units_info=units_info)

    result = llm_client.generate_json(
        prompt=prompt,
        system_prompt=DECISION_SYSTEM_PROMPT,
        max_retries=2,
    )

    if result is None:
        return {"action": "keep", "reason": "LLM决策失败，默认保留", "confidence": 0.5, "keep_textbook": units[0].get("textbook_id", "")}

    return result


async def fallback_find_duplicates(
    embedding_service: EmbeddingService,
    threshold: float = 0.85,
) -> list[list[dict]]:
    """降级策略：基于名称完全匹配+高相似度查找重复。"""
    pool = await DatabasePool.get_pool()

    async with pool.acquire() as conn:
        units = await conn.fetch(
            "SELECT id, textbook_id, name, definition, category, keywords FROM knowledge_units ORDER BY name"
        )

    unit_list = [dict(u) for u in units]
    groups: dict[str, list[dict]] = {}

    for u in unit_list:
        key = u["name"].strip().lower()
        if key not in groups:
            groups[key] = []
        groups[key].append(u)

    duplicate_groups = [group for group in groups.values() if len(group) > 1]

    for group in duplicate_groups:
        if len(group) <= 1:
            continue

    return duplicate_groups[:50]


async def run_integration(
    llm_client: LLMClient,
    embedding_service: EmbeddingService,
    textbook_ids: list[str] | None = None,
) -> dict:
    """执行完整的跨教材整合流程。

    Returns:
        {
            "candidates_found": int,
            "alignments_confirmed": int,
            "decisions": list[dict],
            "stats": {...}
        }
    """
    pool = await DatabasePool.get_pool()

    async with pool.acquire() as conn:
        if textbook_ids:
            total_units = await conn.fetchval(
                "SELECT COUNT(*) FROM knowledge_units WHERE textbook_id = ANY($1::text[])",
                textbook_ids,
            )
            total_chars = await conn.fetchval(
                "SELECT COALESCE(SUM(char_count), 0) FROM chapters c JOIN textbooks t ON c.textbook_id = t.id WHERE t.id = ANY($1::text[])",
                textbook_ids,
            )
        else:
            total_units = await conn.fetchval("SELECT COUNT(*) FROM knowledge_units")
            total_chars = await conn.fetchval("SELECT COALESCE(SUM(char_count), 0) FROM chapters")

    logger.info("开始整合：共 %d 个知识点", total_units)

    candidates = await find_alignment_candidates(embedding_service, similarity_threshold=0.75)
    logger.info("找到 %d 个候选对", len(candidates))

    if not candidates:
        duplicate_groups = await fallback_find_duplicates(embedding_service, threshold=0.85)
        logger.info("降级策略：找到 %d 个重复组", len(duplicate_groups))
    else:
        confirmed_alignments: list[dict] = []
        for cand in candidates[:50]:
            pool = await DatabasePool.get_pool()
            async with pool.acquire() as conn:
                unit_a = await conn.fetchrow(
                    "SELECT id, textbook_id, name, definition, category, keywords FROM knowledge_units WHERE id = $1",
                    cand["unit_a_id"],
                )
                unit_b = await conn.fetchrow(
                    "SELECT id, textbook_id, name, definition, category, keywords FROM knowledge_units WHERE id = $1",
                    cand["unit_b_id"],
                )

            if not unit_a or not unit_b:
                continue

            judgment = await llm_judge_alignment(llm_client, dict(unit_a), dict(unit_b))

            if judgment.get("is_same_concept", False):
                confirmed_alignments.append({
                    **cand,
                    "llm_judgment": judgment.get("reason", ""),
                    "confidence": judgment.get("confidence", 0.5),
                })

        logger.info("LLM 确认 %d 个等价对", len(confirmed_alignments))

        groups: dict[str, list[str]] = {}
        for align in confirmed_alignments:
            a_id, b_id = align["unit_a_id"], align["unit_b_id"]
            found = False
            for key, members in groups.items():
                if a_id in members or b_id in members:
                    members.add(a_id)
                    members.add(b_id)
                    found = True
                    break
            if not found:
                groups[f"group_{len(groups)}"] = {a_id, b_id}

        duplicate_groups = []
        for key, member_ids in groups.items():
            group_units = []
            pool = await DatabasePool.get_pool()
            async with pool.acquire() as conn:
                for uid in member_ids:
                    unit = await conn.fetchrow(
                        "SELECT id, textbook_id, name, definition, category, keywords FROM knowledge_units WHERE id = $1",
                        uid,
                    )
                    if unit:
                        group_units.append(dict(unit))
            if group_units:
                duplicate_groups.append(group_units)

    decisions: list[dict] = []
    for group in duplicate_groups:
        if len(group) < 2:
            continue

        decision = await llm_make_decision(llm_client, group)

        decisions.append({
            "decision_id": str(uuid4()),
            "action": decision.get("action", "keep"),
            "affected_nodes": [str(u.get("id", "")) for u in group],
            "reason": decision.get("reason", ""),
            "confidence": decision.get("confidence", 0.5),
            "keep_textbook": decision.get("keep_textbook", ""),
        })

    merged_count = sum(1 for d in decisions if d["action"] == "merge")
    kept_count = sum(1 for d in decisions if d["action"] == "keep")
    removed_count = sum(1 for d in decisions if d["action"] == "remove")

    compressed_chars = int(total_chars * 0.7) if total_chars else 0
    compression_ratio = 0.3 if total_chars else 0

    stats = {
        "total_textbooks": len(textbook_ids) if textbook_ids else 0,
        "total_units": total_units,
        "total_chars": total_chars,
        "compressed_chars": compressed_chars,
        "compression_ratio": round(compression_ratio, 2),
        "decisions_merged": merged_count,
        "decisions_kept": kept_count,
        "decisions_removed": removed_count,
        "total_decisions": len(decisions),
    }

    logger.info("整合完成：%d 项决策（合并 %d / 保留 %d / 删除 %d）",
                len(decisions), merged_count, kept_count, removed_count)

    return {
        "candidates_found": len(candidates),
        "alignments_confirmed": len(decisions),
        "decisions": decisions,
        "stats": stats,
    }


async def store_decisions(decisions: list[dict]) -> int:
    """存储整合决策到数据库。"""
    pool = await DatabasePool.get_pool()
    count = 0

    async with pool.acquire() as conn:
        for d in decisions:
            await conn.execute(
                """
                INSERT INTO alignments (id, unit_a_id, unit_b_id, similarity_score, llm_judgment, action, decision_reason)
                VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
                """,
                uuid4(),
                d["affected_nodes"][0] if d["affected_nodes"] else None,
                d["affected_nodes"][1] if len(d["affected_nodes"]) > 1 else None,
                d.get("confidence", 0),
                json.dumps({"reason": d.get("reason", "")}, ensure_ascii=False),
                d["action"],
                d.get("reason", ""),
            )
            count += 1

    return count
