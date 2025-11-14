"""Claude function definitions for Home Assistant management."""

# Entity Management Functions
ENTITY_TOOLS = [
    {
        "name": "list_entities",
        "description": "List entities with optional filtering by status, domain, or area. Returns max 100 entities.",
        "parameters": {
            "status": {
                "type": "string",
                "description": "Filter by status: 'available', 'unavailable', 'unknown' (optional)",
                "enum": ["available", "unavailable", "unknown"],
            },
            "domain": {
                "type": "string",
                "description": "Filter by entity domain like 'light', 'sensor', 'switch' (optional)",
            },
            "area": {
                "type": "string",
                "description": "Filter by area name (optional)",
            },
            "offset": {
                "type": "integer",
                "description": "Pagination offset (default: 0)",
            },
            "limit": {
                "type": "integer",
                "description": "Number of results to return, max 100 (default: 100)",
            },
        },
    },
    {
        "name": "get_entity_details",
        "description": "Get full details of a specific entity including attributes, history, and linked devices.",
        "parameters": {
            "entity_id": {
                "type": "string",
                "description": "Entity ID (e.g., 'light.bedroom')",
            },
        },
    },
    {
        "name": "rename_entity",
        "description": "Rename an entity. Validates name format (alphanumeric, underscore, lowercase).",
        "parameters": {
            "entity_id": {
                "type": "string",
                "description": "Current entity ID",
            },
            "new_name": {
                "type": "string",
                "description": "New friendly name (will be converted to snake_case entity_id)",
            },
        },
    },
    {
        "name": "bulk_rename_entities",
        "description": "Rename multiple entities using pattern matching. Returns proposed changes for review.",
        "parameters": {
            "pattern_from": {
                "type": "string",
                "description": "Pattern to match (supports * wildcard)",
            },
            "pattern_to": {
                "type": "string",
                "description": "Pattern to replace with (supports * wildcard)",
            },
            "domain": {
                "type": "string",
                "description": "Limit to specific domain (optional)",
            },
            "execute": {
                "type": "boolean",
                "description": "If false, returns proposed changes only (default: false)",
            },
        },
    },
    {
        "name": "remove_entity",
        "description": "Remove an entity from Home Assistant.",
        "parameters": {
            "entity_id": {
                "type": "string",
                "description": "Entity ID to remove",
            },
            "force": {
                "type": "boolean",
                "description": "Force removal even if entity is in use (default: false)",
            },
        },
    },
    {
        "name": "analyze_naming_consistency",
        "description": "Analyze entity naming patterns and identify inconsistencies.",
        "parameters": {},
    },
    {
        "name": "assign_entity_to_area",
        "description": "Assign an entity to a specific area.",
        "parameters": {
            "entity_id": {
                "type": "string",
                "description": "Entity ID",
            },
            "area_name": {
                "type": "string",
                "description": "Area name to assign to",
            },
        },
    },
]

# Integration Diagnostics Functions
INTEGRATION_TOOLS = [
    {
        "name": "get_integration_status",
        "description": "Get status of all loaded integrations (online/offline/error states).",
        "parameters": {},
    },
    {
        "name": "get_integration_details",
        "description": "Get detailed information about a specific integration.",
        "parameters": {
            "integration_name": {
                "type": "string",
                "description": "Integration domain name (e.g., 'mqtt', 'zigbee')",
            },
        },
    },
    {
        "name": "get_integration_logs",
        "description": "Get recent log entries for a specific integration.",
        "parameters": {
            "integration_name": {
                "type": "string",
                "description": "Integration domain name",
            },
            "lines": {
                "type": "integer",
                "description": "Number of log lines to retrieve (default: 50, max: 500)",
            },
        },
    },
    {
        "name": "get_zigbee_network_status",
        "description": "Get Zigbee network status including device count and signal strength.",
        "parameters": {},
    },
    {
        "name": "get_zwave_network_status",
        "description": "Get Z-Wave network status including device count and failed nodes.",
        "parameters": {},
    },
    {
        "name": "troubleshoot_integration",
        "description": "Get troubleshooting suggestions for a failing integration.",
        "parameters": {
            "integration_name": {
                "type": "string",
                "description": "Integration domain name",
            },
        },
    },
    {
        "name": "list_available_devices",
        "description": "List discoverable devices for an integration that haven't been added yet.",
        "parameters": {
            "integration_name": {
                "type": "string",
                "description": "Integration domain name",
            },
        },
    },
]

# Automation Functions
AUTOMATION_TOOLS = [
    {
        "name": "create_automation",
        "description": "Create a new automation with trigger, conditions, and actions.",
        "parameters": {
            "name": {
                "type": "string",
                "description": "Automation name/alias",
            },
            "trigger": {
                "type": "object",
                "description": "Trigger configuration (e.g., {platform: 'time', at: '10:00:00'})",
            },
            "conditions": {
                "type": "array",
                "description": "Optional list of conditions",
            },
            "actions": {
                "type": "array",
                "description": "List of actions to execute",
            },
        },
    },
    {
        "name": "list_automations",
        "description": "List all automations with basic info (id, name, enabled status).",
        "parameters": {},
    },
    {
        "name": "get_automation_details",
        "description": "Get full configuration of a specific automation.",
        "parameters": {
            "automation_id": {
                "type": "string",
                "description": "Automation ID",
            },
        },
    },
    {
        "name": "update_automation",
        "description": "Update an existing automation's trigger, conditions, or actions.",
        "parameters": {
            "automation_id": {
                "type": "string",
                "description": "Automation ID",
            },
            "updates": {
                "type": "object",
                "description": "Fields to update (trigger, condition, action)",
            },
        },
    },
    {
        "name": "delete_automation",
        "description": "Delete an automation.",
        "parameters": {
            "automation_id": {
                "type": "string",
                "description": "Automation ID",
            },
        },
    },
    {
        "name": "create_routine",
        "description": "Create a new routine (simplified automation for workflows).",
        "parameters": {
            "name": {
                "type": "string",
                "description": "Routine name",
            },
            "description": {
                "type": "string",
                "description": "Optional routine description",
            },
            "triggers": {
                "type": "array",
                "description": "List of triggers",
            },
            "actions": {
                "type": "array",
                "description": "List of actions",
            },
        },
    },
    {
        "name": "generate_node_red_flow",
        "description": "Generate a Node Red flow JSON from a description. Output can be imported into Node Red.",
        "parameters": {
            "description": {
                "type": "string",
                "description": "Description of the flow to generate (e.g., 'turn lights on at sunset and off at 11pm')",
            },
        },
    },
]

# Information/Analysis Functions
ANALYSIS_TOOLS = [
    {
        "name": "analyze_entity_health",
        "description": "Analyze overall entity health including counts by integration and identify issues.",
        "parameters": {},
    },
    {
        "name": "generate_post_migration_report",
        "description": "Generate report of post-migration issues (orphaned entities, old locations, etc).",
        "parameters": {},
    },
    {
        "name": "get_naming_recommendations",
        "description": "Get recommended naming standard and list of entities needing renaming.",
        "parameters": {},
    },
    {
        "name": "get_system_stats",
        "description": "Get overall Home Assistant system statistics.",
        "parameters": {},
    },
]

# All available functions combined
ALL_TOOLS = ENTITY_TOOLS + INTEGRATION_TOOLS + AUTOMATION_TOOLS + ANALYSIS_TOOLS

# Create mapping for quick lookup
TOOL_MAP = {tool["name"]: tool for tool in ALL_TOOLS}


def get_tool_by_name(name: str) -> dict | None:
    """Get tool definition by name."""
    return TOOL_MAP.get(name)


def get_all_tool_definitions() -> list[dict]:
    """Get all tool definitions."""
    return ALL_TOOLS
