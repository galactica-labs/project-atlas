import { List } from "@phosphor-icons/react";
import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "./components/Sidebar";
import Hero from "./pages/Hero";
import Login from "./pages/Login";
import CommandCenter from "./pages/ops/CommandCenter";
import DispatchPlan from "./pages/ops/DispatchPlan";
import FloorPlan from "./pages/ops/FloorPlan";
import ImportFlow from "./pages/ops/ImportFlow";
import IncidentQueue from "./pages/ops/IncidentQueue";
import IngressViz from "./pages/ops/IngressViz";
import ApprovalDetail from "./pages/supervisor/ApprovalDetail";
import ApprovalInbox from "./pages/supervisor/ApprovalInbox";
import ActiveJob from "./pages/tech/ActiveJob";
import CloseOut from "./pages/tech/CloseOut";
import JobsList from "./pages/tech/JobsList";
import { AppProvider, useApp } from "./store/appStore";

// Mobile top bar — only shown on small screens
function MobileHeader({ onOpen }: { onOpen: () => void }) {
  const { role } = useApp();
  const roleLabel = { ops: "Ops Manager", supervisor: "Supervisor", tech: "Technician" }[role];
  const roleDot = { ops: "bg-blue-400", supervisor: "bg-amber-400", tech: "bg-emerald-400" }[role];

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/[0.05] bg-[#050505] flex-shrink-0">
      <button
        type="button"
        onClick={onOpen}
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] text-zinc-400 active:scale-95 transition-transform duration-150"
        aria-label="Open navigation"
      >
        <List size={16} weight="light" />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center flex-shrink-0">
          <div className="w-2 h-2 bg-black rounded-[2px]" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight">Atlas</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${roleDot}`} />
        <span className="text-[11px] text-zinc-500 font-medium">{roleLabel}</span>
      </div>
    </header>
  );
}

function AppRoutes() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isFullPage = ["/", "/login"].includes(location.pathname);

  if (isFullPage) {
    return (
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#050505]">
      <Sidebar mobileOpen={drawerOpen} onMobileClose={() => setDrawerOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader onOpen={() => setDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <Routes>
            <Route path="/ops" element={<CommandCenter />} />
            <Route path="/ops/floor-plan" element={<FloorPlan />} />
            <Route path="/ops/incidents" element={<IncidentQueue />} />
            <Route path="/ops/dispatch" element={<DispatchPlan />} />
            <Route path="/ops/import" element={<ImportFlow />} />
            <Route path="/ops/ingress" element={<IngressViz />} />
            <Route path="/ops/assets" element={<Placeholder title="Asset Registry" />} />
            <Route path="/ops/query" element={<Placeholder title="Natural Language Query" />} />
            <Route path="/ops/reports" element={<Placeholder title="Risk Profile Reports" />} />
            <Route path="/ops/approvals" element={<Placeholder title="Pending Approvals" />} />
            <Route path="/supervisor" element={<ApprovalInbox />} />
            <Route path="/supervisor/approve/:id" element={<ApprovalDetail />} />
            <Route path="/supervisor/history" element={<Placeholder title="Approval History" />} />
            <Route path="/supervisor/team" element={<Placeholder title="Team" />} />
            <Route path="/tech" element={<JobsList />} />
            <Route path="/tech/job" element={<ActiveJob />} />
            <Route path="/tech/active" element={<ActiveJob />} />
            <Route path="/tech/closeout" element={<CloseOut />} />
            <Route path="/tech/settings" element={<Placeholder title="Settings" />} />
            <Route path="*" element={<Navigate to="/ops" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[50dvh]">
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        <p className="text-xs text-zinc-700 mt-1">Coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <TooltipProvider>
        <BrowserRouter>
          <div className="grain" aria-hidden />
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  );
}
