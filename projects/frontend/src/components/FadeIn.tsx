import { type ReactNode, useEffect, useState } from "react";

interface FadeInProps {
  delay?: number;
  duration?: number;
  children: ReactNode;
  className?: string;
}

export default function FadeIn({
  delay = 0,
  duration = 1000,
  children,
  className = "",
}: FadeInProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
