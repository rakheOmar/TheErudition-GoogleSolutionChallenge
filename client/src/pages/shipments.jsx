import { useEffect, useState } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";

export function ShipmentsPage({ onRefresh }) {
  const [shipments, setShipments] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    corridor_id: "",
    load_profile_id: "",
    sla_eta_h: "12",
  });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
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
        setForm((f) => ({
          ...f,
          corridor_id: co[0].id,
          load_profile_id: pr[0]?.id || "",
        }));
      }
    } catch (e) {
      console.error("Load failed", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

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

  function formatAction(action) {
    return action?.replace(/_/g, " ") || "-";
  }

  function getActionColor(action) {
    switch (action) {
      case "continue_with_watch":
        return "bg-emerald-100 text-emerald-700";
      case "reroute":
        return "bg-amber-100 text-amber-700";
      case "hold_and_escalate":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Loading shipments...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-cyan-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">
          Create New Shipment
        </h3>
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={handleCreate}
        >
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              Corridor
            </label>
            <select
              className="min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(e) =>
                setForm((f) => ({ ...f, corridor_id: e.target.value }))
              }
              required
              value={form.corridor_id}
            >
              {corridors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              Load Profile
            </label>
            <select
              className="min-w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(e) =>
                setForm((f) => ({ ...f, load_profile_id: e.target.value }))
              }
              required
              value={form.load_profile_id}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              SLA ETA (hrs)
            </label>
            <input
              className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              min="1"
              onChange={(e) =>
                setForm((f) => ({ ...f, sla_eta_h: e.target.value }))
              }
              required
              step="0.5"
              type="number"
              value={form.sla_eta_h}
            />
          </div>
          <button
            className="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-sm text-white hover:bg-cyan-700 disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Creating..." : "Create Shipment"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">
            All Shipments ({shipments.length})
          </h3>
          <button
            className="rounded-lg border border-slate-300 px-3 py-1 text-slate-600 text-sm hover:bg-slate-50"
            onClick={load}
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-slate-200 border-b bg-slate-50">
                <th className="px-3 py-2 font-medium text-slate-600">ID</th>
                <th className="px-3 py-2 font-medium text-slate-600">
                  Corridor
                </th>
                <th className="px-3 py-2 font-medium text-slate-600">Load</th>
                <th className="px-3 py-2 font-medium text-slate-600">SLA</th>
                <th className="px-3 py-2 font-medium text-slate-600">Status</th>
                <th className="px-3 py-2 font-medium text-slate-600">Action</th>
                <th className="px-3 py-2 font-medium text-slate-600">ETA</th>
                <th className="px-3 py-2 font-medium text-slate-600">Risk</th>
                <th className="px-3 py-2 font-medium text-slate-600">Conf.</th>
                <th className="px-3 py-2 font-medium text-slate-600">Ops</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr
                  className={`cursor-pointer border-slate-100 border-b hover:bg-slate-50 ${selected === s.shipment.id ? "bg-cyan-50" : ""}`}
                  key={s.shipment.id}
                  onClick={() =>
                    setSelected(
                      selected === s.shipment.id ? null : s.shipment.id
                    )
                  }
                >
                  <td className="px-3 py-2 font-mono text-slate-700 text-xs">
                    {s.shipment.id}
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">
                    {s.shipment.corridor_id}
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">
                    {s.shipment.load_profile_id}
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">
                    {s.shipment.sla_eta_h}h
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${s.shipment.status === "in_transit" ? "bg-cyan-100 text-cyan-700" : s.shipment.status === "delivered" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {s.shipment.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${getActionColor(s.recommendation.action)}`}
                    >
                      {formatAction(s.recommendation.action)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">
                    {s.recommendation.expected_impact?.eta_h?.toFixed(1) || "-"}
                    h
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`font-medium text-xs ${(s.recommendation.expected_impact?.risk || 0) >= 6 ? "text-red-600" : (s.recommendation.expected_impact?.risk || 0) >= 4 ? "text-amber-600" : "text-emerald-600"}`}
                    >
                      {s.recommendation.expected_impact?.risk?.toFixed(1) ||
                        "-"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">
                    {(s.recommendation.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded border border-cyan-200 px-2 py-1 text-cyan-700 text-xs hover:bg-cyan-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecompute(s.shipment.id);
                      }}
                    >
                      ↻
                    </button>
                  </td>
                </tr>
              ))}
              {shipments.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-slate-500"
                    colSpan={10}
                  >
                    No shipments. Create one above or seed demo data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
          <h4 className="mb-3 font-semibold text-cyan-800">
            Recommendation Details: {selected.id}
          </h4>
          {(() => {
            const sel = shipments.find((s) => s.shipment.id === selected);
            if (!sel) {
              return null;
            }
            return (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg bg-white p-4">
                  <h5 className="mb-2 font-medium text-slate-700 text-sm">
                    Chosen Path
                  </h5>
                  <p className="font-mono text-slate-800 text-sm">
                    {sel.recommendation.chosen_path?.path_nodes?.join(" → ") ||
                      "No path"}
                  </p>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">ETA:</span>{" "}
                      <span className="font-medium">
                        {sel.recommendation.chosen_path?.eta_h?.toFixed(1)}h
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Cost:</span>{" "}
                      <span className="font-medium">
                        ₹{sel.recommendation.chosen_path?.cost?.toFixed(0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Risk:</span>{" "}
                      <span className="font-medium">
                        {sel.recommendation.chosen_path?.risk?.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Score:</span>{" "}
                      <span className="font-medium">
                        {sel.recommendation.chosen_path?.score?.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-white p-4">
                  <h5 className="mb-2 font-medium text-slate-700 text-sm">
                    Reason Codes
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {sel.recommendation.reason_codes?.map((code, i) => (
                      <span
                        className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 text-xs"
                        key={i}
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-slate-500 text-xs">
                    Confidence:{" "}
                    {(sel.recommendation.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
