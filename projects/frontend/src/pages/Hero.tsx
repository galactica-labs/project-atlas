import type { IconProps } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  ChartBar,
  CheckCircle,
  GitBranch,
  Lock,
  Shield,
  Truck,
  Warning,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── open-source video & photos (Pexels / Unsplash CC0) ──────────────
const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4";

// Taylor Vick — Unsplash (free commercial use)
const DC_PHOTO =
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=2400&q=80";

// imgix — Unsplash circuit board
const CIRCUIT_PHOTO =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=80";

// ─── types ────────────────────────────────────────────────────────────
type IconComponent = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

// ─── hooks ────────────────────────────────────────────────────────────
function useScrolled(threshold = 50) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, ...options }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [options]);
  return { ref, inView };
}

function useCounter(target: number, duration = 1800, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - (1 - p) ** 3; // ease-out-cubic
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, active]);
  return val;
}

// ─── data ─────────────────────────────────────────────────────────────
const NAV_LINKS = ["Platform", "Industries", "Security", "Docs"];
const navLinkHref = (link: string) => `#${link.toLowerCase()}`;

const AGENTS: {
  name: string;
  role: string;
  desc: string;
  stat: string;
  grad: string;
  dot: string;
  ring: string;
  Icon: IconComponent;
}[] = [
  {
    name: "Sentinel",
    role: "Anomaly Detection",
    desc: "Watches every sensor in real time. When something starts to go wrong, it knows — in milliseconds, not hours. False alarms reduce with every retraining cycle.",
    stat: "23ms detection",
    grad: "from-orange-500/15 to-orange-950/5",
    dot: "bg-orange-400",
    ring: "ring-orange-500/20",
    Icon: ChartBar,
  },
  {
    name: "Triton",
    role: "Impact Analysis",
    desc: "Maps how a single failure ripples through your infrastructure. Identifies which assets are at risk, in what order, and with how much time left to act.",
    stat: "Full cascade map",
    grad: "from-red-500/15 to-red-950/5",
    dot: "bg-red-400",
    ring: "ring-red-500/20",
    Icon: Warning,
  },
  {
    name: "Hephaestus",
    role: "Decision Engine",
    desc: "Weighs every option against your rules and risk tolerance. Recommends the right action — repair, dispatch, or hold — with a full explanation every time.",
    stat: "99.1% policy match",
    grad: "from-violet-500/15 to-violet-950/5",
    dot: "bg-violet-400",
    ring: "ring-violet-500/20",
    Icon: Shield,
  },
  {
    name: "Hermes",
    role: "Smart Dispatch",
    desc: "Finds the best technician for every job — matching skills, location, and parts availability — in seconds. No manual coordination, no guesswork.",
    stat: "<2s assignment",
    grad: "from-blue-500/15 to-blue-950/5",
    dot: "bg-blue-400",
    ring: "ring-blue-500/20",
    Icon: Truck,
  },
  {
    name: "Mnemos",
    role: "Continuous Learning",
    desc: "Learns from every incident your team closes. The more Atlas works with you, the better it gets at predicting — and preventing — the next failure.",
    stat: "Always improving",
    grad: "from-cyan-500/15 to-cyan-950/5",
    dot: "bg-cyan-400",
    ring: "ring-cyan-500/20",
    Icon: Brain,
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Connect",
    body: "Atlas connects to your existing sensors and equipment. Every device is discovered and catalogued automatically — no manual setup required.",
  },
  {
    n: "02",
    title: "Understand",
    body: "Atlas translates thousands of cryptic sensor names into plain, structured data. Your team only reviews the handful that need a human decision.",
  },
  {
    n: "03",
    title: "Learn",
    body: "A short observation period builds a unique baseline for every asset in your facility. No manual configuration. Atlas learns what normal looks like.",
  },
  {
    n: "04",
    title: "Detect",
    body: "Anomalies surface in milliseconds, not hours. The longer Atlas runs, the fewer false alarms your team has to deal with.",
  },
  {
    n: "05",
    title: "Predict",
    body: "When something starts to fail, Atlas maps the full picture — which other systems are at risk, in what order, and how much time you have.",
  },
  {
    n: "06",
    title: "Act",
    body: "The right technician is dispatched automatically. Anything that carries real risk pauses for a human sign-off before it executes.",
  },
];

const GOVERNANCE = [
  {
    Icon: Lock,
    title: "Hash-chained audit ledger",
    body: "Every agent action, every human decision, every override. SHA-256 chained and tamper-evident. Auto-verified hourly via Postgres trigger.",
  },
  {
    Icon: CheckCircle,
    title: "Human-in-the-loop gateway",
    body: "Risky actions pause at policy-defined gates. Telegram / Slack approval with full reasoning trace. Mandatory reason for every override.",
  },
  {
    Icon: GitBranch,
    title: "Autonomy expansion via decision memory",
    body: "Approve the same class of action five times and Atlas proposes auto-approving it — with HITL sign-off on the promotion itself.",
  },
];

const COMPLIANCE = ["ISO 55000", "NERC CIP", "SEMI S2", "SOC 2 Type II", "ISO 27001"];

const TICKER_ITEMS = [
  "23ms mean detection latency",
  "94.2% dispatch accuracy",
  "847 global deployments",
  "$9M max outage cost prevented",
  "73% reduction in unplanned downtime",
  "<90s mean time-to-dispatch",
  "50+ federated learning sites",
  "NERC CIP compliant",
];
const TICKER_LOOP_ITEMS = [
  ...TICKER_ITEMS.map((item) => ({ key: `first-${item}`, item })),
  ...TICKER_ITEMS.map((item) => ({ key: `second-${item}`, item })),
];

// ─── sub-components ───────────────────────────────────────────────────

function Orb({ className }: { className: string }) {
  return <div className={`absolute rounded-full pointer-events-none ${className}`} />;
}

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-3 py-1 rounded-full bg-white/5 ring-1 ring-white/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-white/45 mb-5">
      {children}
    </span>
  );
}

function BezelCard({
  children,
  className = "",
  outerClass = "",
}: {
  children: React.ReactNode;
  className?: string;
  outerClass?: string;
}) {
  return (
    <div
      className={`p-[6px] rounded-[1.75rem] bg-white/[0.025] ring-1 ring-white/[0.07] ${outerClass}`}
    >
      <div
        className={`bg-[#080808] rounded-[calc(1.75rem-6px)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] h-full ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

// ─── ROI counter block ────────────────────────────────────────────────
function RoiCounter({
  target,
  prefix,
  suffix,
  label,
  active,
  delay,
}: {
  target: number;
  prefix: string;
  suffix: string;
  label: string;
  active: boolean;
  delay: number;
}) {
  const val = useCounter(target, 2000, active);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);

  return (
    <div
      className="transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      <p className="text-[clamp(2.5rem,5vw,4rem)] font-semibold tracking-[-0.05em] leading-none tabular-nums">
        {prefix}
        {val.toLocaleString()}
        <span className="text-white/30">{suffix}</span>
      </p>
      <p className="text-[13px] text-white/35 leading-snug mt-2 max-w-[180px]">{label}</p>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────
export default function Hero() {
  const navigate = useNavigate();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);

  // section refs
  const howRef = useInView();
  const agentsRef = useInView();
  const roiRef = useInView();
  const govRef = useInView();
  const ctaRef = useInView();

  // prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const rv = (inView: boolean, i: number) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.7s cubic-bezier(0.32,0.72,0,1) ${i * 80}ms, transform 0.7s cubic-bezier(0.32,0.72,0,1) ${i * 80}ms`,
  });

  return (
    <div className="relative w-full bg-[#050505] text-white overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 pt-4">
        <nav
          className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{
            background: scrolled ? "rgba(5,5,5,0.85)" : "transparent",
            backdropFilter: scrolled ? "blur(24px)" : "none",
            WebkitBackdropFilter: scrolled ? "blur(24px)" : "none",
            boxShadow: scrolled ? "inset 0 0 0 1px rgba(255,255,255,0.07)" : "none",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[7px] bg-white flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 bg-black rounded-[3px]" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Atlas</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={navLinkHref(link)}
                className="text-[13px] text-white/45 hover:text-white/90 font-medium transition-colors duration-300"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[13px] text-white/45 hover:text-white/80 font-medium px-4 py-2 transition-colors duration-300"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 bg-white text-black text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-zinc-100 active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group"
            >
              Get started
              <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <ArrowRight size={10} weight="bold" />
              </span>
            </button>
          </div>

          {/* Hamburger */}
          <button
            type="button"
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-[5px] relative z-[60]"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <span
              className="block h-px bg-white origin-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                width: 20,
                transform: menuOpen ? "rotate(45deg) translateY(3px)" : "none",
              }}
            />
            <span
              className="block h-px bg-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                width: 20,
                opacity: menuOpen ? 0 : 1,
                transform: menuOpen ? "scaleX(0)" : "none",
              }}
            />
            <span
              className="block h-px bg-white origin-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                width: 20,
                transform: menuOpen ? "rotate(-45deg) translateY(-3px)" : "none",
              }}
            />
          </button>
        </nav>

        {/* Mobile full-screen menu */}
        <div
          className="md:hidden fixed inset-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? "auto" : "none" }}
        >
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-[#020202]/95"
            style={{ backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)" }}
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-9">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link}
                href={navLinkHref(link)}
                onClick={() => setMenuOpen(false)}
                className="text-4xl font-semibold tracking-tight transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? "translateY(0)" : "translateY(20px)",
                  transitionDelay: menuOpen ? `${i * 60 + 80}ms` : "0ms",
                }}
              >
                {link}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate("/login");
              }}
              className="mt-4 flex items-center gap-2.5 bg-white text-black text-base font-semibold px-8 py-4 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(20px)",
                transitionDelay: menuOpen ? "320ms" : "0ms",
              }}
            >
              Get started <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative w-full min-h-[100dvh] flex flex-col overflow-hidden">
        {/* Video bg */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.45 }}
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
        />

        {/* gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/75 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 to-transparent pointer-events-none" />

        {/* ambient orbs */}
        <Orb className="top-1/4 left-1/3 w-[700px] h-[700px] bg-blue-700/8 blur-[140px] drift" />
        <Orb className="bottom-1/3 right-1/4 w-[500px] h-[500px] bg-violet-700/6 blur-[120px] drift-slow" />

        {/* scan line */}
        <div className="scan-line" />

        {/* content */}
        <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 md:px-10 lg:px-14">
          <div className="flex-1 flex flex-col justify-end pb-16 lg:pb-24">
            {/* eyebrow */}
            <div
              className="inline-flex items-center gap-2.5 mb-6 fade-up"
              style={{ animationDelay: "100ms" }}
            >
              <span className="px-3 py-1 rounded-full bg-white/8 ring-1 ring-white/12 text-[10px] uppercase tracking-[0.2em] font-semibold text-white/55">
                Infrastructure OS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
              <span className="text-[11px] text-emerald-400 font-medium tracking-wide">
                Live · 847 Facilities
              </span>
            </div>

            {/* headline */}
            <h1
              className="text-[clamp(3rem,8vw,5.5rem)] font-semibold tracking-[-0.04em] leading-[0.93] mb-6 max-w-4xl fade-up"
              style={{ animationDelay: "180ms" }}
            >
              The infrastructure OS
              <br />
              <span className="text-white/30">for AI-era</span>
              <br />
              data centers.
            </h1>

            {/* subhead + CTAs + stats */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
              <div>
                <p
                  className="text-[15px] text-white/45 leading-relaxed max-w-sm mb-8 fade-up"
                  style={{ animationDelay: "300ms" }}
                >
                  Predict failures before they cascade. Dispatch the right technician in seconds.
                  Learn from every incident — automatically.
                </p>

                <div className="flex flex-wrap gap-3 fade-up" style={{ animationDelay: "400ms" }}>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-2.5 bg-white text-black text-[13px] font-semibold px-5 py-3 rounded-full hover:bg-zinc-100 active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group"
                  >
                    Enter platform
                    <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      <ArrowRight size={11} weight="bold" />
                    </span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 bg-white/5 ring-1 ring-white/10 text-white text-[13px] font-medium px-5 py-3 rounded-full hover:bg-white/10 active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group"
                  >
                    Watch demo
                    <span className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      <ArrowUpRight size={11} weight="light" />
                    </span>
                  </button>
                </div>
              </div>

              {/* stats */}
              <div className="flex items-end gap-10 fade-up" style={{ animationDelay: "500ms" }}>
                {[
                  { val: "23ms", label: "Mean detection latency" },
                  { val: "94.2%", label: "Dispatch accuracy" },
                  { val: "847", label: "Global deployments" },
                ].map((s) => (
                  <div key={s.label} className="text-right">
                    <p className="text-[1.85rem] font-semibold tracking-[-0.04em] leading-none tabular-nums">
                      {s.val}
                    </p>
                    <p className="text-[11px] text-white/30 font-medium mt-1.5 max-w-[100px] leading-snug text-right">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 fade-in"
          style={{ animationDelay: "900ms" }}
        >
          <span className="text-[9px] uppercase tracking-[0.25em] text-white/20 font-semibold">
            Scroll
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-white/25 to-transparent" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TICKER
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden border-y border-white/5 py-4 bg-white/[0.015]">
        <div className="ticker-track flex gap-12 w-max">
          {TICKER_LOOP_ITEMS.map(({ key, item }) => (
            <div key={key} className="flex items-center gap-12 shrink-0">
              <span className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] whitespace-nowrap">
                {item}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/15" />
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section ref={howRef.ref} className="py-32 lg:py-44">
        <div className="max-w-6xl mx-auto px-6">
          {/* heading */}
          <div style={rv(howRef.inView, 0)} className="mb-20">
            <SectionBadge>The Platform</SectionBadge>
            <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.035em] leading-[1.07] max-w-lg">
              From raw telemetry
              <br />
              <span className="text-white/30">to autonomous action.</span>
            </h2>
          </div>

          {/* 6-step bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.n} style={rv(howRef.inView, i + 1)}>
                <BezelCard className="p-7 flex flex-col gap-5 group hover:bg-[#0d0d0d] transition-colors duration-500">
                  <span className="font-mono text-[10px] text-white/15 tracking-[0.2em]">
                    {item.n}
                  </span>
                  <div>
                    <h3 className="text-[18px] font-semibold tracking-tight mb-2 group-hover:text-white transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-white/38 leading-relaxed">{item.body}</p>
                  </div>
                </BezelCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          DATA CENTER PHOTO BREAK
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-[40vh] min-h-[280px] overflow-hidden">
        <img
          src={DC_PHOTO}
          alt="Data center infrastructure"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-[#050505]/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-[clamp(1.1rem,3vw,1.8rem)] font-semibold tracking-[-0.02em] text-white/70 max-w-2xl mx-auto leading-snug">
              "One prevented outage pays for a decade of Atlas."
            </p>
            <p className="text-[12px] text-white/30 mt-3 font-medium">
              — Atlas founding pitch deck
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          FIVE AGENTS
      ══════════════════════════════════════════════════════════════ */}
      <section ref={agentsRef.ref} className="py-32 lg:py-44 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div style={rv(agentsRef.inView, 0)} className="mb-20">
            <SectionBadge>The Agents</SectionBadge>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.035em] leading-[1.07] max-w-lg">
                Five specialised agents.
                <br />
                <span className="text-white/30">One autonomous system.</span>
              </h2>
              <p className="text-[14px] text-white/35 max-w-xs leading-relaxed lg:text-right">
                Each agent specialises in a critical phase of infrastructure intelligence — working
                together as a seamless, autonomous system.
              </p>
            </div>
          </div>

          {/* bento — 5 cards, last one spans 2 on medium */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AGENTS.map((agent, i) => {
              const Icon = agent.Icon;
              return (
                <div
                  key={agent.name}
                  style={rv(agentsRef.inView, i + 1)}
                  className={i === 4 ? "md:col-span-2 lg:col-span-1" : ""}
                >
                  <div
                    className={`p-[6px] rounded-[1.75rem] bg-gradient-to-br ${agent.grad} ring-1 ${agent.ring} group hover:scale-[1.01] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] h-full`}
                  >
                    <div className="bg-[#070707] rounded-[calc(1.75rem-6px)] p-7 flex flex-col gap-5 h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] group-hover:bg-[#0c0c0c] transition-colors duration-500">
                      {/* header row */}
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.grad} ring-1 ${agent.ring} flex items-center justify-center`}
                        >
                          <Icon size={19} weight="light" className="text-white/65" />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.dot}`} />
                          <span className="text-[10px] font-mono text-white/25 tracking-wide">
                            {agent.stat}
                          </span>
                        </div>
                      </div>

                      {/* identity */}
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.18em] text-white/25 font-semibold mb-0.5">
                          {agent.role}
                        </p>
                        <h3 className="text-[20px] font-semibold tracking-tight">{agent.name}</h3>
                      </div>

                      {/* description */}
                      <p className="text-[13px] text-white/38 leading-relaxed mt-auto">
                        {agent.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ROI
      ══════════════════════════════════════════════════════════════ */}
      <section
        ref={roiRef.ref}
        className="relative py-32 lg:py-44 border-t border-white/5 overflow-hidden"
      >
        {/* circuit board image as bg texture */}
        <img
          src={CIRCUIT_PHOTO}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.04] pointer-events-none"
          loading="lazy"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 to-[#050505]/80 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
            {/* left copy */}
            <div style={rv(roiRef.inView, 0)}>
              <SectionBadge>The Economics</SectionBadge>
              <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.035em] leading-[1.07] mb-6">
                One prevented incident.
                <br />
                <span className="text-white/30">A decade of Atlas paid.</span>
              </h2>
              <p className="text-[14px] text-white/40 leading-relaxed mb-8 max-w-sm">
                A single major outage can cost millions per hour. Atlas converts the hidden costs —
                over-sized redundancy, unnecessary maintenance, SLA penalties — into a measurable
                line item, then eliminates them.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex items-center gap-2.5 bg-white text-black text-[13px] font-semibold px-5 py-3 rounded-full hover:bg-zinc-100 active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group w-fit"
              >
                Calculate your ROI
                <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <ArrowRight size={11} weight="bold" />
                </span>
              </button>
            </div>

            {/* right counters */}
            <div className="grid grid-cols-2 gap-8">
              <RoiCounter
                target={9}
                prefix="$"
                suffix="M/hr"
                label="Max outage cost per hyperscale incident"
                active={roiRef.inView}
                delay={100}
              />
              <RoiCounter
                target={73}
                prefix=""
                suffix="%"
                label="Reduction in unplanned downtime — first year"
                active={roiRef.inView}
                delay={250}
              />
              <RoiCounter
                target={90}
                prefix=""
                suffix="s"
                label="Mean time-to-dispatch including MILP solve"
                active={roiRef.inView}
                delay={400}
              />
              <RoiCounter
                target={847}
                prefix=""
                suffix=""
                label="Deployments globally learning from each other"
                active={roiRef.inView}
                delay={550}
              />
            </div>
          </div>

          {/* invisible cost grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-5 gap-3" style={rv(roiRef.inView, 5)}>
            {[
              {
                label: "Over-provisioned redundancy",
                desc: "N+2 instead of N+1 because you don't trust your predictions",
              },
              {
                label: "Conservative maintenance",
                desc: "Replacing healthy parts on schedule because you can't tell which are failing",
              },
              { label: "SLA penalties", desc: "When something slips through the cracks" },
              { label: "Insurance premiums", desc: "Priced for opacity — not actual risk" },
              { label: "Senior engineer hours", desc: "Triaging alerts a system should triage" },
            ].map((item) => (
              <BezelCard key={item.label} className="p-5">
                <p className="text-[11px] font-semibold text-white/50 mb-1.5 leading-snug">
                  {item.label}
                </p>
                <p className="text-[11px] text-white/25 leading-relaxed">{item.desc}</p>
              </BezelCard>
            ))}
          </div>
          <p className="text-center text-[12px] text-white/25 mt-4 italic">
            The customer is already paying for these. Atlas makes them visible, then eliminates
            them.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          GOVERNANCE
      ══════════════════════════════════════════════════════════════ */}
      <section ref={govRef.ref} className="py-32 lg:py-44 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div style={rv(govRef.inView, 0)} className="mb-20">
            <SectionBadge>Governance</SectionBadge>
            <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.035em] leading-[1.07] max-w-lg">
              Autonomous, but never
              <br />
              <span className="text-white/30">unaccountable.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {GOVERNANCE.map((g, i) => {
              const Icon = g.Icon;
              return (
                <div key={g.title} style={rv(govRef.inView, i + 1)}>
                  <BezelCard className="p-7 flex flex-col gap-5 h-full group hover:bg-[#0d0d0d] transition-colors duration-500">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/8 ring-1 ring-emerald-500/15 flex items-center justify-center shrink-0">
                      <Icon size={17} weight="light" className="text-emerald-400/80" />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-semibold tracking-tight mb-2">{g.title}</h3>
                      <p className="text-[13px] text-white/38 leading-relaxed">{g.body}</p>
                    </div>
                  </BezelCard>
                </div>
              );
            })}
          </div>

          {/* compliance strip */}
          <div style={rv(govRef.inView, 4)}>
            <BezelCard
              outerClass="rounded-2xl"
              className="rounded-[calc(1rem)] px-6 py-4 flex flex-wrap items-center justify-between gap-4"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/25">
                Compliance frameworks
              </p>
              <div className="flex flex-wrap gap-2">
                {COMPLIANCE.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 rounded-full bg-white/4 ring-1 ring-white/8 text-[11px] text-white/35 font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </BezelCard>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section
        ref={ctaRef.ref}
        className="py-36 lg:py-48 border-t border-white/5 relative overflow-hidden"
      >
        <Orb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-700/5 blur-[160px] drift-slow" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div style={rv(ctaRef.inView, 0)}>
            <SectionBadge>Get started</SectionBadge>
            <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold tracking-[-0.04em] leading-[0.95] mb-6">
              Ready to eliminate
              <br />
              <span className="text-white/25">unplanned downtime?</span>
            </h2>
            <p className="text-[15px] text-white/38 leading-relaxed mb-10 max-w-md mx-auto">
              The setup isn't overhead — it's encoding tribal knowledge you're about to lose, and
              earning an autonomous system you can actually trust.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex items-center gap-2.5 bg-white text-black text-[13px] font-semibold px-6 py-3.5 rounded-full hover:bg-zinc-100 active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group"
              >
                Enter platform
                <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <ArrowRight size={11} weight="bold" />
                </span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2.5 bg-white/5 ring-1 ring-white/10 text-white text-[13px] font-medium px-6 py-3.5 rounded-full hover:bg-white/8 active:scale-[0.97] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                Talk to sales
                <span className="w-6 h-6 rounded-full bg-white/8 flex items-center justify-center">
                  <ArrowUpRight size={11} weight="light" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[6px] bg-white flex items-center justify-center">
              <div className="w-2 h-2 bg-black rounded-[2px]" />
            </div>
            <span className="text-[13px] font-semibold">Atlas</span>
          </div>
          <p className="text-[11px] text-white/18">
            Infrastructure OS for AI-era data centers. © 2026 Atlas Systems, Inc.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Security", "Status"].map((link) => (
              <a
                key={link}
                href={navLinkHref(link)}
                className="text-[11px] text-white/22 hover:text-white/55 transition-colors duration-300"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
