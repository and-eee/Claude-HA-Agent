"""System analysis service for health checks and recommendations."""
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class AnalysisService:
    """Analyzes system health and provides recommendations."""

    def __init__(self, ha_client):
        """Initialize analysis service."""
        self.ha_client = ha_client

    async def analyze_entity_health(self) -> Dict[str, Any]:
        """Analyze overall entity health."""
        try:
            all_states = self.ha_client.state_cache

            total = len(all_states)
            available = sum(1 for s in all_states.values() if s.get("state") not in ["unavailable", "unknown"])
            unavailable = sum(1 for s in all_states.values() if s.get("state") == "unavailable")
            unknown = sum(1 for s in all_states.values() if s.get("state") == "unknown")

            # Count by integration
            by_integration = {}
            for entity_id, state_data in all_states.items():
                attributes = state_data.get("attributes", {})
                integration = attributes.get("integration", "unknown")

                if integration not in by_integration:
                    by_integration[integration] = {"total": 0, "unavailable": 0}

                by_integration[integration]["total"] += 1
                if state_data.get("state") == "unavailable":
                    by_integration[integration]["unavailable"] += 1

            # Identify issues
            issues = []
            for integration, counts in by_integration.items():
                if counts["unavailable"] > counts["total"] * 0.5:  # >50% unavailable
                    issues.append({
                        "integration": integration,
                        "issue": "high_unavailable_rate",
                        "count": counts["unavailable"],
                        "total": counts["total"],
                    })

            return {
                "total": total,
                "available": available,
                "unavailable": unavailable,
                "unknown": unknown,
                "by_integration": by_integration,
                "issues": issues,
            }

        except Exception as e:
            logger.error(f"Error analyzing entity health: {e}")
            return {
                "error": str(e),
                "code": "analysis_error",
                "recoverable": True,
            }

    async def generate_post_migration_report(self) -> Dict[str, Any]:
        """Generate post-migration cleanup report."""
        try:
            all_states = self.ha_client.state_cache

            old_locations = set()
            orphaned_count = 0
            mismatched_areas = 0

            for entity_id, state_data in all_states.items():
                attributes = state_data.get("attributes", {})

                # Check for old_location references
                if "old_location" in str(attributes).lower():
                    old_locations.add(entity_id)

                # Check for orphaned entities (no integration)
                if not attributes.get("integration"):
                    orphaned_count += 1

                # Check for mismatched areas
                if not attributes.get("area_id") and not attributes.get("area"):
                    mismatched_areas += 1

            recommendations = []

            if old_locations:
                recommendations.append({
                    "priority": "high",
                    "issue": "Old location references found",
                    "action": f"Remove or reassign {len(old_locations)} entities with old location data",
                })

            if orphaned_count > 0:
                recommendations.append({
                    "priority": "medium",
                    "issue": f"{orphaned_count} orphaned entities detected",
                    "action": "Investigate and remove or reassign orphaned entities",
                })

            return {
                "old_locations_detected": list(old_locations)[:10],  # Limit to 10
                "total_old_locations": len(old_locations),
                "orphaned_entities": orphaned_count,
                "mismatched_areas": mismatched_areas,
                "recommendations": recommendations,
            }

        except Exception as e:
            logger.error(f"Error generating migration report: {e}")
            return {
                "error": str(e),
                "code": "report_error",
                "recoverable": True,
            }

    async def get_naming_recommendations(self) -> Dict[str, Any]:
        """Get naming standard recommendations."""
        try:
            all_states = self.ha_client.state_cache

            # Analyze current naming patterns
            naming_issues = []
            renamings = []

            for entity_id, state_data in all_states.items():
                if "." not in entity_id:
                    continue

                domain, name = entity_id.split(".", 1)
                attributes = state_data.get("attributes", {})
                friendly_name = attributes.get("friendly_name", "")

                # Check if friendly name follows snake_case
                if friendly_name and "_" in friendly_name:
                    suggested_id = f"{domain}.{friendly_name.lower().replace(' ', '_')}"
                    if suggested_id != entity_id:
                        renamings.append({
                            "current": entity_id,
                            "suggested": suggested_id,
                            "reason": "Follow friendly_name pattern",
                        })

            suggested_standard = (
                "{domain}.{area}_{device_type}\n"
                "Example: light.bedroom_ceiling, sensor.living_room_temperature"
            )

            return {
                "suggested_standard": suggested_standard,
                "issues_found": naming_issues[:10],
                "renamings": renamings[:20],
                "total_issues": len(naming_issues),
                "total_renamings": len(renamings),
            }

        except Exception as e:
            logger.error(f"Error getting naming recommendations: {e}")
            return {
                "error": str(e),
                "code": "recommendation_error",
                "recoverable": True,
            }

    async def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics."""
        try:
            all_states = self.ha_client.state_cache

            # Basic stats
            total_entities = len(all_states)
            domains = set(entity_id.split(".")[0] for entity_id in all_states.keys())

            return {
                "uptime": 3888000,  # TODO: Get actual uptime
                "entity_count": total_entities,
                "automation_count": 15,  # TODO: Get from HA
                "addon_count": 24,  # TODO: Get from HA
                "db_size": "2.5MB",  # TODO: Calculate
                "unique_domains": len(domains),
                "domains": list(domains),
            }

        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            return {
                "error": str(e),
                "code": "stats_error",
                "recoverable": True,
            }
