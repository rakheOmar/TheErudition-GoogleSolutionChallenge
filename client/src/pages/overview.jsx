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
    if (risk >= 7) {
      riskStats.critical++;
    } else if (risk >= 5) {
      riskStats.high++;
    } else if (risk >= 3) {
      riskStats.medium++;
    } else {
      riskStats.low++;
    }
  });

  const actionStats = {
    continue_with_watch: 0,
    reroute: 0,
    hold_and_escalate: 0,
    no_compliant_path: 0,
  };
  shipments.forEach((s) => {
    const act = s.recommendation?.action;
    if (act) {
      actionStats[act] = (actionStats[act] || 0) + 1;
    }
  });

  const severityCounts = { high: 0, medium: 0, low: 0 };
  disruptions
    .filter((d) => d.active)
    .forEach((d) => {
      severityCounts[d.severity] = (severityCounts[d.severity] || 0) + 1;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Loading dashboard...
      </div>
    );
  }

return (
    <div className="grid gap-6">
      {/* Hero Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-500 to-cyan-600 p-5 shadow-md">
          <div className="absolute -right-4 -bottom-4 text-white/20 text-8xl font-bold">50</div>
          <p className="font-medium text-cyan-100 text-xs uppercase tracking-wider">
            Active Shipments
          </p>
          <p className="mt-1 font-bold text-white text-4xl">{overview?.active_shipments || 0}</p>
          <p className="mt-2 text-cyan-100 text-xs">
            {shipments.filter((s) => s.shipment.status === "in_transit").length} in transit
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-500 to-amber-600 p-5 shadow-md">
          <div className="absolute -right-4 -bottom-4 text-white/20 text-8xl font-bold">!</div>
          <p className="font-medium text-amber-100 text-xs uppercase tracking-wider">
            Active Disruptions
          </p>
          <p className="mt-1 font-bold text-white text-4xl">{overview?.active_disruptions || 0}</p>
          <p className="mt-2 text-amber-100 text-xs">
            {severityCounts.high} high, {severityCounts.medium} medium
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 shadow-md">
          <div className="absolute -right-4 -bottom-4 text-white/20 text-8xl font-bold">POL</div>
          <p className="font-medium text-emerald-100 text-xs uppercase tracking-wider">
            Active Policies
          </p>
          <p className="mt-1 font-bold text-white text-4xl">{overview?.policies_enabled || 0}</p>
          <p className="mt-2 text-emerald-100 text-xs">
            {policies.length} total rules
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-500 to-violet-600 p-5 shadow-md">
          <div className="absolute -right-4 -bottom-4 text-white/20 text-8xl font-bold">NET</div>
          <p className="font-medium text-violet-100 text-xs uppercase tracking-wider">
            Network Nodes
          </p>
          <p className="mt-1 font-bold text-white text-4xl">{overview?.corridors_supported || 0}</p>
          <p className="mt-2 text-violet-100 text-xs">
            cities connected
          </p>
        </div>
      </div>

      {/* Visual Donut Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk Donut */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Risk Distribution</h3>
          <div className="flex items-center gap-6">
            <div className="relative h-32 w-32 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="3" />
                {riskStats.critical > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-red-600" strokeWidth="3"
                    strokeDasharray={`${(riskStats.critical / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset="0" />
                )}
                {riskStats.high > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-orange-500" strokeWidth="3"
                    strokeDasharray={`${(riskStats.high / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset={-((riskStats.critical / Math.max(shipments.length, 1)) * 100)} />
                )}
                {riskStats.medium > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-amber-500" strokeWidth="3"
                    strokeDasharray={`${(riskStats.medium / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset={-(((riskStats.critical + riskStats.high) / Math.max(shipments.length, 1)) * 100)} />
                )}
                {riskStats.low > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-emerald-500" strokeWidth="3"
                    strokeDasharray={`${(riskStats.low / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset={-(((riskStats.critical + riskStats.high + riskStats.medium) / Math.max(shipments.length, 1)) * 100)} />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold text-slate-700 text-xl">{shipments.length}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-600"></span>Critical</span>
                <span className="font-medium text-red-600">{riskStats.critical}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-500"></span>High</span>
                <span className="font-medium text-orange-500">{riskStats.high}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500"></span>Medium</span>
                <span className="font-medium text-amber-500">{riskStats.medium}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500"></span>Low</span>
                <span className="font-medium text-emerald-500">{riskStats.low}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Donut */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Action Recommendations</h3>
          <div className="flex items-center gap-6">
            <div className="relative h-32 w-32 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="3" />
                {actionStats.continue_with_watch > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-emerald-500" strokeWidth="3"
                    strokeDasharray={`${(actionStats.continue_with_watch / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset="0" />
                )}
                {actionStats.reroute > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-amber-500" strokeWidth="3"
                    strokeDasharray={`${(actionStats.reroute / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset={-((actionStats.continue_with_watch / Math.max(shipments.length, 1)) * 100)} />
                )}
                {actionStats.hold_and_escalate > 0 && (
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-red-500" strokeWidth="3"
                    strokeDasharray={`${(actionStats.hold_and_escalate / Math.max(shipments.length, 1)) * 100} 100`}
                    strokeDashoffset={-(((actionStats.continue_with_watch + actionStats.reroute) / Math.max(shipments.length, 1)) * 100)} />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold text-slate-700 text-xl">{shipments.length}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500"></span>Continue</span>
                <span className="font-medium text-emerald-600">{actionStats.continue_with_watch}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500"></span>Reroute</span>
                <span className="font-medium text-amber-600">{actionStats.reroute}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500"></span>Hold/Escalate</span>
                <span className="font-medium text-red-600">{actionStats.hold_and_escalate}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-400"></span>No Path</span>
                <span className="font-medium text-slate-600">{actionStats.no_compliant_path}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-lg text-slate-800">
            Risk Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-20 text-slate-600 text-sm">Critical</div>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-red-600"
                  style={{
                    width: `${(riskStats.critical / Math.max(shipments.length, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-10 text-right font-medium text-red-600">
                {riskStats.critical}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 text-slate-600 text-sm">High</div>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{
                    width: `${(riskStats.high / Math.max(shipments.length, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-10 text-right font-medium text-orange-500">
                {riskStats.high}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 text-slate-600 text-sm">Medium</div>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${(riskStats.medium / Math.max(shipments.length, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-10 text-right font-medium text-amber-500">
                {riskStats.medium}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 text-slate-600 text-sm">Low</div>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${(riskStats.low / Math.max(shipments.length, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-10 text-right font-medium text-emerald-500">
                {riskStats.low}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-lg text-slate-800">
            Action Recommendations
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-32 text-slate-600 text-sm">Continue</div>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${(actionStats.continue_with_watch / Math.max(shipments.length, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-10 text-right font-medium text-emerald-600">
                {actionStats.continue_with_watch}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 text-slate-600 text-sm">Reroute</div>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: `${(actionStats.reroute / Math.max(shipments.length, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-10 text-right font-medium text-amber-600">
                {actionStats.reroute}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 text-slate-600 text-sm">Hold & Escalate</div>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{
                    width: `${(actionStats.hold_and_escalate / Math.max(shipments.length, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-10 text-right font-medium text-red-600">
                {actionStats.hold_and_escalate}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 text-slate-600 text-sm">No Path</div>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-400"
                  style={{
                    width: `${(actionStats.no_compliant_path / Math.max(shipments.length, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="w-10 text-right font-medium text-slate-600">
                {actionStats.no_compliant_path}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Top Disruptions</h3>
          <div className="space-y-2">
            {disruptions
              .filter((d) => d.active)
              .slice(0, 5)
              .map((d) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-2"
                  key={d.id}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium text-xs ${
                        d.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : d.severity === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {d.severity}
                    </span>
                    <span className="text-slate-700 text-sm">
                      {d.event_type.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-slate-500 text-xs">
                    {d.target_type}
                  </span>
                </div>
              ))}
            {disruptions.filter((d) => d.active).length === 0 && (
              <p className="text-slate-500 text-sm">No active disruptions</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-3 font-semibold text-slate-800">
            Corridors Overview
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {corridors.slice(0, 6).map((c) => {
              const shipmentCount = shipments.filter(
                (s) => s.shipment.corridor_id === c.id
              ).length;
              return (
                <div
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-2"
                  key={c.id}
                >
                  <span className="font-medium text-slate-700 text-sm">
                    {c.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${shipmentCount > 0 ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {shipmentCount} shipments
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">Recent Shipments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-slate-200 border-b">
                <th className="pb-2 font-medium text-slate-600">ID</th>
                <th className="pb-2 font-medium text-slate-600">Corridor</th>
                <th className="pb-2 font-medium text-slate-600">Status</th>
                <th className="pb-2 font-medium text-slate-600">Action</th>
                <th className="pb-2 font-medium text-slate-600">ETA</th>
                <th className="pb-2 font-medium text-slate-600">Risk</th>
                <th className="pb-2 font-medium text-slate-600">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {shipments.slice(0, 8).map((s) => (
                <tr className="border-slate-100 border-b" key={s.shipment.id}>
                  <td className="py-2 font-mono text-slate-700">
                    {s.shipment.id}
                  </td>
                  <td className="py-2 text-slate-600">
                    {s.shipment.corridor_id}
                  </td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${s.shipment.status === "in_transit" ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {s.shipment.status}
                    </span>
                  </td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        s.recommendation.action === "continue_with_watch"
                          ? "bg-emerald-100 text-emerald-700"
                          : s.recommendation.action === "reroute"
                            ? "bg-amber-100 text-amber-700"
                            : s.recommendation.action === "hold_and_escalate"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {s.recommendation.action.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2 text-slate-600">
                    {s.recommendation.expected_impact?.eta_h?.toFixed(1) || "-"}
                    h
                  </td>
                  <td className="py-2 text-slate-600">
                    {s.recommendation.expected_impact?.risk?.toFixed(1) || "-"}
                  </td>
                  <td className="py-2 text-slate-600">
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
