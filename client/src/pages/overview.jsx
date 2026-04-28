import { useEffect, useState, useCallback } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";

const POLL_INTERVAL_MS = 120000;

export function OverviewPage({ onRefresh }) {
  const [overview, setOverview] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [predictiveRisks, setPredictiveRisks] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [whatIf, setWhatIf] = useState(null);
  const [copilotPrompt, setCopilotPrompt] = useState("show top 5 at-risk shipments");
  const [copilotResult, setCopilotResult] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [runningHero, setRunningHero] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, sh, dis, pol, cor, kpiData, riskData, forecastData] = await Promise.all([
        supplyChainApi.overview(),
        supplyChainApi.shipments(),
        supplyChainApi.disruptions(),
        supplyChainApi.policies(),
        supplyChainApi.corridors(),
        supplyChainApi.analyticsKpis(),
        supplyChainApi.predictiveRisks(),
        supplyChainApi.riskForecast(),
      ]);
      setOverview(ov);
      setShipments(sh);
      setDisruptions(dis);
      setPolicies(pol);
      setCorridors(cor);
      setKpis(kpiData);
      setPredictiveRisks(riskData);
      setForecast(forecastData);
    } catch (e) {
      console.error("Load failed", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  async function handleAutoExecute() {
    setExecuting(true);
    try {
      await supplyChainApi.autoExecuteRecommendations(0.85, 5);
      await load();
    } catch (e) {
      console.error("Auto execute failed", e);
    }
    setExecuting(false);
  }

  async function handleWhatIf() {
    try {
      const data = await supplyChainApi.simulateWorsening(1.3);
      setWhatIf(data);
    } catch (e) {
      console.error("What-if failed", e);
    }
  }

  async function handleCopilot() {
    setCopilotLoading(true);
    try {
      const data = await supplyChainApi.copilotChat(copilotPrompt);
      setCopilotResult(data);
    } catch (e) {
      console.error("Copilot failed", e);
    }
    setCopilotLoading(false);
  }

  async function handleRunHeroDemo() {
    setRunningHero(true);
    try {
      await supplyChainApi.runHeroDemo();
      await load();
    } catch (e) {
      console.error("Hero demo failed", e);
    }
    setRunningHero(false);
  }

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

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-[15px] bg-[#090909] p-5 framer-ring">
          <p className="text-[12px] uppercase tracking-[0.21px] text-[#0099ff]">At-risk Shipments</p>
          <p className="mt-2 text-[34px] text-white font-[500]">{kpis?.at_risk_shipments || 0}</p>
        </div>
        <div className="rounded-[15px] bg-[#090909] p-5 framer-ring">
          <p className="text-[12px] uppercase tracking-[0.21px] text-[#ffaa00]">Reroute Recos</p>
          <p className="mt-2 text-[34px] text-white font-[500]">{kpis?.reroute_recommendations || 0}</p>
        </div>
        <div className="rounded-[15px] bg-[#090909] p-5 framer-ring">
          <p className="text-[12px] uppercase tracking-[0.21px] text-[#ff4444]">SLA Gap Hours</p>
          <p className="mt-2 text-[34px] text-white font-[500]">{kpis?.sla_gap_hours_total || 0}</p>
        </div>
        <div className="rounded-[15px] bg-[#090909] p-5 framer-ring">
          <p className="text-[12px] uppercase tracking-[0.21px] text-[#00ff88]">Auto Actions</p>
          <p className="mt-2 text-[34px] text-white font-[500]">{kpis?.auto_actions_executed || 0}</p>
        </div>
      </div>

      <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-[500] text-[18px] text-white">Preemptive Risk Radar</h3>
          <div className="flex items-center gap-2">
            <button
              className="rounded-[10px] border border-[rgba(0,153,255,0.4)] px-3 py-2 text-[13px] text-[#0099ff] disabled:opacity-50"
              disabled={runningHero}
              onClick={handleRunHeroDemo}
              type="button"
            >
              {runningHero ? "Running Demo..." : "Run Hero Demo"}
            </button>
            <button
              className="rounded-[10px] bg-[#0099ff] px-3 py-2 text-[13px] text-white disabled:opacity-50"
              disabled={executing}
              onClick={handleAutoExecute}
              type="button"
            >
              {executing ? "Executing..." : "Auto-execute High Confidence"}
            </button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {predictiveRisks.length === 0 && <p className="text-[#a6a6a6] text-[14px]">No high-risk corridors predicted.</p>}
          {predictiveRisks.map((item) => (
            <div className="rounded-[10px] border border-[rgba(0,153,255,0.15)] p-3" key={item.corridor_id}>
              <p className="text-white text-[14px]">{item.corridor_name}</p>
              <p className="text-[#a6a6a6] text-[12px]">{item.corridor_id}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[12px] text-[#a6a6a6] uppercase">{item.risk_band}</span>
                <span className="text-[14px] font-[500] text-[#ffaa00]">{item.predicted_risk}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-[500] text-[18px] text-white">Likely To Fail SLA Soon</h3>
            <button
              className="rounded-[10px] border border-[rgba(0,153,255,0.2)] px-3 py-1 text-[12px] text-[#a6a6a6]"
              onClick={handleWhatIf}
              type="button"
            >
              Run +30% What-if
            </button>
          </div>
          <div className="space-y-2">
            {forecast.slice(0, 4).map((item) => (
              <div className="rounded-[10px] border border-[rgba(255,170,0,0.2)] p-3" key={item.corridor_id}>
                <div className="flex items-center justify-between">
                  <p className="text-white text-[14px]">{item.corridor_name}</p>
                  <span className="text-[#ffaa00] text-[12px]">12h fail prob {(item.forecast?.[2]?.probability_sla_failure * 100).toFixed(0)}%</span>
                </div>
                <p className="mt-1 text-[12px] text-[#a6a6a6]">
                  Drivers: {(item.drivers || []).slice(0, 3).map((d) => `${d.name} ${Math.round(d.weight * 100)}%`).join(", ")}
                </p>
              </div>
            ))}
            {forecast.length === 0 && <p className="text-[14px] text-[#a6a6a6]">No significant forecasted SLA risk.</p>}
          </div>
          {whatIf && (
            <div className="mt-4 rounded-[10px] bg-[#0a0a0a] p-3 text-[13px] text-[#a6a6a6]">
              Impacted: <span className="text-white">{whatIf.impacted_count}</span> | SLA hours at risk: <span className="text-white">{whatIf.estimated_sla_hours_at_risk}</span> | Est. saved if actioned: <span className="text-[#00ff88]">{whatIf.estimated_sla_hours_saved_if_actioned}</span>
            </div>
          )}
        </div>

        <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
          <h3 className="mb-4 font-[500] text-[18px] text-white">Ops Copilot</h3>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-[10px] border border-[rgba(0,153,255,0.15)] bg-[#0a0a0a] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              onChange={(e) => setCopilotPrompt(e.target.value)}
              value={copilotPrompt}
            />
            <button
              className="rounded-[10px] bg-[#0099ff] px-4 py-2 text-[13px] text-white disabled:opacity-50"
              disabled={copilotLoading}
              onClick={handleCopilot}
              type="button"
            >
              {copilotLoading ? "Thinking..." : "Ask"}
            </button>
          </div>
          {copilotResult?.intent === "top_risk_shipments" && Array.isArray(copilotResult?.data) && (
            <div className="mt-3 space-y-2">
              {copilotResult.data.map((item) => (
                <div className="flex items-center justify-between rounded-[10px] bg-[#0a0a0a] p-3" key={item.shipment_id}>
                  <div>
                    <p className="font-mono text-[12px] text-white">{item.shipment_id}</p>
                    <p className="text-[12px] text-[#a6a6a6]">{String(item.action || "-").replace(/_/g, " ")}</p>
                  </div>
                  <span className="text-[14px] font-[500] text-[#ff4444]">Risk {Number(item.risk || 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
          {copilotResult && !(copilotResult?.intent === "top_risk_shipments" && Array.isArray(copilotResult?.data)) && (
            <pre className="mt-3 overflow-x-auto rounded-[10px] bg-[#0a0a0a] p-3 text-[12px] text-[#a6a6a6]">
              {JSON.stringify(copilotResult, null, 2)}
            </pre>
          )}
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
