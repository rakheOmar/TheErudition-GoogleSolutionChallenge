import { useEffect, useState } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";

export function NetworkPage({ onRefresh }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [n, e, c] = await Promise.all([
        supplyChainApi.nodes(),
        supplyChainApi.edges(),
        supplyChainApi.corridors(),
      ]);
      setNodes(n);
      setEdges(e);
      setCorridors(c);
    } catch (e) {
      console.error("Load failed", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const totalDistance = edges.reduce((sum, e) => sum + (e.distance_km || 0), 0);

  const carriers = [...new Set(edges.map((e) => e.carrier))];
  const carrierStats = carriers.map((c) => ({
    name: c,
    count: edges.filter((e) => e.carrier === c).length,
  }));

  const stateNodes = nodes.reduce((acc, n) => {
    acc[n.state] = (acc[n.state] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Loading network...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800 text-xl">
          India Pharma Distribution Network
        </h2>
        <div className="relative h-96 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 100 100"
          >
            {edges.map((edge, i) => {
              const fromNode = nodes.find((n) => n.id === edge.from_node);
              const toNode = nodes.find((n) => n.id === edge.to_node);
              if (!(fromNode && toNode)) {
                return null;
              }
              const x1 = ((fromNode.lng - 68) / 24) * 90 + 5;
              const y1 = ((28 - fromNode.lat) / 16) * 80 + 10;
              const x2 = ((toNode.lng - 68) / 24) * 90 + 5;
              const y2 = ((28 - toNode.lat) / 16) * 80 + 10;
              return (
                <line
                  key={i}
                  stroke="#94a3b8"
                  strokeDasharray={
                    edge.carrier === "coldswift" ? "1,0.5" : "none"
                  }
                  strokeWidth="0.3"
                  x1={x1}
                  x2={x2}
                  y1={y1}
                  y2={y2}
                />
              );
            })}
            {nodes.map((node, i) => {
              const x = ((node.lng - 68) / 24) * 90 + 5;
              const y = ((28 - node.lat) / 16) * 80 + 10;
              const corridorCount = corridors.filter(
                (c) =>
                  c.source_node === node.id || c.destination_node === node.id
              ).length;
              const size = Math.max(2, Math.min(5, 2 + corridorCount));
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    fill={corridorCount > 2 ? "#0891b2" : "#64748b"}
                    r={size}
                  />
                  <text
                    fill="#334155"
                    fontSize="2.5"
                    fontWeight="500"
                    x={x + size + 1}
                    y={y + 0.5}
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="absolute right-2 bottom-2 rounded bg-white/90 p-2 text-slate-600 text-xs">
            Blue: Major hub (3+ corridors) | Gray: Standard node
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">
            Network Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
              <span className="text-slate-600">Total Nodes (Cities)</span>
              <span className="font-bold text-slate-800">{nodeCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
              <span className="text-slate-600">Total Routes (Edges)</span>
              <span className="font-bold text-slate-800">{edgeCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
              <span className="text-slate-600">Total Distance</span>
              <span className="font-bold text-slate-800">
                {totalDistance.toLocaleString()} km
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
              <span className="text-slate-600">Active Corridors</span>
              <span className="font-bold text-slate-800">
                {corridors.length}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">
            🚛 Carrier Distribution
          </h3>
          <div className="space-y-2">
            {carrierStats.map((c) => (
              <div className="flex items-center justify-between" key={c.name}>
                <span className="text-slate-700 text-sm capitalize">
                  {c.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{ width: `${(c.count / edgeCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-slate-600 text-xs">{c.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">State Coverage</h3>
          <div className="space-y-2">
            {Object.entries(stateNodes).map(([state, count]) => (
              <div className="flex items-center justify-between" key={state}>
                <span className="truncate text-slate-700 text-sm">{state}</span>
                <span className="font-medium text-cyan-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">All Routes</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {edges.map((edge) => {
            const fromNode = nodes.find((n) => n.id === edge.from_node);
            const toNode = nodes.find((n) => n.id === edge.to_node);
            return (
              <div
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                key={edge.id}
              >
                <div>
                  <p className="font-medium text-slate-800 text-sm">
                    {fromNode?.name} → {toNode?.name}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {edge.distance_km.toFixed(2)} km • {edge.base_eta_h.toFixed(2)}h • Rs
                    {(edge.base_cost / 1000).toFixed(0)}k
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${edge.cold_chain_capable ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {edge.carrier}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
