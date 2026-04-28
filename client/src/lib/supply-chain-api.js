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
};
