"""Entity management tool implementations."""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def register_entity_tools(tool_executor, entity_service):
    """Register entity tools with the tool executor."""

    async def list_entities(
        status: Optional[str] = None,
        domain: Optional[str] = None,
        area: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ):
        return await entity_service.list_entities(status, domain, area, offset, limit)

    async def get_entity_details(entity_id: str):
        return await entity_service.get_entity_details(entity_id)

    async def rename_entity(entity_id: str, new_name: str):
        return await entity_service.rename_entity(entity_id, new_name)

    async def bulk_rename_entities(
        pattern_from: str,
        pattern_to: str,
        domain: Optional[str] = None,
        execute: bool = False,
    ):
        return await entity_service.bulk_rename_entities(pattern_from, pattern_to, domain, execute)

    async def remove_entity(entity_id: str, force: bool = False):
        return await entity_service.remove_entity(entity_id, force)

    async def analyze_naming_consistency():
        return await entity_service.analyze_naming_consistency()

    async def assign_entity_to_area(entity_id: str, area_name: str):
        return await entity_service.assign_entity_to_area(entity_id, area_name)

    # Register all tools
    tool_executor.register_tool("list_entities", list_entities)
    tool_executor.register_tool("get_entity_details", get_entity_details)
    tool_executor.register_tool("rename_entity", rename_entity)
    tool_executor.register_tool("bulk_rename_entities", bulk_rename_entities)
    tool_executor.register_tool("remove_entity", remove_entity)
    tool_executor.register_tool("analyze_naming_consistency", analyze_naming_consistency)
    tool_executor.register_tool("assign_entity_to_area", assign_entity_to_area)

    logger.info("Entity tools registered")
