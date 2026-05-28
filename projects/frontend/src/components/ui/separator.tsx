import type * as React from "react";
import { cn } from "@/lib/utils";

const Separator = ({
  className,
  orientation = "horizontal",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }) => (
  <div
    className={cn(
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      "bg-white/[0.06] flex-shrink-0",
      className
    )}
    {...props}
  />
);

export { Separator };
