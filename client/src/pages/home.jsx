import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supplyChainApi } from "../lib/supply-chain-api";

export function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [isLive, setIsLive] = useState(false);

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
