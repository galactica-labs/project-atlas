export type ZoneVariant =
  | "a"
  | "b"
  | "mechanical"
  | "electrical"
  | "power"
  | "cooling"
  | "compute"
  | "network";

export interface ZoneConfig {
  y: number;
  height: number;
  zone: ZoneVariant;
  label: string;
}

export interface FloorConfig {
  label: string;
  subtitle: string;
  shortLabel: string;
  indicatorColor: string;
  zones: Record<string, ZoneConfig>;
}

export type FloorKey = "Mechanical" | "Hall A" | "Hall B";

export const DATACENTER_FLOORS: Record<FloorKey, FloorConfig> = {
  Mechanical: {
    label: "B1 - Mechanical Plant",
    subtitle: "Power / Cooling Infrastructure",
    shortLabel: "B1",
    indicatorColor: "bg-amber-500",
    zones: {
      Electrical: {
        y: 20,
        height: 200,
        zone: "electrical",
        label: "Electrical - Switchgear & Transformers",
      },
      "Backup Power": {
        y: 300,
        height: 200,
        zone: "power",
        label: "Backup Power - UPS & Generators",
      },
      "Chiller Plant": {
        y: 580,
        height: 400,
        zone: "cooling",
        label: "Chiller Plant - Chillers, Towers & Pumps",
      },
    },
  },
  "Hall A": {
    label: "F1 - Data Hall A",
    subtitle: "Primary Compute / CPU",
    shortLabel: "F1",
    indicatorColor: "bg-blue-500",
    zones: {
      "Cooling Bay A": {
        y: 20,
        height: 180,
        zone: "cooling",
        label: "Cooling Bay A - CRAH Units",
      },
      "Compute Row A": {
        y: 280,
        height: 280,
        zone: "compute",
        label: "Compute Row A - CPU Server Racks",
      },
      "Compute Row B": {
        y: 640,
        height: 280,
        zone: "compute",
        label: "Compute Row B - GPU Pods & Racks",
      },
      "Power & Network A": {
        y: 1000,
        height: 160,
        zone: "network",
        label: "Power & Network A - PDUs & Core Switches",
      },
    },
  },
  "Hall B": {
    label: "F2 - Data Hall B",
    subtitle: "HPC / GPU Cluster",
    shortLabel: "F2",
    indicatorColor: "bg-emerald-500",
    zones: {
      "Cooling Bay B": {
        y: 20,
        height: 180,
        zone: "cooling",
        label: "Cooling Bay B - CRAH Units",
      },
      "Compute Row C": {
        y: 280,
        height: 280,
        zone: "compute",
        label: "Compute Row C - GPU Pods",
      },
      "Compute Row D": {
        y: 640,
        height: 280,
        zone: "compute",
        label: "Compute Row D - Rack Compute",
      },
      "Power & Network B": {
        y: 1000,
        height: 160,
        zone: "network",
        label: "Power & Network B - PDUs & Dist. Switches",
      },
    },
  },
};

export const ZONE_INDICATOR_COLORS: Record<string, string> = {
  electrical: "bg-yellow-400",
  power: "bg-orange-400",
  cooling: "bg-sky-400",
  compute: "bg-emerald-400",
  network: "bg-violet-400",
  mechanical: "bg-amber-400",
  a: "bg-blue-400",
  b: "bg-emerald-400",
};

export const ZONE_SURFACE_COLORS: Record<
  ZoneVariant,
  {
    edge: string;
    fill: string;
    glow: string;
    text: string;
  }
> = {
  electrical: {
    edge: "#facc15",
    fill: "rgba(250, 204, 21, 0.08)",
    glow: "rgba(250, 204, 21, 0.16)",
    text: "#fde68a",
  },
  power: {
    edge: "#fb923c",
    fill: "rgba(251, 146, 60, 0.08)",
    glow: "rgba(251, 146, 60, 0.18)",
    text: "#fdba74",
  },
  cooling: {
    edge: "#38bdf8",
    fill: "rgba(56, 189, 248, 0.08)",
    glow: "rgba(56, 189, 248, 0.16)",
    text: "#7dd3fc",
  },
  compute: {
    edge: "#34d399",
    fill: "rgba(52, 211, 153, 0.08)",
    glow: "rgba(52, 211, 153, 0.16)",
    text: "#86efac",
  },
  network: {
    edge: "#a78bfa",
    fill: "rgba(167, 139, 250, 0.08)",
    glow: "rgba(167, 139, 250, 0.18)",
    text: "#c4b5fd",
  },
  mechanical: {
    edge: "#f59e0b",
    fill: "rgba(245, 158, 11, 0.08)",
    glow: "rgba(245, 158, 11, 0.18)",
    text: "#fcd34d",
  },
  a: {
    edge: "#60a5fa",
    fill: "rgba(96, 165, 250, 0.08)",
    glow: "rgba(96, 165, 250, 0.16)",
    text: "#93c5fd",
  },
  b: {
    edge: "#34d399",
    fill: "rgba(52, 211, 153, 0.08)",
    glow: "rgba(52, 211, 153, 0.16)",
    text: "#86efac",
  },
};
