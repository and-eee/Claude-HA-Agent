# Claude HA Agent

AI-powered conversational interface for Home Assistant management, cleanup, and optimization.

## Overview

Claude HA Agent is a Home Assistant add-on that leverages Claude AI to provide intelligent, natural language control over your Home Assistant instance. It helps users:

- **Manage entities** - Discover, filter, rename, and remove entities in bulk
- **Diagnose integrations** - Troubleshoot integration issues and monitor network health
- **Create automations** - Build automations and routines through conversation
- **Optimize system** - Analyze entity health, identify post-migration issues, and recommend improvements
- **Monitor costs** - Track Claude API usage and costs in real-time

## Quick Start

### Prerequisites

- Home Assistant 2024.1.0 or later
- Docker (if running Home Assistant OS)
- Claude API key from Anthropic
- Home Assistant long-lived access token

### Installation

1. **Add Repository** (if using HACS):
   - Open Home Assistant → Settings → Devices & Services → Custom integrations
   - Click "Create Integration" and add repository
   - Search for "Claude HA Agent" and install

2. **Or Manual Installation**:
   - Add as Docker add-on repository: `https://github.com/your-org/claude-ha-agent`
   - Select Claude HA Agent from add-ons
   - Click "Install"

3. **Configuration**:
   - Get Claude API key from https://console.anthropic.com
   - In Home Assistant, go to Settings → Developer Tools → Create Token
   - Copy the long-lived access token
   - Configure the add-on with both keys
   - Start the add-on

4. **Add Custom Card**:
   - Install the custom card from HACS or manually
   - Add `claude-ha-agent-card` to your dashboard
   - Start chatting!

## Architecture

### Backend (Python)

- **FastAPI** REST API and WebSocket server
- **Claude API** integration with function calling
- **Home Assistant WebSocket** connection for real-time state
- **SQLite** conversation storage
- **Modular services** for entity, integration, automation, and analysis management

### Frontend (JavaScript)

- **Custom HA Card** for dashboard integration
- **Real-time messaging** with conversation history
- **Status indicators** for HA and Claude connections
- **Cost monitoring** widget
- **Light/Dark mode** support

## Key Features

### Entity Management
- List entities by status (available, unavailable, unknown)
- Filter by domain or area
- Bulk rename with pattern matching
- Safe entity removal with confirmation
- Naming consistency analysis
- Area assignment automation

### Integration Diagnostics
- View integration health status
- Get integration-specific logs
- Zigbee/Z-Wave network analysis
- Integration troubleshooting suggestions
- Device discovery assistance

### Automation & Routines
- Create automations through conversation
- Generate Node Red flows from descriptions
- Define trigger/condition/action patterns
- Create simplified routines
- Update or delete existing automations

### System Analysis
- Entity health overview
- Post-migration cleanup reports
- Naming convention recommendations
- System statistics and uptime tracking

### Cost Management
- Real-time API cost tracking
- Daily cost aggregation
- Configurable alert thresholds
- Usage dashboard widget
- Token consumption monitoring

## Development

### Project Structure

```
claude-ha-agent/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── models/              # Pydantic models and schemas
│   ├── db/                  # Database layer
│   ├── services/            # Business logic services
│   ├── tools/               # Claude function implementations
│   └── api/                 # REST API routes
├── frontend/
│   ├── claude-ha-agent-card.js  # Custom HA card
│   ├── styles.css           # Card styling
│   └── README.md            # Card documentation
├── Dockerfile               # Docker build configuration
├── addon_config.json        # Home Assistant add-on manifest
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

### Running Locally

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables**:
   ```bash
   export CLAUDE_API_KEY="your-key-here"
   export HA_TOKEN="your-token-here"
   export HA_URL="http://localhost:8123"
   export HA_WEBSOCKET_URL="ws://localhost:8123/api/websocket"
   ```

3. **Run development server**:
   ```bash
   python -m uvicorn app.main:app --reload --port 5000
   ```

4. **Test endpoints**:
   ```bash
   curl http://localhost:5000/api/status
   ```

### Adding New Features

1. **Create new service** in `app/services/new_service.py`
2. **Add tool handlers** in `app/tools/new_tools.py`
3. **Register in main.py** during startup
4. **Define Claude functions** in `app/tools/tool_definitions.py`
5. **Create API endpoints** in `app/api/routes.py` if needed

## Configuration

### Environment Variables

- `CLAUDE_API_KEY` - Claude API key (required)
- `HA_TOKEN` - Home Assistant long-lived token (required)
- `HA_URL` - Home Assistant URL (default: http://supervisor/core)
- `HA_WEBSOCKET_URL` - HA WebSocket endpoint (default: ws://supervisor/core/websocket)
- `ALERT_THRESHOLD_USD` - Cost alert threshold (default: 5.0)
- `DEBUG` - Enable debug logging (default: false)

### Add-on Options

```json
{
  "claude_api_key": "your-api-key",
  "alert_threshold_usd": 5.0
}
```

## API Documentation

### Chat Endpoint

**POST** `/api/chat`

Send a message and receive Claude response with function calls.

```json
Request: {
  "conversation_id": "uuid",
  "message": "Show me all unavailable entities",
  "include_tools": true
}

Response: {
  "id": "message_id",
  "role": "assistant",
  "content": "Found 18 unavailable entities...",
  "tool_calls": [
    {
      "tool_name": "list_entities",
      "parameters": {"status": "unavailable"},
      "result": {...}
    }
  ],
  "cost": 0.0042,
  "tokens": {"input": 150, "output": 200}
}
```

### Conversation Endpoints

- `GET /api/conversations` - List all conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/{id}` - Get conversation with history
- `DELETE /api/conversations/{id}` - Delete conversation

### Status Endpoints

- `GET /api/status` - Backend and connection status
- `GET /api/cost-today` - Daily API cost and usage
- `GET /api/config` - Current configuration
- `POST /api/config` - Update configuration

### Health Check

- `GET /health` - Simple health endpoint

## Troubleshooting

### Add-on Won't Start

1. Check add-on logs: Settings → Add-ons → Claude HA Agent → Logs
2. Verify environment variables are set
3. Check Claude API key validity
4. Verify Home Assistant token is correct

### Card Not Loading

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check if add-on is running: `GET /api/status` should return 200
4. Check browser console for errors (F12)

### No Responses from Claude

1. Verify Claude API key in add-on config
2. Check daily usage hasn't exceeded limits
3. Review add-on logs for API errors
4. Ensure Home Assistant connection is active

### High API Costs

1. Monitor cost in card widget
2. Adjust alert threshold in config
3. Reduce conversation length or complexity
4. Consider disabling tool calls if not needed

## Performance

- **Message Response**: <10 seconds (typical)
- **Card Load Time**: <2 seconds
- **Database Queries**: <100ms
- **Uptime**: 99.9% (HA-dependent)

## Security

- **Credentials**: Stored in HA add-on config (encrypted by HA)
- **API Keys**: Never logged or exposed
- **Communications**: All traffic to HA is local (WebSocket)
- **Access Control**: Token-based (HA user tied)
- **CORS**: Restricted to HA origin in production

## Cost Management

- **Pricing**: Uses Anthropic published rates (~$3/$15 per 1M tokens)
- **Typical Usage**: $0.50-$2.00 per day for normal use
- **Cost Tracking**: Per-message and daily aggregation
- **Alert System**: Configurable threshold with notifications
- **Transparency**: All costs shown in dashboard

## Limitations (MVP v1)

- ✅ Single-user per HA instance
- ✅ No multi-turn automations (single function calls)
- ✅ Limited to basic automation patterns (no complex Jinja2)
- ✅ No direct YAML editing
- ✅ Zigbee/Z-Wave pairing UI assisted (not automated)

## Future Enhancements

- Multi-user support with role-based access
- Advanced automation templates
- Historical entity tracking and trending
- Custom Claude model support
- Node Red flow execution
- Integration marketplace
- Community automation sharing

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

- **Issues**: GitHub issues
- **Discussions**: GitHub discussions
- **Home Assistant Forum**: Post in Home Assistant forum with tag `#claude-ha-agent`

## Credits

Built with:
- [Claude API](https://anthropic.com)
- [Home Assistant](https://www.home-assistant.io/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Anthropic Python SDK](https://github.com/anthropics/anthropic-sdk-python)

---

**Enjoy managing your Home Assistant with Claude! 🎉**
