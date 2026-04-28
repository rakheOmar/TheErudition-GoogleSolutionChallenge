import { useEffect, useState, useCallback } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";
import { useAuth } from "../lib/auth-context";
import { saveDisruption } from "../lib/firebase";

const EVENT_TYPES = [
  { value: "weather_alert", label: "Weather Alert" },
  { value: "traffic_congestion", label: "Traffic Congestion" },
  { value: "vehicle_breakdown", label: "Vehicle Breakdown" },
  { value: "facility_delay", label: "Facility Delay" },
  { value: "regulatory_delay", label: "Regulatory Delay" },
];

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const TARGET_TYPES = [
  { value: "node", label: "Node" },
  { value: "edge", label: "Edge" },
  { value: "corridor", label: "Corridor" },
  { value: "global", label: "Global" },
];

export function DisruptionsPage({ onRefresh }) {
  const { user } = useAuth();
  const [disruptions, setDisruptions] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    event_type: "weather_alert",
    severity: "medium",
    target_type: "node",
    target_value: "",
    eta_multiplier: "1.3",
    risk_delta: "1.2",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, n, e, c] = await Promise.all([
        supplyChainApi.disruptions(),
        supplyChainApi.nodes(),
        supplyChainApi.edges(),
        supplyChainApi.corridors(),
      ]);
      setDisruptions(d);
      setNodes(n);
      setEdges(e);
      setCorridors(c);
    } catch (err) {
      console.error("Load failed", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 120000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await supplyChainApi.createDisruption({
        event_type: form.event_type,
        severity: form.severity,
        target_type: form.target_type,
        target_values: form.target_value ? [form.target_value] : [],
        eta_multiplier: Number(form.eta_multiplier),
        risk_delta: Number(form.risk_delta),
        active: true,
      });
      if (user?.uid && created?.id) {
        await saveDisruption(user.uid, created);
      }
      setForm((f) => ({ ...f, target_value: "" }));
      await load();
      onRefresh?.();
    } catch (err) {
      console.error("Create failed", err);
    }
    setSubmitting(false);
  }

  function getTargetOptions() {
    if (form.target_type === "node") return nodes;
    if (form.target_type === "edge") return edges;
    if (form.target_type === "corridor") return corridors;
    return [];
  }

  function getTargetLabel(item) {
    if (form.target_type === "node") return `${item.name} (${item.id})`;
    if (form.target_type === "edge") return `${item.from_node} → ${item.to_node}`;
    if (form.target_type === "corridor") return item.name;
    return item.id;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-[#a6a6a6]">
        Loading disruptions...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
        <h3 className="mb-4 font-[500] text-[18px] text-white">Create Disruption</h3>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">Event Type</label>
            <select
              className="w-full rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
              value={form.event_type}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">Severity</label>
            <select
              className="w-full rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              value={form.severity}
            >
              {SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">Target Type</label>
            <select
              className="w-full rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              onChange={(e) => setForm((f) => ({ ...f, target_type: e.target.value, target_value: "" }))}
              value={form.target_type}
            >
              {TARGET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {form.target_type !== "global" && (
            <div>
              <label className="mb-1 block text-[#a6a6a6] text-xs">Target</label>
              <select
                className="w-full rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
                onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
                required
                value={form.target_value}
              >
                <option value="">Select target...</option>
                {getTargetOptions().map((item) => (
                  <option key={item.id} value={item.id}>{getTargetLabel(item)}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">ETA Multiplier</label>
            <input
              className="w-full rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              min="1"
              onChange={(e) => setForm((f) => ({ ...f, eta_multiplier: e.target.value }))}
              step="0.1"
              type="number"
              value={form.eta_multiplier}
            />
          </div>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">Risk Delta</label>
            <input
              className="w-full rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              min="0"
              onChange={(e) => setForm((f) => ({ ...f, risk_delta: e.target.value }))}
              step="0.1"
              type="number"
              value={form.risk_delta}
            />
          </div>
          <div className="flex items-end">
            <button
              className="rounded-[10px] bg-[#0099ff] px-4 py-2 font-[500] text-[14px] text-white hover:bg-[#0088ee] disabled:opacity-50"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Creating..." : "Create Disruption"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-[500] text-[18px] text-white">Active Disruptions ({disruptions.filter(d => d.active).length})</h3>
          <button
            className="rounded-[10px] border border-[rgba(0,153,255,0.15)] px-3 py-1 text-[14px] text-[#a6a6a6] hover:border-[#0099ff]"
            onClick={load}
          >
            Refresh
          </button>
        </div>
        <div className="grid gap-3">
          {disruptions.filter(d => d.active).map((d) => (
            <div key={d.id} className="rounded-[10px] bg-[#0a0a0a] p-4 border border-[rgba(255,68,68,0.2)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-[100px] px-3 py-1 text-[12px] ${d.severity === "high" ? "bg-[rgba(255,68,68,0.15)] text-[#ff4444]" : d.severity === "medium" ? "bg-[rgba(255,170,0,0.15)] text-[#ffaa00]" : "bg-[rgba(166,166,166,0.15)] text-[#a6a6a6]"}`}>
                      {d.severity}
                    </span>
                    <span className="text-white font-[500] text-[14px]">{d.event_type.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-[13px] text-[#a6a6a6]">
                    Target: {d.target_type} → {d.target_values?.join(", ")}
                  </div>
                  <div className="flex gap-4 mt-2 text-[12px] text-[#a6a6a6]">
                    <span>ETA x{d.eta_multiplier}</span>
                    <span>Risk +{d.risk_delta}</span>
                  </div>
                </div>
                <button
                  className="rounded-[8px] border border-[rgba(255,68,68,0.3)] px-3 py-1 text-[12px] text-[#ff4444] hover:bg-[rgba(255,68,68,0.1)]"
                  onClick={async () => {
                    const updated = await supplyChainApi.updateDisruption(d.id, { active: false });
                    if (user?.uid && updated?.id) {
                      await saveDisruption(user.uid, updated);
                    }
                    await load();
                  }}
                >
                  Resolve
                </button>
                <button
                  className="ml-2 rounded-[8px] border border-[rgba(0,153,255,0.3)] px-3 py-1 text-[12px] text-[#0099ff] hover:bg-[rgba(0,153,255,0.1)]"
                  onClick={async () => {
                    const timeline = await supplyChainApi.incidentTimeline(d.id);
                    setSelectedIncident(timeline);
                  }}
                  type="button"
                >
                  Timeline
                </button>
              </div>
            </div>
          ))}
          {disruptions.filter(d => d.active).length === 0 && (
            <div className="text-center py-8 text-[#a6a6a6] text-[14px]">No active disruptions</div>
          )}
        </div>
      </div>

      {selectedIncident && (
        <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
          <h3 className="mb-2 font-[500] text-[18px] text-white">Incident Timeline: {selectedIncident.disruption_id}</h3>
          <p className="mb-4 text-[14px] text-[#a6a6a6]">{selectedIncident.ai_summary}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(selectedIncident.timeline || []).map((step) => (
              <div className="rounded-[10px] border border-[rgba(0,153,255,0.12)] p-3" key={step.phase}>
                <p className="text-[12px] uppercase text-[#0099ff]">{step.phase}</p>
                <p className="text-[13px] text-[#a6a6a6]">{step.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
