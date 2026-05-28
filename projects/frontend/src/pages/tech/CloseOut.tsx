import { ArrowLeft, Camera, CaretRight, CheckCircle, Package } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jobs } from "../../data/mock";

const rootCauses = [
  "Refrigerant undercharge — slow leak at CHW circuit fitting",
  "Compressor motor overload — capacitor failure, 97% load sustained",
  "Expansion valve failure — TXV stuck closed, CHW flow restriction",
  "Condenser fouling — airflow restriction causing CHW supply temp rise",
];

export default function CloseOut() {
  const navigate = useNavigate();
  const job = jobs[0];
  const [rootCause, setRootCause] = useState("");
  const [partsUsed, setPartsUsed] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function togglePart(part: string) {
    setPartsUsed((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  }

  function submit() {
    if (!rootCause || partsUsed.length === 0) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-5 py-8 flex flex-col items-center justify-center min-h-[100dvh] text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 ring-1 ring-emerald-500/25 flex items-center justify-center mx-auto mb-5 fade-up">
          <CheckCircle size={32} weight="fill" className="text-emerald-400" />
        </div>
        <h2
          className="text-2xl font-semibold tracking-tight mb-1 fade-up"
          style={{ animationDelay: "60ms" }}
        >
          Work Order Closed
        </h2>
        <p className="text-[13px] text-zinc-500 mb-0.5 fade-up" style={{ animationDelay: "100ms" }}>
          WO-{job.id.toUpperCase()}
        </p>
        <p className="text-[11px] text-zinc-700 mb-8 fade-up" style={{ animationDelay: "140ms" }}>
          Root cause logged · Parts confirmed · Audit record created
        </p>

        {/* Mnemos training tuple card */}
        <div
          className="w-full p-[1.5px] bg-violet-500/[0.06] rounded-2xl ring-1 ring-violet-500/22 mb-3 fade-up"
          style={{ animationDelay: "180ms" }}
        >
          <div className="bg-zinc-950 rounded-[14px] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 status-pulse" />
              <p className="text-[13px] font-semibold text-violet-300">
                Mnemos · Training tuple captured
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              TrainingTuple(anomaly_signal, triage_report, dispatch, outcome) submitted to federated
              model registry. Improves Sentinel detection on CHILLER-class assets facility-wide.
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-zinc-700">tuple_id:</span>
              <span className="text-[9px] font-mono text-violet-600">
                tt-a03-{job.id}-{Date.now().toString(36).slice(-6)}
              </span>
            </div>
          </div>
        </div>

        {/* Learning card */}
        <div
          className="w-full p-[1.5px] bg-blue-500/[0.06] rounded-2xl ring-1 ring-blue-500/18 mb-3 fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <div className="bg-zinc-950 rounded-[14px] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 status-pulse" />
              <p className="text-[13px] font-semibold text-blue-300">Federated model updated</p>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Outcome data contributes to shared detection model across all Atlas-connected
              facilities
            </p>
          </div>
        </div>

        {/* Audit card */}
        <div
          className="w-full p-[1.5px] bg-emerald-500/[0.04] rounded-2xl ring-1 ring-emerald-500/15 mb-7 fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="bg-zinc-950 rounded-[14px] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-[13px] font-semibold text-emerald-300">
                SHA-256 audit record created
              </p>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Root cause, parts used, and repair timeline committed to tamper-evident hash-chained
              audit ledger
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/tech")}
          className="w-full flex items-center justify-center gap-2 bg-white text-black text-[13px] font-semibold py-3.5 rounded-xl hover:bg-zinc-100 transition-all duration-200 active:scale-[0.98] group fade-up"
          style={{ animationDelay: "320ms" }}
        >
          Back to Jobs
          <span className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200">
            <CaretRight size={11} weight="bold" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-6 overflow-y-auto min-h-[100dvh]">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-white mb-6 transition-colors fade-up"
      >
        <ArrowLeft size={13} weight="light" /> Active Job
      </button>

      <div className="mb-6 fade-up" style={{ animationDelay: "40ms" }}>
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-zinc-600">
          Work Order · {job.id.toUpperCase()}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Close-Out Form</h1>
        <p className="text-[13px] text-zinc-600 mt-0.5">CHILLER-A-03 · Mechanical Zone</p>
      </div>

      {/* Root cause */}
      <div className="mb-6 fade-up" style={{ animationDelay: "80ms" }}>
        <p className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold mb-3">
          Root Cause <span className="text-red-400 normal-case tracking-normal">*</span>
        </p>
        <div className="space-y-2">
          {rootCauses.map((rc) => (
            <button
              type="button"
              key={rc}
              onClick={() => setRootCause(rc)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-[12px] transition-all duration-200 active:scale-[0.99] ${
                rootCause === rc
                  ? "border-blue-500/35 bg-blue-500/[0.08] text-white ring-1 ring-blue-500/20"
                  : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
              }`}
            >
              {rc}
            </button>
          ))}
        </div>
      </div>

      {/* Parts used */}
      <div className="mb-6 fade-up" style={{ animationDelay: "140ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <Package size={12} weight="light" className="text-zinc-500" />
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold">
            Parts Used <span className="text-red-400 normal-case tracking-normal">*</span>
          </p>
        </div>
        <div className="space-y-2">
          {job.partsRequired.map((part) => (
            <button
              type="button"
              key={part}
              onClick={() => togglePart(part)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-[12px] transition-all duration-200 active:scale-[0.99] ${
                partsUsed.includes(part)
                  ? "border-emerald-500/25 bg-emerald-500/[0.07] text-white"
                  : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]"
              }`}
            >
              <CheckCircle
                size={14}
                weight={partsUsed.includes(part) ? "fill" : "light"}
                className={partsUsed.includes(part) ? "text-emerald-400" : "text-zinc-700"}
              />
              {part}
            </button>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div className="mb-7 fade-up" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <Camera size={12} weight="light" className="text-zinc-500" />
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-semibold">
            Photo Documentation
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square p-[1.5px] bg-white/[0.02] rounded-xl ring-1 ring-white/[0.06]"
            >
              <div className="bg-zinc-950 rounded-[10px] h-full flex items-center justify-center">
                {i <= 2 ? (
                  <div className="text-center">
                    <Camera size={14} weight="light" className="text-zinc-700 mx-auto mb-1" />
                    <p className="text-[10px] text-zinc-700">Photo {i}</p>
                  </div>
                ) : (
                  <span className="text-zinc-700 text-xl leading-none">+</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!rootCause || partsUsed.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-white text-black text-[13px] font-semibold py-3.5 rounded-xl hover:bg-zinc-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] group fade-up"
        style={{ animationDelay: "260ms" }}
      >
        Close Work Order
        <span className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200">
          <CaretRight size={11} weight="bold" />
        </span>
      </button>
    </div>
  );
}
