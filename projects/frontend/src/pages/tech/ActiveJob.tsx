import {
  ArrowLeft,
  ArrowRight,
  Book,
  Camera,
  CheckCircle,
  Circle,
  Microphone,
  Shield,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets, jobs } from "../../data/mock";

const voiceLog = [
  { time: "14:42:11", speaker: "You", text: "Atlas, start diagnosis on CHILLER-A-03." },
  {
    time: "14:42:13",
    speaker: "Atlas",
    text: "Guide loaded. Sentinel flagged CHW supply at 11.2°C. Begin refrigerant circuit inspection.",
  },
  {
    time: "14:43:02",
    speaker: "You",
    text: "High-side: 380 PSI. Low-side: 58 PSI. Flow rate shows 61 GPM.",
  },
  {
    time: "14:43:15",
    speaker: "Atlas",
    text: "Readings logged. Triton forecast: q50 breach in 16 min. Consistent with refrigerant undercharge. Check compressor contactor next.",
  },
];

// ── Circular progress ring ─────────────────────────────────
function ProgressRing({ pct, size = 52 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg
      width={size}
      height={size}
      className="flex-shrink-0 -rotate-90"
      role="img"
      aria-label={`Progress ${pct}%`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={pct === 100 ? "#34d399" : "#f59e0b"}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.32,0.72,0,1)" }}
      />
    </svg>
  );
}

export default function ActiveJob() {
  const navigate = useNavigate();
  const job = jobs[0];
  const asset = assets.find((a) => a.id === job.assetId);

  const [steps, setSteps] = useState(job.steps);
  const [voiceActive, setVoice] = useState(false);
  const [cameraActive, setCamera] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = completedCount === steps.length;
  const progressPct = (completedCount / steps.length) * 100;

  function toggleStep(id: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-6 min-h-[100dvh] flex flex-col">
      {/* ── Back ── */}
      <button
        type="button"
        onClick={() => navigate("/tech")}
        className="flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-white mb-5 transition-colors group fade-up"
      >
        <ArrowLeft
          size={13}
          weight="light"
          className="group-hover:-translate-x-0.5 transition-transform duration-200"
        />
        My Jobs
      </button>

      {/* ── Job header card ── */}
      <div
        className="p-[1.5px] bg-white/[0.015] rounded-2xl ring-1 ring-white/[0.06] mb-4 fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <div className="bg-[#0a0a0a] rounded-[14px] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-start justify-between">
            {/* Left: title + meta */}
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-[0.14em]">
                  Critical
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-[0.14em]">
                  On-Site
                </span>
              </div>
              <h1 className="text-[14px] font-semibold leading-snug text-white">{job.title}</h1>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                {asset?.name} · {asset?.zone}
              </p>

              {/* SLA below title */}
              <div className="flex items-center gap-2 mt-2.5">
                <p className="text-[10px] text-zinc-600 font-medium">SLA remaining</p>
                <p className="text-[18px] font-semibold text-amber-400 tabular-nums font-mono leading-none">
                  23m
                </p>
              </div>
            </div>

            {/* Right: circular progress */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="relative">
                <ProgressRing pct={progressPct} size={52} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`text-[11px] font-bold font-mono tabular-nums ${allDone ? "text-emerald-400" : "text-white"}`}
                  >
                    {completedCount}/{steps.length}
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-zinc-600 font-mono">steps</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Safety banner ── */}
      <div
        className="p-[1.5px] rounded-xl bg-emerald-500/[0.05] ring-1 ring-emerald-500/18 mb-4 fade-up"
        style={{ animationDelay: "100ms" }}
      >
        <div className="bg-emerald-500/[0.03] rounded-[10px] px-3.5 py-2.5 flex items-center gap-2.5">
          <Shield size={13} weight="light" className="text-emerald-400 flex-shrink-0" />
          <p className="text-[12px] text-emerald-300 font-medium">
            Safety state verified — safe to proceed
          </p>
          <span className="ml-auto text-[10px] text-emerald-700 font-medium">Camera confirmed</span>
        </div>
      </div>

      {/* ── Voice / Camera controls ── */}
      <div className="grid grid-cols-2 gap-2.5 mb-4 fade-up" style={{ animationDelay: "140ms" }}>
        <button
          type="button"
          onClick={() => setVoice(!voiceActive)}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[12px] font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
            voiceActive
              ? "bg-red-500/12 border-red-500/30 text-red-300 ring-1 ring-red-500/18"
              : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          <Microphone
            size={14}
            weight={voiceActive ? "fill" : "light"}
            className={voiceActive ? "status-pulse-red" : ""}
          />
          {voiceActive ? "Listening…" : "Voice Guide"}
        </button>
        <button
          type="button"
          onClick={() => setCamera(!cameraActive)}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[12px] font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
            cameraActive
              ? "bg-blue-500/12 border-blue-500/28 text-blue-300"
              : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          <Camera size={14} weight={cameraActive ? "fill" : "light"} />
          {cameraActive ? "Camera On" : "Camera AR"}
        </button>
      </div>

      {/* ── AR Camera view ── */}
      {cameraActive && (
        <div className="p-[1.5px] bg-white/[0.015] rounded-2xl ring-1 ring-blue-500/18 mb-4 fade-up">
          <div
            className="bg-[#080808] rounded-[14px] overflow-hidden relative"
            style={{ height: "150px" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 border-2 border-emerald-400/65 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full status-pulse" />
                </div>
                <p className="text-[12px] text-emerald-400 font-semibold">
                  CHILLER-A-03 identified
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  Trane CGAM-090 Chiller · LOTO confirmed
                </p>
              </div>
            </div>
            {(
              ["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"] as const
            ).map((pos) => (
              <div
                key={pos}
                className={`absolute w-4 h-4 ${pos}`}
                style={{
                  borderTop: pos.includes("top") ? "1.5px solid rgba(52,211,153,0.55)" : "none",
                  borderBottom: pos.includes("bottom")
                    ? "1.5px solid rgba(52,211,153,0.55)"
                    : "none",
                  borderLeft: pos.includes("left") ? "1.5px solid rgba(52,211,153,0.55)" : "none",
                  borderRight: pos.includes("right") ? "1.5px solid rgba(52,211,153,0.55)" : "none",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Voice log ── */}
      {voiceActive && (
        <div className="p-[1.5px] bg-white/[0.015] rounded-xl ring-1 ring-white/[0.06] mb-4 fade-up">
          <div className="bg-[#080808] rounded-[10px] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-1 h-1 rounded-full bg-red-400 status-pulse-red" />
              <p className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold">
                Voice Log
              </p>
            </div>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {voiceLog.map((l) => (
                <div key={`${l.time}-${l.speaker}`} className="flex items-start gap-2.5">
                  <span className="text-[10px] text-zinc-700 font-mono flex-shrink-0">
                    {l.time}
                  </span>
                  <span
                    className={`text-[10px] font-semibold flex-shrink-0 w-8 ${l.speaker === "Atlas" ? "text-blue-400" : "text-zinc-500"}`}
                  >
                    {l.speaker}
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{l.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Checklist ── */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold">
            Step-by-Step Guide
          </p>
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Book size={11} weight="light" />
            Manual
          </button>
        </div>

        {showManual && (
          <div className="p-[1.5px] bg-white/[0.015] rounded-xl ring-1 ring-white/[0.06] mb-3 fade-up">
            <div className="bg-[#080808] rounded-[10px] p-3.5">
              <p className="text-[11px] font-semibold text-zinc-300 mb-1.5">
                Cooling Unit — Refrigerant Circuit Inspection
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Ensure unit is powered off and LOTO applied. Attach gauges to service ports. Normal
                pressures at 75°F: high 300–350 PSI, low 60–70 PSI. Values outside range indicate
                imbalance or valve fault.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {steps.map((step, idx) => (
            <button
              type="button"
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`w-full flex items-start gap-3.5 px-4 py-3.5 rounded-xl border text-[12px] text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] fade-up ${
                step.completed
                  ? "border-emerald-500/14 bg-emerald-500/[0.04] text-zinc-600"
                  : "border-white/[0.07] bg-white/[0.02] text-zinc-200 hover:bg-white/[0.04] hover:border-white/[0.1]"
              }`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {step.completed ? (
                <CheckCircle
                  size={15}
                  weight="fill"
                  className="text-emerald-400 flex-shrink-0 mt-0.5"
                />
              ) : (
                <Circle size={15} weight="light" className="text-zinc-700 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={`leading-relaxed ${step.completed ? "line-through decoration-zinc-700" : ""}`}
                >
                  {step.label}
                </span>
                {!step.completed && idx === steps.findIndex((s) => !s.completed) && (
                  <span className="ml-2 text-[9px] text-blue-400 font-semibold uppercase tracking-wide">
                    Current
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Complete CTA ── */}
      {allDone && (
        <div className="mt-5 fade-up">
          <button
            type="button"
            onClick={() => navigate("/tech/closeout")}
            className="w-full group flex items-center justify-center gap-2.5 bg-white text-black text-[13px] font-semibold py-3.5 rounded-xl hover:bg-zinc-100 transition-all duration-200 active:scale-[0.98]"
          >
            Complete Job
            <span className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200">
              <ArrowRight size={11} weight="bold" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
