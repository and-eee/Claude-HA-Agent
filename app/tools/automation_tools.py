"""Automation and routine tool implementations."""
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)


def register_automation_tools(tool_executor, automation_service):
    """Register automation tools with the tool executor."""

    async def create_automation(
        name: str,
        trigger: Dict[str, Any],
        conditions: Optional[List[Dict[str, Any]]] = None,
        actions: Optional[List[Dict[str, Any]]] = None,
    ):
        return await automation_service.create_automation(name, trigger, conditions, actions)

    async def list_automations():
        return await automation_service.list_automations()

    async def get_automation_details(automation_id: str):
        return await automation_service.get_automation_details(automation_id)

    async def update_automation(automation_id: str, updates: Dict[str, Any]):
        return await automation_service.update_automation(automation_id, updates)

    async def delete_automation(automation_id: str):
        return await automation_service.delete_automation(automation_id)

    async def create_routine(
        name: str,
        description: Optional[str] = None,
        triggers: Optional[List[Dict[str, Any]]] = None,
        actions: Optional[List[Dict[str, Any]]] = None,
    ):
        return await automation_service.create_routine(name, description, triggers, actions)

    async def generate_node_red_flow(description: str):
        return await automation_service.generate_node_red_flow(description)

    # Register all tools
    tool_executor.register_tool("create_automation", create_automation)
    tool_executor.register_tool("list_automations", list_automations)
    tool_executor.register_tool("get_automation_details", get_automation_details)
    tool_executor.register_tool("update_automation", update_automation)
    tool_executor.register_tool("delete_automation", delete_automation)
    tool_executor.register_tool("create_routine", create_routine)
    tool_executor.register_tool("generate_node_red_flow", generate_node_red_flow)

    logger.info("Automation tools registered")
