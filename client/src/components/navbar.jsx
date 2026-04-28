import { Link, useNavigate } from "react-router-dom";

const PAGES = [
  { id: "overview", label: "Overview", path: "/overview" },
  { id: "network", label: "Network", path: "/network" },
  { id: "shipments", label: "Shipments", path: "/shipments" },
  { id: "disruptions", label: "Disruptions", path: "/disruptions" },
  { id: "policies", label: "Policies", path: "/policies" },
  { id: "audit", label: "Audit", path: "/audit" },
];

export function Navbar({ currentPage, onPageChange }) {
  const navigate = useNavigate();

  const handlePageChange = (pageId) => {
    onPageChange?.(pageId);
    const page = PAGES.find((p) => p.id === pageId);
    if (page) navigate(page.path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#000000] border-b border-[rgba(0,153,255,0.15)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link to="/" className="font-[500] text-[16px] text-white">
          Logistics Control Tower
        </Link>

        <nav className="flex gap-1">
          {PAGES.map((page) => (
            <button
              className={`px-4 py-2 font-[400] text-[14px] transition-all ${
                currentPage === page.id
                  ? "text-[#0099ff] border-b-2 border-[#0099ff]"
                  : "text-[#a6a6a6] hover:text-white"
              }`}
              key={page.id}
              onClick={() => handlePageChange(page.id)}
              type="button"
            >
              {page.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;