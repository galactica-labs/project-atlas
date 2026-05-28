import { useEffect, useState } from "react";

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  initialDelay?: number;
  charDelay?: number;
}

export default function AnimatedHeading({
  text,
  className = "",
  initialDelay = 200,
  charDelay = 30,
}: AnimatedHeadingProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), initialDelay);
    return () => clearTimeout(timer);
  }, [initialDelay]);

  const lines = text.split("\n").map((line, lineIndex, allLines) => {
    const lineOffset = allLines.slice(0, lineIndex).reduce((acc, l) => acc + l.length, 0);

    return {
      id: `line-${lineIndex}-${line}`,
      line,
      lineOffset,
      chars: line.split("").map((char, charIndex) => ({
        id: `char-${lineIndex}-${charIndex}-${char}`,
        char,
        delay: (lineOffset + charIndex) * charDelay,
      })),
    };
  });

  return (
    <h1 className={className} style={{ letterSpacing: "-0.04em" }}>
      {lines.map((line) => {
        return (
          <span key={line.id} style={{ display: "block" }}>
            {line.chars.map(({ id, char, delay }) => {
              return (
                <span
                  key={id}
                  style={{
                    display: "inline-block",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(-18px)",
                    transition: `opacity 500ms ${delay}ms, transform 500ms ${delay}ms`,
                  }}
                >
                  {char === " " ? " " : char}
                </span>
              );
            })}
          </span>
        );
      })}
    </h1>
  );
}
