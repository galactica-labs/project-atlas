import { CaretRight, CheckCircle, Clock, MapPin, Warning } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { assets, jobs } from "../../data/mock";
import { useApp } from "../../store/appStore";

const priorityConfig = {
  critical: {
    ring: "ring-red-500/30",
    bg: "bg-red-500/[0.05]",
    iconBg: "bg-red-500/12",
    iconRing: "ring-red-500/28",
    icon: "text-red-400",
    badge: "bg-red-500/12 text-red-300 border-red-500/22",
    progress: "bg-red-500",
    bar: "bg-red-950/50",
    sla: "text-red-400",
    hover: "hover:ring-red-500/55",
  },
  high: {
    ring: "ring-amber-500/26",
    bg: "bg-amber-500/[0.04]",
    iconBg: "bg-amber-500/12",
    iconRing: "ring-amber-500/24",
    icon: "text-amber-400",
    badge: "bg-amber-500/12 text-amber-300 border-amber-500/20",
    progress: "bg-amber-500",
    bar: "bg-amber-950/50",
    sla: "text-amber-400",
    hover: "hover:ring-amber-500/45",
  },
  medium: {
    ring: "ring-blue-500/20",
    bg: "bg-blue-500/[0.03]",
    iconBg: "bg-blue-500/10",
    iconRing: "ring-blue-500/18",
    icon: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/18",
    progress: "bg-blue-500",
    bar: "bg-blue-950/50",
    sla: "text-blue-400",
    hover: "hover:ring-blue-500/38",
  },
};

export default function JobsList() {
  const navigate = useNavigate();
  const { hitlApproved } = useApp();

  return (
    <div className="max-w-lg mx-auto px-5 py-8 min-h-full">
      {/* ── Header ── */}
      <div className="mb-7 fade-up">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-zinc-600">
            Technician
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-zinc-500 text-[10px] font-semibold">
            {jobs.length} assigned
          </span>
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight">My Jobs</h1>
        <p className="text-[13px] text-zinc-600 mt-0.5">Marcus Chen · On shift</p>
      </div>

      {/* ── HITL banner ── */}
      {!hitlApproved ? (
        <div
          className="relative overflow-hidden p-[1.5px] rounded-xl bg-amber-500/[0.05] ring-1 ring-amber-500/22 mb-5 fade-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="absolute left-0 top-[1.5px] bottom-[1.5px] w-0.5 bg-amber-500/60 rounded-l-sm" />
          <div className="bg-amber-500/[0.04] rounded-[10px] px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 status-pulse-amber" />
            </div>
            <p className="text-[12px] text-amber-300 font-medium">
              Waiting for supervisor approval before dispatch
            </p>
          </div>
        </div>
      ) : (
        <div
          className="p-[1.5px] rounded-xl bg-emerald-500/[0.05] ring-1 ring-emerald-500/22 mb-5 fade-up"
          style={{ animationDelay: "60ms" }}
        >
          <div className="bg-emerald-500/[0.04] rounded-[10px] px-4 py-3 flex items-center gap-3">
            <CheckCircle size={13} weight="fill" className="text-emerald-400 flex-shrink-0" />
            <p className="text-[12px] text-emerald-300 font-medium">
              Approved — proceed to CHILLER-A-03 · Mechanical Zone
            </p>
          </div>
        </div>
      )}

      {/* ── Job cards ── */}
      <div className="space-y-3">
        {jobs.map((job, i) => {
          const asset = assets.find((a) => a.id === job.assetId);
          const cfg = priorityConfig[job.priority] ?? priorityConfig.medium;
          const completedCount = job.steps.filter((s) => s.completed).length;
          const progressPct = (completedCount / job.steps.length) * 100;

          return (
            <button
              type="button"
              key={job.id}
              onClick={() => navigate("/tech/job")}
              className="w-full text-left group active:scale-[0.995] fade-up"
              style={{ animationDelay: `${120 + i * 80}ms` }}
            >
              <div
                className={`p-[1.5px] rounded-2xl ring-1 ${cfg.ring} ${cfg.bg} ${cfg.hover} transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`}
              >
                <div className="bg-[#0a0a0a] rounded-[14px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg} ring-1 ${cfg.iconRing}`}
                      >
                        <Warning size={14} weight="fill" className={cfg.icon} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-snug text-white">
                          {job.title}
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">{asset?.zone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                      <span className={`text-[10px] font-mono font-bold tabular-nums ${cfg.sla}`}>
                        SLA {job.eta.split(":")[1]}m
                      </span>
                      <CaretRight
                        size={11}
                        weight="bold"
                        className="text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Meta badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-3.5">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border capitalize ${cfg.badge}`}
                    >
                      {job.priority}
                    </span>
                    <span className="text-[11px] text-zinc-600 flex items-center gap-1">
                      <MapPin size={10} weight="light" />
                      {asset?.name}
                    </span>
                    <span className="text-[11px] text-zinc-600 flex items-center gap-1">
                      <Clock size={10} weight="light" />
                      ETA {job.eta}
                    </span>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-600 mb-1.5">
                      <span>Progress</span>
                      <span className="font-mono tabular-nums">
                        {completedCount}/{job.steps.length} steps
                      </span>
                    </div>
                    <div className={`h-1 ${cfg.bar} rounded-full overflow-hidden`}>
                      <div
                        className={`h-full ${cfg.progress} rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
