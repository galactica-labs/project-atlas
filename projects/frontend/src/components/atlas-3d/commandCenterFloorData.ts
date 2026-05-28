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
  purpose: string;
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
        label: "Electrical · Switchgear & Transformers",
        purpose: "Primary utility intake, switchgear, transformers",
      },
      "Backup Power": {
        y: 300,
        height: 200,
        zone: "power",
        label: "Backup Power · UPS & Generators",
        purpose: "Generator, UPS and battery failover",
      },
      "Chiller Plant": {
        y: 580,
        height: 400,
        zone: "cooling",
        label: "Chiller Plant · Chillers, Towers & Pumps",
        purpose: "Produces and circulates chilled water",
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
        label: "Cooling Bay A · CRAH Units",
        purpose: "Air handling and temperature control",
      },
      "Compute Row A": {
        y: 280,
        height: 280,
        zone: "compute",
        label: "Compute Row A · CPU Server Racks",
        purpose: "Primary CPU rack workload lane",
      },
      "Compute Row B": {
        y: 640,
        height: 280,
        zone: "compute",
        label: "Compute Row B · GPU Pods & Racks",
        purpose: "High-density GPU and overflow compute",
      },
      "Power & Network A": {
        y: 1000,
        height: 160,
        zone: "network",
        label: "Power & Network A · PDUs & Core Switches",
        purpose: "Rack distribution power and core switching",
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
        label: "Cooling Bay B · CRAH Units",
        purpose: "Air handling for the GPU hall",
      },
      "Compute Row C": {
        y: 280,
        height: 280,
        zone: "compute",
        label: "Compute Row C · GPU Pods",
        purpose: "GPU pod cluster under active load",
      },
      "Compute Row D": {
        y: 640,
        height: 280,
        zone: "compute",
        label: "Compute Row D · Rack Compute",
        purpose: "General compute rack lane",
      },
      "Power & Network B": {
        y: 1000,
        height: 160,
        zone: "network",
        label: "Power & Network B · PDUs & Dist. Switches",
        purpose: "Distribution power and aggregation switching",
      },
    },
  },
};

export const FLOOR_ZONE_RECTS: Record<
  FloorKey,
  Record<string, [number, number, number, number]>
> = {
  Mechanical: {
    Electrical: [2, 2, 98, 30],
    "Backup Power": [2, 33, 98, 61],
    "Chiller Plant": [2, 64, 98, 98],
  },
  "Hall A": {
    "Cooling Bay A": [2, 2, 98, 20],
    "Compute Row A": [2, 23, 98, 51],
    "Compute Row B": [2, 54, 98, 82],
    "Power & Network A": [2, 85, 98, 98],
  },
  "Hall B": {
    "Cooling Bay B": [2, 2, 98, 20],
    "Compute Row C": [2, 23, 98, 51],
    "Compute Row D": [2, 54, 98, 82],
    "Power & Network B": [2, 85, 98, 98],
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
