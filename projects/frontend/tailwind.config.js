/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist Variable", "Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      colors: {
        border: "rgba(255,255,255,0.07)",
        input: "rgba(255,255,255,0.10)",
        ring: "rgba(255,255,255,0.20)",
        background: "#050505",
        foreground: "#fafafa",
        card: { DEFAULT: "#0f0f0f", foreground: "#fafafa" },
        popover: { DEFAULT: "#0a0a0a", foreground: "#fafafa" },
        primary: { DEFAULT: "#fafafa", foreground: "#050505" },
        secondary: { DEFAULT: "#1a1a1a", foreground: "#fafafa" },
        muted: { DEFAULT: "#1a1a1a", foreground: "#71717a" },
        accent: { DEFAULT: "#1a1a1a", foreground: "#fafafa" },
        destructive: { DEFAULT: "#ef4444", foreground: "#fafafa" },
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.32,0.72,0,1) forwards",
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.32,0.72,0,1) forwards",
        "status-pulse": "status-pulse 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
