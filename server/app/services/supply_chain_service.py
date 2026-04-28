from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import UTC, datetime
from itertools import count

from app.db import db
from app.events.event_bus import publish_disruption_created, publish_shipment_updated
from app.models.supply_chain import (
    AuditEntry,
    Corridor,
    DisruptionCreateRequest,
    Edge,
    HeroScenarioResult,
    LoadProfile,
    Node,
    OverviewResponse,
    PathOption,
    PolicyCreateRequest,
    PolicyLayer,
    PolicyUpdateRequest,
    Recommendation,
    ScenarioEvent,
    Shipment,
    ShipmentCreateRequest,
    ShipmentWithRecommendation,
)
from app.utils.maps import maps_client
from app.utils.weather import weather_client


@dataclass
class ServiceState:
    nodes: dict[str, Node]
    edges: dict[str, Edge]
    corridors: dict[str, Corridor]
    load_profiles: dict[str, LoadProfile]
    policies: dict[str, PolicyLayer]
    disruptions: dict[str, ScenarioEvent]
    shipments: dict[str, Shipment]
    recommendations: dict[str, Recommendation]
    audit_log: list[AuditEntry]


class SupplyChainService:
    def __init__(self) -> None:
        self._policy_counter = count(10)
        self._event_counter = count(10)
        self._shipment_counter = count(100)
        self._audit_counter = count(1)
        self._maps_enriched = False
        self._load_or_seed()

    def _load_or_seed(self):
        if db.has_data():
            self._state = self._load_state()
            print("[Startup] Loaded data from database")
        else:
            self._state = self._seed_state()
            self._persist_all()
            print("[Startup] Seeded fresh data")

    def _load_state(self) -> ServiceState:
        return ServiceState(
            nodes=db.load_nodes(),
            edges=db.load_edges(),
            corridors=db.load_corridors(),
            load_profiles=db.load_load_profiles(),
            policies=db.load_policies(),
            disruptions=db.load_disruptions(),
            shipments=db.load_shipments(),
            recommendations={},
            audit_log=[],
        )

    def _persist_all(self):
        db.save_nodes(self._state.nodes)
        db.save_edges(self._state.edges)
        db.save_corridors(self._state.corridors)
        db.save_load_profiles(self._state.load_profiles)
        db.save_policies(self._state.policies)
        db.save_disruptions(self._state.disruptions)
        db.save_shipments(self._state.shipments)

    async def enrich_with_google_maps(self) -> dict[str, Any]:
        if not maps_client.is_enabled():
            return {"enabled": False, "message": "Google Maps API not configured"}
        if self._maps_enriched:
            return {"enabled": True, "message": "Already enriched", "updated": 0}
        updated = 0
        for edge in self._state.edges.values():
            origin = self._state.nodes.get(edge.from_node)
            dest = self._state.nodes.get(edge.to_node)
            if not origin or not dest:
                continue
            route_info = await maps_client.get_route_info(
                origin.lat, origin.lng, dest.lat, dest.lng
            )
            if route_info and route_info.distance_km > 0:
                edge.distance_km = route_info.distance_km
                edge.base_eta_h = route_info.duration_minutes / 60
                updated += 1
        self._maps_enriched = True
        return {"enabled": True, "updated": updated, "message": f"Enriched {updated} routes"}

    def _seed_state(self) -> ServiceState:
        nodes = {
            "mumbai": Node(id="mumbai", name="Mumbai", state="Maharashtra", lat=19.076, lng=72.8777),
            "pune": Node(id="pune", name="Pune", state="Maharashtra", lat=18.5204, lng=73.8567),
            "ahmedabad": Node(id="ahmedabad", name="Ahmedabad", state="Gujarat", lat=23.0225, lng=72.5714),
            "delhi": Node(id="delhi", name="Delhi", state="NCT", lat=28.6139, lng=77.209),
            "lucknow": Node(id="lucknow", name="Lucknow", state="Uttar Pradesh", lat=26.8467, lng=80.9462),
            "hyderabad": Node(id="hyderabad", name="Hyderabad", state="Telangana", lat=17.385, lng=78.4867),
            "bengaluru": Node(id="bengaluru", name="Bengaluru", state="Karnataka", lat=12.9716, lng=77.5946),
            "chennai": Node(id="chennai", name="Chennai", state="Tamil Nadu", lat=13.0827, lng=80.2707),
            "nagpur": Node(id="nagpur", name="Nagpur", state="Maharashtra", lat=21.1458, lng=79.0882),
            "kolkata": Node(id="kolkata", name="Kolkata", state="West Bengal", lat=22.5726, lng=88.3639),
            "cochin": Node(id="cochin", name="Cochin", state="Kerala", lat=9.9312, lng=76.2673),
            "chandigarh": Node(id="chandigarh", name="Chandigarh", state="Punjab/Haryana", lat=30.7333, lng=76.7794),
            "jaipur": Node(id="jaipur", name="Jaipur", state="Rajasthan", lat=26.9124, lng=75.7873),
            "surat": Node(id="surat", name="Surat", state="Gujarat", lat=21.1702, lng=72.8311),
            "indore": Node(id="indore", name="Indore", state="Madhya Pradesh", lat=22.7196, lng=75.8577),
            "bhopal": Node(id="bhopal", name="Bhopal", state="Madhya Pradesh", lat=23.2599, lng=77.4126),
            "patna": Node(id="patna", name="Patna", state="Bihar", lat=25.5941, lng=85.1376),
            "guwahati": Node(id="guwahati", name="Guwahati", state="Assam", lat=26.1445, lng=91.7362),
            "visakhapatnam": Node(id="visakhapatnam", name="Visakhapatnam", state="Andhra Pradesh", lat=17.6868, lng=83.2185),
            "vijayawada": Node(id="vijayawada", name="Vijayawada", state="Andhra Pradesh", lat=16.5062, lng=80.6480),
            "trivandrum": Node(id="trivandrum", name="Trivandrum", state="Kerala", lat=8.5241, lng=76.9362),
            "kanpur": Node(id="kanpur", name="Kanpur", state="Uttar Pradesh", lat=26.4499, lng=80.3319),
            "agra": Node(id="agra", name="Agra", state="Uttar Pradesh", lat=27.1767, lng=78.0081),
            "raipur": Node(id="raipur", name="Raipur", state="Chhattisgarh", lat=21.2514, lng=81.6296),
            "bhubaneswar": Node(id="bhubaneswar", name="Bhubaneswar", state="Odisha", lat=20.2961, lng=85.8245),
        }

        carriers = ["medigo", "pharmalink", "coldswift", "northcare", "tempcontrol", "quickcold", "pharmatrans"]
        edges = {}

        def add_edge(eid, frm, to, dist, eta, cost):
            edges[eid] = Edge(id=eid, from_node=frm, to_node=to, carrier=random.choice(carriers),
                             distance_km=dist, base_eta_h=eta, base_cost=cost)

        connections = [
            ("mumbai", "pune", 150, 3.5, 12000), ("pune", "mumbai", 150, 3.5, 12000),
            ("mumbai", "ahmedabad", 530, 10.5, 36000), ("ahmedabad", "mumbai", 530, 10.5, 36000),
            ("mumbai", "nagpur", 820, 14, 47000), ("nagpur", "mumbai", 820, 14, 47000),
            ("mumbai", "surat", 400, 8, 28000), ("surat", "mumbai", 400, 8, 28000),
            ("mumbai", "indore", 670, 12, 42000), ("indore", "mumbai", 670, 12, 42000),
            ("delhi", "lucknow", 550, 10, 34000), ("lucknow", "delhi", 550, 10, 34000),
            ("delhi", "chandigarh", 250, 5, 18000), ("chandigarh", "delhi", 250, 5, 18000),
            ("delhi", "jaipur", 280, 5.5, 20000), ("jaipur", "delhi", 280, 5.5, 20000),
            ("delhi", "kanpur", 480, 9, 32000), ("kanpur", "delhi", 480, 9, 32000),
            ("delhi", "agra", 230, 4.5, 16000), ("agra", "delhi", 230, 4.5, 16000),
            ("delhi", "patna", 1000, 18, 58000), ("patna", "delhi", 1000, 18, 58000),
            ("delhi", "nagpur", 1050, 19, 56000), ("nagpur", "delhi", 1050, 19, 56000),
            ("nagpur", "hyderabad", 500, 9, 33000), ("hyderabad", "nagpur", 500, 9, 33000),
            ("nagpur", "bhopal", 320, 6.5, 24000), ("bhopal", "nagpur", 320, 6.5, 24000),
            ("nagpur", "raipur", 280, 5.5, 21000), ("raipur", "nagpur", 280, 5.5, 21000),
            ("hyderabad", "bengaluru", 570, 11, 35000), ("bengaluru", "hyderabad", 570, 11, 35000),
            ("hyderabad", "chennai", 630, 12, 36500), ("chennai", "hyderabad", 630, 12, 36500),
            ("hyderabad", "visakhapatnam", 620, 11.5, 38000), ("visakhapatnam", "hyderabad", 620, 11.5, 38000),
            ("hyderabad", "vijayawada", 260, 5, 19000), ("vijayawada", "hyderabad", 260, 5, 19000),
            ("bengaluru", "chennai", 350, 7, 23000), ("chennai", "bengaluru", 350, 7, 23000),
            ("bengaluru", "cochin", 550, 10, 34000), ("cochin", "bengaluru", 550, 10, 34000),
            ("bengaluru", "trivandrum", 680, 13, 42000), ("trivandrum", "bengaluru", 680, 13, 42000),
            ("chennai", "cochin", 580, 11, 36000), ("cochin", "chennai", 580, 11, 36000),
            ("chennai", "trivandrum", 650, 12, 40000), ("trivandrum", "chennai", 650, 12, 40000),
            ("cochin", "trivandrum", 300, 6, 22000), ("trivandrum", "cochin", 300, 6, 22000),
            ("kolkata", "patna", 300, 6, 22000), ("patna", "kolkata", 300, 6, 22000),
            ("kolkata", "guwahati", 1050, 20, 62000), ("guwahati", "kolkata", 1050, 20, 62000),
            ("kolkata", "bhubaneswar", 440, 8.5, 30000), ("bhubaneswar", "kolkata", 440, 8.5, 30000),
            ("bhopal", "indore", 200, 4, 15000), ("indore", "bhopal", 200, 4, 15000),
            ("raipur", "bhubaneswar", 450, 9, 32000), ("bhubaneswar", "raipur", 450, 9, 32000),
            ("lucknow", "kanpur", 180, 4, 14000), ("kanpur", "lucknow", 180, 4, 14000),
            ("jaipur", "ahmedabad", 460, 9, 31000), ("ahmedabad", "jaipur", 460, 9, 31000),
            ("chandigarh", "jaipur", 380, 7.5, 26000), ("jaipur", "chandigarh", 380, 7.5, 26000),
            ("indore", "bhopal", 200, 4, 15000), ("bhopal", "indore", 200, 4, 15000),
        ]
        for i, (frm, to, dist, eta, cost) in enumerate(connections):
            add_edge(f"e_{i}", frm, to, dist, eta, cost)

        corridors = {
            "corr_mumbai_pune": Corridor(id="corr_mumbai_pune", name="Mumbai ↔ Pune", source_node="mumbai", destination_node="pune"),
            "corr_mumbai_ahmedabad": Corridor(id="corr_mumbai_ahmedabad", name="Mumbai ↔ Ahmedabad", source_node="mumbai", destination_node="ahmedabad"),
            "corr_mumbai_nagpur": Corridor(id="corr_mumbai_nagpur", name="Mumbai ↔ Nagpur", source_node="mumbai", destination_node="nagpur"),
            "corr_delhi_lucknow": Corridor(id="corr_delhi_lucknow", name="Delhi ↔ Lucknow", source_node="delhi", destination_node="lucknow"),
            "corr_delhi_chandigarh": Corridor(id="corr_delhi_chandigarh", name="Delhi ↔ Chandigarh", source_node="delhi", destination_node="chandigarh"),
            "corr_delhi_jaipur": Corridor(id="corr_delhi_jaipur", name="Delhi ↔ Jaipur", source_node="delhi", destination_node="jaipur"),
            "corr_hyderabad_bengaluru": Corridor(id="corr_hyderabad_bengaluru", name="Hyderabad ↔ Bengaluru", source_node="hyderabad", destination_node="bengaluru"),
            "corr_hyderabad_chennai": Corridor(id="corr_hyderabad_chennai", name="Hyderabad ↔ Chennai", source_node="hyderabad", destination_node="chennai"),
            "corr_bengaluru_chennai": Corridor(id="corr_bengaluru_chennai", name="Bengaluru ↔ Chennai", source_node="bengaluru", destination_node="chennai"),
            "corr_bengaluru_cochin": Corridor(id="corr_bengaluru_cochin", name="Bengaluru ↔ Cochin", source_node="bengaluru", destination_node="cochin"),
            "corr_kolkata_guwahati": Corridor(id="corr_kolkata_guwahati", name="Kolkata ↔ Guwahati", source_node="kolkata", destination_node="guwahati"),
            "corr_kolkata_patna": Corridor(id="corr_kolkata_patna", name="Kolkata ↔ Patna", source_node="kolkata", destination_node="patna"),
            "corr_nagpur_hyderabad": Corridor(id="corr_nagpur_hyderabad", name="Nagpur ↔ Hyderabad", source_node="nagpur", destination_node="hyderabad"),
            "corr_surat_mumbai": Corridor(id="corr_surat_mumbai", name="Surat ↔ Mumbai", source_node="surat", destination_node="mumbai"),
            "corr_indore_mumbai": Corridor(id="corr_indore_mumbai", name="Indore ↔ Mumbai", source_node="indore", destination_node="mumbai"),
        }

        load_profiles = {
            "cold_chain": LoadProfile(id="cold_chain", label="Cold Chain 2-8°C", min_temp_c=2, max_temp_c=8, max_transit_h=30,
                weights={"eta": 0.35, "cost": 0.2, "sla": 0.25, "risk": 0.2}),
            "frozen": LoadProfile(id="frozen", label="Frozen -18°C", min_temp_c=-25, max_temp_c=-15, max_transit_h=24,
                weights={"eta": 0.45, "cost": 0.15, "sla": 0.25, "risk": 0.15}),
            "fragile": LoadProfile(id="fragile", label="Fragile", min_temp_c=2, max_temp_c=8, max_transit_h=48,
                weights={"eta": 0.3, "cost": 0.25, "sla": 0.3, "risk": 0.15}),
            "standard": LoadProfile(id="standard", label="Standard", min_temp_c=15, max_temp_c=25, max_transit_h=72,
                weights={"eta": 0.25, "cost": 0.3, "sla": 0.2, "risk": 0.25}),
            "heavy": LoadProfile(id="heavy", label="Heavy Cargo", min_temp_c=0, max_temp_c=40, max_transit_h=96,
                weights={"eta": 0.2, "cost": 0.4, "sla": 0.2, "risk": 0.2}),
            "express": LoadProfile(id="express", label="Express", min_temp_c=0, max_temp_c=30, max_transit_h=12,
                weights={"eta": 0.5, "cost": 0.3, "sla": 0.15, "risk": 0.05}),
        }

        policies = {
            "policy_1": PolicyLayer(id="policy_1", owner_type="operations", rule_type="prefer_node",
                applies_to=["nagpur"], params={"notes": "Strategic relief hub"}, priority=120, enabled=True),
            "policy_2": PolicyLayer(id="policy_2", owner_type="compliance", rule_type="block_carrier",
                applies_to=["tempcontrol"], params={"reason": "Quality audit pending"}, priority=5, enabled=True),
            "policy_3": PolicyLayer(id="policy_3", owner_type="sla", rule_type="prefer_node",
                applies_to=["bengaluru", "hyderabad"], params={"notes": "Premium SLA tier"}, priority=80, enabled=True),
            "policy_4": PolicyLayer(id="policy_4", owner_type="operations", rule_type="block_node",
                applies_to=["chandigarh"], params={"notes": "Winter restrictions"}, priority=50, enabled=False),
        }

        disruptions: dict[str, ScenarioEvent] = {}
        shipments: dict[str, Shipment] = {}
        recommendations: dict[str, Recommendation] = {}

        return ServiceState(
            nodes=nodes, edges=edges, corridors=corridors, load_profiles=load_profiles,
            policies=policies, disruptions=disruptions, shipments=shipments,
            recommendations=recommendations, audit_log=[],
        )

    def list_corridors(self) -> list[Corridor]:
        return sorted(self._state.corridors.values(), key=lambda item: item.name)

    def list_load_profiles(self) -> list[LoadProfile]:
        return sorted(self._state.load_profiles.values(), key=lambda item: item.label)

    def list_policies(self) -> list[PolicyLayer]:
        return sorted(
            self._state.policies.values(),
            key=lambda item: (item.priority, item.id),
        )

    def create_policy(self, request: PolicyCreateRequest) -> PolicyLayer:
        policy_id = f"policy_{next(self._policy_counter)}"
        policy = PolicyLayer(id=policy_id, **request.model_dump())
        self._state.policies[policy.id] = policy
        self._record_audit(
            entity_type="policy",
            entity_id=policy.id,
            action="policy_created",
            details={
                "rule_type": policy.rule_type,
                "owner_type": policy.owner_type,
                "enabled": policy.enabled,
            },
        )
        self._recompute_all_shipments()
        db.save_policies(self._state.policies)
        return policy

    def update_policy(self, policy_id: str, request: PolicyUpdateRequest) -> PolicyLayer:
        policy = self._state.policies[policy_id]
        updates = request.model_dump(exclude_none=True)
        merged = policy.model_dump()
        merged.update(updates)
        updated = PolicyLayer(**merged)
        self._state.policies[policy_id] = updated
        self._record_audit(
            entity_type="policy",
            entity_id=policy_id,
            action="policy_updated",
            details={"updated_fields": list(updates.keys())},
        )
        self._recompute_all_shipments()
        db.save_policies(self._state.policies)
        return updated

    def list_disruptions(self) -> list[ScenarioEvent]:
        return sorted(self._state.disruptions.values(), key=lambda item: item.id)

    def create_disruption(self, request: DisruptionCreateRequest) -> ScenarioEvent:
        disruption_id = f"event_{next(self._event_counter)}"
        disruption = ScenarioEvent(id=disruption_id, **request.model_dump())
            self._state.disruptions[disruption.id] = disruption
            self._record_audit(
                entity_type="disruption",
                entity_id=disruption.id,
                action="disruption_created",
                details={
                    "target_type": disruption.target_type,
                    "severity": disruption.severity,
                },
            )
            db.save_disruptions(self._state.disruptions)
            await publish_disruption_created(disruption.model_dump())
            return disruption

    def list_shipments(self) -> list[ShipmentWithRecommendation]:
        entries = []
        for shipment in self._state.shipments.values():
            recommendation = self._state.recommendations.get(shipment.id)
            if recommendation is None:
                recommendation = self._compute_recommendation(shipment)
                self._state.recommendations[shipment.id] = recommendation
            entries.append(
                ShipmentWithRecommendation(
                    shipment=shipment,
                    recommendation=recommendation,
                )
            )
        return sorted(entries, key=lambda item: item.shipment.id)

    def get_shipment(self, shipment_id: str) -> ShipmentWithRecommendation:
        shipment = self._state.shipments[shipment_id]
        recommendation = self._state.recommendations.get(shipment_id)
        if recommendation is None:
            recommendation = self._compute_recommendation(shipment)
            self._state.recommendations[shipment.id] = recommendation
        return ShipmentWithRecommendation(shipment=shipment, recommendation=recommendation)

    def create_shipment(self, request: ShipmentCreateRequest) -> ShipmentWithRecommendation:
        corridor = self._state.corridors[request.corridor_id]
        if request.load_profile_id not in self._state.load_profiles:
            raise KeyError("Invalid load profile")
        shipment_id = f"ship_{next(self._shipment_counter)}"
        shipment = Shipment(
            id=shipment_id,
            corridor_id=request.corridor_id,
            source_node=corridor.source_node,
            destination_node=corridor.destination_node,
            load_profile_id=request.load_profile_id,
            sla_eta_h=request.sla_eta_h,
            status="pending",
        )
        self._state.shipments[shipment.id] = shipment
        recommendation = self._compute_recommendation(shipment)
        self._state.recommendations[shipment.id] = recommendation
        self._record_audit(
            entity_type="shipment",
            entity_id=shipment.id,
            action="shipment_created",
            details={
                "corridor_id": shipment.corridor_id,
                "load_profile_id": shipment.load_profile_id,
                "sla_eta_h": shipment.sla_eta_h,
            },
        )
        db.save_shipments(self._state.shipments)
        await publish_shipment_updated(shipment.model_dump(), recommendation.model_dump())
        return ShipmentWithRecommendation(shipment=shipment, recommendation=recommendation)

    def recompute_shipment(self, shipment_id: str) -> ShipmentWithRecommendation:
        shipment = self._state.shipments[shipment_id]
        recommendation = self._compute_recommendation(shipment)
        self._state.recommendations[shipment.id] = recommendation
        self._record_audit(
            entity_type="shipment",
            entity_id=shipment_id,
            action="recommendation_recomputed",
            details={
                "action": recommendation.action,
                "confidence": recommendation.confidence,
            },
        )
        return ShipmentWithRecommendation(shipment=shipment, recommendation=recommendation)

    def seed_rich_demo(self) -> HeroScenarioResult:
        created_shipments = 0
        created_disruptions = 0

        if not self._state.disruptions:
            disruptions_data = [
                ("weather_alert", "high", "corridor", ["corr_mumbai_nagpur"], 1.6, 2.8),
                ("weather_alert", "medium", "node", ["nagpur"], 1.3, 1.2),
                ("traffic_congestion", "high", "corridor", ["corr_delhi_jaipur"], 1.45, 1.8),
                ("vehicle_breakdown", "medium", "edge", ["e_5"], 1.2, 0.9),
                ("facility_delay", "high", "node", ["kolkata"], 1.5, 2.0),
                ("regulatory_delay", "low", "node", ["guwahati"], 1.1, 0.5),
                ("weather_alert", "medium", "corridor", ["corr_hyderabad_bengaluru"], 1.25, 1.1),
                ("traffic_congestion", "low", "corridor", ["corr_mumbai_pune"], 1.15, 0.6),
            ]
            for et, sev, tt, tv, eta_mult, risk_d in disruptions_data:
                self.create_disruption(DisruptionCreateRequest(
                    event_type=et, severity=sev, target_type=tt, target_values=tv,
                    eta_multiplier=eta_mult, risk_delta=risk_d, active=True))
                created_disruptions += 1

        corridor_ids = list(self._state.corridors.keys())
        profile_ids = list(self._state.load_profiles.keys())

        shipment_configs = [
            ("corr_mumbai_pune", "cold_chain", 4, "in_transit"),
            ("corr_mumbai_nagpur", "frozen", 15, "in_transit"),
            ("corr_delhi_lucknow", "express", 12, "in_transit"),
            ("corr_delhi_jaipur", "standard", 8, "in_transit"),
            ("corr_hyderabad_bengaluru", "fragile", 20, "in_transit"),
            ("corr_hyderabad_chennai", "cold_chain", 14, "pending"),
            ("corr_bengaluru_cochin", "frozen", 10, "in_transit"),
            ("corr_kolkata_guwahati", "heavy", 25, "pending"),
            ("corr_nagpur_hyderabad", "standard", 11, "in_transit"),
            ("corr_surat_mumbai", "fragile", 6, "in_transit"),
            ("corr_indore_mumbai", "standard", 18, "in_transit"),
            ("corr_bengaluru_chennai", "express", 9, "pending"),
            ("corr_delhi_chandigarh", "cold_chain", 5, "in_transit"),
            ("corr_mumbai_ahmedabad", "heavy", 22, "in_transit"),
            ("corr_kolkata_patna", "standard", 7, "in_transit"),
            ("corr_raipur_bhubaneswar", "cold_chain", 13, "pending"),
            ("corr_trivandrum_cochin", "fragile", 3, "in_transit"),
            ("corr_jaipur_ahmedabad", "heavy", 16, "in_transit"),
            ("corr_visakhapatnam_hyderabad", "express", 8, "pending"),
            ("corr_lucknow_kanpur", "standard", 5, "in_transit"),
        ]

        for corridor, profile, sla, status in shipment_configs:
            if corridor in corridor_ids and profile in profile_ids:
                self.create_shipment(ShipmentCreateRequest(
                    corridor_id=corridor, load_profile_id=profile, sla_eta_h=sla))
                created_shipments += 1
                if len(self._state.shipments) > 0:
                    last_shipment = list(self._state.shipments.values())[-1]
                    last_shipment.status = status

        self._record_audit(entity_type="system", entity_id="seed_rich",
            action="rich_demo_seeded", details={"shipments": created_shipments, "disruptions": created_disruptions})
        self._recompute_all_shipments()

        return HeroScenarioResult(shipments_seeded=created_shipments,
            disruptions_seeded=created_disruptions, policies_seeded=0,
            notes=f"Rich demo: {created_shipments} shipments, {created_disruptions} active disruptions")

    def seed_50_shipments(self) -> dict[str, Any]:
        if self._state.shipments:
            return {"status": "skipped", "message": "Shipments already exist. Reset first."}

        profile_ids = list(self._state.load_profiles.keys())
        edge_ids = list(self._state.edges.keys())
        statuses = ["in_transit", "pending", "delivered"]
        sla_range = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]

        priority_corridors = [
            "corr_bengaluru_chennai", "corr_bengaluru_cochin",
            "corr_delhi_chandigarh", "corr_delhi_jaipur", "corr_delhi_lucknow",
            "corr_hyderabad_bengaluru"
        ]

        distribution = [
            ("corr_bengaluru_chennai", 3),
            ("corr_bengaluru_cochin", 3),
            ("corr_delhi_chandigarh", 4),
            ("corr_delhi_jaipur", 3),
            ("corr_delhi_lucknow", 4),
            ("corr_hyderabad_bengaluru", 3),
            ("corr_mumbai_pune", 2),
            ("corr_mumbai_ahmedabad", 2),
            ("corr_mumbai_nagpur", 2),
            ("corr_hyderabad_chennai", 2),
            ("corr_kolkata_guwahati", 2),
            ("corr_kolkata_patna", 2),
            ("corr_nagpur_hyderabad", 2),
            ("corr_surat_mumbai", 2),
            ("corr_indore_mumbai", 2),
        ]

        created = 0
        for corridor_id, count in distribution:
            if created >= 50:
                break
            if corridor_id not in self._state.corridors:
                continue
            for j in range(count):
                if created >= 50:
                    break
                profile_id = profile_ids[j % len(profile_ids)]
                sla = sla_range[j % len(sla_range)]
                status = statuses[j % len(statuses)]
                try:
                    self.create_shipment(ShipmentCreateRequest(
                        corridor_id=corridor_id, load_profile_id=profile_id, sla_eta_h=sla))
                    if len(self._state.shipments) > 0:
                        last_shipment = list(self._state.shipments.values())[-1]
                        last_shipment.status = status
                    created += 1
                except Exception:
                    pass

        disruptions_data = [
            ("weather_alert", "high", "node", ["mumbai"], 1.5, 2.5),
            ("weather_alert", "medium", "node", ["delhi"], 1.25, 1.2),
            ("traffic_congestion", "high", "corridor", ["corr_mumbai_pune"], 1.4, 1.8),
            ("vehicle_breakdown", "medium", "edge", [edge_ids[0]] if edge_ids else ["e_1"], 1.2, 0.9),
            ("facility_delay", "high", "node", ["kolkata"], 1.5, 2.0),
            ("regulatory_delay", "low", "node", ["guwahati"], 1.1, 0.5),
            ("weather_alert", "medium", "node", ["chennai"], 1.2, 1.0),
            ("traffic_congestion", "medium", "corridor", ["corr_hyderabad_bengaluru"], 1.3, 1.1),
        ]
        disruptions_created = 0
        for et, sev, tt, tv, eta_mult, risk_d in disruptions_data:
            try:
                self.create_disruption(DisruptionCreateRequest(
                    event_type=et, severity=sev, target_type=tt, target_values=tv,
                    eta_multiplier=eta_mult, risk_delta=risk_d, active=True))
                disruptions_created += 1
            except Exception:
                pass

        self._recompute_all_shipments()
        self._record_audit(entity_type="system", entity_id="seed_50",
            action="seed_50_with_disruptions", details={"shipments": created, "disruptions": disruptions_created})
        return {"status": "seeded", "shipments": created, "disruptions": disruptions_created}

    def reset_all(self) -> dict:
        self._state = self._seed_state()
        self._persist_all()
        self._record_audit(entity_type="system", entity_id="reset", action="system_reset", details={})
        return {"status": "reset", "message": "All data cleared to base state"}

    def list_audit(self, limit: int = 50) -> list[AuditEntry]:
        return list(reversed(self._state.audit_log[-limit:]))

    def overview(self) -> OverviewResponse:
        return OverviewResponse(
            active_shipments=len(self._state.shipments),
            active_disruptions=sum(1 for event in self._state.disruptions.values() if event.active),
            policies_enabled=sum(1 for policy in self._state.policies.values() if policy.enabled),
            corridors_supported=len(self._state.corridors),
        )

    def _record_audit(
        self,
        *,
        entity_type: str,
        entity_id: str,
        action: str,
        details: dict[str, str | float | int | bool | list[str]],
    ) -> None:
        self._state.audit_log.append(
            AuditEntry(
                id=f"audit_{next(self._audit_counter)}",
                timestamp_utc=datetime.now(UTC).isoformat(),
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                details=details,
            )
        )

    def _recompute_all_shipments(self) -> None:
        for shipment in self._state.shipments.values():
            self._state.recommendations[shipment.id] = self._compute_recommendation(shipment)

    def _compute_recommendation(self, shipment: Shipment) -> Recommendation:
        profile = self._state.load_profiles[shipment.load_profile_id]
        candidates = self._generate_candidates(shipment, profile)

        if not candidates:
            return Recommendation(
                shipment_id=shipment.id,
                action="no_compliant_path",
                confidence=0.95,
                chosen_path=None,
                alternatives=[],
                reason_codes=["NO_COMPLIANT_PATH", "COMPLIANCE_BLOCK"],
                expected_impact={"eta_h": 0, "cost": 0, "risk": 0, "compliance_risk": 10},
            )

        candidates.sort(key=lambda item: item.score)
        best = candidates[0]
        alternatives = candidates[1:3]
        second = alternatives[0] if alternatives else None
        margin = (second.score - best.score) if second else 0.8

        action = "continue_with_watch"
        if best.eta_h > shipment.sla_eta_h or best.risk >= 4.5:
            action = "reroute"
        if best.eta_h > (shipment.sla_eta_h * 1.25) or best.risk >= 7:
            action = "hold_and_escalate"

        compliance_limit = self._compliance_stop_threshold()
        if best.compliance_risk >= compliance_limit:
            action = "no_compliant_path"

        confidence = max(0.4, min(0.96, 0.88 - (best.risk * 0.07) + (margin * 0.05)))
        reason_codes = list(best.reason_codes)
        if action != "continue_with_watch":
            reason_codes.append("ACTION_REQUIRED")
        if action == "no_compliant_path":
            reason_codes.append("COMPLIANCE_STOP")

        return Recommendation(
            shipment_id=shipment.id,
            action=action,
            confidence=round(confidence, 3),
            chosen_path=best,
            alternatives=alternatives,
            reason_codes=reason_codes,
            expected_impact={
                "eta_h": round(best.eta_h, 2),
                "cost": round(best.cost, 2),
                "risk": round(best.risk, 2),
                "compliance_risk": round(best.compliance_risk, 2),
                "sla_gap_h": round(best.eta_h - shipment.sla_eta_h, 2),
            },
        )

    def _compliance_stop_threshold(self) -> float:
        thresholds = []
        for policy in self._state.policies.values():
            if not policy.enabled or policy.owner_type != "compliance":
                continue
            threshold = policy.params.get("compliance_risk_stop")
            if isinstance(threshold, int | float):
                thresholds.append(float(threshold))
        return min(thresholds) if thresholds else 6.5

    def _generate_candidates(self, shipment: Shipment, profile: LoadProfile) -> list[PathOption]:
        path_templates = self._find_paths(shipment.source_node, shipment.destination_node)
        options: list[PathOption] = []
        for node_path in path_templates:
            edge_path = self._path_to_edges(node_path)
            if edge_path is None:
                continue
            if not self._passes_hard_constraints(edge_path, profile):
                continue

            eta = sum(edge.base_eta_h for edge in edge_path)
            cost = sum(edge.base_cost for edge in edge_path)
            risk = 1.0
            compliance_risk = 0.5
            reason_codes: list[str] = ["BASELINE_FEASIBLE"]

            if self._path_contains_preferred_node(node_path):
                reason_codes.append("POLICY_PREFER_NODE")

            for event in self._state.disruptions.values():
                if not event.active:
                    continue
                if self._event_hits_path(event, shipment, node_path, edge_path):
                    eta *= event.eta_multiplier
                    risk += event.risk_delta + self._severity_to_risk(event.severity)
                    compliance_risk += self._severity_to_compliance_risk(event.severity)
                    reason_codes.append(f"EVENT_{event.event_type.upper()}")

            eta_risk = max(0.0, eta - shipment.sla_eta_h) / max(shipment.sla_eta_h, 1)
            sla_penalty = 1.0 if eta > shipment.sla_eta_h else 0.0
            cost_normalized = cost / 100000
            risk_component = risk / 10

            score_eta = profile.weights.get("eta", 0.35) * eta_risk
            score_cost = profile.weights.get("cost", 0.2) * cost_normalized
            score_sla = profile.weights.get("sla", 0.25) * sla_penalty
            score_risk = profile.weights.get("risk", 0.2) * risk_component
            score = score_eta + score_cost + score_sla + score_risk

            options.append(
                PathOption(
                    path_nodes=node_path,
                    path_edges=[edge.id for edge in edge_path],
                    eta_h=round(eta, 3),
                    cost=round(cost, 3),
                    risk=round(risk, 3),
                    compliance_risk=round(compliance_risk, 3),
                    score=round(score, 4),
                    score_breakdown={
                        "eta_component": round(score_eta, 4),
                        "cost_component": round(score_cost, 4),
                        "sla_component": round(score_sla, 4),
                        "risk_component": round(score_risk, 4),
                    },
                    reason_codes=reason_codes,
                )
            )
        return options

    def _path_contains_preferred_node(self, node_path: list[str]) -> bool:
        for policy in self._state.policies.values():
            if not policy.enabled or policy.rule_type != "prefer_node":
                continue
            if set(node_path) & set(policy.applies_to):
                return True
        return False

    def _find_paths(self, source_node: str, destination_node: str) -> list[list[str]]:
        adjacency: dict[str, list[str]] = {}
        for edge in self._state.edges.values():
            adjacency.setdefault(edge.from_node, []).append(edge.to_node)

        results: list[list[str]] = []

        def dfs(current: str, target: str, visited: list[str]) -> None:
            if len(visited) > 5:
                return
            if current == target:
                results.append(visited.copy())
                return
            for next_node in adjacency.get(current, []):
                if next_node in visited:
                    continue
                visited.append(next_node)
                dfs(next_node, target, visited)
                visited.pop()

        dfs(source_node, destination_node, [source_node])
        return results

    def _path_to_edges(self, node_path: list[str]) -> list[Edge] | None:
        edges: list[Edge] = []
        for index in range(len(node_path) - 1):
            from_node = node_path[index]
            to_node = node_path[index + 1]
            edge = next(
                (
                    edge
                    for edge in self._state.edges.values()
                    if edge.from_node == from_node and edge.to_node == to_node
                ),
                None,
            )
            if edge is None:
                return None
            edges.append(edge)
        return edges

    def _passes_hard_constraints(self, edge_path: list[Edge], profile: LoadProfile) -> bool:
        if any(not edge.cold_chain_capable for edge in edge_path):
            return False

        total_eta = sum(edge.base_eta_h for edge in edge_path)
        if total_eta > profile.max_transit_h:
            return False

        for policy in self._state.policies.values():
            if not policy.enabled:
                continue
            if policy.rule_type == "block_node":
                blocked_nodes = set(policy.applies_to)
                traversed_nodes = {edge.from_node for edge in edge_path} | {
                    edge.to_node for edge in edge_path
                }
                if traversed_nodes & blocked_nodes:
                    return False
            if policy.rule_type == "block_edge":
                blocked_edges = set(policy.applies_to)
                traversed_edges = {edge.id for edge in edge_path}
                if traversed_edges & blocked_edges:
                    return False
            if policy.rule_type == "block_carrier":
                blocked_carriers = set(policy.applies_to)
                traversed_carriers = {edge.carrier for edge in edge_path}
                if traversed_carriers & blocked_carriers:
                    return False
        return True

    def _event_hits_path(
        self,
        event: ScenarioEvent,
        shipment: Shipment,
        node_path: list[str],
        edge_path: list[Edge],
    ) -> bool:
        if event.target_type == "global":
            return True
        if event.target_type == "corridor":
            return shipment.corridor_id in event.target_values
        if event.target_type == "node":
            return bool(set(node_path) & set(event.target_values))
        if event.target_type == "edge":
            traversed_edges = {edge.id for edge in edge_path}
            return bool(traversed_edges & set(event.target_values))
        if event.target_type == "carrier":
            traversed_carriers = {edge.carrier for edge in edge_path}
            return bool(traversed_carriers & set(event.target_values))
        return False

    def _severity_to_risk(self, severity: str) -> float:
        if severity == "high":
            return 2.2
        if severity == "medium":
            return 1.1
        return 0.4

    def _severity_to_compliance_risk(self, severity: str) -> float:
        if severity == "high":
            return 2.6
        if severity == "medium":
            return 1.4
        return 0.6

    def get_node(self, node_id: str) -> Node | None:
        return self._state.nodes.get(node_id)

    async def get_weather_for_node(self, node_id: str) -> dict[str, Any]:
        node = self._state.nodes.get(node_id)
        if not node:
            return {"error": "Node not found"}

        if not weather_client.is_enabled():
            return {"enabled": False, "message": "Weather API not available"}

        weather = await weather_client.get_weather(node.lat, node.lng, node.name)
        if not weather:
            return {"enabled": True, "error": "Failed to fetch weather"}

        return {
            "enabled": True,
            "node_id": node_id,
            "city": weather.city,
            "temperature_c": round(weather.temp_c, 2),
            "humidity": weather.humidity,
            "description": weather.description,
            "wind_speed_ms": round(weather.wind_speed, 2),
            "weather_code": weather.weather_code,
            "has_weather_alert": self._check_weather_alert(weather),
        }

    def _check_weather_alert(self, weather: Any) -> bool:
        if weather.weather_code >= 95:
            return True
        if weather.wind_speed > 20:
            return True
        if weather.temp_c > 45 or weather.temp_c < -15:
            return True
        return False

    async def check_weather_and_create_disruptions(self) -> dict[str, Any]:
        created = 0
        for node in self._state.nodes.values():
            if not weather_client.is_enabled():
                break
            weather = await weather_client.get_weather(node.lat, node.lng, node.name)
            if not weather:
                continue
            if not self._check_weather_alert(weather):
                continue
            severity = "high" if weather.weather_code >= 95 or weather.wind_speed > 25 else "medium"
            existing = [e for e in self._state.disruptions.values()
                        if e.target_type == "node" and node.id in e.target_values and e.active]
            if existing:
                continue
            self.create_disruption(DisruptionCreateRequest(
                event_type="weather_alert",
                severity=severity,
                target_type="node",
                target_values=[node.id],
                eta_multiplier=1.5 if severity == "high" else 1.2,
                risk_delta=2.5 if severity == "high" else 1.2,
                active=True,
            ))
            created += 1
        return {"status": "ok", "disruptions_created": created}


supply_chain_service = SupplyChainService()
