from fastapi import APIRouter, HTTPException, Query

from app.models.supply_chain import (
    DisruptionCreateRequest,
    PolicyCreateRequest,
    PolicyUpdateRequest,
    ShipmentCreateRequest,
)
from app.services.gemini_service import explain_recommendation
from app.services.supply_chain_service import supply_chain_service

router = APIRouter(prefix="/supply-chain", tags=["supply_chain"])


@router.get("/overview")
async def get_overview():
    return supply_chain_service.overview()


@router.get("/corridors")
async def get_corridors():
    return supply_chain_service.list_corridors()


@router.get("/load-profiles")
async def get_load_profiles():
    return supply_chain_service.list_load_profiles()


@router.get("/policies")
async def get_policies():
    return supply_chain_service.list_policies()


@router.post("/policies")
async def create_policy(request: PolicyCreateRequest):
    return supply_chain_service.create_policy(request)


@router.patch("/policies/{policy_id}")
async def update_policy(policy_id: str, request: PolicyUpdateRequest):
    try:
        return supply_chain_service.update_policy(policy_id, request)
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Policy not found") from error


@router.get("/disruptions")
async def get_disruptions():
    return supply_chain_service.list_disruptions()


@router.post("/disruptions")
async def create_disruption(request: DisruptionCreateRequest):
    return supply_chain_service.create_disruption(request)


@router.patch("/disruptions/{disruption_id}")
async def update_disruption(disruption_id: str, request: dict):
    try:
        from app.models.supply_chain import DisruptionCreateRequest
        disruption = supply_chain_service._state.disruptions.get(disruption_id)
        if not disruption:
            raise HTTPException(status_code=404, detail="Disruption not found")
        for key, value in request.items():
            if hasattr(disruption, key):
                setattr(disruption, key, value)
        supply_chain_service._recompute_all_shipments()
        from app.db import db
        db.save_disruptions(supply_chain_service._state.disruptions)
        return disruption
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/shipments")
async def get_shipments():
    return supply_chain_service.list_shipments()


@router.post("/shipments")
async def create_shipment(request: ShipmentCreateRequest):
    try:
        return supply_chain_service.create_shipment(request)
    except KeyError as error:
        raise HTTPException(status_code=400, detail="Invalid corridor or load profile") from error


@router.get("/shipments/{shipment_id}")
async def get_shipment(shipment_id: str):
    try:
        return supply_chain_service.get_shipment(shipment_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Shipment not found") from error


@router.post("/shipments/{shipment_id}/recompute")
async def recompute_shipment(shipment_id: str):
    try:
        return supply_chain_service.recompute_shipment(shipment_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail="Shipment not found") from error


@router.post("/seed/rich")
async def seed_rich():
    return supply_chain_service.seed_rich_demo()


@router.post("/seed/50")
async def seed_50():
    return supply_chain_service.seed_50_shipments()


@router.post("/reset")
async def reset_system():
    return supply_chain_service.reset_all()


@router.get("/nodes")
async def get_nodes():
    from app.services.supply_chain_service import supply_chain_service
    return list(supply_chain_service._state.nodes.values())


@router.get("/edges")
async def get_edges():
    from app.services.supply_chain_service import supply_chain_service
    return list(supply_chain_service._state.edges.values())


@router.get("/audit")
async def get_audit(limit: int = Query(default=50, ge=1, le=200)):
    return supply_chain_service.list_audit(limit=limit)


@router.post("/enrich/maps")
async def enrich_with_google_maps():
    return await supply_chain_service.enrich_with_google_maps()


@router.get("/weather/{node_id}")
async def get_node_weather(node_id: str):
    node = supply_chain_service.get_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return await supply_chain_service.get_weather_for_node(node_id)


@router.get("/risks/predictive")
async def get_predictive_risks():
    return supply_chain_service.predictive_risks()


@router.get("/risks/forecast")
async def get_risk_forecast():
    return supply_chain_service.proactive_risk_forecast()


@router.get("/analytics/kpis")
async def get_analytics_kpis():
    return supply_chain_service.analytics_kpis()


@router.post("/recommendations/auto-execute")
async def auto_execute_recommendations(
    confidence_threshold: float = Query(default=0.85, ge=0.4, le=0.99),
    risk_threshold: float = Query(default=5.0, ge=0.0, le=10.0),
):
    return supply_chain_service.auto_execute_recommendations(
        confidence_threshold=confidence_threshold,
        risk_threshold=risk_threshold,
    )


@router.get("/policies/ai-suggestions")
async def get_ai_policy_suggestions(ttl_hours: int = Query(default=3, ge=1, le=24)):
    return await supply_chain_service.suggest_auto_policies(ttl_hours=ttl_hours)


@router.post("/policies/ai-approve")
async def approve_ai_policy(payload: dict):
    return supply_chain_service.approve_policy_suggestion(payload)


@router.post("/simulate/disruption-worsen")
async def simulate_disruption_worsen(factor: float = Query(default=1.3, ge=1.0, le=2.5)):
    return supply_chain_service.simulate_disruption_worsening(factor=factor)


@router.post("/copilot/chat")
async def copilot_chat(payload: dict):
    prompt = str(payload.get("prompt", "")).strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
    return await supply_chain_service.copilot_chat(prompt)


@router.get("/incidents/{disruption_id}/timeline")
async def get_incident_timeline(disruption_id: str):
    data = await supply_chain_service.incident_timeline(disruption_id)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@router.get("/explain/{shipment_id}")
async def explain_shipment(shipment_id: str):
    try:
        s = supply_chain_service._state.shipments.get(shipment_id)
        if not s:
            raise HTTPException(status_code=404, detail="Shipment not found")
        recommendation = supply_chain_service._state.recommendations.get(shipment_id)
        if not recommendation:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        from app.services.gemini_service import explain_recommendation
        explanation = await explain_recommendation(s.model_dump(), recommendation.model_dump())
        return {"explanation": explanation}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/disruptions/auto-from-weather")
async def auto_create_weather_disruptions():
    return await supply_chain_service.check_weather_and_create_disruptions()


@router.post("/demo/hero")
async def run_hero_demo():
    return await supply_chain_service.run_hero_demo()
