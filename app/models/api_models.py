"""Request and response models for the API."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""

    conversation_id: str = Field(..., description="UUID of conversation")
    message: str = Field(..., description="User message")
    include_tools: bool = Field(default=True, description="Include Claude functions")


class MessageResponse(BaseModel):
    """Response model for a message."""

    id: str = Field(..., description="Message UUID")
    role: str = Field(..., description="Message role (user|assistant)")
    content: str = Field(..., description="Message content")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(default=None, description="Tool calls made")
    cost: float = Field(default=0.0, description="API cost for this message")
    tokens: Dict[str, int] = Field(default_factory=dict, description="Token counts")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")


class ConversationResponse(BaseModel):
    """Response model for a conversation."""

    id: str = Field(..., description="Conversation UUID")
    title: str = Field(..., description="Conversation title")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    message_count: int = Field(..., description="Number of messages")
    daily_cost: float = Field(default=0.0, description="Daily API cost")
    messages: Optional[List[MessageResponse]] = Field(default=None, description="Messages in conversation")


class ConversationCreateRequest(BaseModel):
    """Request model to create a new conversation."""

    title: Optional[str] = Field(default=None, description="Optional conversation title")


class StatusResponse(BaseModel):
    """Response model for status endpoint."""

    status: str = Field(..., description="Overall status")
    backend: str = Field(..., description="Backend status")
    ha_connected: bool = Field(..., description="HA connection status")
    claude_available: bool = Field(..., description="Claude API availability")
    uptime_seconds: float = Field(..., description="Uptime in seconds")
    database: str = Field(..., description="Database status")


class CostResponse(BaseModel):
    """Response model for daily cost."""

    daily_cost: float = Field(..., description="Total cost today (UTC)")
    calls_today: int = Field(..., description="API calls today")
    estimated_tokens: int = Field(..., description="Estimated tokens used")
    alert_threshold: float = Field(..., description="Alert threshold in USD")
    over_threshold: bool = Field(..., description="Cost exceeds threshold")


class EntityResponse(BaseModel):
    """Response model for entity information."""

    entity_id: str = Field(..., description="Entity ID")
    state: str = Field(..., description="Current state")
    domain: str = Field(..., description="Entity domain")
    friendly_name: Optional[str] = Field(default=None, description="User-friendly name")
    area: Optional[str] = Field(default=None, description="Area assignment")
    integration: Optional[str] = Field(default=None, description="Integration domain")
    last_updated: Optional[datetime] = Field(default=None, description="Last state change")
    attributes: Optional[Dict[str, Any]] = Field(default=None, description="Entity attributes")


class ConfigResponse(BaseModel):
    """Response model for configuration."""

    debug: bool = Field(..., description="Debug mode enabled")
    alert_threshold_usd: float = Field(..., description="Cost alert threshold")
    ha_connected: bool = Field(..., description="HA connection status")


class ConfigUpdateRequest(BaseModel):
    """Request model to update configuration."""

    alert_threshold_usd: Optional[float] = Field(default=None, description="New alert threshold")


class ErrorResponse(BaseModel):
    """Response model for errors."""

    error: str = Field(..., description="Error message")
    code: Optional[str] = Field(default=None, description="Error code")
    detail: Optional[str] = Field(default=None, description="Detailed error description")
    recoverable: bool = Field(default=False, description="Whether error is recoverable")
