"""Analysis tool implementations."""
import logging

logger = logging.getLogger(__name__)


def register_analysis_tools(tool_executor, analysis_service):
    """Register analysis tools with the tool executor."""

    async def analyze_entity_health():
        return await analysis_service.analyze_entity_health()

    async def generate_post_migration_report():
        return await analysis_service.generate_post_migration_report()

    async def get_naming_recommendations():
        return await analysis_service.get_naming_recommendations()

    async def get_system_stats():
        return await analysis_service.get_system_stats()

    # Register all tools
    tool_executor.register_tool("analyze_entity_health", analyze_entity_health)
    tool_executor.register_tool("generate_post_migration_report", generate_post_migration_report)
    tool_executor.register_tool("get_naming_recommendations", get_naming_recommendations)
    tool_executor.register_tool("get_system_stats", get_system_stats)

    logger.info("Analysis tools registered")
