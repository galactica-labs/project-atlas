import { ArrowRight, Lightning, UserCircle, Wrench } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store/appStore";

const DC_PHOTO =
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=2400&q=80";

const roles = [
  {
    id: "ops" as const,
    label: "Operations Manager",
    desc: "Command center, incident management, dispatch oversight",
    icon: Lightning,
    accent: "blue",
  },
  {
    id: "supervisor" as const,
    label: "Supervisor",
    desc: "Approve critical actions, review decisions, oversee your team",
    icon: UserCircle,
    accent: "amber",
  },
  {
    id: "tech" as const,
    label: "Technician",
    desc: "View assigned jobs, follow guided repair steps, close work orders",
    icon: Wrench,
    accent: "emerald",
  },
] as const;

const accentMap = {
  blue: {
    ring: "ring-blue-500/40",
    bg: "bg-blue-500/[0.07]",
    dot: "bg-blue-400",
    text: "text-blue-400",
  },
  amber: {
    ring: "ring-amber-500/40",
    bg: "bg-amber-500/[0.07]",
    dot: "bg-amber-400",
    text: "text-amber-400",
  },
  emerald: {
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-500/[0.07]",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
  },
};

export default function Login() {
  const { setRole } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"ops" | "supervisor" | "tech">("ops");

  function enter() {
    setRole(selected);
    const dest = selected === "ops" ? "/ops" : selected === "supervisor" ? "/supervisor" : "/tech";
    navigate(dest);
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] flex">
      {/* Left panel — atmospheric photo */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <img
          src={DC_PHOTO}
          alt="Infrastructure"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/20 via-transparent to-[#050505]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/30" />

        {/* Ambient orbs */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-violet-700/8 rounded-full blur-[100px] pointer-events-none" />

        {/* Tagline */}
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
            <span className="text-[11px] text-emerald-400 font-medium tracking-wide">
              Systems operational
            </span>
          </div>
          <h2 className="text-[2.4rem] font-semibold tracking-[-0.035em] leading-[1.08] text-white mb-4 max-w-sm">
            Infrastructure that
            <br />
            <span className="text-white/35">thinks ahead.</span>
          </h2>
          <p className="text-[14px] text-white/40 leading-relaxed max-w-xs">
            Predict failures. Dispatch the right person. Learn from every incident.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-[440px] flex flex-col items-center justify-center px-8 py-12 relative">
        {/* Subtle glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[340px]">
          {/* Brand */}
          <div className="mb-10 fade-up" style={{ animationDelay: "0ms" }}>
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-8 h-8 rounded-[9px] bg-white flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-[3px]" />
              </div>
              <span className="text-[16px] font-semibold tracking-tight">Atlas</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight text-white">Welcome back</h1>
            <p className="text-zinc-500 text-[13px] mt-1">Choose your role to continue</p>
          </div>

          {/* Role cards */}
          <div className="space-y-2.5 mb-6">
            {roles.map((r, i) => {
              const isSelected = selected === r.id;
              const a = accentMap[r.accent];
              const Icon = r.icon;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={`
                    w-full text-left p-[1.5px] rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.99] fade-up
                    ${
                      isSelected
                        ? `ring-1 ${a.ring} bg-white/[0.04]`
                        : "bg-white/[0.02] ring-1 ring-white/[0.06] hover:ring-white/[0.12]"
                    }
                  `}
                  style={{ animationDelay: `${100 + i * 80}ms` }}
                >
                  <div className={`rounded-[14px] px-4 py-3.5 ${isSelected ? a.bg : ""}`}>
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? `${a.bg} ring-1 ${a.ring}` : "bg-white/[0.04] ring-1 ring-white/[0.06]"}`}
                      >
                        <Icon
                          size={15}
                          weight="light"
                          className={isSelected ? a.text : "text-zinc-500"}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-[13px] font-semibold ${isSelected ? "text-white" : "text-zinc-300"}`}
                          >
                            {r.label}
                          </p>
                          {isSelected && <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />}
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">{r.desc}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sign in Button */}
          <button
            type="button"
            onClick={enter}
            className="w-full flex items-center justify-center gap-2.5 bg-white text-black text-[13px] font-semibold py-3.5 rounded-xl hover:bg-zinc-100 transition-all duration-200 active:scale-[0.98] group fade-up"
            style={{ animationDelay: "380ms" }}
          >
            Enter platform
            <span className="w-6 h-6 rounded-lg bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200">
              <ArrowRight size={12} weight="bold" />
            </span>
          </button>

          <p
            className="text-center text-[11px] text-zinc-700 mt-4 fade-up"
            style={{ animationDelay: "440ms" }}
          >
            Access is controlled by your organisation's admin
          </p>
        </div>
      </div>
    </div>
  );
}
