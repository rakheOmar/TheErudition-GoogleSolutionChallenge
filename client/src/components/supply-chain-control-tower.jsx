import { useCallback, useEffect, useMemo, useState } from "react";

import { supplyChainApi } from "@/lib/supply-chain-api";

const disruptionOptions = [
  "traffic_congestion",
  "weather_alert",
  "vehicle_breakdown",
  "facility_delay",
  "regulatory_delay",
];

const severityOptions = ["low", "medium", "high"];
const targetTypeOptions = ["corridor", "node", "edge", "carrier", "global"];
const ownerTypeOptions = ["network_admin", "operations", "compliance", "sla"];
const ruleTypeOptions = [
  "block_node",
  "block_edge",
  "block_carrier",
  "prefer_node",
];

function pretty(value) {
  return value.replaceAll("_", " ");
}

function toFixedOrDash(value, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return value.toFixed(digits);
}

export function SupplyChainControlTower() {
  const [overview, setOverview] = useState(null);
  const [corridors, setCorridors] = useState([]);
  const [loadProfiles, setLoadProfiles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [shipmentForm, setShipmentForm] = useState({
    corridor_id: "",
    load_profile_id: "",
    sla_eta_h: "12",
  });

  const [disruptionForm, setDisruptionForm] = useState({
    event_type: disruptionOptions[0],
    severity: severityOptions[1],
    target_type: targetTypeOptions[0],
    target_values: "",
    eta_multiplier: "1.3",
    risk_delta: "1.2",
    active: true,
  });

  const [policyForm, setPolicyForm] = useState({
    owner_type: ownerTypeOptions[1],
    rule_type: ruleTypeOptions[0],
    applies_to: "",
    priority: "100",
    enabled: true,
    compliance_risk_stop: "",
  });

  const selectedShipment = useMemo(
    () =>
      shipments.find((entry) => entry.shipment.id === selectedShipmentId) ??
      null,
    [selectedShipmentId, shipments]
  );

  const riskCounts = useMemo(() => {
    let low = 0;
    let medium = 0;
    let high = 0;

    for (const entry of shipments) {
      const risk = entry.recommendation.expected_impact.risk ?? 0;
      if (risk >= 6) {
        high += 1;
      } else if (risk >= 3.5) {
        medium += 1;
      } else {
        low += 1;
      }
    }

    return { low, medium, high };
  }, [shipments]);

  const runAction = useCallback(async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Operation failed."
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    await runAction(async () => {
      const [
        overviewResponse,
        corridorsResponse,
        profilesResponse,
        shipmentsResponse,
        disruptionsResponse,
        policiesResponse,
        auditResponse,
      ] = await Promise.all([
        supplyChainApi.overview(),
        supplyChainApi.corridors(),
        supplyChainApi.loadProfiles(),
        supplyChainApi.shipments(),
        supplyChainApi.disruptions(),
        supplyChainApi.policies(),
        supplyChainApi.audit(20),
      ]);

      setOverview(overviewResponse);
      setCorridors(corridorsResponse);
      setLoadProfiles(profilesResponse);
      setShipments(shipmentsResponse);
      setDisruptions(disruptionsResponse);
      setPolicies(policiesResponse);
      setAuditEntries(auditResponse);

      setShipmentForm((current) => ({
        ...current,
        corridor_id: current.corridor_id || corridorsResponse[0]?.id || "",
        load_profile_id:
          current.load_profile_id || profilesResponse[0]?.id || "",
      }));

      setSelectedShipmentId((current) => {
        if (
          current &&
          shipmentsResponse.some((entry) => entry.shipment.id === current)
        ) {
          return current;
        }
        return shipmentsResponse[0]?.shipment.id || "";
      });
    });
  }, [runAction]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function onCreateShipment(event) {
    event.preventDefault();
    await runAction(async () => {
      await supplyChainApi.createShipment({
        corridor_id: shipmentForm.corridor_id,
        load_profile_id: shipmentForm.load_profile_id,
        sla_eta_h: Number(shipmentForm.sla_eta_h),
      });
      await loadAll();
    });
  }

  async function onCreateDisruption(event) {
    event.preventDefault();
    await runAction(async () => {
      await supplyChainApi.createDisruption({
        event_type: disruptionForm.event_type,
        severity: disruptionForm.severity,
        target_type: disruptionForm.target_type,
        target_values: disruptionForm.target_values
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        eta_multiplier: Number(disruptionForm.eta_multiplier),
        risk_delta: Number(disruptionForm.risk_delta),
        active: disruptionForm.active,
      });
      await loadAll();
    });
  }

  async function onCreatePolicy(event) {
    event.preventDefault();
    await runAction(async () => {
      const params = {};
      if (policyForm.compliance_risk_stop) {
        params.compliance_risk_stop = Number(policyForm.compliance_risk_stop);
      }
      await supplyChainApi.createPolicy({
        owner_type: policyForm.owner_type,
        rule_type: policyForm.rule_type,
        applies_to: policyForm.applies_to
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        params,
        priority: Number(policyForm.priority),
        enabled: policyForm.enabled,
      });
      await loadAll();
    });
  }

  async function togglePolicy(policy) {
    await runAction(async () => {
      await supplyChainApi.updatePolicy(policy.id, {
        enabled: !policy.enabled,
      });
      await loadAll();
    });
  }

  async function onRecompute(shipmentId) {
    await runAction(async () => {
      await supplyChainApi.recomputeShipment(shipmentId);
      await loadAll();
    });
  }

  async function onSeedScenario() {
    await runAction(async () => {
      await supplyChainApi.seedHeroScenario();
      await loadAll();
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fdf6e3,_#fff7ed_40%,_#ecfeff_100%)] px-4 py-6 text-slate-900 md:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-cyan-100 bg-white/80 p-6 shadow-sm backdrop-blur">
          <p className="font-semibold text-cyan-700 text-xs uppercase tracking-[0.2em]">
            Smart Supply Chains
          </p>
          <h1 className="mt-2 font-semibold text-3xl tracking-tight md:text-4xl">
            Pharma Control Tower
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600 text-sm md:text-base">
            Detect disruptions early, enforce policy constraints, and dispatch
            the safest feasible action before SLA breaks.
          </p>
          <button
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 font-medium text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy}
            onClick={onSeedScenario}
            type="button"
          >
            {busy ? "Working..." : "Seed hero scenario"}
          </button>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
            <p className="text-slate-500 text-xs uppercase tracking-wider">
              Active shipments
            </p>
            <p className="mt-2 font-semibold text-3xl">
              {overview?.active_shipments ?? 0}
            </p>
          </article>
          <article className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
            <p className="text-slate-500 text-xs uppercase tracking-wider">
              Live disruptions
            </p>
            <p className="mt-2 font-semibold text-3xl">
              {overview?.active_disruptions ?? 0}
            </p>
          </article>
          <article className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-slate-500 text-xs uppercase tracking-wider">
              Policies enabled
            </p>
            <p className="mt-2 font-semibold text-3xl">
              {overview?.policies_enabled ?? 0}
            </p>
          </article>
          <article className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
            <p className="text-slate-500 text-xs uppercase tracking-wider">
              Supported corridors
            </p>
            <p className="mt-2 font-semibold text-3xl">
              {overview?.corridors_supported ?? 0}
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <form
            className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm"
            onSubmit={onCreateShipment}
          >
            <h2 className="font-semibold text-base">Create Shipment</h2>
            <div className="mt-3 grid gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Corridor</span>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  onChange={(event) => {
                    setShipmentForm((current) => ({
                      ...current,
                      corridor_id: event.target.value,
                    }));
                  }}
                  required
                  value={shipmentForm.corridor_id}
                >
                  {corridors.map((corridor) => (
                    <option key={corridor.id} value={corridor.id}>
                      {corridor.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Load profile</span>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  onChange={(event) => {
                    setShipmentForm((current) => ({
                      ...current,
                      load_profile_id: event.target.value,
                    }));
                  }}
                  required
                  value={shipmentForm.load_profile_id}
                >
                  {loadProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">
                  SLA ETA (hours)
                </span>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  min="1"
                  onChange={(event) => {
                    setShipmentForm((current) => ({
                      ...current,
                      sla_eta_h: event.target.value,
                    }));
                  }}
                  required
                  step="0.1"
                  type="number"
                  value={shipmentForm.sla_eta_h}
                />
              </label>
              <button
                className="rounded-lg bg-cyan-700 px-4 py-2 font-medium text-sm text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy}
                type="submit"
              >
                {busy ? "Working..." : "Create shipment"}
              </button>
            </div>
          </form>

          <form
            className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm"
            onSubmit={onCreateDisruption}
          >
            <h2 className="font-semibold text-base">Inject Disruption</h2>
            <div className="mt-3 grid gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">Event type</span>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  onChange={(event) => {
                    setDisruptionForm((current) => ({
                      ...current,
                      event_type: event.target.value,
                    }));
                  }}
                  value={disruptionForm.event_type}
                >
                  {disruptionOptions.map((item) => (
                    <option key={item} value={item}>
                      {pretty(item)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Severity</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    onChange={(event) => {
                      setDisruptionForm((current) => ({
                        ...current,
                        severity: event.target.value,
                      }));
                    }}
                    value={disruptionForm.severity}
                  >
                    {severityOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Target type</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    onChange={(event) => {
                      setDisruptionForm((current) => ({
                        ...current,
                        target_type: event.target.value,
                      }));
                    }}
                    value={disruptionForm.target_type}
                  >
                    {targetTypeOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">
                  Target values (comma separated)
                </span>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  onChange={(event) => {
                    setDisruptionForm((current) => ({
                      ...current,
                      target_values: event.target.value,
                    }));
                  }}
                  placeholder="corr_mumbai_pune or nagpur"
                  value={disruptionForm.target_values}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">
                    ETA multiplier
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    min="1"
                    onChange={(event) => {
                      setDisruptionForm((current) => ({
                        ...current,
                        eta_multiplier: event.target.value,
                      }));
                    }}
                    required
                    step="0.1"
                    type="number"
                    value={disruptionForm.eta_multiplier}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Risk delta</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    min="0"
                    onChange={(event) => {
                      setDisruptionForm((current) => ({
                        ...current,
                        risk_delta: event.target.value,
                      }));
                    }}
                    required
                    step="0.1"
                    type="number"
                    value={disruptionForm.risk_delta}
                  />
                </label>
              </div>
              <button
                className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-sm text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy}
                type="submit"
              >
                {busy ? "Working..." : "Inject disruption"}
              </button>
            </div>
          </form>

          <form
            className="rounded-xl border border-fuchsia-100 bg-white p-4 shadow-sm"
            onSubmit={onCreatePolicy}
          >
            <h2 className="font-semibold text-base">Create Policy</h2>
            <div className="mt-3 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Owner</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    onChange={(event) => {
                      setPolicyForm((current) => ({
                        ...current,
                        owner_type: event.target.value,
                      }));
                    }}
                    value={policyForm.owner_type}
                  >
                    {ownerTypeOptions.map((item) => (
                      <option key={item} value={item}>
                        {pretty(item)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Rule type</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    onChange={(event) => {
                      setPolicyForm((current) => ({
                        ...current,
                        rule_type: event.target.value,
                      }));
                    }}
                    value={policyForm.rule_type}
                  >
                    {ruleTypeOptions.map((item) => (
                      <option key={item} value={item}>
                        {pretty(item)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="text-sm">
                <span className="mb-1 block text-slate-600">
                  Applies to (comma separated)
                </span>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  onChange={(event) => {
                    setPolicyForm((current) => ({
                      ...current,
                      applies_to: event.target.value,
                    }));
                  }}
                  placeholder="nagpur, e_mumbai_pune, northcare"
                  value={policyForm.applies_to}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">Priority</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    min="1"
                    onChange={(event) => {
                      setPolicyForm((current) => ({
                        ...current,
                        priority: event.target.value,
                      }));
                    }}
                    required
                    type="number"
                    value={policyForm.priority}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-slate-600">
                    Compliance stop risk
                  </span>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    min="0"
                    onChange={(event) => {
                      setPolicyForm((current) => ({
                        ...current,
                        compliance_risk_stop: event.target.value,
                      }));
                    }}
                    placeholder="Optional"
                    step="0.1"
                    type="number"
                    value={policyForm.compliance_risk_stop}
                  />
                </label>
              </div>
              <button
                className="rounded-lg bg-fuchsia-700 px-4 py-2 font-medium text-sm text-white transition hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy}
                type="submit"
              >
                {busy ? "Working..." : "Create policy"}
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-base">Operational Snapshot</h2>
            <div className="mt-3 grid gap-3 text-sm">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                Low risk: <strong>{riskCounts.low}</strong>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                Medium risk: <strong>{riskCounts.medium}</strong>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                High risk: <strong>{riskCounts.high}</strong>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                Active disruptions:{" "}
                <strong>
                  {disruptions.filter((item) => item.active).length}
                </strong>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                Policy rules: <strong>{policies.length}</strong>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-base">Policies</h2>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy}
                onClick={loadAll}
                type="button"
              >
                Refresh
              </button>
            </div>
            <div className="grid gap-2">
              {policies.map((policy) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  key={policy.id}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {policy.id} · {pretty(policy.owner_type)} ·{" "}
                      {pretty(policy.rule_type)}
                    </p>
                    <p className="truncate text-slate-600 text-xs">
                      applies_to: {policy.applies_to.join(", ") || "-"}
                    </p>
                  </div>
                  <button
                    className={`rounded-md px-2 py-1 font-medium text-xs ${
                      policy.enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                    disabled={busy}
                    onClick={() => togglePolicy(policy)}
                    type="button"
                  >
                    {policy.enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              ))}
              {policies.length ? null : (
                <p className="text-slate-500 text-sm">
                  No policy rules configured.
                </p>
              )}
            </div>
          </article>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-base">
            Shipment Recommendations
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-slate-200 border-b text-slate-600">
                  <th className="px-2 py-3 font-medium">Shipment</th>
                  <th className="px-2 py-3 font-medium">Corridor</th>
                  <th className="px-2 py-3 font-medium">Action</th>
                  <th className="px-2 py-3 font-medium">Confidence</th>
                  <th className="px-2 py-3 font-medium">ETA</th>
                  <th className="px-2 py-3 font-medium">Risk</th>
                  <th className="px-2 py-3 font-medium">Compliance</th>
                  <th className="px-2 py-3 font-medium">Ops</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((entry) => {
                  const recommendation = entry.recommendation;
                  const impact = recommendation.expected_impact;
                  const isEscalated =
                    recommendation.action !== "continue_with_watch";
                  return (
                    <tr
                      className="border-slate-100 border-b"
                      key={entry.shipment.id}
                      onClick={() => setSelectedShipmentId(entry.shipment.id)}
                    >
                      <td className="px-2 py-3 font-medium text-slate-900">
                        {entry.shipment.id}
                      </td>
                      <td className="px-2 py-3 text-slate-600">
                        {entry.shipment.corridor_id}
                      </td>
                      <td className="px-2 py-3">
                        <span
                          className={`rounded-full px-2 py-1 font-medium text-xs ${
                            isEscalated
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {pretty(recommendation.action)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-slate-700">
                        {toFixedOrDash(recommendation.confidence, 3)}
                      </td>
                      <td className="px-2 py-3 text-slate-700">
                        {toFixedOrDash(impact.eta_h)}h
                      </td>
                      <td className="px-2 py-3 text-slate-700">
                        {toFixedOrDash(impact.risk)}
                      </td>
                      <td className="px-2 py-3 text-slate-700">
                        {toFixedOrDash(impact.compliance_risk)}
                      </td>
                      <td className="px-2 py-3">
                        <button
                          className="rounded-md border border-cyan-200 px-2 py-1 font-medium text-cyan-700 text-xs transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={busy}
                          onClick={() => onRecompute(entry.shipment.id)}
                          type="button"
                        >
                          Recompute
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {shipments.length ? null : (
                  <tr>
                    <td
                      className="px-2 py-5 text-slate-500 text-sm"
                      colSpan={8}
                    >
                      No shipments yet. Create one to see recommendation output.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-cyan-100 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-base">Recommendation Details</h2>
            {selectedShipment ? (
              <div className="mt-3 grid gap-3 text-sm">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="font-medium text-slate-900">
                    {selectedShipment.shipment.id} ·{" "}
                    {selectedShipment.shipment.corridor_id}
                  </p>
                  <p className="text-slate-600 text-xs">
                    Reason codes:{" "}
                    {selectedShipment.recommendation.reason_codes.join(", ") ||
                      "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="font-medium text-slate-800 text-xs uppercase tracking-wide">
                    Chosen path
                  </p>
                  <p className="mt-1 text-slate-700 text-sm">
                    {selectedShipment.recommendation.chosen_path?.path_nodes.join(
                      " -> "
                    ) || "No feasible path"}
                  </p>
                  <p className="text-slate-600 text-xs">
                    score:{" "}
                    {toFixedOrDash(
                      selectedShipment.recommendation.chosen_path?.score,
                      4
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="font-medium text-slate-800 text-xs uppercase tracking-wide">
                    Score breakdown
                  </p>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-slate-700 text-xs">
                    {Object.entries(
                      selectedShipment.recommendation.chosen_path
                        ?.score_breakdown || {}
                    ).map(([key, value]) => (
                      <p key={key}>
                        {pretty(key)}: {toFixedOrDash(value, 4)}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="font-medium text-slate-800 text-xs uppercase tracking-wide">
                    Alternatives
                  </p>
                  <div className="mt-1 grid gap-1 text-xs">
                    {selectedShipment.recommendation.alternatives.map(
                      (option, index) => (
                        <p
                          className="text-slate-700"
                          key={option.path_edges.join("-")}
                        >
                          {index + 1}. {option.path_nodes.join(" -> ")} (score{" "}
                          {toFixedOrDash(option.score, 4)})
                        </p>
                      )
                    )}
                    {selectedShipment.recommendation.alternatives
                      .length ? null : (
                      <p className="text-slate-500">
                        No alternatives generated.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-slate-500 text-sm">
                Select a shipment row to inspect explainability details.
              </p>
            )}
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-base">Audit Trail</h2>
            <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto text-xs">
              {auditEntries.map((item) => (
                <div
                  className="rounded-lg border border-slate-200 px-3 py-2"
                  key={item.id}
                >
                  <p className="font-medium text-slate-900">
                    {item.action} · {item.entity_type} · {item.entity_id}
                  </p>
                  <p className="text-slate-500">{item.timestamp_utc}</p>
                </div>
              ))}
              {auditEntries.length ? null : (
                <p className="text-slate-500 text-sm">No audit entries yet.</p>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
