import { useEffect, useState } from "react";
import { supplyChainApi } from "../lib/supply-chain-api";

export function PoliciesPage({ onRefresh }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    owner_type: "operations",
    rule_type: "block_node",
    applies_to: "",
    priority: "100",
    enabled: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const ownerTypes = ["network_admin", "operations", "compliance", "sla"];
  const ruleTypes = [
    "block_node",
    "block_edge",
    "block_carrier",
    "prefer_node",
  ];

  async function load() {
    setLoading(true);
    try {
      const data = await supplyChainApi.policies();
      setPolicies(data);
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
      await supplyChainApi.createPolicy({
        owner_type: form.owner_type,
        rule_type: form.rule_type,
        applies_to: form.applies_to
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        priority: Number(form.priority),
        enabled: form.enabled,
      });
      await load();
      onRefresh?.();
    } catch (e) {
      console.error("Create failed", e);
    }
    setSubmitting(false);
  }

  async function handleToggle(policy) {
    try {
      await supplyChainApi.updatePolicy(policy.id, {
        enabled: !policy.enabled,
      });
      await load();
      onRefresh?.();
    } catch (e) {
      console.error("Toggle failed", e);
    }
  }

  function getOwnerColor(owner) {
    switch (owner) {
      case "compliance":
        return "bg-red-100 text-red-700";
      case "operations":
        return "bg-cyan-100 text-cyan-700";
      case "sla":
        return "bg-violet-100 text-violet-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  function getRuleColor(rule) {
    switch (rule) {
      case "block_node":
      case "block_edge":
      case "block_carrier":
        return "text-red-600";
      case "prefer_node":
        return "text-emerald-600";
      default:
        return "text-slate-600";
    }
  }

  const enabledCount = policies.filter((p) => p.enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        Loading policies...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <p className="font-medium text-slate-500 text-xs uppercase">
            Enabled Policies
          </p>
          <p className="mt-1 font-bold text-3xl text-emerald-700">
            {enabledCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
          <p className="font-medium text-slate-500 text-xs uppercase">
            Total Policies
          </p>
          <p className="mt-1 font-bold text-3xl text-slate-700">
            {policies.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
          <p className="font-medium text-slate-500 text-xs uppercase">
            By Owner
          </p>
          <div className="mt-2 flex gap-2">
            {[...new Set(policies.map((p) => p.owner_type))].map((owner) => (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${getOwnerColor(owner)}`}
                key={owner}
              >
                {owner}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">
          Create Policy Rule
        </h3>
        <form className="grid gap-4 sm:grid-cols-6" onSubmit={handleCreate}>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">Owner</label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(e) =>
                setForm((f) => ({ ...f, owner_type: e.target.value }))
              }
              value={form.owner_type}
            >
              {ownerTypes.map((o) => (
                <option key={o} value={o}>
                  {o.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              Rule Type
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(e) =>
                setForm((f) => ({ ...f, rule_type: e.target.value }))
              }
              value={form.rule_type}
            >
              {ruleTypes.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-slate-600 text-xs">
              Applies To (comma sep)
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(e) =>
                setForm((f) => ({ ...f, applies_to: e.target.value }))
              }
              placeholder="nagpur, e_1, northcare"
              value={form.applies_to}
            />
          </div>
          <div>
            <label className="mb-1 block text-slate-600 text-xs">
              Priority
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              min="1"
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value }))
              }
              type="number"
              value={form.priority}
            />
          </div>
          <div className="flex items-end">
            <button
              className="w-full rounded-lg bg-fuchsia-600 px-4 py-2 font-medium text-sm text-white hover:bg-fuchsia-700 disabled:opacity-50"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Creating..." : "Create Policy"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">
          All Policies ({policies.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-slate-200 border-b bg-slate-50">
                <th className="px-3 py-2 font-medium text-slate-600">ID</th>
                <th className="px-3 py-2 font-medium text-slate-600">Owner</th>
                <th className="px-3 py-2 font-medium text-slate-600">Rule</th>
                <th className="px-3 py-2 font-medium text-slate-600">
                  Applies To
                </th>
                <th className="px-3 py-2 font-medium text-slate-600">
                  Priority
                </th>
                <th className="px-3 py-2 font-medium text-slate-600">Status</th>
                <th className="px-3 py-2 font-medium text-slate-600">Ops</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr
                  className="border-slate-100 border-b hover:bg-slate-50"
                  key={p.id}
                >
                  <td className="px-3 py-2 font-mono text-slate-700 text-xs">
                    {p.id}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium text-xs ${getOwnerColor(p.owner_type)}`}
                    >
                      {p.owner_type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`font-medium text-xs ${getRuleColor(p.rule_type)}`}
                    >
                      {p.rule_type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">
                    {p.applies_to.join(", ") || "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">
                    {p.priority}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium text-xs ${p.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {p.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className={`rounded border px-2 py-1 font-medium text-xs transition ${
                        p.enabled
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                      onClick={() => handleToggle(p)}
                    >
                      {p.enabled ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-slate-500"
                    colSpan={7}
                  >
                    No policies. Create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
