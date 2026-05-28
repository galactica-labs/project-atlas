import { createContext, createElement, type ReactNode, useContext, useState } from "react";
import {
  type Asset,
  type Incident,
  assets as initialAssets,
  incidents as initialIncidents,
  jobs as initialJobs,
  type Job,
} from "../data/mock";

type Role = "ops" | "supervisor" | "tech";

interface AppState {
  role: Role;
  setRole: (r: Role) => void;
  assets: Asset[];
  incidents: Incident[];
  jobs: Job[];
  activeIncidentId: string | null;
  setActiveIncident: (id: string | null) => void;
  activeJobId: string | null;
  setActiveJob: (id: string | null) => void;
  hitlApproved: boolean;
  approveHitl: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("ops");
  const [assets] = useState(initialAssets);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [jobs] = useState(initialJobs);
  const [activeIncidentId, setActiveIncident] = useState<string | null>(null);
  const [activeJobId, setActiveJob] = useState<string | null>(null);
  const [hitlApproved, setHitlApproved] = useState(false);

  function approveHitl() {
    setHitlApproved(true);
    setIncidents((prev) =>
      prev.map((i) => (i.id === "inc-001" ? { ...i, status: "dispatched" } : i))
    );
  }

  return createElement(AppContext.Provider, {
    value: {
      role,
      setRole,
      assets,
      incidents,
      jobs,
      activeIncidentId,
      setActiveIncident,
      activeJobId,
      setActiveJob,
      hitlApproved,
      approveHitl,
    },
    children,
  });
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
