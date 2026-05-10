"""整合报告生成服务：LLM 优先 + 模板降级。"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from uuid import uuid4

import asyncpg

from api.core.database import DatabasePool
from api.core.llm_client import LLMClient

logger = logging.getLogger(__name__)

REPORT_SYSTEM_PROMPT = """你是一个医学教材整合报告撰写专家。请根据整合数据生成专业的整合报告。

## 报告结构
1. 整合概览
2. 整合决策摘要
3. 知识图谱统计
4. 重点整合案例（3-5个）
5. 教学完整性说明

## 格式要求
- 使用 Markdown 格式
- 数据要准确，与系统实际运行结果一致
- 语言专业、简洁、有条理"""

REPORT_PROMPT = """请根据以下整合数据生成完整的整合报告。

## 整合数据
{integration_data}

## 教材信息
{textbook_info}

## 决策详情（前10项）
{decisions_info}

## 要求
1. 严格按照报告结构生成
2. 数据必须准确
3. 重点整合案例要具体说明为什么这么做
4. 教学完整性说明要分析是否有知识缺口"""


def build_report_template(stats: dict, decisions: list[dict], textbook_info: list[dict]) -> str:
    """降级策略：使用模板生成报告。"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    textbook_list = "\n".join([f"- 《{t['title']}》({t['filename']})" for t in textbook_info])

    merged = [d for d in decisions if d.get("action") == "merge"]
    kept = [d for d in decisions if d.get("action") == "keep"]
    removed = [d for d in decisions if d.get("action") == "remove"]

    case_studies = ""
    for i, d in enumerate(decisions[:5]):
        case_studies += f"""
### 案例 {i + 1}
- **决策类型**：{d.get('action', '未知')}
- **涉及节点**：{', '.join(d.get('affected_nodes', [])[:3])}
- **决策理由**：{d.get('reason', '无')}
- **置信度**：{d.get('confidence', 0):.2f}
"""

    report = f"""# 学科知识整合报告

> 生成时间：{now}

---

## 1. 整合概览

| 指标 | 数值 |
|------|------|
| 原始教材数量 | {stats.get('total_textbooks', 0)} 本 |
| 原始总字数 | {stats.get('total_chars', 0):,} 字 |
| 整合后字数 | {stats.get('compressed_chars', 0):,} 字 |
| 压缩比 | {stats.get('compression_ratio', 0):.0%} |

### 教材列表
{textbook_list}

---

## 2. 整合决策摘要

| 决策类型 | 数量 |
|----------|------|
| 合并（merge） | {len(merged)} 项 |
| 保留（keep） | {len(kept)} 项 |
| 删除（remove） | {len(removed)} 项 |
| **总计** | **{len(decisions)} 项** |

---

## 3. 知识图谱统计

| 指标 | 数值 |
|------|------|
| 整合前节点数 | {stats.get('total_units', 0)} |
| 整合后节点数 | {stats.get('total_units', 0) - len(removed)} |
| 整合前关系数 | - |
| 整合后关系数 | - |

---

## 4. 重点整合案例

{case_studies if case_studies else "暂无整合案例"}

---

## 5. 教学完整性说明

### 知识缺口分析
基于当前整合决策，系统已对重复知识点进行去重处理。保留的知识点覆盖了各教材的核心内容。

### 教学逻辑链路
整合过程中优先保留了描述最系统、最完整的版本，确保教学逻辑链路不断裂。

### 建议
建议教师审查整合结果，特别关注：
1. 被删除的知识点是否包含独特内容
2. 合并后的知识点是否完整保留了原版本的关键信息
3. 是否有前置依赖关系被破坏

---

*以上内容由系统自动生成，仅供参考。如有疑问请查阅原教材。*
"""

    return report


async def generate_report_with_llm(
    llm_client: LLMClient,
    stats: dict,
    decisions: list[dict],
    textbook_info: list[dict],
) -> str:
    """LLM 生成整合报告。"""
    decisions_info = ""
    for i, d in enumerate(decisions[:10]):
        decisions_info += f"""
决策 {i + 1}:
- 类型：{d.get('action', '未知')}
- 涉及节点：{', '.join(d.get('affected_nodes', [])[:3])}
- 理由：{d.get('reason', '无')}
- 置信度：{d.get('confidence', 0):.2f}
"""

    prompt = REPORT_PROMPT.format(
        integration_data=json.dumps(stats, ensure_ascii=False, indent=2),
        textbook_info="\n".join([f"- {t['title']} ({t['filename']})" for t in textbook_info]),
        decisions_info=decisions_info,
    )

    result = llm_client.generate(
        prompt=prompt,
        system_prompt=REPORT_SYSTEM_PROMPT,
        temperature=0.3,
        max_tokens=4000,
    )

    return result


async def create_report(
    llm_client: LLMClient,
    stats: dict,
    decisions: list[dict],
    textbook_ids: list[str] | None = None,
) -> dict:
    """创建整合报告。LLM 优先，模板降级。"""
    pool = await DatabasePool.get_pool()

    async with pool.acquire() as conn:
        if textbook_ids:
            textbook_rows = await conn.fetch(
                "SELECT id, filename, title FROM textbooks WHERE id = ANY($1::text[])",
                textbook_ids,
            )
        else:
            textbook_rows = await conn.fetch("SELECT id, filename, title FROM textbooks")

    textbook_info = [dict(r) for r in textbook_rows]

    try:
        content = await generate_report_with_llm(llm_client, stats, decisions, textbook_info)
        logger.info("LLM 生成报告成功")
    except Exception as e:
        logger.warning("LLM 生成报告失败，使用模板降级: %s", e)
        content = build_report_template(stats, decisions, textbook_info)

    report_id = str(uuid4())

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO reports (id, title, content, format, stats, textbook_ids)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6)
            """,
            report_id,
            f"整合报告 - {datetime.now().strftime('%Y-%m-%d')}",
            content,
            "markdown",
            json.dumps(stats, ensure_ascii=False),
            textbook_ids or [],
        )

    return {
        "id": report_id,
        "title": f"整合报告 - {datetime.now().strftime('%Y-%m-%d')}",
        "content": content,
        "stats": stats,
    }


async def get_report(report_id: str) -> dict | None:
    """获取报告。"""
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, title, content, format, stats, textbook_ids, created_at, updated_at FROM reports WHERE id = $1",
            report_id,
        )
    if not row:
        return None
    return dict(row)


async def list_reports() -> list[dict]:
    """获取报告列表。"""
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, title, format, stats, created_at FROM reports ORDER BY created_at DESC"
        )
    return [dict(r) for r in rows]


async def update_report(report_id: str, title: str | None = None, content: str | None = None) -> dict | None:
    """更新报告。"""
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        if title and content:
            await conn.execute(
                "UPDATE reports SET title = $2, content = $3, updated_at = now() WHERE id = $1",
                report_id, title, content,
            )
        elif title:
            await conn.execute(
                "UPDATE reports SET title = $2, updated_at = now() WHERE id = $1",
                report_id, title,
            )
        elif content:
            await conn.execute(
                "UPDATE reports SET content = $2, updated_at = now() WHERE id = $1",
                report_id, content,
            )
        else:
            return None

    return await get_report(report_id)


async def delete_report(report_id: str) -> bool:
    """删除报告。"""
    pool = await DatabasePool.get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM reports WHERE id = $1", report_id)
    return result == "DELETE 1"
