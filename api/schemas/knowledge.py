"""Knowledge unit and edge Pydantic schemas."""

from datetime import datetime
from typing import ClassVar, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class KnowledgeUnit(BaseModel):
    """Represents an extracted knowledge concept/unit from a textbook."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4, description="Unique knowledge unit identifier")
    textbook_id: UUID = Field(..., description="Source textbook ID")
    chapter_id: UUID = Field(..., description="Source chapter ID")
    name: str = Field(..., min_length=1, max_length=200, description="Concept name")
    definition: str = Field(default="", description="Concept definition or description")
    category: Literal["概念", "原理", "方法", "现象", "结构", "过程"] = Field(
        ..., description="Knowledge category"
    )
    content: str = Field(default="", description="Detailed content of the knowledge unit")
    keywords: list[str] = Field(default_factory=list, description="Associated keywords")
    importance_score: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Importance score between 0 and 1"
    )
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")


class KnowledgeEdge(BaseModel):
    """Represents a relationship between two knowledge units."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4, description="Unique edge identifier")
    source_id: UUID = Field(..., description="Source knowledge unit ID")
    target_id: UUID = Field(..., description="Target knowledge unit ID")
    relation_type: Literal["prerequisite", "parallel", "contains", "applies_to"] = Field(
        ..., description="Type of relationship"
    )
    description: str = Field(default="", description="Human-readable description of the relation")
    confidence: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Confidence score between 0 and 1"
    )
