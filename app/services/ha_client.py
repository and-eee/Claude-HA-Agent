"""Home Assistant WebSocket client for state management."""
import asyncio
import json
import logging
from typing import Optional, Callable, Dict, Any
from datetime import datetime
import aiohttp

logger = logging.getLogger(__name__)


class HAClient:
    """Manages connection to Home Assistant WebSocket API."""

    def __init__(self, ha_url: str, ha_token: str, ws_url: str):
        """Initialize HA client."""
        self.ha_url = ha_url
        self.ha_token = ha_token
        self.ws_url = ws_url
        self.ws: Optional[aiohttp.ClientWebSocketResponse] = None
        self.connected = False
        self.message_id = 0
        self.state_cache: Dict[str, Any] = {}
        self.state_update_callbacks: list[Callable] = []
        self._connection_task: Optional[asyncio.Task] = None

    def add_state_update_callback(self, callback: Callable):
        """Register callback for state changes."""
        self.state_update_callbacks.append(callback)

    async def connect(self, max_retries: int = 5, retry_delay: int = 5) -> bool:
        """Connect to HA WebSocket."""
        for attempt in range(max_retries):
            try:
                logger.info(f"Connecting to HA WebSocket (attempt {attempt + 1}/{max_retries})")

                session = aiohttp.ClientSession()
                self.ws = await session.ws_connect(self.ws_url, autoping=True, autoclose=True)

                # Authenticate
                auth_msg = {"type": "auth", "access_token": self.ha_token}
                await self.ws.send_json(auth_msg)

                # Wait for auth response
                msg = await self.ws.receive_json(timeout=10)
                if msg.get("type") == "auth_ok":
                    self.connected = True
                    logger.info("Successfully connected and authenticated to HA")

                    # Subscribe to state_changed events
                    await self._subscribe_to_events()

                    # Start listening for messages
                    self._connection_task = asyncio.create_task(self._listen_for_messages())

                    return True
                else:
                    logger.error(f"Authentication failed: {msg}")
                    await self.ws.close()

            except asyncio.TimeoutError:
                logger.warning(f"Connection timeout (attempt {attempt + 1})")
            except Exception as e:
                logger.warning(f"Connection error: {e} (attempt {attempt + 1})")

            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (2 ** attempt))  # Exponential backoff

        logger.error("Failed to connect to HA after maximum retries")
        return False

    async def _subscribe_to_events(self):
        """Subscribe to HA events."""
        self.message_id += 1
        subscribe_msg = {
            "id": self.message_id,
            "type": "subscribe_events",
            "event_type": "state_changed",
        }
        await self.ws.send_json(subscribe_msg)

        # Get entities list
        await self._get_entities()

    async def _get_entities(self):
        """Get initial entity state snapshot."""
        self.message_id += 1
        call_msg = {
            "id": self.message_id,
            "type": "call_service",
            "domain": "homeassistant",
            "service": "get_states",
        }

        try:
            await self.ws.send_json(call_msg)
            # Response will be handled in listen_for_messages
        except Exception as e:
            logger.error(f"Error getting entities: {e}")

    async def _listen_for_messages(self):
        """Listen for messages from HA WebSocket."""
        try:
            while self.ws and not self.ws.closed:
                msg = await self.ws.receive_json(timeout=60)

                if msg.get("type") == "event":
                    event = msg.get("event", {})
                    if event.get("event_type") == "state_changed":
                        await self._handle_state_changed(event.get("data", {}))

                elif msg.get("type") == "result":
                    # Handle call_service results
                    pass

                elif msg.get("type") == "auth_required":
                    logger.warning("Re-authentication required")
                    auth_msg = {"type": "auth", "access_token": self.ha_token}
                    await self.ws.send_json(auth_msg)

        except asyncio.TimeoutError:
            logger.warning("WebSocket timeout - connection idle")
        except asyncio.CancelledError:
            logger.info("WebSocket listener cancelled")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            self.connected = False

    async def _handle_state_changed(self, data: Dict[str, Any]):
        """Handle state_changed event."""
        entity_id = data.get("entity_id")
        new_state = data.get("new_state", {})

        if entity_id and new_state:
            self.state_cache[entity_id] = {
                "state": new_state.get("state"),
                "attributes": new_state.get("attributes", {}),
                "last_updated": new_state.get("last_updated"),
            }

            # Call registered callbacks
            for callback in self.state_update_callbacks:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(entity_id, new_state)
                    else:
                        callback(entity_id, new_state)
                except Exception as e:
                    logger.error(f"Error in state update callback: {e}")

    async def get_state(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Get current state of an entity."""
        if entity_id in self.state_cache:
            return self.state_cache[entity_id]

        # If not in cache, try to fetch from HA API
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.ha_url}/api/states/{entity_id}"
                headers = {"Authorization": f"Bearer {self.ha_token}"}

                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        state = {
                            "state": data.get("state"),
                            "attributes": data.get("attributes", {}),
                            "last_updated": data.get("last_updated"),
                        }
                        self.state_cache[entity_id] = state
                        return state

        except Exception as e:
            logger.warning(f"Error fetching state for {entity_id}: {e}")

        return None

    async def get_all_states(self) -> Dict[str, Any]:
        """Get all entity states from HA."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.ha_url}/api/states"
                headers = {"Authorization": f"Bearer {self.ha_token}"}

                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        entities = await resp.json()

                        # Update cache
                        for entity in entities:
                            entity_id = entity.get("entity_id")
                            if entity_id:
                                self.state_cache[entity_id] = {
                                    "state": entity.get("state"),
                                    "attributes": entity.get("attributes", {}),
                                    "last_updated": entity.get("last_updated"),
                                }

                        return self.state_cache

        except Exception as e:
            logger.error(f"Error getting all states: {e}")

        return self.state_cache

    async def call_service(self, domain: str, service: str, data: Optional[Dict[str, Any]] = None) -> bool:
        """Call a Home Assistant service."""
        if not self.ws or self.ws.closed:
            logger.error("WebSocket not connected")
            return False

        try:
            self.message_id += 1
            msg = {
                "id": self.message_id,
                "type": "call_service",
                "domain": domain,
                "service": service,
                "service_data": data or {},
            }

            await self.ws.send_json(msg)
            return True

        except Exception as e:
            logger.error(f"Error calling service {domain}.{service}: {e}")
            return False

    async def get_config(self) -> Optional[Dict[str, Any]]:
        """Get Home Assistant configuration."""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.ha_url}/api/config"
                headers = {"Authorization": f"Bearer {self.ha_token}"}

                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        return await resp.json()

        except Exception as e:
            logger.error(f"Error getting config: {e}")

        return None

    async def disconnect(self):
        """Disconnect from HA WebSocket."""
        self.connected = False

        if self._connection_task:
            self._connection_task.cancel()
            try:
                await self._connection_task
            except asyncio.CancelledError:
                pass

        if self.ws and not self.ws.closed:
            await self.ws.close()

        logger.info("Disconnected from HA")
