"""Knowledge graph visualization Pydantic schemas."""

from typing import ClassVar

from pydantic import BaseModel, ConfigDict, Field


class GraphNode(BaseModel):
    """A node in the knowledge graph visualization."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: str = Field(..., min_length=1, description="Node identifier")
    label: str = Field(..., min_length=1, description="Display label for the node")
    type: str = Field(..., min_length=1, description="Node type (e.g. concept, chapter)")
    properties: dict[str, str] = Field(
        default_factory=dict, description="Additional display properties"
    )


class GraphEdge(BaseModel):
    """An edge in the knowledge graph visualization."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    source: str = Field(..., min_length=1, description="Source node ID")
    target: str = Field(..., min_length=1, description="Target node ID")
    relation: str = Field(..., min_length=1, description="Relationship label")
    properties: dict[str, str] = Field(
        default_factory=dict, description="Additional display properties"
    )


class GraphData(BaseModel):
    """Complete graph data for frontend visualization."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    nodes: list[GraphNode] = Field(default_factory=list, description="Graph nodes")
    edges: list[GraphEdge] = Field(default_factory=list, description="Graph edges")
