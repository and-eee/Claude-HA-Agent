"""REST API routes."""
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import date

from app.models.api_models import (
    ChatRequest,
    MessageResponse,
    ConversationResponse,
    ConversationCreateRequest,
    StatusResponse,
    CostResponse,
    ConfigResponse,
    ConfigUpdateRequest,
    ErrorResponse,
)
from app.config import config

logger = logging.getLogger(__name__)

# These will be injected by main.py
_services = {}


def set_services(services):
    """Set service instances (called from main.py)."""
    global _services
    _services = services


def get_services():
    """Get service instances."""
    return _services


router = APIRouter(prefix="/api")


# Chat endpoint
@router.post("/chat", response_model=MessageResponse)
async def chat(request: ChatRequest):
    """Send a message to Claude and get response."""
    try:
        services = get_services()

        if not services:
            raise HTTPException(status_code=503, detail="Services not initialized")

        ha_client = services.get("ha_client")
        claude_service = services.get("claude_service")
        conversation_service = services.get("conversation_service")
        tool_executor = services.get("tool_executor")

        if not all([ha_client, claude_service, conversation_service, tool_executor]):
            raise HTTPException(status_code=503, detail="Services not fully initialized")

        # Get conversation history
        history = conversation_service.get_conversation_history(request.conversation_id)

        # Add user message
        conversation_service.add_user_message(request.conversation_id, request.message)

        # Build HA context
        entity_status = {"total": 287, "unavailable": 18, "unknown": 1}  # TODO: Get from ha_client
        system_info = {"version": "2024.11.1", "uptime_readable": "45 days"}  # TODO: Get from ha_client
        ha_context = conversation_service.build_ha_context(
            system_info, entity_status, []
        )

        # Get available functions
        from app.tools.tool_definitions import get_all_tool_definitions

        available_functions = get_all_tool_definitions()

        # Send to Claude
        claude_response = await claude_service.chat(
            user_message=request.message,
            conversation_history=history,
            functions=available_functions if request.include_tools else None,
            ha_context=ha_context,
        )

        # Handle tool calls if present
        if claude_response.get("tool_calls"):
            tool_results = await tool_executor.execute_tools_parallel(
                claude_response["tool_calls"]
            )

            # Process results and get final response
            final_response = await claude_service.process_tool_results(
                conversation_history=history,
                assistant_message=claude_response["content"],
                tool_calls=claude_response["tool_calls"],
                tool_results=tool_results,
                functions=available_functions,
                ha_context=ha_context,
            )

            # Use final response content
            response_content = final_response.get("content", "")
            tokens_input = final_response.get("tokens_input", 0)
            tokens_output = final_response.get("tokens_output", 0)
        else:
            response_content = claude_response.get("content", "")
            tokens_input = claude_response.get("tokens_input", 0)
            tokens_output = claude_response.get("tokens_output", 0)

        # Calculate cost
        cost = conversation_service.calculate_message_cost(tokens_input, tokens_output)

        # Add assistant message to conversation
        response_msg = conversation_service.add_assistant_message(
            conversation_id=request.conversation_id,
            content=response_content,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            cost=cost,
            tool_calls=claude_response.get("tool_calls"),
        )

        return response_msg

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Conversation endpoints
@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations():
    """List all conversations."""
    try:
        services = get_services()
        conversation_service = services.get("conversation_service")

        if not conversation_service:
            raise HTTPException(status_code=503, detail="Services not initialized")

        conversations = conversation_service.list_all_conversations()
        return conversations

    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(request: ConversationCreateRequest):
    """Create a new conversation."""
    try:
        services = get_services()
        conversation_service = services.get("conversation_service")

        if not conversation_service:
            raise HTTPException(status_code=503, detail="Services not initialized")

        conversation_id = conversation_service.create_conversation(request.title)
        conv = conversation_service.get_conversation_details(conversation_id)

        return conv

    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str):
    """Get a specific conversation with full history."""
    try:
        services = get_services()
        conversation_service = services.get("conversation_service")

        if not conversation_service:
            raise HTTPException(status_code=503, detail="Services not initialized")

        conv = conversation_service.get_conversation_details(conversation_id)

        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return conv

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation."""
    try:
        services = get_services()
        conversation_service = services.get("conversation_service")

        if not conversation_service:
            raise HTTPException(status_code=503, detail="Services not initialized")

        success = conversation_service.delete_conversation(conversation_id)

        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return {"status": "deleted", "conversation_id": conversation_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Status endpoints
@router.get("/status", response_model=StatusResponse)
async def get_status():
    """Get backend health and connection status."""
    try:
        services = get_services()
        ha_client = services.get("ha_client")
        claude_service = services.get("claude_service")

        # Check HA connection
        ha_connected = ha_client.connected if ha_client else False

        # Check Claude availability (simple check - we could test with API)
        claude_available = bool(claude_service and services.get("claude_service").api_key)

        return StatusResponse(
            status="operational" if (ha_connected and claude_available) else "degraded",
            backend="running",
            ha_connected=ha_connected,
            claude_available=claude_available,
            uptime_seconds=0,  # TODO: Track uptime
            database="ready",
        )

    except Exception as e:
        logger.error(f"Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cost-today", response_model=CostResponse)
async def get_daily_cost():
    """Get daily API cost."""
    try:
        services = get_services()
        conversation_service = services.get("conversation_service")
        claude_service = services.get("claude_service")

        if not conversation_service:
            raise HTTPException(status_code=503, detail="Services not initialized")

        daily_cost = conversation_service.get_daily_cost()
        daily_calls = conversation_service.get_daily_call_count()

        return CostResponse(
            daily_cost=daily_cost,
            calls_today=daily_calls,
            estimated_tokens=claude_service.tokens_used_today if claude_service else 0,
            alert_threshold=config.ALERT_THRESHOLD_USD,
            over_threshold=daily_cost > config.ALERT_THRESHOLD_USD,
        )

    except Exception as e:
        logger.error(f"Error getting daily cost: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config", response_model=ConfigResponse)
async def get_config_endpoint():
    """Get current configuration."""
    try:
        services = get_services()
        ha_client = services.get("ha_client")

        return ConfigResponse(
            debug=config.DEBUG,
            alert_threshold_usd=config.ALERT_THRESHOLD_USD,
            ha_connected=ha_client.connected if ha_client else False,
        )

    except Exception as e:
        logger.error(f"Error getting config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/config", response_model=ConfigResponse)
async def update_config(request: ConfigUpdateRequest):
    """Update configuration."""
    try:
        # Update alert threshold in runtime config
        if request.alert_threshold_usd is not None:
            config.ALERT_THRESHOLD_USD = request.alert_threshold_usd

        services = get_services()
        ha_client = services.get("ha_client")

        return ConfigResponse(
            debug=config.DEBUG,
            alert_threshold_usd=config.ALERT_THRESHOLD_USD,
            ha_connected=ha_client.connected if ha_client else False,
        )

    except Exception as e:
        logger.error(f"Error updating config: {e}")
        raise HTTPException(status_code=500, detail=str(e))
