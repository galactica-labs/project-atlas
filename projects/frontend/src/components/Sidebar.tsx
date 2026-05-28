import {
  ArrowsClockwise,
  ChartBar,
  ClipboardText,
  Desktop,
  Gear,
  List,
  MagnifyingGlass,
  MapTrifold,
  Microphone,
  Pulse,
  SignOut,
  SquaresFour,
  Users,
  Warning,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../store/appStore";

const opLinks = [
  { to: "/ops", icon: SquaresFour, label: "Command Center" },
  { to: "/ops/floor-plan", icon: MapTrifold, label: "Floor Plan" },
  { to: "/ops/incidents", icon: Warning, label: "Incidents" },
  { to: "/ops/import", icon: ArrowsClockwise, label: "Genesis Flow" },
  { to: "/ops/ingress", icon: Pulse, label: "Ingress Data" },
  { to: "/ops/assets", icon: Desktop, label: "Assets" },
  { to: "/ops/query", icon: MagnifyingGlass, label: "NL Query" },
  { to: "/ops/reports", icon: ChartBar, label: "Reports" },
];
const supLinks = [
  { to: "/supervisor", icon: List, label: "Approval Inbox" },
  { to: "/supervisor/history", icon: ClipboardText, label: "History" },
  { to: "/supervisor/team", icon: Users, label: "Team" },
];
const techLinks = [
  { to: "/tech", icon: List, label: "My Jobs" },
  { to: "/tech/active", icon: Microphone, label: "Active Job" },
  { to: "/tech/settings", icon: Gear, label: "Settings" },
];

const roleConfig = {
  ops: {
    label: "Ops Manager",
    color: "text-blue-400",
    dot: "bg-blue-400",
    initials: "OM",
    name: "Ops Manager",
    abbr: "OPS",
  },
  supervisor: {
    label: "Supervisor",
    color: "text-amber-400",
    dot: "bg-amber-400",
    initials: "JR",
    name: "J. Rivera",
    abbr: "SUP",
  },
  tech: {
    label: "Technician",
    color: "text-emerald-400",
    dot: "bg-emerald-400",
    initials: "MC",
    name: "Marcus Chen",
    abbr: "TECH",
  },
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { role, setRole } = useApp();
  const navigate = useNavigate();
  const links = role === "ops" ? opLinks : role === "supervisor" ? supLinks : techLinks;
  const rc = roleConfig[role];

  function handleNav(path: string) {
    navigate(path);
    onClose?.();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <div className="w-2.5 h-2.5 bg-black rounded-[3px]" />
          </div>
          <span className="text-[14px] font-semibold tracking-tight">Atlas</span>
          <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-wider ml-1">
            {rc.abbr}
          </span>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors duration-200"
          >
            <X size={14} weight="light" />
          </button>
        )}
      </div>

      {/* Role switcher */}
      <div className="px-3 py-3 border-b border-white/[0.05]">
        <div className="p-[1.5px] bg-white/[0.02] rounded-xl ring-1 ring-white/[0.06]">
          <div className="bg-zinc-950 rounded-[10px]">
            <select
              value={role}
              onChange={(e) => {
                const r = e.target.value as "ops" | "supervisor" | "tech";
                setRole(r);
                handleNav(r === "ops" ? "/ops" : r === "supervisor" ? "/supervisor" : "/tech");
              }}
              className="w-full bg-transparent px-3 py-2.5 text-[12px] font-medium text-zinc-300 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="ops">Ops Manager</option>
              <option value="supervisor">Supervisor</option>
              <option value="tech">Technician</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-1 mt-2">
          <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
          <span className={`text-[10px] font-medium ${rc.color}`}>{rc.label}</span>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/ops" || to === "/supervisor" || to === "/tech"}
            onClick={() => onClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-[9px] rounded-[10px] text-[13px] font-medium transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group md:text-[12px] md:py-[7px] ${
                isActive
                  ? "bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.03]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={15}
                  weight={isActive ? "fill" : "light"}
                  className={isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-300"}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-2 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-zinc-800 ring-1 ring-white/[0.08] flex items-center justify-center text-[10px] font-bold text-zinc-300 flex-shrink-0">
            {rc.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-zinc-300 truncate">{rc.name}</p>
            <p className="text-[10px] text-zinc-600">{rc.label}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            navigate("/");
            onClose?.();
          }}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-[10px] text-[12px] font-medium text-zinc-700 hover:text-zinc-300 hover:bg-white/[0.04] transition-all duration-200 group"
        >
          <SignOut size={13} weight="light" className="group-hover:text-zinc-400" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  // Close on route change (mobile)
  const _location = useLocation();
  useEffect(() => {
    onMobileClose?.();
  }, [onMobileClose]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop: static sidebar */}
      <aside className="hidden md:flex w-[216px] min-h-screen bg-[#050505] border-r border-white/[0.05] flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile: slide-in drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-[#070707] border-r border-white/[0.06] flex flex-col"
            >
              <SidebarContent onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
