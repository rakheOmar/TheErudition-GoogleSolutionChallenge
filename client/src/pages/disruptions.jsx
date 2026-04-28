import { useEffect, useState } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";

export function DisruptionsPage({ onRefresh }) {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    event_type: "weather_alert",
    severity: "medium",
    target_type: "corridor",
    target_values: "",
    eta_multiplier: "1.3",
    risk_delta: "1.0",
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const eventTypes = [
    "weather_alert",
    "traffic_congestion",
    "vehicle_breakdown",
    "facility_delay",
    "regulatory_delay",
  ];
  const severities = ["low", "medium", "high"];
  const targetTypes = ["corridor", "node", "edge", "carrier", "global"];

  async function load() {
    setLoading(true);
    try {
      const data = await supplyChainApi.disruptions();
      setDisruptions(data);
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
      await supplyChainApi.createDisruption({
        event_type: form.event_type,
        severity: form.severity,
        target_type: form.target_type,
        target_values: form.target_values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        eta_multiplier: Number(form.eta_multiplier),
        risk_delta: Number(form.risk_delta),
        active: form.active,
      });
      await load();
      onRefresh?.();
    } catch (e) {
      console.error("Create failed", e);
    }
    setSubmitting(false);
  }

  function getSeverityColor(sev) {
    switch (sev) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  }

  const activeCount = disruptions.filter((d) => d.active).length;
  const bySeverity = { high: 0, medium: 0, low: 0 };
  disruptions
    .filter((d) => d.active)
    .forEach((d) => {
      bySeverity[d.severity]++;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Loading disruptions...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-500 text-xs uppercase">
                High Severity
              </p>
              <p className="mt-1 font-bold text-3xl text-red-700">
                {bySeverity.high}
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-3 text-2xl">High</div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-500 text-xs uppercase">
                Medium Severity
              </p>
              <p className="mt-1 font-bold text-3xl text-amber-700">
                {bySeverity.medium}
              </p>
            </div>
            <div className="rounded-full bg-amber-100 p-3 text-2xl">Med</div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-500 text-xs uppercase">
                Low Severity
              </p>
              <p className="mt-1 font-bold text-3xl text-slate-700">
                {bySeverity.low}
              </p>
            </div>
            <div className="rounded-full bg-slate-100 p-3 text-2xl">Low</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">
          Create Disruption Event
        </h3>
        <form className="grid gap-4 sm:grid-cols-4" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              Event Type
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(e) =>
                setForm((f) => ({ ...f, event_type: e.target.value }))
              }
              value={form.event_type}
            >
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              Severity
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(e) =>
                setForm((f) => ({ ...f, severity: e.target.value }))
              }
              value={form.severity}
            >
              {severities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              Target Type
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(e) =>
                setForm((f) => ({ ...f, target_type: e.target.value }))
              }
              value={form.target_type}
            >
              {targetTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              Target Values
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(e) =>
                setForm((f) => ({ ...f, target_values: e.target.value }))
              }
              placeholder="corr_xxx, node_id"
              value={form.target_values}
            />
          </div>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              ETA Multiplier
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              min="1"
              onChange={(e) =>
                setForm((f) => ({ ...f, eta_multiplier: e.target.value }))
              }
              step="0.1"
              type="number"
              value={form.eta_multiplier}
            />
          </div>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              Risk Delta
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              min="0"
              onChange={(e) =>
                setForm((f) => ({ ...f, risk_delta: e.target.value }))
              }
              step="0.1"
              type="number"
              value={form.risk_delta}
            />
          </div>
          <div className="flex items-end">
            <button
              className="w-full rounded-lg bg-amber-600 px-4 py-2 font-medium text-sm text-white hover:bg-amber-700 disabled:opacity-50"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Creating..." : "Add Disruption"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">
            All Disruption Events ({disruptions.length})
          </h3>
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700 text-xs">
            {activeCount} active
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {disruptions.map((d) => (
            <div
              className={`rounded-lg border p-4 ${getSeverityColor(d.severity)} ${d.active ? "" : "opacity-50"}`}
              key={d.id}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">
                    {d.event_type.replace("_", " ")}
                  </p>
                  <p className="mt-1 text-xs opacity-75">
                    Target: {d.target_type}
                  </p>
                  <p className="truncate text-xs opacity-75">
                    {d.target_values.join(", ")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium text-xs ${d.severity === "high" ? "bg-red-200 text-red-800" : d.severity === "medium" ? "bg-amber-200 text-amber-800" : "bg-slate-200 text-slate-600"}`}
                >
                  {d.severity}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="opacity-75">ETA×</span>{" "}
                  <span className="font-medium">{d.eta_multiplier}</span>
                </div>
                <div>
                  <span className="opacity-75">Risk+</span>{" "}
                  <span className="font-medium">{d.risk_delta}</span>
                </div>
              </div>
              <div className="mt-2 border-black/10 border-t pt-2 text-xs">
                Status: {d.active ? "Active" : "Resolved"}
              </div>
            </div>
          ))}
          {disruptions.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500">
              No disruptions. Add one above or seed demo data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
