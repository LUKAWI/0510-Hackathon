"""知识提取服务：从章节内容中提取知识单元和关系。"""

from __future__ import annotations

import logging
from uuid import uuid4

from api.core.llm_client import LLMClient

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """你是一个医学教材知识提取专家。请从教材文本中提取知识单元和它们之间的关系。

## 输出要求
1. 每个知识单元是一个独立的、可被定义的概念/原理/方法/现象
2. 每个知识单元有且仅有一个核心主题
3. 如果一段文字包含多个主题，请拆分为多个知识单元
4. 识别知识单元之间的关系（前置依赖、并列、包含、应用）"""

EXTRACTION_PROMPT = """请从以下教材章节中提取知识单元。

## 章节信息
教材：{textbook_name}
章节：{chapter_title}

## 章节内容
{chapter_content}

## 输出格式（JSON）
{{
  "knowledge_units": [
    {{
      "name": "知识单元名称（5-15字）",
      "definition": "一句话定义（30-80字）",
      "category": "概念|原理|方法|现象|结构|过程",
      "content": "该知识单元的完整内容（200-800字）",
      "keywords": ["关键词1", "关键词2", "关键词3"]
    }}
  ],
  "relationships": [
    {{
      "source_name": "源知识单元名称",
      "target_name": "目标知识单元名称",
      "relation_type": "prerequisite|parallel|contains|applies_to",
      "description": "关系描述（20字以内）"
    }}
  ]
}}

注意：
- 知识单元数量根据内容复杂度决定，通常 3-8 个
- 关系只提取明确的、重要的关系
- 所有内容必须来自原文，不要编造"""


def extract_knowledge_units(
    llm_client: LLMClient,
    textbook_name: str,
    chapter_title: str,
    chapter_content: str,
) -> dict:
    """从章节内容提取知识单元和关系。

    Returns:
        {"knowledge_units": [...], "relationships": [...]}
    """
    prompt = EXTRACTION_PROMPT.format(
        textbook_name=textbook_name,
        chapter_title=chapter_title,
        chapter_content=chapter_content[:3000],
    )

    result = llm_client.generate_json(
        prompt=prompt,
        system_prompt=EXTRACTION_SYSTEM_PROMPT,
        max_retries=3,
    )

    if result is None:
        logger.error("知识提取失败: %s - %s", textbook_name, chapter_title)
        return {"knowledge_units": [], "relationships": []}

    units = result.get("knowledge_units", [])
    relationships = result.get("relationships", [])

    for unit in units:
        unit["id"] = str(uuid4())

    logger.info(
        "提取完成: %s - %s, %d 个知识单元, %d 个关系",
        textbook_name, chapter_title, len(units), len(relationships),
    )

    return {"knowledge_units": units, "relationships": relationships}


def validate_knowledge_unit(unit: dict) -> tuple[bool, str]:
    """校验知识单元粒度是否合理。"""
    content = unit.get("content", "")

    if len(content) < 50:
        return False, "内容过短，可能是片段而非独立知识单元"
    if len(content) > 1500:
        return False, "内容过长，可能包含多个知识点"
    if len(unit.get("definition", "")) < 5:
        return False, "定义过于简短"
    if not unit.get("keywords"):
        return False, "缺少关键词"

    return True, "OK"


def merge_small_units(units: list[dict], min_size: int = 100) -> list[dict]:
    """合并过小的知识单元。"""
    if not units:
        return []

    merged: list[dict] = []
    buffer: dict | None = None

    for unit in units:
        if buffer is None:
            buffer = unit.copy()
        elif len(buffer.get("content", "")) < min_size:
            buffer["content"] += "\n" + unit.get("content", "")
            buffer["keywords"] = list(set(
                buffer.get("keywords", []) + unit.get("keywords", [])
            ))
        else:
            merged.append(buffer)
            buffer = unit.copy()

    if buffer:
        merged.append(buffer)

    return merged
