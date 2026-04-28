import { useEffect, useState } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";

export function AuditPage({ onRefresh }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await supplyChainApi.audit(100);
      setEntries(data);
    } catch (e) {
      console.error("Load failed", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function getActionColor(action) {
    if (action.includes("created")) {
      return "bg-emerald-100 text-emerald-700";
    }
    if (action.includes("updated")) {
      return "bg-amber-100 text-amber-700";
    }
    if (action.includes("recomputed")) {
      return "bg-cyan-100 text-cyan-700";
    }
    if (action.includes("seeded")) {
      return "bg-violet-100 text-violet-700";
    }
    if (action.includes("reset")) {
      return "bg-red-100 text-red-700";
    }
    return "bg-slate-100 text-slate-600";
  }

  function getEntityColor(entity) {
    switch (entity) {
      case "shipment":
        return "Shipment";
      case "policy":
        return "Policy";
      case "disruption":
        return "Disruption";
      case "system":
        return "System";
      default:
        return "Other";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Loading audit...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">
            Audit Trail ({entries.length} entries)
          </h3>
          <button
            className="rounded-lg border border-slate-300 px-3 py-1 text-slate-600 text-sm hover:bg-slate-50"
            onClick={load}
          >
            Refresh
          </button>
        </div>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              className="flex items-start gap-4 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
              key={entry.id}
            >
              <div className="text-2xl">
                {getEntityColor(entry.entity_type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium text-xs ${getActionColor(entry.action)}`}
                  >
                    {entry.action}
                  </span>
                  <span className="font-medium text-slate-700 text-sm">
                    {entry.entity_type}
                  </span>
                  <span className="font-mono text-slate-600 text-xs">
                    {entry.entity_id}
                  </span>
                </div>
                {Object.keys(entry.details).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1 text-slate-500 text-xs">
                    {Object.entries(entry.details)
                      .slice(0, 3)
                      .map(([k, v]) => (
                        <span className="rounded bg-slate-100 px-1" key={k}>
                          {k}: {typeof v === "object" ? JSON.stringify(v) : v}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <div className="whitespace-nowrap text-right text-slate-400 text-xs">
                {new Date(entry.timestamp_utc).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              No audit entries. Perform some actions or seed demo data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
