import { CaretRight, CheckCircle, Clock, ShieldCheck, Warning } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../store/appStore";

export default function ApprovalInbox() {
  const navigate = useNavigate();
  const { hitlApproved } = useApp();

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 min-h-full">
      {/* ── Header ── */}
      <div className="mb-8 fade-up">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-zinc-600">
            Supervisor
          </span>
          {!hitlApproved && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/12 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
              <span className="w-1 h-1 rounded-full bg-amber-400 status-pulse-amber" />1 pending
            </span>
          )}
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight">Approval Inbox</h1>
        <p className="text-[13px] text-zinc-600 mt-1">
          Actions requiring your sign-off before they execute
        </p>
      </div>

      {/* ── Pending approval ── */}
      {!hitlApproved ? (
        <button
          type="button"
          onClick={() => navigate("/supervisor/approve/inc-001")}
          className="w-full text-left group active:scale-[0.995] fade-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="relative overflow-hidden p-[1.5px] rounded-2xl ring-1 ring-amber-500/30 bg-amber-500/[0.04] group-hover:ring-amber-500/55 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
            {/* Left accent bar */}
            <div className="absolute left-0 top-[1.5px] bottom-[1.5px] w-0.5 bg-amber-500/70 rounded-l-sm" />

            <div className="rounded-[14px] px-5 py-5 bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3.5">
                  <div className="relative w-11 h-11 bg-amber-500/12 rounded-2xl ring-1 ring-amber-500/25 flex items-center justify-center flex-shrink-0">
                    <Warning size={16} weight="fill" className="text-amber-400" />
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-[#0a0a0a] flex items-center justify-center">
                      <span className="text-[7px] font-bold text-white leading-none">1</span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[14px] font-semibold text-white leading-none font-mono">
                        Emergency Bypass — CHILLER-A-03
                      </span>
                      <span className="text-[9px] bg-red-500/15 text-red-300 border border-red-500/22 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        Critical
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-500 leading-relaxed max-w-md mt-1">
                      Hermes agent requests CHW loop bypass + PUMP-CHW-03/04 isolation. Your
                      approval gates dispatch to Marcus Chen and CHILLER-A-01/02 activation.
                    </p>
                  </div>
                </div>
                <CaretRight
                  size={14}
                  weight="bold"
                  className="text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all duration-200 mt-1 flex-shrink-0 ml-3"
                />
              </div>

              {/* Confidence bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[9px] mb-1.5">
                  <span className="text-zinc-600 font-mono uppercase tracking-wide">
                    AI confidence
                  </span>
                  <span className="text-amber-400 font-mono font-bold">94%</span>
                </div>
                <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "94%" }} />
                </div>
              </div>

              {/* Meta strip */}
              <div className="flex items-center gap-4 text-[10px] text-zinc-600 pt-3 border-t border-white/[0.05]">
                <span className="flex items-center gap-1.5">
                  <Clock size={9} weight="light" />
                  Requested 14:33
                </span>
                <span>Escalated automatically</span>
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold ml-auto">
                  <span className="w-1 h-1 rounded-full bg-amber-400 status-pulse-amber" />
                  SLA breach in 23 min
                </span>
              </div>
            </div>
          </div>
        </button>
      ) : (
        <div
          className="p-[1.5px] rounded-2xl ring-1 ring-emerald-500/25 bg-emerald-500/[0.04] fade-up"
          style={{ animationDelay: "80ms" }}
        >
          <div className="rounded-[14px] px-5 py-4 bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/12 rounded-xl ring-1 ring-emerald-500/22 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={17} weight="fill" className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-emerald-300">
                  CHW bypass approved — Marcus Chen dispatched
                </p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  CHILLER-A-03 · Approved by you · 14:34 · SHA-256 audit record committed
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {hitlApproved && (
        <div className="text-center mt-12 fade-up" style={{ animationDelay: "160ms" }}>
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={18} weight="light" className="text-zinc-600" />
          </div>
          <p className="text-[13px] font-medium text-zinc-500">No further approvals pending</p>
          <p className="text-[12px] text-zinc-700 mt-1">
            All autonomous actions are within approved policy
          </p>
        </div>
      )}
    </div>
  );
}
