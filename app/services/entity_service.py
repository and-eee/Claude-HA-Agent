"""Entity management service."""
import logging
import re
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)


class EntityService:
    """Manages entity operations."""

    def __init__(self, ha_client):
        """Initialize entity service."""
        self.ha_client = ha_client

    async def list_entities(
        self,
        status: Optional[str] = None,
        domain: Optional[str] = None,
        area: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Dict[str, Any]:
        """List entities with optional filtering."""
        try:
            # Get all states from cache
            all_states = self.ha_client.state_cache

            filtered = []

            for entity_id, state_data in all_states.items():
                state = state_data.get("state", "")
                attributes = state_data.get("attributes", {})

                # Apply filters
                if status and state != status:
                    if status not in ["available", "unavailable", "unknown"]:
                        continue

                # Extract domain from entity_id
                entity_domain = entity_id.split(".")[0] if "." in entity_id else "unknown"

                if domain and entity_domain != domain:
                    continue

                entity_area = attributes.get("area_id") or attributes.get("area")
                if area and entity_area != area:
                    continue

                filtered.append(
                    {
                        "entity_id": entity_id,
                        "state": state,
                        "domain": entity_domain,
                        "friendly_name": attributes.get("friendly_name", entity_id),
                        "area": entity_area,
                        "integration": attributes.get("integration"),
                        "last_updated": state_data.get("last_updated"),
                    }
                )

            # Apply pagination
            total = len(filtered)
            entities = filtered[offset : offset + limit]

            return {
                "entities": entities,
                "total": total,
                "offset": offset,
                "has_more": (offset + limit) < total,
            }

        except Exception as e:
            logger.error(f"Error listing entities: {e}")
            return {
                "error": str(e),
                "code": "entity_list_error",
                "recoverable": True,
            }

    async def get_entity_details(self, entity_id: str) -> Dict[str, Any]:
        """Get full entity details."""
        try:
            state_data = self.ha_client.state_cache.get(entity_id)

            if not state_data:
                return {
                    "error": f"Entity {entity_id} not found",
                    "code": "entity_not_found",
                    "recoverable": False,
                }

            attributes = state_data.get("attributes", {})
            entity_domain = entity_id.split(".")[0] if "." in entity_id else "unknown"

            return {
                "entity_id": entity_id,
                "state": state_data.get("state"),
                "domain": entity_domain,
                "friendly_name": attributes.get("friendly_name", entity_id),
                "area": attributes.get("area_id") or attributes.get("area"),
                "integration": attributes.get("integration"),
                "device_id": attributes.get("device_id"),
                "attributes": attributes,
                "last_updated": state_data.get("last_updated"),
            }

        except Exception as e:
            logger.error(f"Error getting entity details: {e}")
            return {
                "error": str(e),
                "code": "entity_error",
                "recoverable": True,
            }

    async def rename_entity(self, entity_id: str, new_name: str) -> Dict[str, Any]:
        """Rename an entity."""
        try:
            # Validate entity exists
            if entity_id not in self.ha_client.state_cache:
                return {
                    "error": f"Entity {entity_id} not found",
                    "code": "entity_not_found",
                    "recoverable": False,
                }

            # Convert new_name to valid entity_id format (snake_case, lowercase)
            new_id_name = new_name.lower().replace(" ", "_").replace("-", "_")
            new_id_name = re.sub(r"[^a-z0-9_]", "", new_id_name)

            # Extract domain from old entity_id
            domain = entity_id.split(".")[0]
            new_entity_id = f"{domain}.{new_id_name}"

            # Check if new entity_id already exists
            if new_entity_id in self.ha_client.state_cache and new_entity_id != entity_id:
                return {
                    "error": f"Entity {new_entity_id} already exists",
                    "code": "entity_exists",
                    "recoverable": True,
                    "suggestion": f"Try {domain}.{new_id_name}_2",
                }

            # TODO: Call HA service to rename entity
            # For now, simulate the rename
            logger.info(f"Renaming {entity_id} to {new_entity_id}")

            return {
                "success": True,
                "old_id": entity_id,
                "new_id": new_entity_id,
            }

        except Exception as e:
            logger.error(f"Error renaming entity: {e}")
            return {
                "error": str(e),
                "code": "rename_error",
                "recoverable": True,
            }

    async def bulk_rename_entities(
        self,
        pattern_from: str,
        pattern_to: str,
        domain: Optional[str] = None,
        execute: bool = False,
    ) -> Dict[str, Any]:
        """Bulk rename entities using pattern matching."""
        try:
            proposed_changes = []

            for entity_id in self.ha_client.state_cache.keys():
                entity_domain = entity_id.split(".")[0]

                # Filter by domain if specified
                if domain and entity_domain != domain:
                    continue

                # Apply pattern matching
                entity_name = entity_id.split(".")[1]

                if "*" in pattern_from:
                    # Wildcard matching
                    pattern_regex = pattern_from.replace("*", ".*")
                    if not re.match(pattern_regex, entity_name):
                        continue

                    new_name = re.sub(pattern_from.replace("*", "(.*)"), pattern_to, entity_name)
                else:
                    # Exact match
                    if pattern_from not in entity_name:
                        continue

                    new_name = entity_name.replace(pattern_from, pattern_to)

                new_entity_id = f"{entity_domain}.{new_name}"

                proposed_changes.append(
                    {
                        "old_id": entity_id,
                        "new_id": new_entity_id,
                    }
                )

            if execute:
                # TODO: Execute the renames
                logger.info(f"Executing {len(proposed_changes)} entity renames")
                return {
                    "renamed": len(proposed_changes),
                    "failed": 0,
                    "details": proposed_changes,
                }
            else:
                # Return proposed changes for review
                return {
                    "renamed": 0,
                    "failed": 0,
                    "details": proposed_changes,
                    "message": "Dry-run mode: review changes and call again with execute=true",
                }

        except Exception as e:
            logger.error(f"Error in bulk rename: {e}")
            return {
                "error": str(e),
                "code": "bulk_rename_error",
                "recoverable": True,
            }

    async def remove_entity(self, entity_id: str, force: bool = False) -> Dict[str, Any]:
        """Remove an entity."""
        try:
            if entity_id not in self.ha_client.state_cache:
                return {
                    "error": f"Entity {entity_id} not found",
                    "code": "entity_not_found",
                    "recoverable": False,
                }

            # TODO: Check if entity is in use (unless force=True)
            # TODO: Call HA service to remove entity

            logger.info(f"Removing entity {entity_id}")

            return {
                "success": True,
                "removed_id": entity_id,
            }

        except Exception as e:
            logger.error(f"Error removing entity: {e}")
            return {
                "error": str(e),
                "code": "remove_error",
                "recoverable": True,
            }

    async def analyze_naming_consistency(self) -> Dict[str, Any]:
        """Analyze entity naming patterns for consistency."""
        try:
            issues = []
            patterns = {}

            for entity_id in self.ha_client.state_cache.keys():
                if "." not in entity_id:
                    continue

                domain, name = entity_id.split(".", 1)
                name_parts = name.split("_")

                # Track patterns by domain
                if domain not in patterns:
                    patterns[domain] = {"count": 0, "examples": []}

                patterns[domain]["count"] += 1
                if len(patterns[domain]["examples"]) < 5:
                    patterns[domain]["examples"].append(entity_id)

                # Check for issues
                # Mixed case
                if name != name.lower():
                    issues.append(
                        {
                            "entity_id": entity_id,
                            "issue": "mixed_case",
                            "suggestion": f"Use {entity_id.lower()}",
                        }
                    )

                # Very long names
                if len(name) > 50:
                    issues.append(
                        {
                            "entity_id": entity_id,
                            "issue": "overly_long",
                            "suggestion": f"Consider shorter name",
                        }
                    )

            return {
                "issues": issues[:20],  # Limit to 20 issues
                "total_issues": len(issues),
                "patterns": patterns,
            }

        except Exception as e:
            logger.error(f"Error analyzing naming: {e}")
            return {
                "error": str(e),
                "code": "analysis_error",
                "recoverable": True,
            }

    async def assign_entity_to_area(self, entity_id: str, area_name: str) -> Dict[str, Any]:
        """Assign an entity to an area."""
        try:
            if entity_id not in self.ha_client.state_cache:
                return {
                    "error": f"Entity {entity_id} not found",
                    "code": "entity_not_found",
                    "recoverable": False,
                }

            # TODO: Call HA service to assign entity to area

            logger.info(f"Assigning {entity_id} to area {area_name}")

            return {
                "success": True,
                "entity_id": entity_id,
                "new_area": area_name,
            }

        except Exception as e:
            logger.error(f"Error assigning entity to area: {e}")
            return {
                "error": str(e),
                "code": "assignment_error",
                "recoverable": True,
            }
