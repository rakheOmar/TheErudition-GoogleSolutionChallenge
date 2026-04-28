const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";
const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE || "false").toLowerCase() === "true";

const demoState = {
  nodes: [
    { id: "mumbai", name: "Mumbai", lat: 19.076, lng: 72.8777 },
    { id: "delhi", name: "Delhi", lat: 28.6139, lng: 77.209 },
    { id: "bengaluru", name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    { id: "chennai", name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { id: "hyderabad", name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  ],
  corridors: [
    { id: "corr_mumbai_delhi", name: "Mumbai-Delhi", source_node: "mumbai", destination_node: "delhi" },
    { id: "corr_bengaluru_chennai", name: "Bengaluru-Chennai", source_node: "bengaluru", destination_node: "chennai" },
    { id: "corr_hyderabad_bengaluru", name: "Hyderabad-Bengaluru", source_node: "hyderabad", destination_node: "bengaluru" },
  ],
  edges: [
    { id: "e_1", from_node: "mumbai", to_node: "delhi", distance_km: 1410, carrier: "BlueDart" },
    { id: "e_2", from_node: "bengaluru", to_node: "chennai", distance_km: 346, carrier: "Delhivery" },
    { id: "e_3", from_node: "hyderabad", to_node: "bengaluru", distance_km: 569, carrier: "Ekart" },
  ],
  loadProfiles: [
    { id: "cold_chain", label: "Cold Chain" },
    { id: "frozen", label: "Frozen" },
    { id: "express", label: "Express" },
    { id: "fragile", label: "Fragile" },
    { id: "heavy", label: "Heavy" },
    { id: "standard", label: "Standard" },
  ],
  policies: [
    { id: "pol_1", owner_type: "operations", rule_type: "block_edge", applies_to: ["e_1"], priority: 60, enabled: true, params: { reason: "Monsoon risk" } },
  ],
  disruptions: [
    { id: "event_1", event_type: "weather_alert", severity: "high", target_type: "node", target_values: ["mumbai"], eta_multiplier: 1.5, risk_delta: 2.2, active: true },
    { id: "event_2", event_type: "traffic_congestion", severity: "medium", target_type: "corridor", target_values: ["corr_hyderabad_bengaluru"], eta_multiplier: 1.2, risk_delta: 1.1, active: true },
  ],
  shipments: [],
  shipmentCounter: 100,
  policyCounter: 2,
  disruptionCounter: 3,
};

function computeRecommendation(shipment) {
  const disruptionHits = demoState.disruptions.filter((d) => d.active && (d.target_values || []).includes(shipment.corridor_id)).length;
  const baseRisk = shipment.load_profile_id === "frozen" || shipment.load_profile_id === "cold_chain" ? 5 : 3;
  const risk = Math.min(10, baseRisk + disruptionHits * 1.8 + (shipment.sla_eta_h <= 8 ? 1.5 : 0));
  const action = risk >= 7 ? "hold_and_escalate" : risk >= 5 ? "reroute" : "continue_with_watch";
  const eta_h = Math.max(2, shipment.sla_eta_h * (1 + disruptionHits * 0.18));
  const confidence = Math.min(0.96, 0.62 + risk / 20);
  const reason_codes = [];
  if (disruptionHits > 0) reason_codes.push("active_disruption_on_corridor");
  if (shipment.sla_eta_h <= 8) reason_codes.push("tight_sla");
  if (shipment.load_profile_id === "cold_chain" || shipment.load_profile_id === "frozen") reason_codes.push("sensitive_cargo");
  return {
    action,
    confidence,
    reason_codes,
    expected_impact: {
      eta_h,
      risk,
      sla_gap_h: Math.max(0, eta_h - shipment.sla_eta_h),
    },
    chosen_path: {
      path_nodes: corridorNodes(shipment.corridor_id),
      eta_h,
      cost: Math.round(eta_h * 1200),
      risk,
      score: Number((1 / (1 + risk)).toFixed(3)),
    },
  };
}

function corridorNodes(corridorId) {
  const corr = demoState.corridors.find((c) => c.id === corridorId);
  if (!corr) return [];
  return [corr.source_node, corr.destination_node];
}

function shipmentWithRecommendation(shipment) {
  return {
    shipment,
    recommendation: computeRecommendation(shipment),
  };
}

function overviewData() {
  return {
    active_shipments: demoState.shipments.length,
    active_disruptions: demoState.disruptions.filter((d) => d.active).length,
    policies_enabled: demoState.policies.filter((p) => p.enabled).length,
    corridors_supported: demoState.corridors.length,
  };
}

function analyticsData() {
  const rows = demoState.shipments.map((s) => computeRecommendation(s));
  const atRisk = rows.filter((r) => (r.expected_impact?.risk || 0) >= 5).length;
  const reroutes = rows.filter((r) => r.action === "reroute").length;
  const holds = rows.filter((r) => r.action === "hold_and_escalate").length;
  const slaGap = rows.reduce((sum, r) => sum + (r.expected_impact?.sla_gap_h || 0), 0);
  const avgRisk = rows.length ? rows.reduce((sum, r) => sum + (r.expected_impact?.risk || 0), 0) / rows.length : 0;
  return {
    shipments_total: demoState.shipments.length,
    at_risk_shipments: atRisk,
    reroute_recommendations: reroutes,
    hold_recommendations: holds,
    avg_risk: Number(avgRisk.toFixed(2)),
    sla_gap_hours_total: Number(slaGap.toFixed(2)),
    auto_actions_executed: 0,
    active_disruptions: demoState.disruptions.filter((d) => d.active).length,
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      throw new Error(payload.detail ?? fallback);
    } catch {
      throw new Error(fallback);
    }
  }

  return response.json();
}

async function demoRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;

  if (path === "/supply-chain/overview") return overviewData();
  if (path === "/supply-chain/corridors") return demoState.corridors;
  if (path === "/supply-chain/load-profiles") return demoState.loadProfiles;
  if (path === "/supply-chain/policies") return demoState.policies;
  if (path === "/supply-chain/disruptions") return demoState.disruptions;
  if (path === "/supply-chain/shipments") return demoState.shipments.map(shipmentWithRecommendation);
  if (path === "/supply-chain/nodes") return demoState.nodes;
  if (path === "/supply-chain/edges") return demoState.edges;
  if (path.startsWith("/supply-chain/audit")) return [];
  if (path === "/supply-chain/analytics/kpis") return analyticsData();
  if (path === "/supply-chain/risks/predictive") {
    return demoState.corridors.map((c) => ({
      corridor_id: c.id,
      corridor_name: c.name,
      predicted_risk: Number((4 + Math.random() * 3).toFixed(1)),
      risk_band: "medium",
    }));
  }
  if (path === "/supply-chain/risks/forecast") {
    return demoState.corridors.map((c) => ({
      corridor_id: c.id,
      corridor_name: c.name,
      drivers: [{ name: "weather", weight: 0.45 }, { name: "sla_pressure", weight: 0.3 }, { name: "traffic", weight: 0.25 }],
      forecast: [
        { hours: 2, predicted_risk: 4.8, probability_sla_failure: 0.42, risk_band: "medium" },
        { hours: 6, predicted_risk: 5.4, probability_sla_failure: 0.55, risk_band: "high" },
        { hours: 12, predicted_risk: 6.1, probability_sla_failure: 0.64, risk_band: "high" },
      ],
    }));
  }

  if (path === "/supply-chain/shipments" && method === "POST") {
    const corridor = demoState.corridors.find((c) => c.id === body.corridor_id);
    const shipment = {
      id: `ship_${demoState.shipmentCounter++}`,
      corridor_id: body.corridor_id,
      source_node: corridor?.source_node || "mumbai",
      destination_node: corridor?.destination_node || "delhi",
      load_profile_id: body.load_profile_id,
      sla_eta_h: Number(body.sla_eta_h || 12),
      status: "pending",
    };
    demoState.shipments.unshift(shipment);
    return shipmentWithRecommendation(shipment);
  }

  if (path.startsWith("/supply-chain/shipments/") && path.endsWith("/recompute") && method === "POST") {
    const id = path.split("/")[3];
    const shipment = demoState.shipments.find((s) => s.id === id);
    if (!shipment) throw new Error("Shipment not found");
    return shipmentWithRecommendation(shipment);
  }

  if (path === "/supply-chain/disruptions" && method === "POST") {
    const disruption = {
      id: `event_${demoState.disruptionCounter++}`,
      event_type: body.event_type || "weather_alert",
      severity: body.severity || "medium",
      target_type: body.target_type || "corridor",
      target_values: body.target_values || [],
      eta_multiplier: Number(body.eta_multiplier || 1.2),
      risk_delta: Number(body.risk_delta || 1.0),
      active: body.active !== false,
    };
    demoState.disruptions.unshift(disruption);
    return disruption;
  }

  if (path.startsWith("/supply-chain/disruptions/") && method === "PATCH") {
    const id = path.split("/")[3];
    const item = demoState.disruptions.find((d) => d.id === id);
    if (!item) throw new Error("Disruption not found");
    Object.assign(item, body || {});
    return item;
  }

  if (path === "/supply-chain/policies" && method === "POST") {
    const policy = {
      id: `pol_${demoState.policyCounter++}`,
      owner_type: body.owner_type || "operations",
      rule_type: body.rule_type || "block_edge",
      applies_to: body.applies_to || [],
      priority: Number(body.priority || 50),
      enabled: body.enabled !== false,
      params: body.params || {},
    };
    demoState.policies.unshift(policy);
    return policy;
  }

  if (path.startsWith("/supply-chain/policies/") && method === "PATCH") {
    const id = path.split("/")[3];
    const item = demoState.policies.find((p) => p.id === id);
    if (!item) throw new Error("Policy not found");
    Object.assign(item, body || {});
    return item;
  }

  if (path.startsWith("/supply-chain/policies/ai-suggestions")) {
    return [
      {
        suggestion_id: "sugg_corr_hyderabad_bengaluru_3",
        title: "Temporary block on Hyderabad-Bengaluru",
        rule_type: "block_edge",
        owner_type: "operations",
        applies_to: ["corr_hyderabad_bengaluru"],
        priority: 20,
        params: { reason: "AI suggested due to forecasted SLA failure", ttl_hours: 3 },
        confidence: 0.88,
      },
    ];
  }

  if (path === "/supply-chain/policies/ai-approve" && method === "POST") {
    const policy = {
      id: `pol_${demoState.policyCounter++}`,
      owner_type: body.owner_type || "operations",
      rule_type: body.rule_type || "block_edge",
      applies_to: body.applies_to || [],
      priority: Number(body.priority || 50),
      enabled: true,
      params: body.params || {},
    };
    demoState.policies.unshift(policy);
    return policy;
  }

  if (path.startsWith("/supply-chain/simulate/disruption-worsen") && method === "POST") {
    return {
      factor: 1.3,
      impacted_shipments: demoState.shipments.slice(0, 10).map((s) => ({
        shipment_id: s.id,
        corridor_id: s.corridor_id,
        current_action: computeRecommendation(s).action,
        current_risk: computeRecommendation(s).expected_impact.risk,
        projected_risk: Number((computeRecommendation(s).expected_impact.risk * 1.3).toFixed(2)),
        projected_sla_gap_h: Number((computeRecommendation(s).expected_impact.sla_gap_h * 1.3).toFixed(2)),
        recommended_action: "reroute",
      })),
      impacted_count: Math.min(10, demoState.shipments.length),
      estimated_sla_hours_at_risk: 24.3,
      estimated_sla_hours_saved_if_actioned: 11.7,
      risk_delta_total: 15.2,
    };
  }

  if (path === "/supply-chain/copilot/chat" && method === "POST") {
    const rows = demoState.shipments
      .map((s) => ({ shipment: s, rec: computeRecommendation(s) }))
      .sort((a, b) => b.rec.expected_impact.risk - a.rec.expected_impact.risk)
      .slice(0, 5)
      .map((x) => ({
        shipment_id: x.shipment.id,
        risk: x.rec.expected_impact.risk,
        action: x.rec.action,
      }));
    return { intent: "top_risk_shipments", data: rows };
  }

  if (path.startsWith("/supply-chain/incidents/") && path.endsWith("/timeline")) {
    const id = path.split("/")[3];
    return {
      disruption_id: id,
      ai_summary: "Disruption detected and mitigation sequence initiated. High-risk shipments were prioritized for reroute or escalation.",
      timeline: [
        { phase: "detection", note: "Event detected by monitoring engine" },
        { phase: "impact-analysis", note: "Affected corridors and shipments computed" },
        { phase: "recommendation", note: "Policy-aware route actions generated" },
        { phase: "execution", note: "Ops approved selected actions" },
      ],
    };
  }

  if (path.startsWith("/supply-chain/explain/")) {
    const id = path.split("/")[3];
    const shipment = demoState.shipments.find((s) => s.id === id);
    if (!shipment) return { explanation: "Shipment not found in demo mode." };
    const rec = computeRecommendation(shipment);
    return {
      explanation: `Shipment ${id} is marked ${rec.action.replace(/_/g, " ")} because risk is ${rec.expected_impact.risk.toFixed(1)} with ETA impact of ${rec.expected_impact.eta_h.toFixed(1)}h.`,
    };
  }

  if (path === "/supply-chain/disruptions/auto-from-weather" && method === "POST") {
    const disruption = {
      id: `event_${demoState.disruptionCounter++}`,
      event_type: "weather_alert",
      severity: "medium",
      target_type: "node",
      target_values: ["delhi"],
      eta_multiplier: 1.2,
      risk_delta: 1.2,
      active: true,
    };
    demoState.disruptions.unshift(disruption);
    return { status: "ok", disruptions_created: 1 };
  }

  if (path === "/supply-chain/demo/hero" && method === "POST") {
    demoState.shipments = [
      { id: "ship_100", corridor_id: "corr_mumbai_delhi", source_node: "mumbai", destination_node: "delhi", load_profile_id: "frozen", sla_eta_h: 8, status: "in_transit" },
      { id: "ship_101", corridor_id: "corr_hyderabad_bengaluru", source_node: "hyderabad", destination_node: "bengaluru", load_profile_id: "cold_chain", sla_eta_h: 10, status: "pending" },
      { id: "ship_102", corridor_id: "corr_bengaluru_chennai", source_node: "bengaluru", destination_node: "chennai", load_profile_id: "express", sla_eta_h: 6, status: "in_transit" },
    ];
    demoState.disruptions = [
      { id: "event_1", event_type: "weather_alert", severity: "high", target_type: "corridor", target_values: ["corr_mumbai_delhi"], eta_multiplier: 1.6, risk_delta: 2.3, active: true },
      { id: "event_2", event_type: "traffic_congestion", severity: "medium", target_type: "corridor", target_values: ["corr_hyderabad_bengaluru"], eta_multiplier: 1.2, risk_delta: 1.1, active: true },
    ];
    return {
      status: "ok",
      message: "Hero demo scenario prepared",
      seeded: { shipments_seeded: 3, disruptions_seeded: 2, policies_seeded: 1, notes: "Frontend-only demo" },
      weather: { status: "ok", disruptions_created: 0 },
      auto_actions: { auto_reroutes: 1, auto_escalations: 1 },
      kpis: analyticsData(),
      top_forecast: await demoRequest("/supply-chain/risks/forecast"),
    };
  }

  if (path === "/supply-chain/seed/rich" && method === "POST") {
    return demoRequest("/supply-chain/demo/hero", { method: "POST" });
  }

  if (path === "/supply-chain/seed/50" && method === "POST") {
    const profiles = demoState.loadProfiles.map((p) => p.id);
    const corridors = demoState.corridors.map((c) => c.id);
    demoState.shipments = Array.from({ length: 50 }).map((_, i) => {
      const corridor = corridors[i % corridors.length];
      const corr = demoState.corridors.find((c) => c.id === corridor);
      return {
        id: `ship_${100 + i}`,
        corridor_id: corridor,
        source_node: corr.source_node,
        destination_node: corr.destination_node,
        load_profile_id: profiles[i % profiles.length],
        sla_eta_h: 4 + (i % 20),
        status: i % 3 === 0 ? "pending" : "in_transit",
      };
    });
    return { status: "seeded", shipments: 50, disruptions: demoState.disruptions.length };
  }

  if (path === "/supply-chain/reset" && method === "POST") {
    demoState.shipments = [];
    demoState.disruptions = [];
    demoState.policies = [];
    return { status: "reset", message: "All data cleared to base state" };
  }

  if (path === "/supply-chain/enrich/maps" && method === "POST") return { status: "ok", enriched_edges: demoState.edges.length };
  if (path.startsWith("/supply-chain/weather/")) return { enabled: false, message: "Demo mode weather disabled" };

  throw new Error(`Demo mode route not mocked: ${path}`);
}

const transport = DEMO_MODE ? demoRequest : request;

export const supplyChainApi = {
  overview: () => transport("/supply-chain/overview"),
  corridors: () => transport("/supply-chain/corridors"),
  loadProfiles: () => transport("/supply-chain/load-profiles"),
  policies: () => transport("/supply-chain/policies"),
  disruptions: () => transport("/supply-chain/disruptions"),
  shipments: () => transport("/supply-chain/shipments"),
  nodes: () => transport("/supply-chain/nodes"),
  edges: () => transport("/supply-chain/edges"),
  audit: (limit = 50) => transport(`/supply-chain/audit?limit=${limit}`),
  createShipment: (payload) =>
    transport("/supply-chain/shipments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createDisruption: (payload) =>
    transport("/supply-chain/disruptions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDisruption: (disruptionId, payload) =>
    transport(`/supply-chain/disruptions/${disruptionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createPolicy: (payload) =>
    transport("/supply-chain/policies", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePolicy: (policyId, payload) =>
    transport(`/supply-chain/policies/${policyId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  recomputeShipment: (shipmentId) =>
    transport(`/supply-chain/shipments/${shipmentId}/recompute`, {
      method: "POST",
    }),
  seedRich: () => transport("/supply-chain/seed/rich", { method: "POST" }),
  seed50: () => transport("/supply-chain/seed/50", { method: "POST" }),
  reset: () => transport("/supply-chain/reset", { method: "POST" }),
  enrichWithGoogleMaps: () =>
    transport("/supply-chain/enrich/maps", { method: "POST" }),
  getWeather: (nodeId) => transport(`/supply-chain/weather/${nodeId}`),
  explainShipment: (shipmentId) => transport(`/supply-chain/explain/${shipmentId}`),
  predictiveRisks: () => transport("/supply-chain/risks/predictive"),
  riskForecast: () => transport("/supply-chain/risks/forecast"),
  analyticsKpis: () => transport("/supply-chain/analytics/kpis"),
  autoExecuteRecommendations: (confidenceThreshold = 0.85, riskThreshold = 5) =>
    transport(
      `/supply-chain/recommendations/auto-execute?confidence_threshold=${confidenceThreshold}&risk_threshold=${riskThreshold}`,
      { method: "POST" },
    ),
  aiPolicySuggestions: (ttlHours = 3) =>
    transport(`/supply-chain/policies/ai-suggestions?ttl_hours=${ttlHours}`),
  approveAiPolicy: (payload) =>
    transport("/supply-chain/policies/ai-approve", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  simulateWorsening: (factor = 1.3) =>
    transport(`/supply-chain/simulate/disruption-worsen?factor=${factor}`, {
      method: "POST",
    }),
  copilotChat: (prompt) =>
    transport("/supply-chain/copilot/chat", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  incidentTimeline: (disruptionId) =>
    transport(`/supply-chain/incidents/${disruptionId}/timeline`),
  runHeroDemo: () => transport("/supply-chain/demo/hero", { method: "POST" }),
};
