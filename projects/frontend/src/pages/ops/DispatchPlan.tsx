import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Wrench,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { assets, technicians } from "../../data/mock";
import { getRequiredCerts, scoreMatch } from "../../models/hermes";
import { useApp } from "../../store/appStore";

export default function DispatchPlan() {
  const navigate = useNavigate();
  const { jobs, incidents } = useApp();
  const job = jobs[0];
  const asset = assets.find((a) => a.id === job?.assetId);
  const tech = technicians.find((t) => t.id === job?.technicianId) ?? technicians[0];
  const incident = incidents.find((i) => i.id === job?.incidentId);

  const required = asset ? getRequiredCerts(asset) : [];
  const matchScore = Math.round(scoreMatch(tech, required) * 100);

  const planStats = [
    { label: "Generated in", value: "0.8s", sub: "automatic" },
    { label: "Candidates", value: String(technicians.length), sub: "evaluated" },
    { label: "Match score", value: `${matchScore}%`, sub: "optimal fit" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 min-h-full">
      {/* ── Back ── */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-white mb-7 transition-colors duration-200 group fade-up"
      >
        <ArrowLeft
          size={13}
          weight="light"
          className="group-hover:-translate-x-0.5 transition-transform duration-200"
        />
        Back
      </button>

      {/* ── Title row ── */}
      <div
        className="flex items-start justify-between flex-wrap gap-3 mb-6 fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-zinc-600 mb-1">
            Dispatch Plan
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight">{job.title}</h1>
          <p className="text-[12px] text-zinc-600 mt-0.5">
            Generated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className="px-3 py-1.5 bg-amber-500/[0.07] border border-amber-500/20 text-amber-300 text-[11px] font-semibold rounded-xl">
          Awaiting approval
        </span>
      </div>

      {/* ── Stats bento ── */}
      <div className="grid grid-cols-3 gap-2.5 mb-5 fade-up" style={{ animationDelay: "80ms" }}>
        {planStats.map((s) => (
          <div
            key={s.label}
            className="p-[1.5px] bg-white/[0.015] rounded-xl ring-1 ring-white/[0.06]"
          >
            <div className="bg-[#0a0a0a] rounded-[10px] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="text-[22px] font-semibold tracking-tighter tabular-nums text-white leading-none">
                {s.value}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1.5">{s.label}</p>
              <p className="text-[10px] text-zinc-700">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Technician card ── */}
      <div
        className="p-[1.5px] bg-white/[0.015] rounded-2xl ring-1 ring-white/[0.06] mb-4 fade-up"
        style={{ animationDelay: "120ms" }}
      >
        <div className="bg-[#0a0a0a] rounded-[14px] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold mb-4">
            Assigned Technician
          </p>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 ring-1 ring-white/[0.08] flex items-center justify-center text-[13px] font-bold text-zinc-200 flex-shrink-0">
              {tech.avatar}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-[14px] font-semibold text-white">{tech.name}</h3>
                <span className="text-[10px] bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                  Available
                </span>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-zinc-500 mb-3">
                <span className="flex items-center gap-1">
                  <MapPin size={11} weight="light" />
                  {tech.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} weight="light" />
                  ETA {tech.eta}
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {tech.certifications.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] bg-white/[0.04] border border-white/[0.07] text-zinc-400 px-2 py-0.5 rounded-full"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-zinc-600 mb-0.5">Match</p>
              <p className="text-[26px] font-semibold text-emerald-400 tabular-nums tracking-tighter leading-none">
                {matchScore}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Job details ── */}
      <div
        className="p-[1.5px] bg-white/[0.015] rounded-2xl ring-1 ring-white/[0.06] mb-4 fade-up"
        style={{ animationDelay: "160ms" }}
      >
        <div className="bg-[#0a0a0a] rounded-[14px] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold mb-4">
            Job Details
          </p>
          <div className="flex items-start gap-3 mb-4">
            <Wrench size={14} weight="light" className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-[13px] font-semibold text-white">{job.title}</h3>
              <p className="text-[12px] text-zinc-500 mt-1 leading-relaxed">{job.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.05]">
            <div>
              <p className="text-[10px] text-zinc-600 mb-1">Asset</p>
              <p className="text-[13px] font-medium text-white">{asset?.name}</p>
              <p className="text-[11px] text-zinc-600">{asset?.zone}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 mb-1">SLA window</p>
              <p className="text-[13px] font-semibold text-amber-300">
                {incident?.ttf ?? 23} min remaining
              </p>
              <p className="text-[11px] text-zinc-600">High criticality</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Parts ── */}
      <div
        className="p-[1.5px] bg-white/[0.015] rounded-2xl ring-1 ring-white/[0.06] mb-4 fade-up"
        style={{ animationDelay: "200ms" }}
      >
        <div className="bg-[#0a0a0a] rounded-[14px] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <Package size={13} weight="light" className="text-zinc-500" />
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold">
              Parts Required
            </p>
          </div>
          <div className="space-y-2.5">
            {job.partsRequired.map((part) => (
              <div key={part} className="flex items-center gap-3 text-[12px]">
                <CheckCircle size={14} weight="fill" className="text-emerald-400 flex-shrink-0" />
                <span className="text-zinc-300 flex-1">{part}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">In stock</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Route ── */}
      <div
        className="p-[1.5px] bg-white/[0.015] rounded-2xl ring-1 ring-white/[0.06] mb-6 fade-up"
        style={{ animationDelay: "240ms" }}
      >
        <div
          className="bg-[#0a0a0a] rounded-[14px] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          style={{ height: "140px" }}
        >
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold mb-3">
            Route
          </p>
          <div className="relative h-[80px]">
            <svg aria-hidden="true" className="absolute inset-0 w-full h-full">
              <circle cx="8%" cy="50%" r="5" fill="#10b981" />
              <line
                x1="8%"
                y1="50%"
                x2="92%"
                y2="50%"
                stroke="rgba(16,185,129,0.25)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <circle cx="92%" cy="50%" r="5" fill="#ef4444" />
            </svg>
            <div className="absolute left-[5%] bottom-0 text-[10px] text-zinc-600">
              {tech.location}
            </div>
            <div className="absolute right-[3%] bottom-0 text-[10px] text-zinc-600">
              {asset?.zone ?? "Target"}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-center">
              <span className="font-mono text-[11px] text-zinc-400 block">2.1 km</span>
              <span className="text-[10px] text-zinc-600">ETA {tech.eta}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="flex gap-3 fade-up" style={{ animationDelay: "280ms" }}>
        <button
          type="button"
          onClick={() => navigate("/supervisor")}
          className="flex-1 group flex items-center justify-center gap-2.5 bg-white text-black text-[13px] font-semibold py-3.5 rounded-xl hover:bg-zinc-100 transition-all duration-200 active:scale-[0.98]"
        >
          Request Approval
          <span className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200">
            <ArrowRight size={11} weight="bold" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/tech")}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] text-white text-[13px] font-medium py-3.5 rounded-xl hover:bg-white/[0.07] transition-all duration-200 active:scale-[0.98]"
        >
          Technician View
        </button>
      </div>
    </div>
  );
}
