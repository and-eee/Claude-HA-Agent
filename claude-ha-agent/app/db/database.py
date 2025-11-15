"""Database setup and operations for conversation storage."""
import sqlite3
import json
from datetime import datetime, date
from pathlib import Path
from typing import Optional, List, Dict, Any
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)


class Database:
    """SQLite database manager for conversations and state cache."""

    def __init__(self, db_path: Path):
        """Initialize database connection."""
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self) -> None:
        """Initialize database schema."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Conversations table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                title TEXT,
                metadata JSON
            )
            """
        )

        # Messages table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                tokens_input INTEGER DEFAULT 0,
                tokens_output INTEGER DEFAULT 0,
                cost REAL DEFAULT 0.0,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tool_calls JSON,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
            """
        )

        # HA State Cache table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS ha_state_cache (
                entity_id TEXT PRIMARY KEY,
                state TEXT NOT NULL,
                attributes JSON,
                last_updated TIMESTAMP,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        # Create indices
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at)")

        conn.commit()
        conn.close()
        logger.info(f"Database initialized at {self.db_path}")

    def create_conversation(self, title: Optional[str] = None) -> str:
        """Create a new conversation and return its ID."""
        conversation_id = str(uuid4())
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO conversations (id, title, metadata)
            VALUES (?, ?, ?)
            """,
            (conversation_id, title or "Untitled", json.dumps({"daily_cost": 0.0, "message_count": 0})),
        )

        conn.commit()
        conn.close()
        logger.debug(f"Created conversation {conversation_id}")
        return conversation_id

    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        tokens_input: int = 0,
        tokens_output: int = 0,
        cost: float = 0.0,
        tool_calls: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """Add a message to a conversation."""
        message_id = str(uuid4())
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO messages (id, conversation_id, role, content, tokens_input, tokens_output, cost, tool_calls)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                message_id,
                conversation_id,
                role,
                content,
                tokens_input,
                tokens_output,
                cost,
                json.dumps(tool_calls) if tool_calls else None,
            ),
        )

        # Update conversation metadata
        cursor.execute(
            """
            UPDATE conversations
            SET updated_at = CURRENT_TIMESTAMP,
                metadata = json_set(
                    metadata,
                    '$.message_count',
                    (SELECT COUNT(*) FROM messages WHERE conversation_id = ?),
                    '$.daily_cost',
                    (SELECT COALESCE(SUM(cost), 0.0) FROM messages
                     WHERE conversation_id = ? AND DATE(timestamp) = DATE('now'))
                )
            WHERE id = ?
            """,
            (conversation_id, conversation_id, conversation_id),
        )

        conn.commit()
        conn.close()
        logger.debug(f"Added message {message_id} to conversation {conversation_id}")
        return message_id

    def get_conversation_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a conversation."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, role, content, tokens_input, tokens_output, cost, timestamp, tool_calls
            FROM messages
            WHERE conversation_id = ?
            ORDER BY timestamp ASC
            """,
            (conversation_id,),
        )

        messages = []
        for row in cursor.fetchall():
            messages.append(
                {
                    "id": row["id"],
                    "role": row["role"],
                    "content": row["content"],
                    "tokens": {"input": row["tokens_input"], "output": row["tokens_output"]},
                    "cost": row["cost"],
                    "timestamp": row["timestamp"],
                    "tool_calls": json.loads(row["tool_calls"]) if row["tool_calls"] else None,
                }
            )

        conn.close()
        return messages

    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get conversation details."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, created_at, updated_at, title, metadata
            FROM conversations
            WHERE id = ?
            """,
            (conversation_id,),
        )

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        metadata = json.loads(row["metadata"]) if row["metadata"] else {}

        return {
            "id": row["id"],
            "title": row["title"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "message_count": metadata.get("message_count", 0),
            "daily_cost": metadata.get("daily_cost", 0.0),
        }

    def get_all_conversations(self) -> List[Dict[str, Any]]:
        """Get all conversations."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, created_at, updated_at, title, metadata
            FROM conversations
            ORDER BY updated_at DESC
            """
        )

        conversations = []
        for row in cursor.fetchall():
            metadata = json.loads(row["metadata"]) if row["metadata"] else {}
            conversations.append(
                {
                    "id": row["id"],
                    "title": row["title"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                    "message_count": metadata.get("message_count", 0),
                    "daily_cost": metadata.get("daily_cost", 0.0),
                }
            )

        conn.close()
        return conversations

    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation and all its messages."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
        cursor.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))

        conn.commit()
        rows_deleted = cursor.rowcount
        conn.close()

        if rows_deleted > 0:
            logger.info(f"Deleted conversation {conversation_id}")
            return True

        return False

    def update_conversation_title(self, conversation_id: str, title: str) -> bool:
        """Update conversation title."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("UPDATE conversations SET title = ? WHERE id = ?", (title, conversation_id))

        conn.commit()
        success = cursor.rowcount > 0
        conn.close()

        return success

    def get_daily_cost(self, target_date: Optional[date] = None) -> float:
        """Get total API cost for a specific date (default: today UTC)."""
        if target_date is None:
            target_date = date.today()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT COALESCE(SUM(cost), 0.0) as total_cost
            FROM messages
            WHERE DATE(timestamp) = ?
            """,
            (target_date.isoformat(),),
        )

        result = cursor.fetchone()
        conn.close()

        return result[0] if result else 0.0

    def get_daily_call_count(self, target_date: Optional[date] = None) -> int:
        """Get number of API calls for a specific date (default: today UTC)."""
        if target_date is None:
            target_date = date.today()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT COUNT(*) as call_count
            FROM messages
            WHERE role = 'assistant' AND DATE(timestamp) = ?
            """,
            (target_date.isoformat(),),
        )

        result = cursor.fetchone()
        conn.close()

        return result[0] if result else 0

    # HA State Cache operations

    def cache_entity_state(self, entity_id: str, state: str, attributes: Dict[str, Any], last_updated: datetime):
        """Cache or update an entity's state."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT OR REPLACE INTO ha_state_cache (entity_id, state, attributes, last_updated, cached_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (entity_id, state, json.dumps(attributes), last_updated.isoformat()),
        )

        conn.commit()
        conn.close()

    def get_cached_entity_state(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Get cached entity state."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT entity_id, state, attributes, last_updated, cached_at
            FROM ha_state_cache
            WHERE entity_id = ?
            """,
            (entity_id,),
        )

        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        return {
            "entity_id": row["entity_id"],
            "state": row["state"],
            "attributes": json.loads(row["attributes"]) if row["attributes"] else {},
            "last_updated": row["last_updated"],
            "cached_at": row["cached_at"],
        }

    def get_all_cached_entities(self) -> List[Dict[str, Any]]:
        """Get all cached entity states."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT entity_id, state, attributes, last_updated, cached_at
            FROM ha_state_cache
            ORDER BY entity_id
            """
        )

        entities = []
        for row in cursor.fetchall():
            entities.append(
                {
                    "entity_id": row["entity_id"],
                    "state": row["state"],
                    "attributes": json.loads(row["attributes"]) if row["attributes"] else {},
                    "last_updated": row["last_updated"],
                    "cached_at": row["cached_at"],
                }
            )

        conn.close()
        return entities

    def clear_entity_cache(self, entity_id: str) -> bool:
        """Remove an entity from cache."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("DELETE FROM ha_state_cache WHERE entity_id = ?", (entity_id,))

        conn.commit()
        success = cursor.rowcount > 0
        conn.close()

        return success

    def clear_all_cache(self) -> int:
        """Clear all cached entity states."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("DELETE FROM ha_state_cache")

        conn.commit()
        count = cursor.rowcount
        conn.close()

        logger.info(f"Cleared {count} cached entities")
        return count
