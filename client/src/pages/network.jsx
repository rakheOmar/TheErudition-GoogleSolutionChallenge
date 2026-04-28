import { useEffect, useState } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";
import { LogisticsMap } from "../components/logistics-map";

export function NetworkPage({ onRefresh }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    showRoutes: true,
    showNodes: true,
    showShipments: true,
    showDisruptions: true,
    selectedCorridor: "all",
  });

  async function load() {
    setLoading(true);
    try {
      const [n, e, c, s, d] = await Promise.all([
        supplyChainApi.nodes(),
        supplyChainApi.edges(),
        supplyChainApi.corridors(),
        supplyChainApi.shipments(),
        supplyChainApi.disruptions(),
      ]);
      setNodes(n);
      setEdges(e);
      setCorridors(c);
      setShipments(s);
      setDisruptions(d);
    } catch (e) {
      console.error("Load failed", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredNodes = filters.selectedCorridor === "all" 
    ? nodes 
    : nodes.filter(n => {
        const corr = corridors.find(c => c.id === filters.selectedCorridor);
        return corr && (corr.source_node === n.id || corr.destination_node === n.id);
      });

  const filteredEdges = filters.selectedCorridor === "all"
    ? edges
    : edges.filter(e => {
        const corr = corridors.find(c => c.id === filters.selectedCorridor);
        if (!corr) return false;
        return (e.from_node === corr.source_node && e.to_node === corr.destination_node) ||
               (e.from_node === corr.destination_node && e.to_node === corr.source_node);
      });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-[#a6a6a6]">
        Loading network...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex gap-4 flex-wrap items-center">
        <select
          value={filters.selectedCorridor}
          onChange={(e) => setFilters(f => ({ ...f, selectedCorridor: e.target.value }))}
          className="rounded-[10px] bg-[#090909] border border-[rgba(0,153,255,0.15)] px-4 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
        >
          <option value="all">All Corridors</option>
          {corridors.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-[14px] text-[#a6a6a6]">
          <input
            type="checkbox"
            checked={filters.showRoutes}
            onChange={(e) => setFilters(f => ({ ...f, showRoutes: e.target.checked }))}
            className="accent-[#0099ff]"
          />
          Routes
        </label>
        <label className="flex items-center gap-2 text-[14px] text-[#a6a6a6]">
          <input
            type="checkbox"
            checked={filters.showNodes}
            onChange={(e) => setFilters(f => ({ ...f, showNodes: e.target.checked }))}
            className="accent-[#0099ff]"
          />
          Nodes
        </label>
        <label className="flex items-center gap-2 text-[14px] text-[#a6a6a6]">
          <input
            type="checkbox"
            checked={filters.showDisruptions}
            onChange={(e) => setFilters(f => ({ ...f, showDisruptions: e.target.checked }))}
            className="accent-[#0099ff]"
          />
          Disruptions
        </label>
      </div>

      <div className="rounded-[15px] bg-[#090909] p-1 framer-ring" style={{ height: "500px" }}>
        <LogisticsMap
          nodes={filters.showNodes ? filteredNodes : []}
          edges={filters.showRoutes ? filteredEdges : []}
          shipments={filters.showShipments ? shipments : []}
          disruptions={filters.showDisruptions ? disruptions.filter(d => d.active) : []}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
          <h3 className="mb-4 font-[500] text-[18px] text-white">Network Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[14px] text-[#a6a6a6]">Total Nodes</span>
              <span className="text-[14px] text-white font-[500]">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-[#a6a6a6]">Total Routes</span>
              <span className="text-[14px] text-white font-[500]">{edges.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-[#a6a6a6]">Total Distance</span>
              <span className="text-[14px] text-white font-[500]">{edges.reduce((s, e) => s + (e.distance_km || 0), 0).toLocaleString()} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-[#a6a6a6]">Active Corridors</span>
              <span className="text-[14px] text-white font-[500]">{corridors.length}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[15px] bg-[#090909] p-6 framer-ring lg:col-span-2">
          <h3 className="mb-4 font-[500] text-[18px] text-white">Corridors</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {corridors.map(c => {
              const sCount = shipments.filter(s => s.shipment?.corridor_id === c.id).length;
              return (
                <div key={c.id} className="flex items-center justify-between rounded-[10px] border border-[rgba(0,153,255,0.1)] p-3">
                  <span className="text-[14px] text-white">{c.name}</span>
                  <span className={`rounded-[100px] px-3 py-1 text-[12px] ${sCount > 0 ? "bg-[rgba(0,153,255,0.15)] text-[#0099ff]" : "bg-[rgba(166,166,166,0.1)] text-[#a6a6a6]"}`}>
                    {sCount} shipments
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}