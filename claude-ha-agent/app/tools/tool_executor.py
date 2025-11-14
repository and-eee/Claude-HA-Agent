"""Tool executor for handling Claude function calls."""
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class ToolExecutor:
    """Executes tools and manages tool call results."""

    def __init__(self):
        """Initialize tool executor."""
        self.tools: Dict[str, callable] = {}

    def register_tool(self, tool_name: str, handler: callable):
        """Register a tool handler."""
        self.tools[tool_name] = handler
        logger.debug(f"Registered tool: {tool_name}")

    async def execute_tool(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single tool."""
        if tool_name not in self.tools:
            return {
                "error": f"Tool {tool_name} not found",
                "code": "tool_not_found",
                "recoverable": False,
            }

        try:
            handler = self.tools[tool_name]

            # Check if handler is async
            import asyncio

            if asyncio.iscoroutinefunction(handler):
                result = await handler(**tool_input)
            else:
                result = handler(**tool_input)

            return result

        except TypeError as e:
            # Parameter mismatch
            return {
                "error": f"Invalid parameters for {tool_name}: {str(e)}",
                "code": "invalid_parameters",
                "recoverable": False,
            }

        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {e}")
            return {
                "error": str(e),
                "code": "tool_error",
                "recoverable": True,
            }

    async def execute_tools_parallel(self, tool_calls: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Execute multiple tools in parallel."""
        import asyncio

        tasks = []
        for tool_call in tool_calls:
            task = self.execute_tool(tool_call["name"], tool_call["input"])
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=False)

        return [
            {
                "tool_use_id": tool_call["id"],
                "tool_name": tool_call["name"],
                "result": result,
            }
            for tool_call, result in zip(tool_calls, results)
        ]
