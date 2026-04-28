import { useCallback, useEffect, useState } from "react";
import { supplyChainApi } from "./lib/supply-chain-api";
import { HelpButton } from "./components/help-panel";
import { AuditPage } from "./pages/audit";
import { DisruptionsPage } from "./pages/disruptions";
import { NetworkPage } from "./pages/network";
import { OverviewPage } from "./pages/overview";
import { PoliciesPage } from "./pages/policies";
import { ShipmentsPage } from "./pages/shipments";

const PAGES = [
  { id: "overview", label: "Overview" },
  { id: "network", label: "Network" },
  { id: "shipments", label: "Shipments" },
  { id: "disruptions", label: "Disruptions" },
  { id: "policies", label: "Policies" },
  { id: "audit", label: "Audit" },
];

export function App() {
  const [currentPage, setCurrentPage] = useState("overview");
  const [overview, setOverview] = useState(null);

  const loadOverview = useCallback(async () => {
    try {
      const data = await supplyChainApi.overview();
      setOverview(data);
    } catch (e) {
      console.error("Failed to load overview", e);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  function renderPage() {
    switch (currentPage) {
      case "overview":
        return <OverviewPage onRefresh={loadOverview} />;
      case "network":
        return <NetworkPage onRefresh={loadOverview} />;
      case "shipments":
        return <ShipmentsPage onRefresh={loadOverview} />;
      case "disruptions":
        return <DisruptionsPage onRefresh={loadOverview} />;
      case "policies":
        return <PoliciesPage onRefresh={loadOverview} />;
      case "audit":
        return <AuditPage onRefresh={loadOverview} />;
      default:
        return <OverviewPage onRefresh={loadOverview} />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl tracking-tight">
              Pharma Supply Chain Control Tower
            </h1>
            <p className="text-slate-400 text-sm">
              Real-time visibility and AI-powered route recommendations
            </p>
          </div>
          <div className="flex items-center gap-4">
            {overview && (
              <div className="flex gap-6 text-center">
                <div>
                  <div className="font-bold text-2xl text-cyan-400">
                    {overview.active_shipments}
                  </div>
                  <div className="text-slate-400 text-xs">Shipments</div>
                </div>
                <div>
                  <div className="font-bold text-2xl text-amber-400">
                    {overview.active_disruptions}
                  </div>
                  <div className="text-slate-400 text-xs">Disruptions</div>
                </div>
                <div>
                  <div className="font-bold text-2xl text-emerald-400">
                    {overview.policies_enabled}
                  </div>
                  <div className="text-slate-400 text-xs">Policies</div>
                </div>
                <div>
                  <div className="font-bold text-2xl text-violet-400">
                    {overview.corridors_supported}
                  </div>
                  <div className="text-slate-400 text-xs">Corridors</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="border-slate-200 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <div className="flex gap-1">
            {PAGES.map((page) => (
              <button
                className={`px-4 py-3 font-medium text-sm transition-colors ${
                  currentPage === page.id
                    ? "border-cyan-600 border-b-2 bg-cyan-50 text-cyan-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                type="button"
              >
                {page.label}
              </button>
            ))}
          </div>
          <HelpButton pageId={currentPage} />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-6">{renderPage()}</main>
    </div>
  );
}

export default App;
