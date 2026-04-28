import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supplyChainApi } from "../lib/supply-chain-api";

const GOODS_TYPES = [
  {
    id: "cold_chain",
    label: "Cold Chain",
    icon: "CC",
    accent: "#00d4ff",
    risks: ["temperature drift", "reefer downtime", "handover delays"],
    controls: ["strict SLA windows", "prefer stable corridors", "high disruption sensitivity"],
  },
  {
    id: "frozen",
    label: "Frozen Goods",
    icon: "FG",
    accent: "#66b3ff",
    risks: ["route extension risk", "power interruptions", "compliance penalties"],
    controls: ["penalize long ETA", "reroute early", "carrier reliability weighting"],
  },
  {
    id: "express",
    label: "Express",
    icon: "EX",
    accent: "#ffaa00",
    risks: ["traffic bottlenecks", "last-mile congestion", "tight buffers"],
    controls: ["ETA-first ranking", "auto-escalation on delay", "fast reroute triggers"],
  },
  {
    id: "fragile",
    label: "Fragile",
    icon: "FR",
    accent: "#ff7a7a",
    risks: ["excess handling", "rough corridor segments", "carrier mismatch"],
    controls: ["route smoothness bias", "carrier filtering", "hold-and-escalate threshold"],
  },
  {
    id: "heavy",
    label: "Heavy Industrial",
    icon: "HV",
    accent: "#c08bff",
    risks: ["regulatory restrictions", "bridge/edge limits", "slow transit windows"],
    controls: ["policy-heavy compliance", "restricted edge blocking", "priority corridor checks"],
  },
  {
    id: "standard",
    label: "Standard",
    icon: "ST",
    accent: "#00ff88",
    risks: ["cost volatility", "moderate SLA pressure", "network saturation"],
    controls: ["balanced score routing", "cost-risk optimization", "dynamic policy adaptation"],
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [activeGoods, setActiveGoods] = useState(GOODS_TYPES[0].id);

  const loadStats = useCallback(async () => {
    try {
      const [ov, sh, dis] = await Promise.all([
        supplyChainApi.overview(),
        supplyChainApi.shipments(),
        supplyChainApi.disruptions(),
      ]);
      setStats({
        ...ov,
        inTransit: sh.filter(s => s.shipment?.status === "in_transit").length,
        atRisk: sh.filter(s => (s.recommendation?.expected_impact?.risk || 0) >= 5).length,
        activeDisruptions: dis.filter(d => d.active).length,
      });
      setIsLive(true);
    } catch (e) {
      console.error("Failed to load stats", e);
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 120000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const handleStart = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/overview");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,153,255,0.2)] bg-[#090909] px-4 py-2">
            <div className={`h-2 w-2 rounded-full ${isLive ? "bg-[#00ff88] animate-pulse" : "bg-[#666666]"}`} />
            <span className="text-[12px] font-[500] uppercase tracking-[0.21px] text-[#0099ff]">
              {isLive ? "System Active" : "Connecting..."}
            </span>
          </div>
          <h1 className="mb-6 font-[500] text-[110px] leading-[0.85] tracking-[-5.5px] text-white font-[GT_Walsheim]">
            Logistics
            <span className="block text-[#0099ff]">Control Tower</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-[#a6a6a6] leading-relaxed">
            AI-powered supply chain resilience platform. Continuously monitoring weather, traffic, and operational events
            to preemptively detect disruptions and optimize routes before delays cascade.
          </p>
        </div>

        {stats && (
          <div className="mb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
              <p className="mb-2 font-[500] text-[12px] uppercase tracking-[0.21px] text-[#0099ff]">Active Shipments</p>
              <p className="font-[500] text-[48px] text-white leading-none">{stats.active_shipments || 0}</p>
              <p className="mt-3 text-[14px] text-[#a6a6a6]">{stats.inTransit || 0} in transit</p>
            </div>
            <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
              <p className="mb-2 font-[500] text-[12px] uppercase tracking-[0.21px] text-[#ffaa00]">At Risk</p>
              <p className="font-[500] text-[48px] text-white leading-none">{stats.atRisk || 0}</p>
              <p className="mt-3 text-[14px] text-[#a6a6a6]">shipments need attention</p>
            </div>
            <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
              <p className="mb-2 font-[500] text-[12px] uppercase tracking-[0.21px] text-[#ff4444]">Disruptions</p>
              <p className="font-[500] text-[48px] text-white leading-none">{stats.activeDisruptions || 0}</p>
              <p className="mt-3 text-[14px] text-[#a6a6a6]">active alerts</p>
            </div>
            <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
              <p className="mb-2 font-[500] text-[12px] uppercase tracking-[0.21px] text-[#00ff88]">Network</p>
              <p className="font-[500] text-[48px] text-white leading-none">{stats.corridors_supported || 0}</p>
              <p className="mt-3 text-[14px] text-[#a6a6a6]">corridors monitored</p>
            </div>
          </div>
        )}

        <div className="mb-20 grid gap-6 md:grid-cols-3">
          <div className="rounded-[15px] bg-[#090909] p-8 framer-ring">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#0099ff]" />
              <h3 className="font-[500] text-[24px] text-white tracking-[-1px]">Smart Routing</h3>
            </div>
            <p className="text-[15px] text-[#a6a6a6] leading-relaxed">
              AI analyzes constraints, policies, and disruptions to recommend optimal routes.
              Auto-reroutes shipments before delays cascade.
            </p>
          </div>

          <div className="rounded-[15px] bg-[#090909] p-8 framer-ring">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#ffaa00]" />
              <h3 className="font-[500] text-[24px] text-white tracking-[-1px]">Disruption Detection</h3>
            </div>
            <p className="text-[15px] text-[#a6a6a6] leading-relaxed">
              Real-time monitoring of weather, traffic, and operational events.
              {stats?.activeDisruptions > 0 && (
                <span className="text-[#ff4444]"> {stats.activeDisruptions} active alert(s) detected.</span>
              )}
            </p>
          </div>

          <div className="rounded-[15px] bg-[#090909] p-8 framer-ring">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#00ff88]" />
              <h3 className="font-[500] text-[24px] text-white tracking-[-1px]">Policy Compliance</h3>
            </div>
            <p className="text-[15px] text-[#a6a6a6] leading-relaxed">
              Temperature control, regulatory routes, and SLA rules enforced automatically.
              {stats?.policies_enabled > 0 && (
                <span className="text-[#00ff88]"> {stats.policies_enabled} active policies.</span>
              )}
            </p>
          </div>
        </div>

        <div className="mb-20 rounded-[18px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(145deg,#070707,#111111)] p-6 framer-ring">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="font-[500] text-[22px] tracking-[-0.5px] text-white">Goods Intelligence Matrix</h3>
            <span className="rounded-full border border-[rgba(0,153,255,0.25)] px-3 py-1 text-[11px] uppercase tracking-[0.21px] text-[#0099ff]">
              Tap Any Cargo Type
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-6">
            {GOODS_TYPES.map((item) => {
              const isActive = item.id === activeGoods;
              return (
                <button
                  key={item.id}
                  className={`rounded-[12px] border px-3 py-3 text-left transition-all ${
                    isActive
                      ? "border-[rgba(0,153,255,0.45)] bg-[#0d0d0d]"
                      : "border-[rgba(255,255,255,0.08)] bg-[#090909] hover:border-[rgba(255,255,255,0.18)]"
                  }`}
                  onClick={() => setActiveGoods(item.id)}
                  type="button"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-[11px] font-[600]"
                      style={{ backgroundColor: `${item.accent}22`, color: item.accent }}
                    >
                      {item.icon}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2px] text-[#a6a6a6]">{isActive ? "Open" : "View"}</span>
                  </div>
                  <p className="text-[13px] font-[500] text-white">{item.label}</p>
                </button>
              );
            })}
          </div>
          {GOODS_TYPES.map((item) => {
            if (item.id !== activeGoods) return null;
            return (
              <div key={item.id} className="mt-4 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[12px] uppercase tracking-[0.21px] text-[#ff9f43]">Primary Risk Signals</p>
                    <div className="space-y-1">
                      {item.risks.map((risk) => (
                        <p key={risk} className="text-[13px] text-[#c7c7c7]">- {risk}</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[12px] uppercase tracking-[0.21px] text-[#00d084]">Optimization Controls</p>
                    <div className="space-y-1">
                      {item.controls.map((control) => (
                        <p key={control} className="text-[13px] text-[#c7c7c7]">- {control}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            className="inline-flex items-center gap-3 rounded-[100px] bg-white px-10 py-4 font-[500] text-[18px] text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,153,255,0.3)] disabled:opacity-50"
            disabled={loading}
            onClick={handleStart}
            type="button"
          >
            {loading ? "Loading..." : "Launch Control Tower"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
