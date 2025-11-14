"""Conversation management service."""
import logging
from typing import Optional, List, Dict, Any
from datetime import date

from app.db.database import Database
from app.config import config

logger = logging.getLogger(__name__)


class ConversationService:
    """Manages conversations and message history."""

    def __init__(self, database: Database):
        """Initialize conversation service."""
        self.db = database

    def create_conversation(self, title: Optional[str] = None) -> str:
        """Create a new conversation."""
        conversation_id = self.db.create_conversation(title or "Untitled")
        logger.info(f"Created conversation: {conversation_id}")
        return conversation_id

    def add_user_message(
        self, conversation_id: str, message: str
    ) -> Dict[str, Any]:
        """Add a user message to conversation."""
        message_id = self.db.add_message(
            conversation_id=conversation_id,
            role="user",
            content=message,
        )

        return {
            "id": message_id,
            "role": "user",
            "content": message,
        }

    def add_assistant_message(
        self,
        conversation_id: str,
        content: str,
        tokens_input: int = 0,
        tokens_output: int = 0,
        cost: float = 0.0,
        tool_calls: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Add an assistant message to conversation."""
        message_id = self.db.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content=content,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            cost=cost,
            tool_calls=tool_calls,
        )

        return {
            "id": message_id,
            "role": "assistant",
            "content": content,
            "cost": cost,
            "tokens": {"input": tokens_input, "output": tokens_output},
            "tool_calls": tool_calls,
        }

    def get_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation history for Claude context."""
        messages = self.db.get_conversation_messages(conversation_id)

        # Format for Claude API
        history = []
        for msg in messages:
            history.append({
                "role": msg["role"],
                "content": msg["content"],
            })

        return history

    def get_conversation_details(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get conversation metadata and messages."""
        conv = self.db.get_conversation(conversation_id)

        if not conv:
            return None

        messages = self.db.get_conversation_messages(conversation_id)

        return {
            "id": conv["id"],
            "title": conv["title"],
            "created_at": conv["created_at"],
            "updated_at": conv["updated_at"],
            "message_count": conv["message_count"],
            "daily_cost": conv["daily_cost"],
            "messages": messages,
        }

    def list_all_conversations(self) -> List[Dict[str, Any]]:
        """List all conversations."""
        return self.db.get_all_conversations()

    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation."""
        return self.db.delete_conversation(conversation_id)

    def update_conversation_title(self, conversation_id: str, title: str) -> bool:
        """Update conversation title."""
        return self.db.update_conversation_title(conversation_id, title)

    def get_daily_cost(self, target_date: Optional[date] = None) -> float:
        """Get API cost for a date."""
        return self.db.get_daily_cost(target_date)

    def get_daily_call_count(self, target_date: Optional[date] = None) -> int:
        """Get number of API calls for a date."""
        return self.db.get_daily_call_count(target_date)

    def build_ha_context(
        self,
        system_info: Dict[str, Any],
        entity_status: Dict[str, Any],
        integration_errors: List[str],
    ) -> str:
        """Build dynamic HA context for Claude."""
        context = "[HA CONTEXT]\n"

        if system_info:
            context += f"- Home Assistant {system_info.get('version', 'unknown')}\n"
            context += f"- Uptime: {system_info.get('uptime_readable', 'unknown')}\n"

        if entity_status:
            total = entity_status.get("total", 0)
            unavailable = entity_status.get("unavailable", 0)
            unknown = entity_status.get("unknown", 0)
            context += f"- Total entities: {total} ({unavailable} unavailable, {unknown} unknown)\n"

        # Add integration errors
        if integration_errors:
            context += "- Recent errors:\n"
            for i, error in enumerate(integration_errors[:3], 1):
                context += f"  {i}. {error}\n"

        # Add API cost today
        daily_cost = self.get_daily_cost()
        daily_calls = self.get_daily_call_count()
        context += f"- API Cost Today: ${daily_cost:.2f} ({daily_calls} calls)\n"

        return context

    def build_message_for_claude(
        self,
        user_message: str,
        conversation_history: List[Dict[str, Any]],
        available_functions: List[Dict[str, Any]],
        ha_context: str,
    ) -> tuple[List[Dict[str, Any]], str]:
        """Build formatted message for Claude."""

        # Format history
        messages = []
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message,
        })

        return messages, ha_context

    def calculate_message_cost(
        self, tokens_input: int, tokens_output: int
    ) -> float:
        """Calculate cost for tokens using Claude pricing."""
        return config.get_claude_cost(tokens_input, tokens_output)
