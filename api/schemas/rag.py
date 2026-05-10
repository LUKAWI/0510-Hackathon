"""RAG query and response Pydantic schemas."""

from typing import ClassVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RAGQuery(BaseModel):
    """Input query for the RAG question-answering pipeline."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    question: str = Field(..., min_length=1, max_length=2000, description="User question")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of chunks to retrieve")
    session_id: UUID | None = Field(default=None, description="Optional session for context")


class Citation(BaseModel):
    """A citation referencing a specific textbook passage."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    textbook: str = Field(..., min_length=1, description="Source textbook title")
    chapter: str | None = Field(default=None, description="Source chapter title")
    page: int | None = Field(default=None, ge=1, description="Source page number")
    relevance_score: float = Field(
        ..., ge=0.0, le=1.0, description="Relevance score to the query"
    )
    snippet: str = Field(..., min_length=1, description="Relevant text snippet from source")


class SourceChunk(BaseModel):
    """A raw retrieved text chunk used to generate the answer."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    chunk_id: str = Field(..., min_length=1, description="Chunk identifier")
    textbook: str = Field(..., min_length=1, description="Source textbook title")
    chapter: str | None = Field(default=None, description="Source chapter title")
    content: str = Field(..., min_length=1, description="Chunk text content")
    score: float = Field(..., ge=0.0, le=1.0, description="Vector similarity score")


class RAGResponse(BaseModel):
    """Output from the RAG question-answering pipeline."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    answer: str = Field(..., min_length=1, description="Generated answer text")
    citations: list[Citation] = Field(
        default_factory=list, description="Citations supporting the answer"
    )
    source_chunks: list[SourceChunk] = Field(
        default_factory=list, description="Retrieved source chunks"
    )
