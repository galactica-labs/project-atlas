import * as React from "react";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number; indicatorClassName?: string }
>(({ className, value = 0, indicatorClassName, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative h-1 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}
    {...props}
  >
    <div
      className={cn(
        "h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
        indicatorClassName ?? "bg-blue-500"
      )}
      style={{ width: `${value}%` }}
    />
  </div>
));
Progress.displayName = "Progress";

export { Progress };
