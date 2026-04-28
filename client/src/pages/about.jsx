import { useEffect, useState } from "react";

export function AboutPage() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/supply-chain/overview")
      .then((r) => r.json())
      .then(setOverview)
      .catch(() => {});
  }, []);

  return (
    <div className="grid gap-8">
      <div className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-6">
        <h1 className="font-semibold text-2xl text-slate-900">About This Solution</h1>
        <p className="mt-2 text-slate-600">
          Pharma Supply Chain Control Tower - Decision Support System for Logistics
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-lg text-slate-800 mb-4">The Problem</h2>
        <div className="space-y-4 text-slate-600">
          <p>
            Pharmaceutical logistics requires precise temperature control and strict delivery windows.
            When disruptions occur (weather, traffic, vehicle breakdowns), dispatchers must quickly
            decide: continue, reroute, or hold?
          </p>
          <p>
            Making wrong decisions costs lives in pharma. Wrong temperature = ruined vaccines.
            Missed SLA = insulin arriving late to diabetic patients.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-lg text-slate-800 mb-4">Key Architectural Decisions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-slate-800">Why Multi-Page Dashboard?</h3>
            <p className="mt-1 text-slate-600 text-sm">
              Single-page apps get cluttered. Judges review prototypes after deck + video,
              so clarity matters. Multi-page lets us show: overview KPIs, network topology,
              shipment details, disruption impact, policy controls, and audit trail.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-slate-800">Why Google Maps + Open-Meteo?</h3>
            <p className="mt-1 text-slate-600 text-sm">
              We use real external APIs to show integration capability. Google Maps provides
              actual distances and ETAs for Indian routes. Open-Meteo gives live weather
              data without API keys. This proves we can connect to real-world data sources.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-slate-800">Why Policy Layers?</h3>
            <p className="mt-1 text-slate-600 text-sm">
              Different stakeholders own different rules: Operations prefers routes,
              Compliance blocks unsafe carriers, SLA governs time penalties.
              Our policy system lets multiple owners set rules that all get enforced
              before any route is recommended.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-slate-800">Why Explainable Recommendations?</h3>
            <p className="mt-1 text-slate-600 text-sm">
              Judges (and real dispatchers) need to trust the system. We show:
              reason codes (why this action?), score breakdown (eta vs cost vs risk),
              confidence level, and alternatives. If AI recommends "reroute",
              the dispatcher sees exactly which disruption caused it.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-slate-800">Why Audit Trail?</h3>
            <p className="mt-1 text-slate-600 text-sm">
              In regulated pharma, every decision must be traceable.
              Every shipment created, policy changed, disruption added, and
              recommendation computed gets logged with timestamp.
              This could satisfy compliance requirements.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-lg text-slate-800 mb-4">How Recommendations Work</h2>
        <div className="space-y-4 text-slate-600 text-sm">
          <div className="flex gap-4">
            <div className="flex-1 rounded-lg bg-slate-50 p-3">
              <div className="font-medium text-slate-700">1. Path Finding</div>
              <div className="mt-1 text-slate-500">DFS finds all valid routes from source to destination</div>
            </div>
            <div className="flex-1 rounded-lg bg-slate-50 p-3">
              <div className="font-medium text-slate-700">2. Hard Constraints</div>
              <div className="mt-1 text-slate-500">Remove paths failing cold-chain, max-transit, or policy blocks</div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 rounded-lg bg-slate-50 p-3">
              <div className="font-medium text-slate-700">3. Scoring</div>
              <div className="mt-1 text-slate-500">Score = w_eta*eta + w_cost*cost + w_sla*sla + w_risk*risk</div>
            </div>
            <div className="flex-1 rounded-lg bg-slate-50 p-3">
              <div className="font-medium text-slate-700">4. Action Mapping</div>
              <div className="mt-1 text-slate-500">Based on risk level and SLA breach: continue / reroute / hold / no-path</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-lg text-slate-800 mb-4">External Integrations</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
            <div className="font-medium text-cyan-800">Google Distance Matrix API</div>
            <div className="mt-1 text-cyan-700 text-sm">Real distances and ETAs for Indian routes</div>
            <div className="mt-2 text-xs text-cyan-600">Status: {overview?.corridors_supported > 0 ? "Active" : "Not configured"}</div>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="font-medium text-blue-800">Open-Meteo Weather API</div>
            <div className="mt-1 text-blue-700 text-sm">Live weather for all 25 cities</div>
            <div className="mt-2 text-xs text-blue-600">Status: Active (free, no key)</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-lg text-slate-800 mb-4">Disruption Types</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="font-medium text-amber-800">Weather Alert</div>
            <div className="mt-1 text-amber-700 text-xs">Auto-detected from weather API</div>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <div className="font-medium text-orange-800">Traffic Congestion</div>
            <div className="mt-1 text-orange-700 text-xs">Manually injected</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="font-medium text-red-800">Vehicle Breakdown</div>
            <div className="mt-1 text-red-700 text-xs">Manually injected</div>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
            <div className="font-medium text-purple-800">Facility Delay</div>
            <div className="mt-1 text-purple-700 text-xs">Hub/warehouse issues</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="font-medium text-slate-800">Regulatory Delay</div>
            <div className="mt-1 text-slate-700 text-xs">Customs/compliance</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-lg text-slate-800 mb-4">Load Profile Types</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-cyan-50 px-3 py-2">
            <span className="font-medium text-cyan-800">Pharma Standard 2-8C</span>
            <span className="text-cyan-600">Most vaccines, standard meds</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
            <span className="font-medium text-blue-800">Vaccine Deepfreeze -20C</span>
            <span className="text-blue-600">mRNA vaccines, special</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
            <span className="font-medium text-emerald-800">Insulin Cold 2-6C</span>
            <span className="text-emerald-600">Insulin, temperature critical</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
            <span className="font-medium text-amber-800">Ambient 15-25C</span>
            <span className="text-amber-600">Tablets, oral meds</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-lg text-slate-800 mb-4">Current System State</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-center">
            <div className="font-bold text-2xl text-cyan-700">{overview?.active_shipments ?? 0}</div>
            <div className="text-cyan-600 text-sm">Shipments</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
            <div className="font-bold text-2xl text-amber-700">{overview?.active_disruptions ?? 0}</div>
            <div className="text-amber-600 text-sm">Active Disruptions</div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
            <div className="font-bold text-2xl text-emerald-700">{overview?.policies_enabled ?? 0}</div>
            <div className="text-emerald-600 text-sm">Policies</div>
          </div>
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-center">
            <div className="font-bold text-2xl text-violet-700">{overview?.corridors_supported ?? 0}</div>
            <div className="text-violet-600 text-sm">Corridors</div>
          </div>
        </div>
      </div>
    </div>
  );
}