import { useEffect, useState, useCallback } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";

const ACTION_COLORS = {
  continue_with_watch: "bg-[rgba(0,153,255,0.15)] text-[#0099ff]",
  reroute: "bg-[rgba(255,170,0,0.15)] text-[#ffaa00]",
  hold_and_escalate: "bg-[rgba(255,68,68,0.15)] text-[#ff4444]",
  no_compliant_path: "bg-[rgba(166,166,166,0.15)] text-[#a6a6a6]",
};

export function ShipmentsPage({ onRefresh }) {
  const [shipments, setShipments] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ corridor_id: "", load_profile_id: "", sla_eta_h: "12" });
  const [submitting, setSubmitting] = useState(false);
  const [explanations, setExplanations] = useState({});
  const [explaining, setExplaining] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sh, co, pr] = await Promise.all([
        supplyChainApi.shipments(),
        supplyChainApi.corridors(),
        supplyChainApi.loadProfiles(),
      ]);
      setShipments(sh);
      setCorridors(co);
      setProfiles(pr);
      if (co.length && !form.corridor_id) {
        setForm((f) => ({ ...f, corridor_id: co[0].id, load_profile_id: pr[0]?.id || "" }));
      }
    } catch (e) {
      console.error("Load failed", e);
    }
    setLoading(false);
  }, [form.corridor_id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supplyChainApi.createShipment({
        corridor_id: form.corridor_id,
        load_profile_id: form.load_profile_id,
        sla_eta_h: Number(form.sla_eta_h),
      });
      await load();
      onRefresh?.();
    } catch (e) {
      console.error("Create failed", e);
    }
    setSubmitting(false);
  }

  async function handleRecompute(id) {
    try {
      await supplyChainApi.recomputeShipment(id);
      await load();
    } catch (e) {
      console.error("Recompute failed", e);
    }
  }

  async function handleExplain(id) {
    setExplaining(id);
    try {
      const data = await supplyChainApi.explainShipment(id);
      setExplanations(prev => ({ ...prev, [id]: data.explanation }));
    } catch (e) {
      console.error("Explanation failed", e);
      setExplanations(prev => ({ ...prev, [id]: "Failed to get explanation" }));
    }
    setExplaining(null);
  }

  function formatAction(action) {
    return action?.replace(/_/g, " ") || "-";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-[#a6a6a6]">
        Loading shipments...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
        <h3 className="mb-4 font-[500] text-[18px] text-white">Create New Shipment</h3>
        <form className="flex flex-wrap items-end gap-4" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">Corridor</label>
            <select
              className="min-w-48 rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              onChange={(e) => setForm((f) => ({ ...f, corridor_id: e.target.value }))}
              required
              value={form.corridor_id}
            >
              {corridors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">Load Profile</label>
            <select
              className="min-w-40 rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              onChange={(e) => setForm((f) => ({ ...f, load_profile_id: e.target.value }))}
              required
              value={form.load_profile_id}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">SLA ETA (hrs)</label>
            <input
              className="w-24 rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              min="1"
              onChange={(e) => setForm((f) => ({ ...f, sla_eta_h: e.target.value }))}
              required
              step="0.5"
              type="number"
              value={form.sla_eta_h}
            />
          </div>
          <button
            className="rounded-[10px] bg-[#0099ff] px-4 py-2 font-[500] text-[14px] text-white hover:bg-[#0088ee] disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Creating..." : "Create Shipment"}
          </button>
        </form>
      </div>

      <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-[500] text-[18px] text-white">All Shipments ({shipments.length})</h3>
          <button
            className="rounded-[10px] border border-[rgba(0,153,255,0.15)] px-3 py-1 text-[14px] text-[#a6a6a6] hover:border-[#0099ff]"
            onClick={load}
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.05)]">
                <th className="px-3 py-2 text-[#a6a6a6] font-[400]">ID</th>
                <th className="px-3 py-2 text-[#a6a6a6] font-[400]">Corridor</th>
                <th className="px-3 py-2 text-[#a6a6a6] font-[400]">Load</th>
                <th className="px-3 py-2 text-[#a6a6a6] font-[400]">SLA</th>
                <th className="px-3 py-2 text-[#a6a6a6] font-[400]">Status</th>
                <th className="px-3 py-2 text-[#a6a6a6] font-[400]">Action</th>
                <th className="px-3 py-2 text-[#a6a6a6] font-[400]">ETA</th>
                <th className="px-3 py-2 text-[#a6a6a6] font-[400]">Risk</th>
                <th className="px-3 py-2 text-[#a6a6a6] font-[400]">Conf.</th>
                <th className="px-3 py-2 text-[#a6a6a6] font-[400]">Ops</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr
                  className={`cursor-pointer border-b border-[rgba(255,255,255,0.05)] hover:bg-[#0a0a0a] ${selected === s.shipment.id ? "bg-[#0a0a0a]" : ""}`}
                  key={s.shipment.id}
                  onClick={() => setSelected(selected === s.shipment.id ? null : s.shipment.id)}
                >
                  <td className="px-3 py-3 font-mono text-[#a6a6a6] text-[13px]">{s.shipment.id}</td>
                  <td className="px-3 py-3 text-white text-[13px]">{s.shipment.corridor_id}</td>
                  <td className="px-3 py-3 text-[#a6a6a6] text-[13px]">{s.shipment.load_profile_id}</td>
                  <td className="px-3 py-3 text-[#a6a6a6] text-[13px]">{s.shipment.sla_eta_h}h</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-[100px] px-3 py-1 text-[12px] ${s.shipment.status === "in_transit" ? "bg-[rgba(0,153,255,0.15)] text-[#0099ff]" : s.shipment.status === "delivered" ? "bg-[rgba(0,200,100,0.15)] text-[#00c864]" : "bg-[rgba(166,166,166,0.15)] text-[#a6a6a6]"}`}>
                      {s.shipment.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`rounded-[100px] px-3 py-1 text-[12px] ${ACTION_COLORS[s.recommendation.action] || ACTION_COLORS.no_compliant_path}`}>
                      {formatAction(s.recommendation.action)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[#a6a6a6] text-[13px]">{s.recommendation.expected_impact?.eta_h?.toFixed(1) || "-"}h</td>
                  <td className="px-3 py-3">
                    <span className={`font-[500] text-[13px] ${(s.recommendation.expected_impact?.risk || 0) >= 6 ? "text-[#ff4444]" : (s.recommendation.expected_impact?.risk || 0) >= 4 ? "text-[#ffaa00]" : "text-[#00c864]"}`}>
                      {s.recommendation.expected_impact?.risk?.toFixed(1) || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[#a6a6a6] text-[13px]">{(s.recommendation.confidence * 100).toFixed(0)}%</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button
                        className="rounded-[8px] border border-[rgba(0,153,255,0.15)] px-2 py-1 text-[#0099ff] text-[12px] hover:border-[#0099ff]"
                        onClick={(e) => { e.stopPropagation(); handleRecompute(s.shipment.id); }}
                      >
                        ↻
                      </button>
                      <button
                        className="rounded-[8px] border border-[rgba(0,153,255,0.15)] px-2 py-1 text-[#0099ff] text-[12px] hover:border-[#0099ff] disabled:opacity-50"
                        disabled={explaining === s.shipment.id}
                        onClick={(e) => { e.stopPropagation(); handleExplain(s.shipment.id); }}
                      >
                        {explaining === s.shipment.id ? "..." : "AI"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {shipments.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-[#a6a6a6]" colSpan={10}>
                    No shipments. Create one above or seed demo data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
          <h4 className="mb-4 font-[500] text-[16px] text-white">Recommendation Details: {selected}</h4>
          {(() => {
            const sel = shipments.find((s) => s.shipment.id === selected);
            if (!sel) return null;
            return (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[10px] bg-[#0a0a0a] p-4">
                  <h5 className="mb-2 font-[500] text-[14px] text-[#a6a6a6]">Chosen Path</h5>
                  <p className="font-mono text-white text-[14px]">{sel.recommendation.chosen_path?.path_nodes?.join(" → ") || "No path"}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                    <div><span className="text-[#a6a6a6]">ETA:</span> <span className="text-white font-[500]">{sel.recommendation.chosen_path?.eta_h?.toFixed(1)}h</span></div>
                    <div><span className="text-[#a6a6a6]">Cost:</span> <span className="text-white font-[500]">₹{sel.recommendation.chosen_path?.cost?.toFixed(0)}</span></div>
                    <div><span className="text-[#a6a6a6]">Risk:</span> <span className="text-white font-[500]">{sel.recommendation.chosen_path?.risk?.toFixed(1)}</span></div>
                    <div><span className="text-[#a6a6a6]">Score:</span> <span className="text-white font-[500]">{sel.recommendation.chosen_path?.score?.toFixed(3)}</span></div>
                  </div>
                </div>
                <div className="rounded-[10px] bg-[#0a0a0a] p-4">
                  <h5 className="mb-2 font-[500] text-[14px] text-[#a6a6a6]">Reason Codes</h5>
                  <div className="flex flex-wrap gap-1">
                    {sel.recommendation.reason_codes?.map((code, i) => (
                      <span className="rounded-[100px] bg-[rgba(255,255,255,0.05)] px-3 py-1 text-[12px] text-[#a6a6a6]" key={i}>{code}</span>
                    ))}
                  </div>
                  <div className="mt-3 text-[#a6a6a6] text-[13px]">Confidence: {(sel.recommendation.confidence * 100).toFixed(1)}%</div>
                  {explanations[sel.shipment.id] && (
                    <div className="mt-3 rounded-[10px] bg-[rgba(0,153,255,0.05)] border border-[rgba(0,153,255,0.1)] p-3">
                      <h5 className="mb-1 font-[500] text-[12px] text-[#0099ff]">AI Explanation</h5>
                      <p className="text-[13px] text-[#a6a6a6] leading-relaxed">{explanations[sel.shipment.id]}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
