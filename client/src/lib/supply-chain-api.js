const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

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

export const supplyChainApi = {
  overview: () => request("/supply-chain/overview"),
  corridors: () => request("/supply-chain/corridors"),
  loadProfiles: () => request("/supply-chain/load-profiles"),
  policies: () => request("/supply-chain/policies"),
  disruptions: () => request("/supply-chain/disruptions"),
  shipments: () => request("/supply-chain/shipments"),
  nodes: () => request("/supply-chain/nodes"),
  edges: () => request("/supply-chain/edges"),
  audit: (limit = 50) => request(`/supply-chain/audit?limit=${limit}`),
  createShipment: (payload) =>
    request("/supply-chain/shipments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createDisruption: (payload) =>
    request("/supply-chain/disruptions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDisruption: (disruptionId, payload) =>
    request(`/supply-chain/disruptions/${disruptionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createPolicy: (payload) =>
    request("/supply-chain/policies", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePolicy: (policyId, payload) =>
    request(`/supply-chain/policies/${policyId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  recomputeShipment: (shipmentId) =>
    request(`/supply-chain/shipments/${shipmentId}/recompute`, {
      method: "POST",
    }),
  seedRich: () => request("/supply-chain/seed/rich", { method: "POST" }),
  seed50: () => request("/supply-chain/seed/50", { method: "POST" }),
  reset: () => request("/supply-chain/reset", { method: "POST" }),
  enrichWithGoogleMaps: () =>
    request("/supply-chain/enrich/maps", { method: "POST" }),
  getWeather: (nodeId) => request(`/supply-chain/weather/${nodeId}`),
  explainShipment: (shipmentId) => request(`/supply-chain/explain/${shipmentId}`),
  predictiveRisks: () => request("/supply-chain/risks/predictive"),
  riskForecast: () => request("/supply-chain/risks/forecast"),
  analyticsKpis: () => request("/supply-chain/analytics/kpis"),
  autoExecuteRecommendations: (confidenceThreshold = 0.85, riskThreshold = 5) =>
    request(
      `/supply-chain/recommendations/auto-execute?confidence_threshold=${confidenceThreshold}&risk_threshold=${riskThreshold}`,
      { method: "POST" },
    ),
  aiPolicySuggestions: (ttlHours = 3) =>
    request(`/supply-chain/policies/ai-suggestions?ttl_hours=${ttlHours}`),
  approveAiPolicy: (payload) =>
    request("/supply-chain/policies/ai-approve", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  simulateWorsening: (factor = 1.3) =>
    request(`/supply-chain/simulate/disruption-worsen?factor=${factor}`, {
      method: "POST",
    }),
  copilotChat: (prompt) =>
    request("/supply-chain/copilot/chat", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  incidentTimeline: (disruptionId) =>
    request(`/supply-chain/incidents/${disruptionId}/timeline`),
  runHeroDemo: () => request("/supply-chain/demo/hero", { method: "POST" }),
};
