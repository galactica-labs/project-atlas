import { CaretDown } from "@phosphor-icons/react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value: string;
  onChange: (v: string) => void;
  close: () => void;
  toggle: () => void;
}>({ value: "", onChange: () => {}, close: () => {}, toggle: () => {} });

const Select = ({ value, onValueChange, children, className }: SelectProps) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <SelectContext.Provider
      value={{
        value,
        onChange: onValueChange,
        close: () => setOpen(false),
        toggle: () => setOpen((o) => !o),
      }}
    >
      <div ref={ref} className={cn("relative", className)}>
        {children}
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0a0a0a] rounded-xl ring-1 ring-white/[0.08] shadow-xl py-1 overflow-hidden">
            {React.Children.map(
              children,
              (c) => (c as React.ReactElement<{ children?: React.ReactNode }>)?.props?.children
            )}
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { toggle } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex items-center justify-between w-full px-3 py-2 text-[12px] text-zinc-300 bg-white/[0.03] rounded-lg ring-1 ring-white/[0.07] hover:ring-white/[0.12] transition-all duration-200",
        className
      )}
    >
      {children}
      <CaretDown size={10} className="text-zinc-600 ml-2" />
    </button>
  );
};

const SelectContent = ({
  children,
  className: _className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <>{children}</>;

const SelectItem = ({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { onChange, close } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => {
        onChange(value);
        close();
      }}
      className={cn(
        "w-full text-left px-3 py-2 text-[12px] text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors duration-150",
        className
      )}
    >
      {children}
    </button>
  );
};

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = React.useContext(SelectContext);
  return <span>{value || placeholder}</span>;
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
