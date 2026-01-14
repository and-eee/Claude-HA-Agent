"""FastAPI application entry point."""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import config
from app.db.database import Database
from app.services.ha_client import HAClient
from app.services.claude_service import ClaudeService
from app.services.conversation_service import ConversationService
from app.services.entity_service import EntityService
from app.services.integration_service import IntegrationService
from app.services.automation_service import AutomationService
from app.services.analysis_service import AnalysisService
from app.tools.tool_executor import ToolExecutor
from app.tools import entity_tools, integration_tools, automation_tools, analysis_tools
from app.api import routes

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if config.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Global service instances
_services = {}
_startup_complete = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan context manager for startup/shutdown."""
    global _services, _startup_complete

    logger.info("Starting Claude HA Agent")

    try:
        # Validate required configuration
        config.validate_required()

        # Initialize database
        database = Database(config.DB_PATH)
        logger.info(f"Database initialized at {config.DB_PATH}")

        # Initialize HA WebSocket client
        ha_client = HAClient(config.HA_URL, config.HA_TOKEN, config.HA_WEBSOCKET_URL)

        # Connect to HA
        ha_connected = await ha_client.connect()
        if not ha_connected:
            logger.error("Failed to connect to Home Assistant")
        else:
            logger.info("Connected to Home Assistant")

        # Initialize Claude service
        claude_service = ClaudeService(config.CLAUDE_API_KEY, config.CLAUDE_MODEL)

        # Load daily stats for Claude service
        today_cost = database.get_daily_cost()
        today_tokens = 0  # TODO: Calculate from database
        claude_service.set_daily_stats(database.get_daily_call_count(), today_tokens)

        logger.info(f"Daily stats loaded - Calls: {claude_service.call_count_today}")

        # Initialize conversation service
        conversation_service = ConversationService(database)

        # Initialize domain-specific services
        entity_service = EntityService(ha_client)
        integration_service = IntegrationService(ha_client)
        automation_service = AutomationService(ha_client)
        analysis_service = AnalysisService(ha_client)

        # Initialize tool executor
        tool_executor = ToolExecutor()

        # Register all tools
        entity_tools.register_entity_tools(tool_executor, entity_service)
        integration_tools.register_integration_tools(tool_executor, integration_service)
        automation_tools.register_automation_tools(tool_executor, automation_service)
        analysis_tools.register_analysis_tools(tool_executor, analysis_service)

        logger.info("All tools registered successfully")

        # Store services globally for API routes
        _services = {
            "database": database,
            "ha_client": ha_client,
            "claude_service": claude_service,
            "conversation_service": conversation_service,
            "entity_service": entity_service,
            "integration_service": integration_service,
            "automation_service": automation_service,
            "analysis_service": analysis_service,
            "tool_executor": tool_executor,
        }

        # Pass services to routes
        routes.set_services(_services)

        _startup_complete = True
        logger.info("Claude HA Agent startup complete")

        yield

        # Shutdown
        logger.info("Shutting down Claude HA Agent")
        await ha_client.disconnect()
        logger.info("Shutdown complete")

    except Exception as e:
        logger.error(f"Startup error: {e}", exc_info=True)
        raise


# Create FastAPI app
app = FastAPI(
    title="Claude HA Agent",
    description="AI-powered conversational Home Assistant management",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware to allow HA card requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to HA origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(routes.router)


# Health check endpoint
@app.get("/health")
async def health():
    """Simple health check."""
    return {"status": "ok", "startup_complete": _startup_complete}


# Mount static files (screensaver) at root - MUST be after all other routes
# This serves static/index.html at the root URL
app.mount("/", StaticFiles(directory="static", html=True), name="static")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=config.API_HOST,
        port=config.API_PORT,
        workers=config.API_WORKERS,
        reload=config.DEBUG,
    )
