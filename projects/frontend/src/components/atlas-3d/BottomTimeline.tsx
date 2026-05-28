import { Info, Warning, XCircle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useCommandCenterStore } from "./commandCenterStore";
import type { TimelineEvent } from "./sceneTypes";

const ICON: Record<TimelineEvent["severity"], React.ElementType> = {
  info: Info,
  warning: Warning,
  critical: XCircle,
};

const COLOR: Record<TimelineEvent["severity"], string> = {
  info: "#71717a",
  warning: "#f59e0b",
  critical: "#ef4444",
};

export function BottomTimeline() {
  const timelineEvents = useCommandCenterStore((s) => s.timelineEvents);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  });

  return (
    <div className="h-full flex items-center bg-[#060606] border-t border-white/[0.05]">
      <div className="px-4 flex-shrink-0 border-r border-white/[0.05] h-full flex items-center">
        <p className="text-[8px] font-mono uppercase tracking-widest text-zinc-700">Timeline</p>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="px-4">
          <p className="text-[10px] text-zinc-800 font-mono">No events — run a simulation</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto flex items-center gap-3 px-4"
          style={{ scrollbarWidth: "none" }}
        >
          <AnimatePresence initial={false}>
            {timelineEvents.map((evt, i) => {
              const Icon = ICON[evt.severity];
              const color = COLOR[evt.severity];
              const isLast = i === timelineEvents.length - 1;
              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className={`flex items-center gap-2 flex-shrink-0 px-2.5 py-1.5 rounded-lg ${
                    isLast ? "bg-white/[0.04] ring-1 ring-white/[0.08]" : "bg-transparent"
                  }`}
                >
                  <Icon size={9} weight="fill" style={{ color }} />
                  <span className="text-[9px] font-mono text-zinc-500 tabular-nums">
                    {evt.timestamp}
                  </span>
                  <span className="text-[9px] text-zinc-400 max-w-[220px] truncate">
                    {evt.message}
                  </span>
                  {i < timelineEvents.length - 1 && (
                    <div className="w-4 h-px bg-white/[0.07] ml-1" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
