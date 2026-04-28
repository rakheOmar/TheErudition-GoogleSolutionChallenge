import { useCallback, useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supplyChainApi } from "./lib/supply-chain-api";
import { useAuth } from "./lib/auth-context";
import { Navbar } from "./components/navbar";
import { HelpButton } from "./components/help-panel";
import { AuditPage } from "./pages/audit";
import { DisruptionsPage } from "./pages/disruptions";
import { NetworkPage } from "./pages/network";
import { OverviewPage } from "./pages/overview";
import { PoliciesPage } from "./pages/policies";
import { ShipmentsPage } from "./pages/shipments";
import { HomePage } from "./pages/home";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";

const PAGES = [
  { id: "overview", label: "Overview", path: "/overview" },
  { id: "network", label: "Network", path: "/network" },
  { id: "shipments", label: "Shipments", path: "/shipments" },
  { id: "disruptions", label: "Disruptions", path: "/disruptions" },
  { id: "policies", label: "Policies", path: "/policies" },
  { id: "audit", label: "Audit", path: "/audit" },
];

function PageWrapper({ children, currentPage, setCurrentPage }) {
  const navigate = useNavigate();

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
    const page = PAGES.find((p) => p.id === pageId);
    if (page) navigate(page.path);
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      <Navbar currentPage={currentPage} onPageChange={handlePageChange} />
      <main className="mx-auto max-w-7xl px-6 py-8 pt-[72px]">
        {children}
      </main>
    </div>
  );
}

export function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
    const pathPage = PAGES.find((p) => p.path === location.path);
    if (pathPage) setCurrentPage(pathPage.id);
  }, [location.path]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-[#a6a6a6]">Loading...</div>
      </div>
    );
  }

  const isLoggedIn = true;

  return (
    <Routes>
      <Route path="/" element={
        <PageWrapper currentPage={currentPage} setCurrentPage={setCurrentPage}>
          <HomePage onStartDemo={() => navigate("/overview")} />
        </PageWrapper>
      } />
      <Route path="/login" element={
        <PageWrapper currentPage={currentPage} setCurrentPage={setCurrentPage}>
          <LoginPage />
        </PageWrapper>
      } />
      <Route path="/signup" element={
        <PageWrapper currentPage={currentPage} setCurrentPage={setCurrentPage}>
          <SignupPage />
        </PageWrapper>
      } />
      <Route
        path="/overview"
        element={isLoggedIn ? <PageWrapper currentPage={currentPage} setCurrentPage={setCurrentPage}><OverviewPage onRefresh={loadOverview} /></PageWrapper> : <LoginPage />}
      />
      <Route
        path="/network"
        element={isLoggedIn ? <PageWrapper currentPage={currentPage} setCurrentPage={setCurrentPage}><NetworkPage onRefresh={loadOverview} /></PageWrapper> : <LoginPage />}
      />
      <Route
        path="/shipments"
        element={isLoggedIn ? <PageWrapper currentPage={currentPage} setCurrentPage={setCurrentPage}><ShipmentsPage onRefresh={loadOverview} /></PageWrapper> : <LoginPage />}
      />
      <Route
        path="/disruptions"
        element={isLoggedIn ? <PageWrapper currentPage={currentPage} setCurrentPage={setCurrentPage}><DisruptionsPage onRefresh={loadOverview} /></PageWrapper> : <LoginPage />}
      />
      <Route
        path="/policies"
        element={isLoggedIn ? <PageWrapper currentPage={currentPage} setCurrentPage={setCurrentPage}><PoliciesPage onRefresh={loadOverview} /></PageWrapper> : <LoginPage />}
      />
      <Route
        path="/audit"
        element={isLoggedIn ? <PageWrapper currentPage={currentPage} setCurrentPage={setCurrentPage}><AuditPage onRefresh={loadOverview} /></PageWrapper> : <LoginPage />}
      />
    </Routes>
  );
}

export default App;