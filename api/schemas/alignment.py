"""Knowledge alignment and integration Pydantic schemas."""

from typing import ClassVar, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class AlignmentCandidate(BaseModel):
    """A candidate pair of knowledge units that may represent the same concept."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    unit_a_id: UUID = Field(..., description="First knowledge unit ID")
    unit_b_id: UUID = Field(..., description="Second knowledge unit ID")
    similarity_score: float = Field(
        ..., ge=0.0, le=1.0, description="Embedding similarity score"
    )
    llm_judgment: str | None = Field(
        default=None, description="LLM assessment of whether units are semantically equivalent"
    )


class IntegrationDecision(BaseModel):
    """A decision on how to handle aligned knowledge units."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    decision_id: UUID = Field(default_factory=uuid4, description="Unique decision identifier")
    action: Literal["merge", "keep", "remove"] = Field(
        ..., description="Integration action to take"
    )
    affected_nodes: list[UUID] = Field(
        ..., min_length=1, description="Knowledge unit IDs affected by this decision"
    )
    result_node: UUID | None = Field(
        default=None, description="ID of the resulting merged node (if action is merge)"
    )
    reason: str = Field(default="", description="Explanation for the decision")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence in this decision"
    )
