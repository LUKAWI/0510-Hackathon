"""Chat message and conversation Pydantic schemas."""

from datetime import datetime
from typing import ClassVar, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


class ChatMessage(BaseModel):
    """A single message in a conversation."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    id: UUID = Field(default_factory=uuid4, description="Unique message identifier")
    session_id: UUID = Field(..., description="Conversation session ID")
    role: Literal["user", "assistant", "system"] = Field(
        ..., description="Message sender role"
    )
    content: str = Field(..., min_length=1, description="Message content")
    timestamp: datetime = Field(default_factory=datetime.now, description="Message timestamp")
    metadata: dict[str, str] = Field(
        default_factory=dict, description="Additional metadata (e.g. model used, token count)"
    )


class ConversationHistory(BaseModel):
    """Full conversation history for a session."""

    model_config: ClassVar[ConfigDict] = ConfigDict(from_attributes=True)

    session_id: UUID = Field(..., description="Conversation session ID")
    messages: list[ChatMessage] = Field(
        default_factory=list, description="Ordered list of messages"
    )
