"""Background processing task Pydantic schemas."""

from datetime import datetime
from typing import ClassVar, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class ProcessingTask(BaseModel):
    """Represents a background processing task (document parsing, graph building, etc.)."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4, description="Unique task identifier")
    task_type: Literal["upload", "parse", "embed", "graph_build", "alignment", "rag_query"] = (
        Field(..., description="Type of processing task")
    )
    status: Literal["pending", "processing", "completed", "failed"] = Field(
        default="pending", description="Current task status"
    )
    progress: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Progress percentage (0.0 to 1.0)"
    )
    message: str = Field(default="", description="Human-readable status message")
    result_data: dict[str, str] | None = Field(
        default=None, description="Task result payload as key-value pairs"
    )
    created_at: datetime = Field(default_factory=datetime.now, description="Task creation time")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update time")
