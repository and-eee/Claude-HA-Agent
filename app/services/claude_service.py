"""Claude API service with function calling support."""
import logging
from typing import Optional, List, Dict, Any
from datetime import date
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class ClaudeService:
    """Service for interacting with Claude API."""

    SYSTEM_PROMPT = """You are Claude, an AI assistant integrated with Home Assistant to help users manage and optimize their smart home systems.

Your responsibilities:
1. Help users manage entities (discover, filter, rename, remove)
2. Diagnose integration issues and provide troubleshooting
3. Create automations and routines through conversation
4. Provide post-migration cleanup assistance
5. Analyze system health and recommend improvements

Important guidelines:
- Always confirm destructive operations before execution. Describe what will change and ask for confirmation.
- Be concise but thorough. Provide relevant details without overwhelming.
- When presenting lists, group by category (e.g., by integration, by area).
- For troubleshooting, explain the issue, suggest solutions, ask clarifying questions.
- For automation creation, confirm the trigger/condition/action pattern before creating.
- If a function call fails, explain why and suggest alternatives.
- Track API usage - if you see warnings about rate limits, suggest pausing or deferring non-urgent tasks."""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        """Initialize Claude service."""
        self.api_key = api_key
        self.model = model
        self.client = Anthropic(api_key=api_key)
        self.call_count_today = 0
        self.tokens_used_today = 0

    def set_daily_stats(self, call_count: int, tokens_used: int):
        """Set daily statistics (typically loaded from database on startup)."""
        self.call_count_today = call_count
        self.tokens_used_today = tokens_used

    def update_daily_stats(self, tokens_input: int, tokens_output: int):
        """Update daily stats after an API call."""
        self.call_count_today += 1
        self.tokens_used_today += tokens_input + tokens_output

    def reset_daily_stats(self):
        """Reset daily statistics (called at midnight UTC)."""
        self.call_count_today = 0
        self.tokens_used_today = 0

    def _build_system_prompt(
        self, ha_context: str, functions: List[Dict[str, Any]], rate_limit_warning: bool = False
    ) -> str:
        """Build complete system prompt with HA context and functions."""
        prompt = self.SYSTEM_PROMPT + "\n\n" + ha_context

        if rate_limit_warning:
            prompt += "\n\n[WARNING: 950+ API calls today. Consider pausing non-urgent operations]"

        prompt += "\n\nAvailable functions:\n"
        for func in functions:
            prompt += f"- {func['name']}: {func['description']}\n"

        return prompt

    async def chat(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        functions: Optional[List[Dict[str, Any]]] = None,
        ha_context: str = "",
        max_retries: int = 2,
        retry_delay: int = 5,
    ) -> Dict[str, Any]:
        """Send message to Claude with function calling support."""

        # Build messages for API
        messages = []

        # Add conversation history
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Check if we should warn about rate limits
        rate_limit_warning = self.call_count_today > 950

        # Build system prompt
        system_prompt = self._build_system_prompt(
            ha_context, functions or [], rate_limit_warning=rate_limit_warning
        )

        # Prepare tools for Claude
        tools = []
        if functions:
            tools = [
                {
                    "name": func["name"],
                    "description": func["description"],
                    "input_schema": {"type": "object", "properties": func.get("parameters", {})},
                }
                for func in functions
            ]

        attempt = 0
        while attempt < max_retries:
            try:
                # Call Claude API
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    system=system_prompt,
                    tools=tools if tools else None,
                    messages=messages,
                )

                # Parse response
                result = {
                    "content": "",
                    "tool_calls": [],
                    "tokens_input": response.usage.input_tokens,
                    "tokens_output": response.usage.output_tokens,
                    "stop_reason": response.stop_reason,
                }

                # Extract content and tool calls from response
                for block in response.content:
                    if hasattr(block, "text"):
                        result["content"] += block.text
                    elif block.type == "tool_use":
                        result["tool_calls"].append(
                            {
                                "name": block.name,
                                "id": block.id,
                                "input": block.input,
                            }
                        )

                # Update daily stats
                self.update_daily_stats(response.usage.input_tokens, response.usage.output_tokens)

                logger.info(
                    f"Claude API call successful - Input: {response.usage.input_tokens}, "
                    f"Output: {response.usage.output_tokens}"
                )

                return result

            except Exception as e:
                attempt += 1
                logger.error(f"Claude API error (attempt {attempt}/{max_retries}): {e}")

                if attempt < max_retries:
                    import asyncio

                    await asyncio.sleep(retry_delay * (2 ** (attempt - 1)))
                else:
                    return {
                        "error": "Claude API unavailable after retries",
                        "recoverable": True,
                        "tokens_input": 0,
                        "tokens_output": 0,
                    }

        return {
            "error": "Claude API unavailable",
            "recoverable": True,
            "tokens_input": 0,
            "tokens_output": 0,
        }

    async def process_tool_results(
        self,
        conversation_history: List[Dict[str, str]],
        assistant_message: str,
        tool_calls: List[Dict[str, Any]],
        tool_results: List[Dict[str, Any]],
        functions: Optional[List[Dict[str, Any]]] = None,
        ha_context: str = "",
    ) -> Dict[str, Any]:
        """Send tool results back to Claude for final response."""

        messages = []

        # Add conversation history
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Add assistant's function-calling message
        messages.append(
            {
                "role": "assistant",
                "content": [
                    {"type": "text", "text": assistant_message},
                    *[
                        {
                            "type": "tool_use",
                            "id": tc["id"],
                            "name": tc["name"],
                            "input": tc["input"],
                        }
                        for tc in tool_calls
                    ],
                ],
            }
        )

        # Add tool results
        for result in tool_results:
            messages.append(
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": result["tool_use_id"],
                            "content": str(result["content"]),
                        }
                    ],
                }
            )

        # Get final response from Claude
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=self.SYSTEM_PROMPT + "\n\n" + ha_context,
                messages=messages,
            )

            result = {
                "content": "",
                "tokens_input": response.usage.input_tokens,
                "tokens_output": response.usage.output_tokens,
            }

            for block in response.content:
                if hasattr(block, "text"):
                    result["content"] += block.text

            self.update_daily_stats(response.usage.input_tokens, response.usage.output_tokens)

            return result

        except Exception as e:
            logger.error(f"Error processing tool results: {e}")
            return {
                "error": str(e),
                "recoverable": True,
                "tokens_input": 0,
                "tokens_output": 0,
            }

    def get_available_functions(self) -> List[Dict[str, Any]]:
        """Get list of available Claude functions."""
        # This will be populated by tool definitions loaded from tool modules
        return []

    def get_rate_limit_status(self, max_calls: int = 1000) -> Dict[str, Any]:
        """Get current rate limit status."""
        return {
            "calls_today": self.call_count_today,
            "max_calls": max_calls,
            "percentage_used": (self.call_count_today / max_calls) * 100,
            "tokens_used": self.tokens_used_today,
        }
