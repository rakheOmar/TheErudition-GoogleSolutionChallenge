import { useEffect, useState } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";

export function OverviewPage({ onRefresh }) {
  const [overview, setOverview] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [ov, sh, dis, pol, cor] = await Promise.all([
        supplyChainApi.overview(),
        supplyChainApi.shipments(),
        supplyChainApi.disruptions(),
        supplyChainApi.policies(),
        supplyChainApi.corridors(),
      ]);
      setOverview(ov);
      setShipments(sh);
      setDisruptions(dis);
      setPolicies(pol);
      setCorridors(cor);
    } catch (e) {
      console.error("Load failed", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const riskStats = { low: 0, medium: 0, high: 0, critical: 0 };
  shipments.forEach((s) => {
    const risk = s.recommendation?.expected_impact?.risk || 0;
    if (risk >= 7) riskStats.critical++;
    else if (risk >= 5) riskStats.high++;
    else if (risk >= 3) riskStats.medium++;
    else riskStats.low++;
  });

  const actionStats = { continue_with_watch: 0, reroute: 0, hold_and_escalate: 0, no_compliant_path: 0 };
  shipments.forEach((s) => {
    const act = s.recommendation?.action;
    if (act) actionStats[act] = (actionStats[act] || 0) + 1;
  });

  const severityCounts = { high: 0, medium: 0, low: 0 };
  disruptions.filter((d) => d.active).forEach((d) => {
    severityCounts[d.severity] = (severityCounts[d.severity] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-[#a6a6a6]">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-[15px] bg-[#090909] p-6 framer-ring">
          <div className="absolute -right-6 -bottom-6 font-[500] text-[120px] text-[rgba(0,153,255,0.1)] leading-none">
            50
          </div>
          <p className="font-[500] text-[12px] uppercase tracking-[0.21px] text-[#0099ff]">
            Active Shipments
          </p>
          <p className="mt-2 font-[500] text-[48px] text-white leading-none">
            {overview?.active_shipments || 0}
          </p>
          <p className="mt-3 text-[14px] text-[#a6a6a6]">
            {shipments.filter((s) => s.shipment.status === "in_transit").length} in transit
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[15px] bg-[#090909] p-6 framer-ring">
          <div className="absolute -right-6 -bottom-6 font-[500] text-[120px] text-[rgba(255,170,0,0.1)] leading-none">
            !
          </div>
          <p className="font-[500] text-[12px] uppercase tracking-[0.21px] text-[#ffaa00]">
            Active Disruptions
          </p>
          <p className="mt-2 font-[500] text-[48px] text-white leading-none">
            {overview?.active_disruptions || 0}
          </p>
          <p className="mt-3 text-[14px] text-[#a6a6a6]">
            {severityCounts.high} high, {severityCounts.medium} medium
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[15px] bg-[#090909] p-6 framer-ring">
          <div className="absolute -right-6 -bottom-6 font-[500] text-[120px] text-[rgba(0,255,136,0.1)] leading-none">
            POL
          </div>
          <p className="font-[500] text-[12px] uppercase tracking-[0.21px] text-[#00ff88]">
            Active Policies
          </p>
          <p className="mt-2 font-[500] text-[48px] text-white leading-none">
            {overview?.policies_enabled || 0}
          </p>
          <p className="mt-3 text-[14px] text-[#a6a6a6]">
            {policies.length} total rules
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[15px] bg-[#090909] p-6 framer-ring">
          <div className="absolute -right-6 -bottom-6 font-[500] text-[120px] text-[rgba(170,0,255,0.1)] leading-none">
            NET
          </div>
          <p className="font-[500] text-[12px] uppercase tracking-[0.21px] text-[#aa00ff]">
            Network Nodes
          </p>
          <p className="mt-2 font-[500] text-[48px] text-white leading-none">
            {overview?.corridors_supported || 0}
          </p>
          <p className="mt-3 text-[14px] text-[#a6a6a6]">
            cities connected
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
          <h3 className="mb-6 font-[500] text-[20px] text-white">Risk Distribution</h3>
          <div className="flex items-center gap-8">
            <div className="relative h-36 w-36 shrink-0">
              <svg className="h-full w-full -rotate-[90deg]" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                {riskStats.critical > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#ff4444" strokeWidth="3"
                    strokeDasharray={`${(riskStats.critical / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset="0" />
                )}
                {riskStats.high > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#ff8800" strokeWidth="3"
                    strokeDasharray={`${(riskStats.high / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset={-((riskStats.critical / Math.max(shipments.length, 1)) * 100)} />
                )}
                {riskStats.medium > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#ffaa00" strokeWidth="3"
                    strokeDasharray={`${(riskStats.medium / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset={-(((riskStats.critical + riskStats.high) / Math.max(shipments.length, 1)) * 100)} />
                )}
                {riskStats.low > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#00ff88" strokeWidth="3"
                    strokeDasharray={`${(riskStats.low / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset={-(((riskStats.critical + riskStats.high + riskStats.medium) / Math.max(shipments.length, 1)) * 100)} />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-[500] text-[32px] text-white">{shipments.length}</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-[15px] text-[#a6a6a6]">
                  <span className="h-3 w-3 rounded-full bg-[#ff4444]"></span>Critical
                </span>
                <span className="font-[500] text-[#ff4444]">{riskStats.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-[15px] text-[#a6a6a6]">
                  <span className="h-3 w-3 rounded-full bg-[#ff8800]"></span>High
                </span>
                <span className="font-[500] text-[#ff8800]">{riskStats.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-[15px] text-[#a6a6a6]">
                  <span className="h-3 w-3 rounded-full bg-[#ffaa00]"></span>Medium
                </span>
                <span className="font-[500] text-[#ffaa00]">{riskStats.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-[15px] text-[#a6a6a6]">
                  <span className="h-3 w-3 rounded-full bg-[#00ff88]"></span>Low
                </span>
                <span className="font-[500] text-[#00ff88]">{riskStats.low}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
          <h3 className="mb-6 font-[500] text-[20px] text-white">Action Recommendations</h3>
          <div className="flex items-center gap-8">
            <div className="relative h-36 w-36 shrink-0">
              <svg className="h-full w-full -rotate-[90deg]" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                {actionStats.continue_with_watch > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#00ff88" strokeWidth="3"
                    strokeDasharray={`${(actionStats.continue_with_watch / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset="0" />
                )}
                {actionStats.reroute > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#ffaa00" strokeWidth="3"
                    strokeDasharray={`${(actionStats.reroute / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset={-((actionStats.continue_with_watch / Math.max(shipments.length, 1)) * 100)} />
                )}
                {actionStats.hold_and_escalate > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#ff4444" strokeWidth="3"
                    strokeDasharray={`${(actionStats.hold_and_escalate / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset={-(((actionStats.continue_with_watch + actionStats.reroute) / Math.max(shipments.length, 1)) * 100)} />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-[500] text-[32px] text-white">{shipments.length}</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-[15px] text-[#a6a6a6]">
                  <span className="h-3 w-3 rounded-full bg-[#00ff88]"></span>Continue
                </span>
                <span className="font-[500] text-[#00ff88]">{actionStats.continue_with_watch}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-[15px] text-[#a6a6a6]">
                  <span className="h-3 w-3 rounded-full bg-[#ffaa00]"></span>Reroute
                </span>
                <span className="font-[500] text-[#ffaa00]">{actionStats.reroute}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-[15px] text-[#a6a6a6]">
                  <span className="h-3 w-3 rounded-full bg-[#ff4444]"></span>Hold/Escalate
                </span>
                <span className="font-[500] text-[#ff4444]">{actionStats.hold_and_escalate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3 text-[15px] text-[#a6a6a6]">
                  <span className="h-3 w-3 rounded-full bg-[#666666]"></span>No Path
                </span>
                <span className="font-[500] text-[#666666]">{actionStats.no_compliant_path}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
          <h3 className="mb-4 font-[500] text-[18px] text-white">Top Disruptions</h3>
          <div className="space-y-3">
            {disruptions.filter((d) => d.active).slice(0, 5).map((d) => (
              <div className="flex items-center justify-between rounded-[8px] bg-[#000000] p-3" key={d.id}>
                <div className="flex items-center gap-3">
                  <span className={`rounded-[100px] px-3 py-1 font-[500] text-[12px] ${
                    d.severity === "high"
                      ? "bg-[rgba(255,68,68,0.15)] text-[#ff4444]"
                      : d.severity === "medium"
                        ? "bg-[rgba(255,170,0,0.15)] text-[#ffaa00]"
                        : "bg-[rgba(166,166,166,0.15)] text-[#a6a6a6]"
                  }`}>
                    {d.severity}
                  </span>
                  <span className="text-[14px] text-white">
                    {d.event_type.replace("_", " ")}
                  </span>
                </div>
                <span className="text-[12px] text-[#a6a6a6]">{d.target_type}</span>
              </div>
            ))}
            {disruptions.filter((d) => d.active).length === 0 && (
              <p className="text-[14px] text-[#a6a6a6]">No active disruptions</p>
            )}
          </div>
        </div>

        <div className="rounded-[15px] bg-[#090909] p-6 framer-ring lg:col-span-2">
          <h3 className="mb-4 font-[500] text-[18px] text-white">Corridors Overview</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {corridors.slice(0, 6).map((c) => {
              const shipmentCount = shipments.filter((s) => s.shipment.corridor_id === c.id).length;
              return (
                <div className="flex items-center justify-between rounded-[10px] border border-[rgba(0,153,255,0.1)] p-3" key={c.id}>
                  <span className="font-[500] text-[14px] text-white">{c.name}</span>
                  <span className={`rounded-[100px] px-3 py-1 text-[12px] ${
                    shipmentCount > 0
                      ? "bg-[rgba(0,153,255,0.15)] text-[#0099ff]"
                      : "bg-[rgba(166,166,166,0.1)] text-[#a6a6a6]"
                  }`}>
                    {shipmentCount} shipments
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
        <h3 className="mb-4 font-[500] text-[18px] text-white">Recent Shipments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-[rgba(0,153,255,0.15)]">
                <th className="pb-3 font-[500] text-[#a6a6a6]">ID</th>
                <th className="pb-3 font-[500] text-[#a6a6a6]">Corridor</th>
                <th className="pb-3 font-[500] text-[#a6a6a6]">Status</th>
                <th className="pb-3 font-[500] text-[#a6a6a6]">Action</th>
                <th className="pb-3 font-[500] text-[#a6a6a6]">ETA</th>
                <th className="pb-3 font-[500] text-[#a6a6a6]">Risk</th>
                <th className="pb-3 font-[500] text-[#a6a6a6]">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {shipments.slice(0, 8).map((s) => (
                <tr className="border-b border-[rgba(0,153,255,0.1)]" key={s.shipment.id}>
                  <td className="py-3 font-[500] text-[#0099ff]">{s.shipment.id}</td>
                  <td className="py-3 text-[#a6a6a6]">{s.shipment.corridor_id}</td>
                  <td className="py-3">
                    <span className={`rounded-[100px] px-3 py-1 text-[12px] ${
                      s.shipment.status === "in_transit"
                        ? "bg-[rgba(0,153,255,0.15)] text-[#0099ff]"
                        : "bg-[rgba(166,166,166,0.1)] text-[#a6a6a6]"
                    }`}>
                      {s.shipment.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`rounded-[100px] px-3 py-1 text-[12px] ${
                      s.recommendation.action === "continue_with_watch"
                        ? "bg-[rgba(0,255,136,0.15)] text-[#00ff88]"
                        : s.recommendation.action === "reroute"
                          ? "bg-[rgba(255,170,0,0.15)] text-[#ffaa00]"
                          : s.recommendation.action === "hold_and_escalate"
                            ? "bg-[rgba(255,68,68,0.15)] text-[#ff4444]"
                            : "bg-[rgba(102,102,102,0.15)] text-[#666666]"
                    }`}>
                      {s.recommendation.action.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 text-[#a6a6a6]">
                    {s.recommendation.expected_impact?.eta_h?.toFixed(1) || "-"}h
                  </td>
                  <td className="py-3 text-[#a6a6a6]">
                    {s.recommendation.expected_impact?.risk?.toFixed(1) || "-"}
                  </td>
                  <td className="py-3 text-[#a6a6a6]">
                    {(s.recommendation.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}