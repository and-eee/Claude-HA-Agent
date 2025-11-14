"""Integration diagnostics tool implementations."""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def register_integration_tools(tool_executor, integration_service):
    """Register integration tools with the tool executor."""

    async def get_integration_status():
        return await integration_service.get_integration_status()

    async def get_integration_details(integration_name: str):
        return await integration_service.get_integration_details(integration_name)

    async def get_integration_logs(integration_name: str, lines: int = 50):
        return await integration_service.get_integration_logs(integration_name, lines)

    async def get_zigbee_network_status():
        return await integration_service.get_zigbee_network_status()

    async def get_zwave_network_status():
        return await integration_service.get_zwave_network_status()

    async def troubleshoot_integration(integration_name: str):
        return await integration_service.troubleshoot_integration(integration_name)

    async def list_available_devices(integration_name: str):
        return await integration_service.list_available_devices(integration_name)

    # Register all tools
    tool_executor.register_tool("get_integration_status", get_integration_status)
    tool_executor.register_tool("get_integration_details", get_integration_details)
    tool_executor.register_tool("get_integration_logs", get_integration_logs)
    tool_executor.register_tool("get_zigbee_network_status", get_zigbee_network_status)
    tool_executor.register_tool("get_zwave_network_status", get_zwave_network_status)
    tool_executor.register_tool("troubleshoot_integration", troubleshoot_integration)
    tool_executor.register_tool("list_available_devices", list_available_devices)

    logger.info("Integration tools registered")
