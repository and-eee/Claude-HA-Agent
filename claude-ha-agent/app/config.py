"""Configuration management for Claude HA Agent."""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Application configuration."""

    # Environment
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ENV: str = os.getenv("ENV", "production")

    # Claude API
    CLAUDE_API_KEY: str = os.getenv("CLAUDE_API_KEY", "")
    CLAUDE_MODEL: str = "claude-3-5-sonnet-20241022"
    CLAUDE_MAX_TOKENS: int = 4096

    # Home Assistant
    HA_URL: str = os.getenv("HA_URL", "http://supervisor/core")
    HA_TOKEN: str = os.getenv("HA_TOKEN", "")
    HA_WEBSOCKET_URL: str = os.getenv("HA_WEBSOCKET_URL", "ws://supervisor/core/websocket")

    # Cost Management
    ALERT_THRESHOLD_USD: float = float(os.getenv("ALERT_THRESHOLD_USD", "5.0"))
    API_CALL_LIMIT_PER_DAY: int = 1000

    # Database
    DB_PATH: Path = Path(os.getenv("DB_PATH", "/config/claude_ha_agent/database.db"))
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    # API Server
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "5000"))
    API_WORKERS: int = int(os.getenv("API_WORKERS", "1"))

    # Claude API Pricing (as of 2024-11)
    # Claude 3.5 Sonnet pricing
    CLAUDE_INPUT_COST_PER_1M_TOKENS: float = 3.0  # $3 per 1M input tokens
    CLAUDE_OUTPUT_COST_PER_1M_TOKENS: float = 15.0  # $15 per 1M output tokens

    @classmethod
    def get_claude_cost(cls, input_tokens: int, output_tokens: int) -> float:
        """Calculate Claude API cost for given tokens."""
        input_cost = (input_tokens / 1_000_000) * cls.CLAUDE_INPUT_COST_PER_1M_TOKENS
        output_cost = (output_tokens / 1_000_000) * cls.CLAUDE_OUTPUT_COST_PER_1M_TOKENS
        return input_cost + output_cost

    @classmethod
    def validate_required(cls) -> bool:
        """Validate required configuration."""
        required = {
            "CLAUDE_API_KEY": cls.CLAUDE_API_KEY,
            "HA_TOKEN": cls.HA_TOKEN,
        }

        missing = [key for key, value in required.items() if not value]
        if missing:
            raise ValueError(f"Missing required configuration: {', '.join(missing)}")

        return True


# Global config instance
config = Config()
