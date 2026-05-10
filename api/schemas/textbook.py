"""Textbook and Chapter Pydantic schemas."""

from datetime import datetime
from typing import ClassVar, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class Textbook(BaseModel):
    """Represents an uploaded textbook document."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4, description="Unique textbook identifier")
    filename: str = Field(..., min_length=1, max_length=255, description="Original filename")
    title: str = Field(..., min_length=1, max_length=500, description="Textbook title")
    total_chars: int = Field(default=0, ge=0, description="Total character count")
    total_pages: int = Field(default=0, ge=0, description="Total page count")
    status: Literal["uploading", "parsing", "indexing", "ready", "failed"] = Field(
        default="uploading", description="Processing status"
    )
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")


class Chapter(BaseModel):
    """Represents a chapter within a textbook."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4, description="Unique chapter identifier")
    textbook_id: UUID = Field(..., description="Parent textbook ID")
    title: str = Field(..., min_length=1, max_length=500, description="Chapter title")
    page_start: int = Field(..., ge=1, description="Starting page number")
    page_end: int = Field(..., ge=1, description="Ending page number")
    content: str = Field(default="", description="Full chapter text content")
    char_count: int = Field(default=0, ge=0, description="Character count of content")
