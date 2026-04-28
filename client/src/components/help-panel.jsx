import { useState } from "react";

const pageExplanations = {
  overview: "Dashboard overview: Shows all key metrics at a glance - risk levels, action distribution, active disruptions. Judges see it first.",
  network: "Network view: 25 cities, 40+ routes, cold-chain capability. Shows physical infrastructure of the supply chain.",
  shipments: "Shipments: Core functionality. Every row is a decision - click for path details, score breakdown, alternatives.",
  disruptions: "Disruptions: Events that trigger recommendation changes. Weather comes from real API, others are manual.",
  policies: "Policies: Rules from different owners (Operations, Compliance). Block rules are hard constraints, Prefer rules score boosts.",
  audit: "Audit: Pharma is regulated. Every action is logged with timestamp for traceability and compliance.",
};

export function HelpButton({ pageId }) {
  const [isOpen, setIsOpen] = useState(false);
  const explanation = pageExplanations[pageId];

  if (!explanation) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-slate-400 hover:text-cyan-600 text-sm underline"
      >
        ?
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Quick Explanation</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 text-lg">
                x
              </button>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{explanation}</p>
          </div>
        </div>
      )}
    </>
  );
}

export function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-800 px-2 py-1 text-xs text-white whitespace-normal z-50">
          {text}
        </span>
      )}
    </span>
  );
}