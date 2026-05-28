import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) => {
  const [selected, setSelected] = React.useState(defaultValue ?? "");
  const current = value ?? selected;
  const _set = onValueChange ?? setSelected;
  return (
    <div className={className} data-tabs-root data-value={current}>
      {children}
    </div>
  );
};

const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    role="tablist"
    className={cn(
      "flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl ring-1 ring-white/[0.06]",
      className
    )}
  >
    {children}
  </div>
);

const TabsTrigger = ({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <button
    type="button"
    role="tab"
    data-value={value}
    className={cn(
      "px-3 py-1.5 text-[12px] font-medium rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors duration-200 data-[state=active]:bg-white/[0.08] data-[state=active]:text-white",
      className
    )}
  >
    {children}
  </button>
);

const TabsContent = ({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div data-tab-content data-value={value} className={className}>
    {children}
  </div>
);

export { Tabs, TabsContent, TabsList, TabsTrigger };
