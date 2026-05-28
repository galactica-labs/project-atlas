import {
  ArrowLeft,
  ArrowRight,
  Book,
  Camera,
  CheckCircle,
  Circle,
  Cpu,
  Desktop,
  FloppyDiskBack,
  Microphone,
  PaperPlaneTilt,
  Shield,
  SpeakerHigh,
  Stop,
  Wrench,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTechnicianRealtime } from "../../hooks/useTechnicianRealtime";

const serviceChecklist = [
  {
    id: "bench-intake",
    label: "Confirm unit on bench and capture serial number sticker before opening chassis.",
  },
  {
    id: "power-safe",
    label: "Disconnect AC power and all peripherals, then drain residual power with one button press.",
  },
  {
    id: "panel-open",
    label: "Release access panel and remove front bezel to expose memory and drive cage area.",
  },
  {
    id: "memory-check",
    label: "Inspect DIMM seating, populate black sockets first, and reseat memory if POST issue persists.",
  },
  {
    id: "storage-check",
    label: "Verify primary drive is on dark blue SATA0 or confirm M.2 SSD retention screw is secure.",
  },
  {
    id: "cmos-path",
    label: "If BIOS corruption suspected, clear CMOS with AC removed and restore date, time, and setup values.",
  },
  {
    id: "diagnostics",
    label: "Boot to HP PC Hardware Diagnostics with Esc then F2 and record any failure ID.",
  },
];

const statusConfig = {
  active: {
    badge: "bg-emerald-500/16 border-emerald-500/30 text-emerald-300",
    dot: "bg-emerald-400",
  },
  connecting: {
    badge: "bg-amber-500/14 border-amber-500/28 text-amber-300",
    dot: "bg-amber-400",
  },
  idle: {
    badge: "bg-zinc-900/80 border-white/[0.08] text-zinc-400",
    dot: "bg-zinc-500",
  },
} as const;

function ProgressRing({ pct, size = 56 }: { pct: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90" role="img" aria-label={`Progress ${pct}%`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={pct === 100 ? "#34d399" : "#60a5fa"}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.35s ease" }}
      />
    </svg>
  );
}

export default function ActiveJob() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState(() =>
    serviceChecklist.map((step, index) => ({
      ...step,
      completed: index < 2,
    }))
  );
  const [showManual, setShowManual] = useState(true);
  const [textInput, setTextInput] = useState("");
  const {
    audioRef,
    error,
    events,
    isActive,
    isConnecting,
    isMuted,
    lastTaskResult,
    messages,
    noiseSuppression,
    sendText,
    startSession,
    status,
    stopSession,
    toggleMute,
    toolCall,
    videoRef,
  } = useTechnicianRealtime({
    assetName: "HP EliteDesk 800 G3 SFF",
    engineerId: "eng-1",
    engineerName: "Marcus Chen",
    jobTitle: "HP Bench Triage - Power and POST validation",
    taskHint: "access panel, DIMM reseat, SATA0, CMOS reset, diagnostics",
  });

  const completedCount = steps.filter((step) => step.completed).length;
  const allDone = completedCount === steps.length;
  const progressPct = (completedCount / steps.length) * 100;
  const currentManual = lastTaskResult?.found ? lastTaskResult : null;

  function toggleStep(id: string) {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, completed: !step.completed } : step))
    );
  }

  function handleSendText() {
    sendText(textInput);
    setTextInput("");
  }

  const tone = isActive ? statusConfig.active : isConnecting ? statusConfig.connecting : statusConfig.idle;

  return (
    <div className="min-h-[100dvh] bg-[#050505] px-4 py-4 md:px-6 md:py-5">
      <div className="mx-auto flex max-w-[1540px] flex-col gap-4">
        <div className="flex items-center justify-between gap-3 fade-up">
          <button
            type="button"
            onClick={() => navigate("/tech")}
            className="flex items-center gap-1.5 text-[12px] text-zinc-600 hover:text-white transition-colors group"
          >
            <ArrowLeft size={13} weight="light" className="group-hover:-translate-x-0.5 transition-transform duration-200" />
            My Jobs
          </button>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-zinc-600">
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-300">Bench Job</span>
            <span>HP SFF workflow</span>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(380px,0.72fr)]">
          <section className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_78%_18%,rgba(16,185,129,0.1),transparent_22%),linear-gradient(180deg,#0d0d0d_0%,#070707_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 md:px-6">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.16em]">Bench triage</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-[0.16em]">Hardware guided</span>
                </div>
                <h1 className="text-[24px] md:text-[30px] font-semibold tracking-tight text-white leading-tight">
                  HP EliteDesk 800 G3 SFF - power and POST recovery workflow
                </h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-zinc-400">
                  Camera-led bench assist for access panel removal, DIMM reseat, SATA path validation,
                  CMOS reset, and diagnostics capture.
                </p>
              </div>

              <div className="hidden md:flex flex-col items-center gap-1 rounded-[22px] border border-white/[0.06] bg-black/20 px-4 py-3">
                <div className="relative">
                  <ProgressRing pct={progressPct} size={60} />
                  <div className="absolute inset-0 flex items-center justify-center text-[12px] font-bold font-mono text-white">
                    {completedCount}/{steps.length}
                  </div>
                </div>
                <span className="text-[9px] uppercase tracking-[0.14em] text-zinc-600">Checklist</span>
              </div>
            </div>

            <div className="grid gap-4 p-4 md:p-5">
              <div className="relative min-h-[460px] overflow-hidden rounded-[24px] border border-white/[0.06] bg-black xl:min-h-[720px] 2xl:min-h-[780px]">
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

                <div className="absolute left-4 top-4 z-10">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md ${tone.badge}`}>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${tone.dot} ${isActive || isConnecting ? "animate-pulse" : ""}`} />
                    {status}
                  </span>
                </div>

                {isActive ? (
                  <div className="absolute right-4 top-4 z-10 flex items-center gap-2 flex-wrap justify-end">
                    {toolCall ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-300 backdrop-blur-md animate-pulse">
                        {toolCall}
                      </span>
                    ) : null}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium backdrop-blur-md ${
                        noiseSuppression
                          ? "border-cyan-500/30 bg-cyan-500/20 text-cyan-300"
                          : "border-zinc-700/40 bg-zinc-800/60 text-zinc-500"
                      }`}
                    >
                      {noiseSuppression ? "Noise clean" : "Noise off"}
                    </span>
                  </div>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                  <div className="rounded-[24px] border border-white/[0.06] bg-black/55 p-4 backdrop-blur-md">
                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/18 bg-blue-500/10 text-blue-300">
                            <Desktop size={18} weight="duotone" />
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Unit under service</p>
                            <p className="text-[14px] font-semibold text-white">HP EliteDesk 800 G3 SFF</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Aim camera at rear I/O, access panel lever, DIMM bank, SATA0 path, or CMOS area.
                          Atlas bench guide will switch steps based on what technician asks for.
                        </p>
                      </div>

                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => void startSession()}
                          disabled={isConnecting}
                          className="h-14 shrink-0 rounded-full bg-green-600 px-7 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500"
                        >
                          {isConnecting ? "Connecting..." : "Start Session"}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={toggleMute}
                            className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition-all active:scale-95 ${
                              isMuted
                                ? "bg-red-500/80 text-white hover:bg-red-400/80"
                                : "border border-zinc-600/40 bg-zinc-800/70 text-zinc-200 hover:bg-zinc-700/70"
                            }`}
                            title={isMuted ? "Unmute microphone" : "Mute microphone"}
                          >
                            <Microphone size={18} weight={isMuted ? "light" : "fill"} />
                          </button>
                          <button
                            type="button"
                            onClick={stopSession}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600/80 text-white transition-all active:scale-95 hover:bg-red-500/80"
                            title="End session"
                          >
                            <Stop size={18} weight="fill" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!isActive && !isConnecting ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/72 pointer-events-none">
                    <div className="mb-4 text-5xl">📷</div>
                    <p className="text-sm text-zinc-300">Start session for live desktop bench guidance</p>
                    <p className="mt-1 text-xs text-zinc-500">Camera + mic feed routed into technician assist panel</p>
                  </div>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#0a0a0a]/84">
                <div className="border-b border-white/[0.06] px-4 py-4 md:px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench size={14} weight="duotone" className="text-blue-300" />
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Checklist</p>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-[15px] font-semibold text-white">Bench actions</h2>
                      <p className="mt-1 text-[11px] text-zinc-500">Follow manual-backed hardware sequence.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[18px] font-semibold font-mono text-blue-300 leading-none">{completedCount}/{steps.length}</p>
                      <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-zinc-600">completed</p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="px-3 py-3 md:px-4 md:py-4 max-h-[340px] xl:max-h-[300px]">
                  <div className="grid gap-2 xl:grid-cols-2">
                    {steps.map((step, index) => {
                      const current = !step.completed && index === steps.findIndex((item) => !item.completed);

                      return (
                        <button
                          type="button"
                          key={step.id}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => toggleStep(step.id)}
                          aria-pressed={step.completed}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
                            step.completed
                              ? "border-emerald-500/18 bg-emerald-500/[0.05] text-zinc-500"
                              : "border-white/[0.07] bg-white/[0.02] text-zinc-200 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {step.completed ? (
                              <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-emerald-400" />
                            ) : (
                              <Circle size={16} weight="light" className="mt-0.5 shrink-0 text-zinc-700" />
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Step {index + 1}</span>
                                {current ? (
                                  <span className="rounded-full border border-blue-500/24 bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-300">
                                    Current
                                  </span>
                                ) : null}
                              </div>
                              <p className={`mt-1 text-[12px] leading-relaxed ${step.completed ? "line-through decoration-zinc-700" : "text-zinc-200"}`}>
                                {step.label}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </section>

          <aside className="flex min-h-[620px] flex-col gap-4">
            <section className="rounded-[28px] border border-white/[0.07] bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
              <div className="border-b border-white/[0.06] px-4 py-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-white">Conversation</h2>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {messages.length === 0 ? "Bench voice + text will land here" : `${messages.length} message${messages.length === 1 ? "" : "s"}`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Events</p>
                  <p className="mt-1 text-[13px] font-semibold text-zinc-300">{events.length}</p>
                </div>
              </div>

              {error ? (
                <div className="mx-4 mt-4 rounded-xl border border-red-500/24 bg-red-500/[0.05] px-3 py-2 text-[11px] text-red-300">
                  Error: {error}
                </div>
              ) : null}

              <ScrollArea className="min-h-0 flex-1 px-4 py-4 max-h-[340px] space-y-3">
                {messages.length === 0 ? (
                  <div className="flex h-[220px] flex-col items-center justify-center gap-3 text-center text-zinc-600">
                    <span className="text-2xl">💬</span>
                    <span className="text-[12px]">Voice and text messages will appear here</span>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-[12px] leading-relaxed ${
                          message.role === "user"
                            ? "rounded-br-md bg-blue-600 text-white"
                            : message.role === "system"
                              ? "rounded-bl-md border border-purple-500/20 bg-purple-500/15 text-purple-300"
                              : "rounded-bl-md bg-zinc-800 text-zinc-200"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <span className="mb-0.5 block text-[10px] font-medium text-zinc-500">Assistant</span>
                        ) : null}
                        {message.text}
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>

              <div className="border-t border-white/[0.06] px-4 py-4 flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(event) => setTextInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSendText();
                    }
                  }}
                  placeholder="Ask about DIMMs, SATA0, CMOS reset, rear ports, password jumper..."
                  className="h-11 flex-1 rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSendText}
                  disabled={!textInput.trim() || !isActive}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-all active:scale-95 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500"
                  title="Send message"
                >
                  <PaperPlaneTilt size={16} weight="fill" />
                </button>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/[0.07] bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Manual context</p>
                  <h3 className="mt-1 text-[15px] font-semibold text-white">
                    {currentManual?.title ?? "Awaiting manual lookup"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowManual((current) => !current)}
                  className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Book size={12} weight="light" />
                  {showManual ? "Hide" : "Show"}
                </button>
              </div>

              {showManual ? (
                currentManual ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-[11px] text-zinc-400 leading-relaxed">
                      {currentManual.summary}
                    </div>
                    <div className="rounded-2xl border border-blue-500/16 bg-blue-500/[0.05] px-3 py-3 text-[11px] text-blue-200">
                      {currentManual.sourceSection}
                    </div>
                    <div className="space-y-2">
                      {currentManual.steps.slice(0, 4).map((step: string, index: number) => (
                        <div
                          key={`${currentManual.title}-${step}`}
                          className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2.5 text-[11px] text-zinc-300 leading-relaxed"
                        >
                          <span className="mr-2 font-semibold text-blue-400">{index + 1}.</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-[12px] text-zinc-500 leading-relaxed">
                    Start session and ask for one specific hardware action. Good prompts: "remove access panel",
                    "rear ports", "upgrade memory", "clear bios", or "run diagnostics".
                  </div>
                )
              ) : null}
            </section>

            <section className="rounded-[28px] border border-white/[0.07] bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4">
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <SpeakerHigh size={14} weight="duotone" className="text-blue-300" />
                    <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Voice</span>
                  </div>
                  <p className="mt-2 text-[12px] font-semibold text-white">{isActive ? "Live duplex" : "Standby"}</p>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Camera size={14} weight="duotone" className="text-emerald-300" />
                    <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Camera</span>
                  </div>
                  <p className="mt-2 text-[12px] font-semibold text-white">{isActive ? "Streaming bench view" : "Idle"}</p>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Cpu size={14} weight="duotone" className="text-violet-300" />
                    <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">Manual source</span>
                  </div>
                  <p className="mt-2 text-[12px] font-semibold text-white">HP EliteDesk 800 G3 SFF</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-500/18 bg-emerald-500/[0.05] px-3 py-3 flex items-center gap-2.5">
                <Shield size={13} weight="light" className="text-emerald-400 shrink-0" />
                <p className="text-[11px] text-emerald-300 font-medium">
                  AC disconnect and static discharge required before chassis-open steps.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-[10px] text-zinc-600 flex items-center gap-2">
                <FloppyDiskBack size={12} weight="duotone" className="text-zinc-500 shrink-0" />
                Nest endpoints and generated API types drive this panel. Manual-backed guidance routes through realtime tool calls.
              </div>

              {allDone ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/tech/closeout")}
                    className="w-full group flex items-center justify-center gap-2.5 rounded-2xl bg-white py-3.5 text-[13px] font-semibold text-black transition-all duration-200 active:scale-[0.98] hover:bg-zinc-100"
                  >
                    Complete Job
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-black/10 transition-transform duration-200 group-hover:translate-x-0.5">
                      <ArrowRight size={11} weight="bold" />
                    </span>
                  </button>
                </div>
              ) : null}
            </section>
          </aside>
        </div>

        <audio ref={audioRef} autoPlay className="hidden" />
      </div>
    </div>
  );
}
