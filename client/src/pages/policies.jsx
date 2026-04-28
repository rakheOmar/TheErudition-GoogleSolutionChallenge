import { useEffect, useState, useCallback } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";

const OWNER_TYPES = [
  { value: "network_admin", label: "Network Admin" },
  { value: "operations", label: "Operations" },
  { value: "compliance", label: "Compliance" },
  { value: "sla", label: "SLA" },
];

const RULE_TYPES = [
  { value: "block_node", label: "Block Node" },
  { value: "block_edge", label: "Block Edge" },
  { value: "block_carrier", label: "Block Carrier" },
  { value: "prefer_node", label: "Prefer Node" },
];

export function PoliciesPage({ onRefresh }) {
  const [policies, setPolicies] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    owner_type: "operations",
    rule_type: "block_node",
    target_id: "",
    priority: "100",
    enabled: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, n, e] = await Promise.all([
        supplyChainApi.policies(),
        supplyChainApi.nodes(),
        supplyChainApi.edges(),
      ]);
      setPolicies(p);
      setNodes(n);
      setEdges(e);
    } catch (err) {
      console.error("Load failed", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.target_id) return;
    setSubmitting(true);
    try {
      await supplyChainApi.createPolicy({
        owner_type: form.owner_type,
        rule_type: form.rule_type,
        applies_to: [form.target_id],
        priority: Number(form.priority),
        enabled: form.enabled,
      });
      setForm((f) => ({ ...f, target_id: "" }));
      await load();
      onRefresh?.();
    } catch (err) {
      console.error("Create failed", err);
    }
    setSubmitting(false);
  }

  async function handleToggle(policy) {
    try {
      await supplyChainApi.updatePolicy(policy.id, { enabled: !policy.enabled });
      await load();
    } catch (err) {
      console.error("Toggle failed", err);
    }
  }

  function getTargetOptions() {
    if (form.rule_type === "block_carrier") {
      const carriers = [...new Set(edges.map((e) => e.carrier))];
      return carriers.map((c) => ({ id: c, name: c }));
    }
    return form.rule_type === "block_edge" ? edges : nodes;
  }

  function getTargetLabel(item) {
    if (form.rule_type === "block_carrier") return item.name;
    if (form.rule_type === "block_edge") return `${item.from_node} → ${item.to_node}`;
    return `${item.name} (${item.id})`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-[#a6a6a6]">
        Loading policies...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
        <h3 className="mb-4 font-[500] text-[18px] text-white">Create Policy</h3>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">Owner</label>
            <select
              className="w-full rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              onChange={(e) => setForm((f) => ({ ...f, owner_type: e.target.value }))}
              value={form.owner_type}
            >
              {OWNER_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">Rule Type</label>
            <select
              className="w-full rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              onChange={(e) => setForm((f) => ({ ...f, rule_type: e.target.value, target_id: "" }))}
              value={form.rule_type}
            >
              {RULE_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">Target</label>
            <select
              className="w-full rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              onChange={(e) => setForm((f) => ({ ...f, target_id: e.target.value }))}
              required
              value={form.target_id}
            >
              <option value="">Select target...</option>
              {getTargetOptions().map((item) => (
                <option key={item.id} value={item.id}>{getTargetLabel(item)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[#a6a6a6] text-xs">Priority</label>
            <input
              className="w-full rounded-[10px] bg-[#0a0a0a] border border-[rgba(0,153,255,0.15)] px-3 py-2 text-[14px] text-white focus:border-[#0099ff] focus:outline-none"
              min="1"
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              type="number"
              value={form.priority}
            />
          </div>
          <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-4">
            <label className="flex items-center gap-2 text-[14px] text-[#a6a6a6]">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                className="accent-[#0099ff]"
              />
              Enabled
            </label>
            <button
              className="rounded-[10px] bg-[#0099ff] px-4 py-2 font-[500] text-[14px] text-white hover:bg-[#0088ee] disabled:opacity-50"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Creating..." : "Create Policy"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[15px] bg-[#090909] p-6 framer-ring">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-[500] text-[18px] text-white">Active Policies ({policies.filter(p => p.enabled).length})</h3>
          <button
            className="rounded-[10px] border border-[rgba(0,153,255,0.15)] px-3 py-1 text-[14px] text-[#a6a6a6] hover:border-[#0099ff]"
            onClick={load}
          >
            Refresh
          </button>
        </div>
        <div className="grid gap-3">
          {policies.map((p) => (
            <div key={p.id} className={`rounded-[10px] bg-[#0a0a0a] p-4 border ${p.enabled ? "border-[rgba(0,153,255,0.1)]" : "border-[rgba(255,255,255,0.05)] opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-[100px] px-3 py-1 text-[12px] ${p.enabled ? "bg-[rgba(0,153,255,0.15)] text-[#0099ff]" : "bg-[rgba(166,166,166,0.1)] text-[#a6a6a6]"}`}>
                      {p.enabled ? "active" : "disabled"}
                    </span>
                    <span className="text-white font-[500] text-[14px]">{p.rule_type.replace(/_/g, " ")}</span>
                    <span className="text-[#a6a6a6] text-[12px]">{p.owner_type}</span>
                  </div>
                  <div className="text-[13px] text-[#a6a6a6]">
                    Targets: {p.applies_to?.join(", ")} | Priority: {p.priority}
                  </div>
                </div>
                <button
                  className={`rounded-[8px] border px-3 py-1 text-[12px] ${p.enabled ? "border-[rgba(255,170,0,0.3)] text-[#ffaa00] hover:bg-[rgba(255,170,0,0.1)]" : "border-[rgba(0,153,255,0.3)] text-[#0099ff] hover:bg-[rgba(0,153,255,0.1)]"}`}
                  onClick={() => handleToggle(p)}
                >
                  {p.enabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
          {policies.length === 0 && (
            <div className="text-center py-8 text-[#a6a6a6] text-[14px]">No policies created yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
