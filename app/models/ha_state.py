"""Home Assistant state and entity models."""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class HAEntity(BaseModel):
    """Home Assistant entity model."""

    entity_id: str = Field(..., description="Unique entity ID (domain.name)")
    state: str = Field(..., description="Current state")
    friendly_name: Optional[str] = Field(default=None, description="User-friendly name")
    area: Optional[str] = Field(default=None, description="Area assignment")
    domain: Optional[str] = Field(default=None, description="Entity domain (light, sensor, etc)")
    integration: Optional[str] = Field(default=None, description="Integration that owns this entity")
    device_id: Optional[str] = Field(default=None, description="Associated device ID")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Entity attributes")
    last_changed: Optional[datetime] = Field(default=None, description="Last state change time")
    last_updated: Optional[datetime] = Field(default=None, description="Last update time")


class HAIntegration(BaseModel):
    """Home Assistant integration status."""

    name: str = Field(..., description="Integration name")
    domain: str = Field(..., description="Integration domain")
    loaded: bool = Field(..., description="Integration is loaded")
    status: str = Field(..., description="Status: online|error|unknown")
    error_message: Optional[str] = Field(default=None, description="Error details if status=error")
    device_count: int = Field(default=0, description="Number of devices")
    version: Optional[str] = Field(default=None, description="Integration version")


class HADevice(BaseModel):
    """Home Assistant device model."""

    device_id: str = Field(..., description="Unique device ID")
    name: str = Field(..., description="Device name")
    manufacturer: Optional[str] = Field(default=None, description="Device manufacturer")
    model: Optional[str] = Field(default=None, description="Device model")
    area: Optional[str] = Field(default=None, description="Area assignment")
    integration: str = Field(..., description="Integration domain")
    entities: List[str] = Field(default_factory=list, description="Associated entity IDs")


class HAAutomation(BaseModel):
    """Home Assistant automation model."""

    id: str = Field(..., description="Automation ID")
    alias: str = Field(..., description="Automation name/alias")
    enabled: bool = Field(..., description="Automation is enabled")
    trigger: Dict[str, Any] = Field(..., description="Automation trigger")
    condition: Optional[list] = Field(default=None, description="Optional conditions")
    action: list = Field(..., description="Actions to execute")
    description: Optional[str] = Field(default=None, description="Automation description")


class HAZigbeeDevice(BaseModel):
    """Zigbee device information."""

    ieee_address: str = Field(..., description="IEEE address")
    nwk: int = Field(..., description="Network address")
    node_desc: Optional[str] = Field(default=None, description="Node descriptor")
    manufacturer: str = Field(..., description="Device manufacturer")
    model: str = Field(..., description="Device model")
    application_version: Optional[int] = Field(default=None, description="Application version")
    stack_version: Optional[int] = Field(default=None, description="Stack version")
    zha_device_handlers: Optional[str] = Field(default=None, description="ZHA device handlers")
    power_source: Optional[str] = Field(default=None, description="Power source type")
    lqi: Optional[int] = Field(default=None, description="Link quality indicator")
    rssi: Optional[int] = Field(default=None, description="Signal strength")
    last_seen: Optional[datetime] = Field(default=None, description="Last communication time")


class HAZWaveDevice(BaseModel):
    """Z-Wave device information."""

    node_id: int = Field(..., description="Z-Wave node ID")
    name: str = Field(..., description="Device name")
    manufacturer: Optional[str] = Field(default=None, description="Device manufacturer")
    model: Optional[str] = Field(default=None, description="Device model")
    device_type: Optional[str] = Field(default=None, description="Z-Wave device type")
    status: str = Field(..., description="Device status")
    is_failed: bool = Field(default=False, description="Device communication failed")
    is_sleeping: bool = Field(default=False, description="Device is sleeping")
    query_stage: Optional[str] = Field(default=None, description="Query stage")


class StateChangedEvent(BaseModel):
    """Home Assistant state_changed event."""

    entity_id: str = Field(..., description="Entity ID that changed")
    old_state: Optional[HAEntity] = Field(default=None, description="Previous state")
    new_state: HAEntity = Field(..., description="New state")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event timestamp")
