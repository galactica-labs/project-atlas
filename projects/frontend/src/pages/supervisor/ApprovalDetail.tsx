import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  GitBranch,
  ListChecks,
  PencilSimple,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../store/appStore";

const reasoningSteps = [
  {
    agent: "Sentinel",
    color: "blue",
    step: "Anomaly detected 14:32:18 — CHILLER-A-03 CHW supply temp +4.1σ above 30-day baseline. Compressor load 97%, flow rate −39% in 14 min. Pattern matches thermal runaway in 94 prior cases.",
  },
  {
    agent: "Triton",
    color: "violet",
    step: "LightGBM quantile forecast: q95 crosses 12°C threshold in +11 min, q50 in +18 min. Model confidence 94%. AnomalySignal → TriageReport emitted.",
  },
  {
    agent: "Hephaestus",
    color: "orange",
    step: "Apache AGE blast-radius query: CHILLER-A-03 → PUMP-CHW-03/04 → CRAH-B-01..04 → POD-05, POD-06. 8 downstream systems at risk. $2.4M GPU compute at exposure.",
  },
  {
    agent: "Hermes",
    color: "emerald",
    step: "RAG→MILP dispatch: Marcus Chen selected (HVAC-R + Chiller-Certified, on-site depot, 8 min ETA). Parts confirmed in stock: R-410A, TXV valve, compressor contactor. Policy template: balanced.",
  },
];

const alternatives = [
  {
    label: "Dispatch + CHW Loop Bypass",
    risk: "Low" as const,
    recommended: true,
    desc: "Dispatch Marcus Chen to inspect CHILLER-A-03. Activate CHILLER-A-01/02 to absorb Zone B load. Engage PUMP-CHW-03/04 bypass valves. Lowest blast-radius exposure.",
  },
  {
    label: "Controlled POD-05/06 Shutdown",
    risk: "High" as const,
    recommended: false,
    desc: "Power down POD-05 and POD-06 to remove heat load from Zone B. Estimated 4-hour service window. $2.4M GPU compute offline.",
  },
  {
    label: "Monitor & Wait",
    risk: "Critical" as const,
    recommended: false,
    desc: "No immediate action. q95 breach in 11 min, q50 in 18 min. Risk of uncontrolled thermal cascade to all 8 downstream systems.",
  },
];

type RiskKey = "Low" | "High" | "Critical";
const riskStyle: Record<RiskKey, { bg: string; text: string; bar: string }> = {
  Low: { bg: "bg-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-500" },
  High: { bg: "bg-amber-500/10", text: "text-amber-400", bar: "bg-amber-500" },
  Critical: { bg: "bg-red-500/10", text: "text-red-400", bar: "bg-red-500" },
};

const riskWidth: Record<RiskKey, string> = { Low: "25%", High: "70%", Critical: "100%" };

const agentColor: Record<string, string> = {
  blue: "text-blue-400",
  violet: "text-violet-400",
  orange: "text-orange-400",
  amber: "text-amber-400",
  emerald: "text-emerald-400",
};
const agentDotCls: Record<string, string> = {
  blue: "bg-blue-500/20 ring-blue-500/40",
  violet: "bg-violet-500/18 ring-violet-500/35",
  orange: "bg-orange-500/15 ring-orange-500/30",
  amber: "bg-amber-500/15 ring-amber-500/30",
  emerald: "bg-emerald-500/15 ring-emerald-500/30",
};
const agentBarCls: Record<string, string> = {
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
};

export default function ApprovalDetail() {
  const navigate = useNavigate();
  const { approveHitl } = useApp();
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  function handleDecision(d: "approve" | "reject") {
    if (!note.trim()) return;
    setDecision(d);
    setSubmitted(true);
    if (d === "approve") approveHitl();
    setTimeout(() => navigate("/supervisor"), 1800);
  }

  if (submitted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center fade-up">
          <div
            className={`w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center ${
              decision === "approve"
                ? "bg-emerald-500/12 ring-1 ring-emerald-500/25"
                : "bg-red-500/12 ring-1 ring-red-500/25"
            }`}
          >
            {decision === "approve" ? (
              <CheckCircle size={32} weight="fill" className="text-emerald-400" />
            ) : (
              <XCircle size={32} weight="fill" className="text-red-400" />
            )}
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            {decision === "approve" ? "Approved" : "Rejected"}
          </h2>
          <p className="text-[13px] text-zinc-600 mt-2">Decision recorded · Audit entry created</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 overflow-y-auto h-full">
      {/* ── Back ── */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-white mb-7 transition-colors fade-up group"
      >
        <ArrowLeft
          size={13}
          weight="light"
          className="group-hover:-translate-x-0.5 transition-transform duration-200"
        />
        Back to Inbox
      </button>

      {/* ── Title block ── */}
      <div className="flex items-start gap-3.5 mb-6 fade-up" style={{ animationDelay: "60ms" }}>
        <div className="relative w-11 h-11 bg-amber-500/12 rounded-2xl ring-1 ring-amber-500/22 flex items-center justify-center flex-shrink-0">
          <Warning size={18} weight="fill" className="text-amber-400" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 ring-2 ring-[#050505] flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">!</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-zinc-600">
            INC-001 · HITL Approval Required
          </span>
          <h1 className="text-[20px] font-semibold tracking-tight mt-0.5">
            Emergency Bypass — CHILLER-A-03
          </h1>
          <p className="text-[12px] text-zinc-600 mt-0.5">
            Hermes requested 14:33:42 · also sent via Telegram
          </p>
        </div>
      </div>

      {/* ── Confidence strip ── */}
      <div
        className="p-[1.5px] rounded-xl bg-amber-500/[0.04] ring-1 ring-amber-500/16 mb-5 fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <div className="rounded-[10px] px-4 py-3 bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-zinc-600 font-mono uppercase tracking-wide">
              AI recommendation confidence
            </span>
            <span className="text-amber-300 font-mono font-bold">94%</span>
          </div>
          <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "94%" }} />
          </div>
        </div>
      </div>

      {/* ── Reasoning trace toggle ── */}
      <div className="mb-4 fade-up" style={{ animationDelay: "100ms" }}>
        <button
          type="button"
          onClick={() => setShowTrace(!showTrace)}
          className="flex items-center gap-2 text-[12px] text-blue-400 hover:text-blue-300 transition-colors font-medium group"
        >
          <ListChecks size={14} weight="light" />
          {showTrace ? "Hide" : "Show"} reasoning trace
          <ArrowRight
            size={10}
            weight="bold"
            className={`transition-transform duration-300 ${showTrace ? "rotate-90" : ""}`}
          />
        </button>
      </div>

      {/* ── Reasoning trace ── */}
      {showTrace && (
        <div className="p-[1.5px] bg-white/[0.012] rounded-2xl ring-1 ring-white/[0.06] mb-5 fade-up">
          <div className="bg-[#0a0a0a] rounded-[14px] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="relative pl-7">
              <div className="absolute left-[10px] top-4 bottom-4 w-px bg-white/[0.06]" />
              <div className="space-y-5">
                {reasoningSteps.map((s) => (
                  <div key={s.agent} className="relative flex gap-4">
                    <div
                      className={`absolute -left-7 w-5 h-5 rounded-full ring-1 flex items-center justify-center flex-shrink-0 z-10 ${agentDotCls[s.color]}`}
                      style={{ background: "rgba(0,0,0,0.9)" }}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${agentBarCls[s.color]} opacity-70`}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] mb-1 ${agentColor[s.color]}`}
                      >
                        {s.agent}
                      </p>
                      <p className="text-[12px] text-zinc-400 leading-relaxed">{s.step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Alternatives ── */}
      <div className="mb-5 fade-up" style={{ animationDelay: "140ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <GitBranch size={13} weight="light" className="text-zinc-500" />
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold">
            Decision Options
          </p>
        </div>
        <div className="space-y-2">
          {alternatives.map((a) => {
            const rs = riskStyle[a.risk];
            return (
              <div
                key={a.label}
                className={`p-[1.5px] rounded-xl ring-1 ${
                  a.recommended
                    ? "ring-blue-500/25 bg-blue-500/[0.04]"
                    : a.risk === "Critical"
                      ? "ring-red-500/15 bg-red-500/[0.025]"
                      : "ring-white/[0.06] bg-transparent"
                }`}
              >
                <div className="rounded-[10px] px-4 py-3.5 bg-[#0a0a0a]">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[13px] font-semibold text-white">{a.label}</span>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      {a.recommended && (
                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wide">
                          Recommended
                        </span>
                      )}
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${rs.bg} ${rs.text}`}
                      >
                        {a.risk} risk
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mb-2">{a.desc}</p>
                  <div className="h-0.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${rs.bar} rounded-full opacity-40`}
                      style={{ width: riskWidth[a.risk] }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mandatory note ── */}
      <div className="mb-4 fade-up" style={{ animationDelay: "180ms" }}>
        <div className="flex items-center gap-2 mb-2.5">
          <PencilSimple size={12} weight="light" className="text-zinc-500" />
          <label
            htmlFor="decision-note"
            className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold"
          >
            Your Decision Note
          </label>
          <span className="text-[10px] text-red-500 font-semibold">Required</span>
        </div>
        <div className="p-[1.5px] bg-white/[0.012] rounded-xl ring-1 ring-white/[0.07] focus-within:ring-white/[0.18] transition-all duration-200">
          <textarea
            id="decision-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe your reasoning for this decision…"
            className="w-full bg-transparent rounded-[10px] px-4 py-3 text-[13px] text-white placeholder-zinc-700 focus:outline-none resize-none leading-relaxed"
            rows={3}
          />
        </div>
      </div>

      {/* ── Audit notice ── */}
      <div
        className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5 mb-5 fade-up"
        style={{ animationDelay: "220ms" }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
        <p className="text-[11px] text-zinc-500">
          Decision recorded via Telegram + SHA-256 hash-chained audit ledger
        </p>
      </div>

      {/* ── Decision buttons ── */}
      <div className="flex gap-3 fade-up" style={{ animationDelay: "260ms" }}>
        <button
          type="button"
          onClick={() => handleDecision("approve")}
          disabled={!note.trim()}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-25 disabled:cursor-not-allowed text-white text-[13px] font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          <CheckCircle size={15} weight="fill" />
          Approve
        </button>
        <button
          type="button"
          onClick={() => handleDecision("reject")}
          disabled={!note.trim()}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600/70 hover:bg-red-600 disabled:opacity-25 disabled:cursor-not-allowed text-white text-[13px] font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          <XCircle size={15} weight="fill" />
          Reject
        </button>
      </div>
    </div>
  );
}
