from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


OwnerType = Literal["network_admin", "operations", "compliance", "sla"]
RuleType = Literal[
    "block_node",
    "block_edge",
    "block_carrier",
    "prefer_node",
]
Severity = Literal["low", "medium", "high"]
TargetType = Literal["node", "edge", "corridor", "carrier", "global"]
EventType = Literal[
    "traffic_congestion",
    "weather_alert",
    "vehicle_breakdown",
    "facility_delay",
    "regulatory_delay",
]
RecommendationAction = Literal[
    "continue_with_watch",
    "reroute",
    "hold_and_escalate",
    "no_compliant_path",
]


class Node(BaseModel):
    id: str
    name: str
    state: str
    lat: float
    lng: float
    type: Literal["city", "hub", "warehouse"] = "city"


class Edge(BaseModel):
    id: str
    from_node: str
    to_node: str
    mode: Literal["road"] = "road"
    carrier: str
    distance_km: float
    base_eta_h: float
    base_cost: float
    cold_chain_capable: bool = True


class Corridor(BaseModel):
    id: str
    name: str
    source_node: str
    destination_node: str


class LoadProfile(BaseModel):
    id: str
    label: str
    min_temp_c: float
    max_temp_c: float
    max_transit_h: float
    weights: dict[str, float]


class PolicyLayer(BaseModel):
    id: str
    owner_type: OwnerType
    rule_type: RuleType
    applies_to: list[str] = Field(default_factory=list)
    params: dict[str, str | float | int | bool] = Field(default_factory=dict)
    priority: int = 100
    enabled: bool = True


class ScenarioEvent(BaseModel):
    id: str
    event_type: EventType
    severity: Severity
    target_type: TargetType
    target_values: list[str] = Field(default_factory=list)
    eta_multiplier: float = 1.0
    risk_delta: float = 0.0
    active: bool = True


class Shipment(BaseModel):
    id: str
    corridor_id: str
    source_node: str
    destination_node: str
    load_profile_id: str
    sla_eta_h: float
    status: Literal["in_transit", "pending", "delivered"] = "pending"


class PathOption(BaseModel):
    path_nodes: list[str]
    path_edges: list[str]
    eta_h: float
    cost: float
    risk: float
    compliance_risk: float = 0.0
    score: float
    score_breakdown: dict[str, float] = Field(default_factory=dict)
    reason_codes: list[str] = Field(default_factory=list)


class Recommendation(BaseModel):
    shipment_id: str
    action: RecommendationAction
    confidence: float
    chosen_path: PathOption | None = None
    alternatives: list[PathOption] = Field(default_factory=list)
    reason_codes: list[str] = Field(default_factory=list)
    expected_impact: dict[str, float] = Field(default_factory=dict)


class PolicyCreateRequest(BaseModel):
    owner_type: OwnerType
    rule_type: RuleType
    applies_to: list[str] = Field(default_factory=list)
    params: dict[str, str | float | int | bool] = Field(default_factory=dict)
    priority: int = 100
    enabled: bool = True


class PolicyUpdateRequest(BaseModel):
    owner_type: OwnerType | None = None
    rule_type: RuleType | None = None
    applies_to: list[str] | None = None
    params: dict[str, str | float | int | bool] | None = None
    priority: int | None = None
    enabled: bool | None = None


class DisruptionCreateRequest(BaseModel):
    event_type: EventType
    severity: Severity
    target_type: TargetType
    target_values: list[str] = Field(default_factory=list)
    eta_multiplier: float = 1.0
    risk_delta: float = 0.0
    active: bool = True


class ShipmentCreateRequest(BaseModel):
    corridor_id: str
    load_profile_id: str
    sla_eta_h: float


class ShipmentWithRecommendation(BaseModel):
    shipment: Shipment
    recommendation: Recommendation


class AuditEntry(BaseModel):
    id: str
    timestamp_utc: str
    entity_type: Literal["shipment", "policy", "disruption", "system"]
    entity_id: str
    action: str
    details: dict[str, str | float | int | bool | list[str]] = Field(default_factory=dict)


class HeroScenarioResult(BaseModel):
    shipments_seeded: int
    disruptions_seeded: int
    policies_seeded: int
    notes: str


class OverviewResponse(BaseModel):
    active_shipments: int
    active_disruptions: int
    policies_enabled: int
    corridors_supported: int
