"""知识图谱专项测试。

测试 extract_knowledge_units, store_knowledge_units, validate_knowledge_unit, 以及图谱 API 端点。
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))
from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

os.environ.setdefault("DASHSCOPE_API_KEY", "sk-test-graph")

from api.core.llm_client import LLMClient
from api.services.extract_service import (
    extract_knowledge_units,
    validate_knowledge_unit,
    merge_small_units,
)
from api.services.graph_service import store_knowledge_units

# ═══════════════════════════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════════════════════════


def _make_unit(
    name: str = "细胞膜结构",
    definition: str = "细胞膜是由磷脂双分子层和蛋白质组成的半透性生物膜",
    category: str = "结构",
    content: str | None = None,
    keywords: list[str] | None = None,
) -> dict:
    return {
        "name": name,
        "definition": definition,
        "category": category,
        "content": (
            content
            if content is not None
            else "这是关于%s的详细内容，涵盖了其基本概念、主要特征"
                 "以及在生物学中的重要意义。该知识点在教材中占据核心地位，"
                 "学习者需要掌握其定义、分类和实际应用。" % name
        ),
        "keywords": keywords if keywords is not None else ["关键词A", "关键词B", "关键词C"],
    }


def _make_relationship(
    source_name: str = "细胞膜结构",
    target_name: str = "物质跨膜运输",
    relation_type: str = "prerequisite",
    description: str = "结构决定功能",
) -> dict:
    return {
        "source_name": source_name,
        "target_name": target_name,
        "relation_type": relation_type,
        "description": description,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 1. extract_knowledge_units 返回结构测试
# ═══════════════════════════════════════════════════════════════════════════════


class TestExtractKnowledgeUnits:
    """测试 extract_knowledge_units 返回结构。"""

    def test_returns_expected_structure(self):
        """Mock LLMClient 后验证返回 {'knowledge_units': [...], 'relationships': [...]}。"""
        mock_llm = MagicMock(spec=LLMClient)
        mock_llm.generate_json.return_value = {
            "knowledge_units": [
                _make_unit("细胞膜结构", category="结构"),
                _make_unit("物质跨膜运输", category="过程"),
                _make_unit("被动运输", category="原理"),
            ],
            "relationships": [
                _make_relationship("细胞膜结构", "物质跨膜运输", "prerequisite"),
                _make_relationship("物质跨膜运输", "被动运输", "contains"),
            ],
        }

        result = extract_knowledge_units(
            llm_client=mock_llm,
            textbook_name="细胞生物学",
            chapter_title="细胞膜与跨膜运输",
            chapter_content="细胞膜是细胞的边界...(模拟内容)",
        )

        assert isinstance(result, dict)
        assert "knowledge_units" in result
        assert "relationships" in result
        assert isinstance(result["knowledge_units"], list)
        assert isinstance(result["relationships"], list)

    def test_each_unit_has_required_fields(self):
        """每个知识单元必须包含 id, name, definition, category, content, keywords。"""
        mock_llm = MagicMock(spec=LLMClient)
        mock_llm.generate_json.return_value = {
            "knowledge_units": [
                _make_unit("线粒体", category="结构"),
                _make_unit("氧化磷酸化", category="过程"),
            ],
            "relationships": [],
        }

        result = extract_knowledge_units(
            llm_client=mock_llm,
            textbook_name="生物化学",
            chapter_title="生物氧化",
            chapter_content="线粒体是细胞的能量工厂...(模拟内容)",
        )

        required_fields = {"id", "name", "definition", "category", "content", "keywords"}
        for unit in result["knowledge_units"]:
            missing = required_fields - set(unit.keys())
            assert not missing, f"缺失字段: {missing}"

    def test_generated_ids_are_unique(self):
        """每个知识单元的 id 应唯一。"""
        mock_llm = MagicMock(spec=LLMClient)
        mock_llm.generate_json.return_value = {
            "knowledge_units": [
                _make_unit("神经元", category="结构"),
                _make_unit("动作电位", category="现象"),
                _make_unit("突触传递", category="过程"),
            ],
            "relationships": [],
        }

        result = extract_knowledge_units(
            llm_client=mock_llm,
            textbook_name="神经生物学",
            chapter_title="神经元与信号传导",
            chapter_content="神经元是神经系统的基本单位...(模拟内容)",
        )

        ids = [u["id"] for u in result["knowledge_units"]]
        assert len(ids) == len(set(ids)), f"ID 重复: {ids}"

    def test_empty_llm_result_returns_empty_lists(self):
        """LLM 返回 None 时，返回空列表。"""
        mock_llm = MagicMock(spec=LLMClient)
        mock_llm.generate_json.return_value = None

        result = extract_knowledge_units(
            llm_client=mock_llm,
            textbook_name="测试教材",
            chapter_title="测试章节",
            chapter_content="测试内容",
        )

        assert result == {"knowledge_units": [], "relationships": []}

    def test_relationships_preserved_in_output(self):
        """关系数据应原样保留在输出中。"""
        rel = _make_relationship("A", "B", "prerequisite", "A 是 B 的前提")
        mock_llm = MagicMock(spec=LLMClient)
        mock_llm.generate_json.return_value = {
            "knowledge_units": [
                _make_unit("A"),
                _make_unit("B"),
            ],
            "relationships": [rel],
        }

        result = extract_knowledge_units(
            llm_client=mock_llm,
            textbook_name="测试",
            chapter_title="测试",
            chapter_content="测试",
        )

        assert result["relationships"] == [rel]


# ═══════════════════════════════════════════════════════════════════════════════
# 2. store_knowledge_units 逻辑测试
# ═══════════════════════════════════════════════════════════════════════════════


class TestStoreKnowledgeUnitsLogic:
    """测试 store_knowledge_units 的参数校验和 ID 生成逻辑。"""

    @pytest.mark.asyncio
    async def test_generates_ids_when_not_provided(self):
        """未提供 id 时，应为每个 unit 生成唯一 UUID。"""
        units = [
            _make_unit("概念A"),
            _make_unit("概念B"),
        ]

        with patch("api.services.graph_service.DatabasePool") as mock_pool:
            mock_conn = AsyncMock()
            mock_pool.get_pool = AsyncMock()
            mock_pool.get_pool.return_value = mock_pool
            mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_pool.acquire.return_value.__aexit__ = AsyncMock()
            mock_conn.execute = AsyncMock()

            ids = await store_knowledge_units(
                units=units,
                textbook_id="test-textbook-id",
                chapter_id="test-chapter-id",
            )

        assert len(ids) == 2
        assert ids[0] != ids[1]
        for uid in ids:
            assert isinstance(uid, str)
            assert len(uid) > 0

    @pytest.mark.asyncio
    async def test_uses_provided_ids(self):
        """已提供 id 时，使用提供的 id。"""
        preset_id = "my-custom-id-12345"
        units = [
            {**_make_unit("概念X"), "id": preset_id},
        ]

        with patch("api.services.graph_service.DatabasePool") as mock_pool:
            mock_conn = AsyncMock()
            mock_pool.get_pool = AsyncMock()
            mock_pool.get_pool.return_value = mock_pool
            mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_pool.acquire.return_value.__aexit__ = AsyncMock()
            mock_conn.execute = AsyncMock()

            ids = await store_knowledge_units(
                units=units,
                textbook_id="test-textbook-id",
            )

        assert ids == [preset_id]

    @pytest.mark.asyncio
    async def test_empty_units_returns_empty_list(self):
        """空 units 列表应返回空列表。"""
        with patch("api.services.graph_service.DatabasePool") as mock_pool:
            mock_conn = AsyncMock()
            mock_pool.get_pool = AsyncMock()
            mock_pool.get_pool.return_value = mock_pool
            mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_pool.acquire.return_value.__aexit__ = AsyncMock()
            mock_conn.execute = AsyncMock()

            ids = await store_knowledge_units(
                units=[],
                textbook_id="test-textbook-id",
            )

        assert ids == []

    @pytest.mark.asyncio
    async def test_execute_called_with_correct_params(self):
        """验证 conn.execute 被调用且收到了 textbook_id 参数。"""
        unit = _make_unit("测试概念", definition="这是一个测试", category="概念")
        unit["id"] = "unit-id-abc"

        with patch("api.services.graph_service.DatabasePool") as mock_pool:
            mock_conn = AsyncMock()
            mock_pool.get_pool = AsyncMock()
            mock_pool.get_pool.return_value = mock_pool
            mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_pool.acquire.return_value.__aexit__ = AsyncMock()
            mock_conn.execute = AsyncMock()

            await store_knowledge_units(
                units=[unit],
                textbook_id="textbook-001",
                chapter_id="chapter-001",
            )

        mock_conn.execute.assert_called_once()
        args = mock_conn.execute.call_args[0]
        assert args[2] == "textbook-001"
        assert args[3] == "chapter-001"

    @pytest.mark.asyncio
    async def test_chapter_id_none_is_accepted(self):
        """chapter_id 为 None 时也能正常执行。"""
        unit = _make_unit("无章节概念")

        with patch("api.services.graph_service.DatabasePool") as mock_pool:
            mock_conn = AsyncMock()
            mock_pool.get_pool = AsyncMock()
            mock_pool.get_pool.return_value = mock_pool
            mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_pool.acquire.return_value.__aexit__ = AsyncMock()
            mock_conn.execute = AsyncMock()

            ids = await store_knowledge_units(
                units=[unit],
                textbook_id="textbook-002",
                chapter_id=None,
            )

        assert len(ids) == 1
        assert ids[0] is not None


# ═══════════════════════════════════════════════════════════════════════════════
# 3. 图谱 API 端点测试（需要后端运行）
# ═══════════════════════════════════════════════════════════════════════════════

needs_backend = pytest.mark.skipif(
    os.environ.get("DATABASE_URL", "").startswith("postgresql://user:pass@localhost"),
    reason="需要配置真实 DATABASE_URL 并启动后端服务",
)


@pytest.mark.skip(reason="需要运行中的后端服务和数据库")
class TestGraphAPIEndpoints:
    """测试图谱 API 端点。使用 httpx.AsyncClient 发送请求。"""

    @pytest.mark.asyncio
    async def test_get_merged_graph_returns_200(self):
        """GET /api/graph/merged/all 返回 200 且包含 nodes 和 edges。"""
        import httpx
        from api.main import app

        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/graph/merged/all")

        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        assert isinstance(data["nodes"], list)
        assert isinstance(data["edges"], list)

    @pytest.mark.asyncio
    async def test_search_nodes_returns_200(self):
        """GET /api/graph/search/test 返回 200。"""
        import httpx
        from api.main import app

        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/graph/search/test")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:
            item = data[0]
            assert "id" in item
            assert "name" in item

    @pytest.mark.asyncio
    async def test_get_nonexistent_node_returns_404(self):
        """GET /api/graph/node/nonexistent 返回 404。"""
        import httpx
        from api.main import app

        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/graph/node/nonexistent-id-that-does-not-exist")

        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════════
# 4. validate_knowledge_unit 测试
# ═══════════════════════════════════════════════════════════════════════════════


class TestValidateKnowledgeUnit:
    """测试 validate_knowledge_unit 校验逻辑。"""

    def test_valid_unit_passes(self):
        """正常的知识单元通过校验。"""
        unit = _make_unit(
            name="DNA 复制",
            definition="DNA 复制是指以亲代 DNA 为模板合成子代 DNA 的过程",
            category="过程",
            content="DNA 复制是生物遗传信息传递的核心过程。在细胞分裂前，"
                    "DNA 双链解旋，在 DNA 聚合酶的作用下，以每条单链为模板，"
                    "按照碱基互补配对原则合成新的互补链。最终形成两个与亲代"
                    "完全相同的 DNA 分子。",
            keywords=["DNA复制", "半保留复制", "DNA聚合酶"],
        )
        ok, msg = validate_knowledge_unit(unit)
        assert ok is True
        assert msg == "OK"

    def test_content_too_short_fails(self):
        """内容过短（< 50 字符）不通过校验。"""
        unit = _make_unit(
            content="太短了",
        )
        ok, msg = validate_knowledge_unit(unit)
        assert ok is False
        assert "过短" in msg

    def test_content_too_long_fails(self):
        """内容过长（> 1500 字符）不通过校验。"""
        unit = _make_unit(
            content="长" * 1501,
        )
        ok, msg = validate_knowledge_unit(unit)
        assert ok is False
        assert "过长" in msg

    def test_definition_too_short_fails(self):
        """定义过短（< 5 字符）不通过校验。"""
        unit = _make_unit(
            definition="短",
            content="这是关于短定义知识单元的详细内容。" * 10,
        )
        ok, msg = validate_knowledge_unit(unit)
        assert ok is False
        assert "定义" in msg

    def test_empty_definition_fails(self):
        """空定义不通过校验。"""
        unit = _make_unit(
            definition="",
            content="这是关于空定义知识单元的详细内容。" * 10,
        )
        ok, msg = validate_knowledge_unit(unit)
        assert ok is False
        assert "定义" in msg

    def test_missing_keywords_fails(self):
        """缺少关键词不通过校验。"""
        unit = _make_unit(
            keywords=[],
            content="这是缺少关键词知识单元的详细内容描述。" * 10,
        )
        ok, msg = validate_knowledge_unit(unit)
        assert ok is False
        assert "关键词" in msg

    def test_none_keywords_fails(self):
        """关键词为 None 不通过校验。"""
        unit = _make_unit(
            content="这是关键词为 None 的知识单元详细内容描述。" * 10,
        )
        del unit["keywords"]
        ok, msg = validate_knowledge_unit(unit)
        assert ok is False
        assert "关键词" in msg

    def test_boundary_content_length_50_passes(self):
        """内容正好 50 字符时通过校验（边界值）。"""
        unit = _make_unit(content="A" * 50)
        ok, msg = validate_knowledge_unit(unit)
        assert ok is True

    def test_boundary_content_length_1500_passes(self):
        """内容正好 1500 字符时通过校验（边界值）。"""
        unit = _make_unit(content="B" * 1500)
        ok, msg = validate_knowledge_unit(unit)
        assert ok is True

    def test_boundary_definition_length_5_passes(self):
        """定义正好 5 字符时通过校验（边界值）。"""
        unit = _make_unit(
            definition="ABCDE",
            content="A" * 60,
        )
        ok, msg = validate_knowledge_unit(unit)
        assert ok is True


# ═══════════════════════════════════════════════════════════════════════════════
# 5. merge_small_units 测试
# ═══════════════════════════════════════════════════════════════════════════════


class TestMergeSmallUnits:
    """测试 merge_small_units 合并逻辑。"""

    def test_empty_list_returns_empty(self):
        result = merge_small_units([])
        assert result == []

    def test_single_unit_returned_as_is(self):
        unit = _make_unit("概念A", content="短内容")
        result = merge_small_units([unit])
        assert len(result) == 1
        assert result[0]["name"] == "概念A"

    def test_small_units_are_merged(self):
        units = [
            _make_unit("A", content="短" * 20, keywords=["k1"]),
            _make_unit("B", content="短" * 30, keywords=["k2"]),
        ]
        result = merge_small_units(units, min_size=200)
        assert len(result) == 1
        assert len(result[0]["keywords"]) >= 2

    def test_keywords_deduplicated_after_merge(self):
        units = [
            _make_unit("A", content="X" * 20, keywords=["k1", "k2"]),
            _make_unit("B", content="Y" * 20, keywords=["k2", "k3"]),
        ]
        result = merge_small_units(units, min_size=200)
        assert len(result) == 1
        assert set(result[0]["keywords"]) == {"k1", "k2", "k3"}
