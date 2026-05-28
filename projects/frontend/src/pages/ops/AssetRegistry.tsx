import {
  CaretDown,
  Desktop,
  Lightning,
  MagnifyingGlass,
  Thermometer,
  Warning,
  WifiHigh,
  X,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Asset, AssetStatus } from "../../data/mock";
import { useApp } from "../../store/appStore";

// ── helpers ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<AssetStatus, string> = {
  normal: "Normal",
  warning: "Warning",
  critical: "Critical",
  offline: "Offline",
};

const STATUS_DOT: Record<AssetStatus, string> = {
  normal: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-400",
  offline: "bg-zinc-600",
};

const STATUS_TEXT: Record<AssetStatus, string> = {
  normal: "text-emerald-400",
  warning: "text-amber-400",
  critical: "text-red-400",
  offline: "text-zinc-500",
};

const STATUS_GLOW: Record<AssetStatus, string> = {
  normal: "rgba(52,211,153,0.10)",
  warning: "rgba(245,158,11,0.10)",
  critical: "rgba(239,68,68,0.10)",
  offline: "transparent",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  Power: <Lightning size={10} weight="fill" className="text-amber-400" />,
  Cooling: <Thermometer size={10} weight="fill" className="text-sky-400" />,
  Compute: <Desktop size={10} weight="fill" className="text-violet-400" />,
  Network: <WifiHigh size={10} weight="fill" className="text-emerald-400" />,
};

const CRIT_BADGE: Record<string, string> = {
  high: "text-red-400 bg-red-500/[0.08] border-red-500/20",
  medium: "text-amber-400 bg-amber-500/[0.08] border-amber-500/20",
  low: "text-zinc-500 bg-white/[0.04] border-white/[0.08]",
};

const ALL_TYPES = ["Power", "Cooling", "Compute", "Network"];
const ALL_FLOORS = ["Mechanical", "Hall A", "Hall B"];
const ALL_STATUSES: AssetStatus[] = ["critical", "warning", "offline", "normal"];

// ── Detail panel ──────────────────────────────────────────────────────────

function DetailPanel({
  asset,
  onClose,
  relatedIncident,
  allAssets,
}: {
  asset: Asset;
  onClose: () => void;
  relatedIncident: { id: string; severity: string; ttf: number; prediction: string } | null;
  allAssets: Asset[];
}) {
  const deps = asset.dependsOn
    .map((id) => allAssets.find((a) => a.id === id))
    .filter(Boolean) as Asset[];

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      className="w-[288px] flex-shrink-0 flex flex-col border-l border-white/[0.06] bg-[#050505]"
      style={{ scrollbarWidth: "none" }}
    >
      {/* header */}
      <div className="px-4 pt-3.5 pb-3 border-b border-white/[0.05] flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {TYPE_ICON[asset.type] ?? null}
            <span className="text-[11px] font-semibold text-white font-mono">{asset.name}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 hover:text-white transition-colors duration-150"
          >
            <X size={10} weight="bold" />
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${CRIT_BADGE[asset.criticality]}`}
          >
            {asset.criticality}
          </span>
          <span className="text-[9px] text-zinc-600 font-mono">
            {asset.floor} · {asset.zone}
          </span>
        </div>
      </div>

      {/* status */}
      <div
        className="mx-4 mt-3 flex-shrink-0 rounded-xl border border-white/[0.06] bg-[#070707] px-3.5 py-3"
        style={{ boxShadow: `0 0 20px ${STATUS_GLOW[asset.status]}` }}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[asset.status]}`} />
          <span className={`text-[13px] font-semibold ${STATUS_TEXT[asset.status]}`}>
            {STATUS_LABEL[asset.status]}
          </span>
          {asset.status !== "normal" && (
            <span className="ml-auto text-[8px] font-mono text-zinc-700 uppercase tracking-wider">
              {asset.type}
            </span>
          )}
        </div>
      </div>

      {/* telemetry */}
      <div className="px-4 mt-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-[2px] h-3 rounded-full bg-sky-500/60" />
          <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
            Telemetry
          </span>
        </div>
        <div className="space-y-1.5">
          {asset.telemetry.map((t) => (
            <div
              key={t.metric}
              className="flex items-center justify-between rounded-lg bg-white/[0.025] border border-white/[0.05] px-2.5 py-1.5"
            >
              <span className="text-[9px] text-zinc-500 font-mono">{t.metric}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-white font-mono tabular-nums">
                  {t.value}
                  <span className="text-[9px] text-zinc-600 ml-0.5">{t.unit}</span>
                </span>
                {t.trend !== "stable" && (
                  <span
                    className={`text-[8px] font-mono ${t.trend === "up" ? "text-red-400" : "text-sky-400"}`}
                  >
                    {t.trend === "up" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* dependencies */}
      {deps.length > 0 && (
        <div className="px-4 mt-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-[2px] h-3 rounded-full bg-violet-500/60" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
              Depends On
            </span>
          </div>
          <div className="space-y-1">
            {deps.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 rounded-lg bg-white/[0.025] border border-white/[0.05] px-2.5 py-1.5"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[d.status]}`}
                />
                <span className="text-[9px] text-zinc-400 font-mono flex-1 truncate">{d.name}</span>
                <span className="text-[8px] text-zinc-700 font-mono">{d.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* linked incident */}
      {relatedIncident && (
        <div className="px-4 mt-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-[2px] h-3 rounded-full bg-red-500/70" />
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.15em]">
              Active Incident
            </span>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-red-500/22 bg-red-500/[0.04] px-3 py-2.5">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-red-500/40 to-transparent" />
            <div className="flex items-center gap-2 mb-1">
              <Warning size={9} weight="fill" className="text-red-400" />
              <span className="text-[10px] font-semibold text-red-300">
                {relatedIncident.severity.toUpperCase()}
              </span>
              <span className="ml-auto text-[9px] font-mono font-bold text-red-400 tabular-nums">
                {relatedIncident.ttf}m
              </span>
            </div>
            <p className="text-[8px] text-zinc-500 leading-relaxed line-clamp-2">
              {relatedIncident.prediction.slice(0, 100)}…
            </p>
          </div>
        </div>
      )}

      <div className="flex-1" />
    </motion.div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────

function AssetRow({
  asset,
  isSelected,
  onClick,
}: {
  asset: Asset;
  isSelected: boolean;
  onClick: () => void;
}) {
  const firstTelemetry = asset.telemetry[0];
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-200 group ${
        isSelected
          ? "border-white/[0.12] bg-white/[0.05]"
          : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.02]"
      }`}
    >
      {/* status dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[asset.status]}`}
        style={
          asset.status !== "normal"
            ? { boxShadow: `0 0 5px ${STATUS_GLOW[asset.status]}` }
            : undefined
        }
      />

      {/* name */}
      <div className="w-[110px] flex-shrink-0">
        <p className="text-[11px] font-semibold font-mono text-white truncate">{asset.name}</p>
      </div>

      {/* type */}
      <div className="hidden sm:flex items-center gap-1.5 w-[78px] flex-shrink-0">
        {TYPE_ICON[asset.type] ?? null}
        <span className="text-[9px] text-zinc-500 font-mono">{asset.type}</span>
      </div>

      {/* floor */}
      <div className="hidden md:block w-[76px] flex-shrink-0">
        <span className="text-[9px] text-zinc-600 font-mono truncate">{asset.floor}</span>
      </div>

      {/* zone */}
      <div className="hidden lg:block flex-1 min-w-0">
        <span className="text-[9px] text-zinc-700 font-mono truncate">{asset.zone}</span>
      </div>

      {/* first telemetry */}
      {firstTelemetry && (
        <div className="hidden xl:flex items-center gap-1 w-[100px] flex-shrink-0">
          <span className="text-[9px] text-zinc-700 font-mono truncate">
            {firstTelemetry.metric}
          </span>
          <span className="text-[10px] font-mono font-semibold text-zinc-400 tabular-nums ml-auto">
            {firstTelemetry.value}
            <span className="text-zinc-700 text-[8px]">{firstTelemetry.unit}</span>
          </span>
        </div>
      )}

      {/* criticality */}
      <div className="hidden sm:block flex-shrink-0 ml-auto">
        <span
          className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border ${CRIT_BADGE[asset.criticality]}`}
        >
          {asset.criticality}
        </span>
      </div>

      {/* chevron */}
      <CaretDown
        size={9}
        weight="bold"
        className={`flex-shrink-0 text-zinc-700 -rotate-90 transition-opacity duration-150 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}
      />
    </motion.button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function AssetRegistry() {
  const { assets, incidents } = useApp();
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedFloors, setSelectedFloors] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<AssetStatus>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // status counts
  const statusCounts = useMemo(
    () =>
      ALL_STATUSES.reduce(
        (acc, s) => {
          acc[s] = assets.filter((a) => a.status === s).length;
          return acc;
        },
        {} as Record<AssetStatus, number>
      ),
    [assets]
  );

  // filtered assets
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q) && !a.zone.toLowerCase().includes(q)) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(a.type)) return false;
      if (selectedFloors.size > 0 && !selectedFloors.has(a.floor)) return false;
      if (selectedStatuses.size > 0 && !selectedStatuses.has(a.status)) return false;
      return true;
    });
  }, [assets, search, selectedTypes, selectedFloors, selectedStatuses]);

  const selectedAsset = selectedId ? (assets.find((a) => a.id === selectedId) ?? null) : null;
  const relatedIncident = selectedId
    ? (incidents.find((i) => i.assetId === selectedId || i.blastRadius.includes(selectedId)) ??
      null)
    : null;

  function toggleType(t: string) {
    setSelectedTypes((prev) => {
      const n = new Set(prev);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });
  }
  function toggleFloor(f: string) {
    setSelectedFloors((prev) => {
      const n = new Set(prev);
      n.has(f) ? n.delete(f) : n.add(f);
      return n;
    });
  }
  function toggleStatus(s: AssetStatus) {
    setSelectedStatuses((prev) => {
      const n = new Set(prev);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });
  }

  const hasFilters =
    search.length > 0 ||
    selectedTypes.size > 0 ||
    selectedFloors.size > 0 ||
    selectedStatuses.size > 0;

  return (
    <div className="flex h-full bg-[#050505] overflow-hidden">
      {/* ── Left sidebar ────────────────────────────────────────── */}
      <div
        className="w-[188px] flex-shrink-0 flex flex-col border-r border-white/[0.05] py-4 px-3 gap-4 overflow-y-auto hidden md:flex"
        style={{ scrollbarWidth: "none" }}
      >
        {/* title */}
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-[2px] h-3.5 rounded-full bg-sky-500/70" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.16em]">
              Asset Registry
            </span>
          </div>
          <p className="text-[10px] text-zinc-700 font-mono mt-1">
            {assets.length} total · {assets.filter((a) => a.status !== "offline").length} online
          </p>
        </div>

        {/* status breakdown */}
        <div>
          <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.15em] mb-2">
            Status
          </p>
          <div className="space-y-1">
            {ALL_STATUSES.map((s) => {
              const active = selectedStatuses.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all duration-200 ${
                    active
                      ? "border-white/[0.10] bg-white/[0.04]"
                      : "border-transparent hover:bg-white/[0.02]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[s]}`} />
                  <span className="text-[9px] font-mono text-zinc-400 flex-1">
                    {STATUS_LABEL[s]}
                  </span>
                  <span
                    className={`text-[9px] font-mono tabular-nums font-semibold ${STATUS_TEXT[s]}`}
                  >
                    {statusCounts[s]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* type filter */}
        <div>
          <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.15em] mb-2">
            Type
          </p>
          <div className="flex flex-wrap gap-1">
            {ALL_TYPES.map((t) => {
              const active = selectedTypes.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`flex items-center gap-1 text-[8px] font-mono px-2 py-1 rounded-lg border transition-all duration-200 ${
                    active
                      ? "border-white/[0.14] bg-white/[0.06] text-zinc-200"
                      : "border-white/[0.05] text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03]"
                  }`}
                >
                  {TYPE_ICON[t]}
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* floor filter */}
        <div>
          <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.15em] mb-2">
            Floor
          </p>
          <div className="space-y-1">
            {ALL_FLOORS.map((f) => {
              const active = selectedFloors.has(f);
              const count = assets.filter((a) => a.floor === f).length;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFloor(f)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all duration-200 ${
                    active
                      ? "border-white/[0.10] bg-white/[0.04]"
                      : "border-transparent hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="text-[9px] font-mono text-zinc-400">{f}</span>
                  <span className="text-[8px] font-mono text-zinc-700 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* clear */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedTypes(new Set());
              setSelectedFloors(new Set());
              setSelectedStatuses(new Set());
            }}
            className="flex items-center gap-1 text-[8px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors duration-150 mt-auto"
          >
            <X size={8} weight="bold" />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Main table area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* search / toolbar */}
        <div className="px-4 py-3 border-b border-white/[0.05] flex-shrink-0 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2">
            <MagnifyingGlass size={11} className="text-zinc-600 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets, zones…"
              className="flex-1 bg-transparent text-[11px] text-zinc-300 placeholder:text-zinc-700 outline-none font-mono"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X size={9} className="text-zinc-600 hover:text-zinc-400" />
              </button>
            )}
          </div>
          <span className="text-[9px] font-mono text-zinc-700 flex-shrink-0 tabular-nums">
            {filtered.length} / {assets.length}
          </span>
        </div>

        {/* column headers */}
        <div className="px-4 py-1.5 border-b border-white/[0.04] flex items-center gap-3 flex-shrink-0">
          <div className="w-1.5 flex-shrink-0" />
          <div className="w-[110px] flex-shrink-0">
            <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-[0.15em]">
              Name
            </span>
          </div>
          <div className="hidden sm:block w-[78px] flex-shrink-0">
            <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-[0.15em]">
              Type
            </span>
          </div>
          <div className="hidden md:block w-[76px] flex-shrink-0">
            <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-[0.15em]">
              Floor
            </span>
          </div>
          <div className="hidden lg:block flex-1 min-w-0">
            <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-[0.15em]">
              Zone
            </span>
          </div>
          <div className="hidden xl:block w-[100px] flex-shrink-0">
            <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-[0.15em]">
              Telemetry
            </span>
          </div>
          <div className="hidden sm:block flex-shrink-0 ml-auto">
            <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-[0.15em]">
              Crit
            </span>
          </div>
          <div className="w-[9px] flex-shrink-0" />
        </div>

        {/* rows */}
        <div className="flex-1 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: "none" }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <p className="text-[11px] text-zinc-600 font-mono">No assets match</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedTypes(new Set());
                  setSelectedFloors(new Set());
                  setSelectedStatuses(new Set());
                }}
                className="flex items-center gap-1 text-[9px] font-mono text-zinc-700 hover:text-zinc-400 transition-colors duration-150"
              >
                <X size={8} weight="bold" />
                Clear filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((asset) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedId === asset.id}
                  onClick={() => setSelectedId(selectedId === asset.id ? null : asset.id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedAsset && (
          <DetailPanel
            asset={selectedAsset}
            onClose={() => setSelectedId(null)}
            relatedIncident={relatedIncident}
            allAssets={assets}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
