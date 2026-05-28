import { ArrowRight, CheckCircle, Clock, Warning } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { assets } from "../../data/mock";
import { useApp } from "../../store/appStore";

const severityConfig = {
  critical: {
    ring: "ring-red-500/28",
    bg: "bg-red-500/[0.04]",
    badge: "bg-red-500/12 text-red-300 border-red-500/20",
    icon: "text-red-400",
    iconBg: "bg-red-500/12 ring-red-500/25",
    progress: "bg-red-500",
    bar: "bg-red-950/40",
    ttf: "text-red-400",
    hover: "hover:ring-red-500/50",
  },
  high: {
    ring: "ring-amber-500/22",
    bg: "bg-amber-500/[0.03]",
    badge: "bg-amber-500/12 text-amber-300 border-amber-500/18",
    icon: "text-amber-400",
    iconBg: "bg-amber-500/12 ring-amber-500/22",
    progress: "bg-amber-500",
    bar: "bg-amber-950/40",
    ttf: "text-amber-400",
    hover: "hover:ring-amber-500/40",
  },
  medium: {
    ring: "ring-blue-500/18",
    bg: "bg-blue-500/[0.025]",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/15",
    icon: "text-blue-400",
    iconBg: "bg-blue-500/10 ring-blue-500/18",
    progress: "bg-blue-500",
    bar: "bg-blue-950/40",
    ttf: "text-blue-400",
    hover: "hover:ring-blue-500/35",
  },
};

export default function IncidentQueue() {
  const navigate = useNavigate();
  const { incidents, setActiveIncident } = useApp();

  const active = incidents.filter((i) => i.status !== "resolved");
  const resolved = incidents.filter((i) => i.status === "resolved");

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 min-h-full">
      {/* ── Header ── */}
      <div className="mb-7 fade-up">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-zinc-600">
            Operations
          </span>
          {active.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/12 border border-red-500/20 text-red-400 text-[10px] font-bold">
              {active.length} active
            </span>
          )}
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight">Incident Queue</h1>
        <p className="text-[13px] text-zinc-600 mt-0.5">
          Real-time facility alerts · sorted by urgency
        </p>
      </div>

      {/* ── Active incidents ── */}
      {active.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 fade-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/[0.06] ring-1 ring-emerald-500/18 flex items-center justify-center mb-3">
            <CheckCircle size={18} weight="light" className="text-emerald-500" />
          </div>
          <p className="text-[13px] font-medium text-zinc-400">No active incidents</p>
          <p className="text-[12px] text-zinc-700 mt-1">All systems nominal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((inc, i) => {
            const asset = assets.find((a) => a.id === inc.assetId);
            const cfg = severityConfig[inc.severity] ?? severityConfig.medium;
            const urgencyPct = Math.min(100, (1 - inc.ttf / 60) * 100);

            return (
              <button
                type="button"
                key={inc.id}
                onClick={() => {
                  setActiveIncident(inc.id);
                  navigate("/ops");
                }}
                className="w-full text-left group active:scale-[0.995] fade-up"
                style={{ animationDelay: `${80 + i * 70}ms` }}
              >
                <div
                  className={`p-[1.5px] rounded-2xl ring-1 ${cfg.ring} ${cfg.bg} ${cfg.hover} transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`}
                >
                  <div className="rounded-[14px] px-4 py-4 bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg} ring-1`}
                        >
                          <Warning size={14} weight="fill" className={cfg.icon} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-[13px] font-semibold text-white leading-none">
                              {asset?.name}
                            </span>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${cfg.badge}`}
                            >
                              {inc.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 mt-0.5 leading-none">
                            {asset?.zone} · Detected {inc.detectedAt}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p
                          className={`text-[28px] font-semibold tabular-nums font-mono leading-none ${cfg.ttf}`}
                        >
                          {inc.ttf}
                        </p>
                        <p className="text-[9px] text-zinc-700 font-mono">min</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-500 leading-relaxed mb-3 line-clamp-2">
                      {inc.prediction}
                    </p>

                    <div className="mb-3">
                      <div className={`h-1 ${cfg.bar} rounded-full overflow-hidden`}>
                        <div
                          className={`h-full ${cfg.progress} rounded-full`}
                          style={{ width: `${urgencyPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2.5 border-t border-white/[0.04]">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                        <Clock size={9} weight="light" />
                        {inc.detectedAt}
                      </span>
                      <span className="text-[10px] text-zinc-700">
                        {inc.blastRadius.length + 1} systems at risk
                      </span>
                      {inc.status === "hitl-pending" && (
                        <span className="text-[9px] bg-amber-500/12 text-amber-300 border border-amber-500/18 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                          Awaiting approval
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-zinc-600 group-hover:text-zinc-300 transition-colors">
                        Investigate
                        <ArrowRight
                          size={9}
                          weight="bold"
                          className="group-hover:translate-x-0.5 transition-transform duration-200"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Resolved ── */}
      {resolved.length > 0 && (
        <div className="mt-8 fade-up" style={{ animationDelay: "200ms" }}>
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.18em] font-semibold mb-3">
            Resolved
          </p>
          <div className="space-y-2">
            {resolved.map((inc) => {
              const asset = assets.find((a) => a.id === inc.assetId);
              return (
                <div
                  key={inc.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.01]"
                >
                  <CheckCircle size={13} weight="fill" className="text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-zinc-500 font-medium truncate">{asset?.name}</p>
                    <p className="text-[10px] text-zinc-700 mt-0.5">{asset?.zone}</p>
                  </div>
                  <span className="text-[10px] text-zinc-700 font-mono">{inc.detectedAt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
