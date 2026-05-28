import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type TaskSeed = {
  id: string;
  title: string;
  keywords: string[];
  category: string;
  startMarker: string;
  endMarker: string;
};

type TaskDoc = {
  id: string;
  title: string;
  keywords: string[];
  category: string;
  content: string;
};

const inputPath =
  process.env.TASK_SOURCE_TEXT_PATH || join(process.cwd(), "rag/text/c05386798.txt");
const outputPath =
  process.env.TASK_DOCS_PATH || join(process.cwd(), "src/technician-assist/data/tasks.json");

const taskSeeds: TaskSeed[] = [
  {
    id: "front-panel-components",
    title: "Identify front panel components",
    keywords: [
      "front panel",
      "front ports",
      "usb front",
      "headphone jack",
      "power button",
      "sd card reader",
    ],
    category: "product-features",
    startMarker: "Front panel components",
    endMarker: "Rear panel components",
  },
  {
    id: "rear-panel-components",
    title: "Identify rear panel components",
    keywords: [
      "rear panel",
      "rear ports",
      "displayport",
      "rj45",
      "network jack",
      "power cord connector",
    ],
    category: "product-features",
    startMarker: "Rear panel components",
    endMarker: "Serial number location",
  },
  {
    id: "remove-access-panel",
    title: "Remove access panel",
    keywords: ["access panel", "open case", "open chassis", "remove side panel", "service cover"],
    category: "removal-and-replacement",
    startMarker: "Access panel",
    endMarker: "Front bezel",
  },
  {
    id: "remove-front-bezel",
    title: "Remove front bezel",
    keywords: ["front bezel", "remove bezel", "front cover", "bezel blank", "dust filter"],
    category: "removal-and-replacement",
    startMarker: "Front bezel",
    endMarker: "Slim optical drive bezel blank",
  },
  {
    id: "upgrade-memory",
    title: "Upgrade or reseat DDR4 memory",
    keywords: ["memory", "ram", "dimm", "reseat memory", "upgrade memory", "dimm1"],
    category: "removal-and-replacement",
    startMarker: "Memory",
    endMarker: " Expansion card",
  },
  {
    id: "install-expansion-card",
    title: "Remove or install expansion card",
    keywords: ["expansion card", "pcie", "graphics card", "add card", "remove card", "low profile"],
    category: "removal-and-replacement",
    startMarker: " Expansion card",
    endMarker: "Drives",
  },
  {
    id: "replace-3-5-drive",
    title: "Replace 3.5-inch hard drive",
    keywords: ["hard drive", "3.5 drive", "sata drive", "replace drive", "sata0", "primary drive"],
    category: "drives",
    startMarker: "Removing a 3.5-inch hard drive",
    endMarker: "Installing a 3.5-inch hard drive",
  },
  {
    id: "install-m2-ssd",
    title: "Install or replace M.2 SSD",
    keywords: ["m2", "ssd", "nvme", "storage card", "2280", "2230"],
    category: "drives",
    startMarker: "Removing and installing an M.2 SSD storage card",
    endMarker: "WLAN module",
  },
  {
    id: "reset-password-jumper",
    title: "Reset password jumper",
    keywords: [
      "password jumper",
      "clear password",
      "pswd",
      "forgot bios password",
      "administrator password",
    ],
    category: "security-and-cmos",
    startMarker: "Resetting the password jumper",
    endMarker: "Clearing and resetting the BIOS",
  },
  {
    id: "clear-bios-cmos",
    title: "Clear and reset BIOS CMOS",
    keywords: ["clear cmos", "reset bios", "cmos button", "factory defaults", "bios reset"],
    category: "security-and-cmos",
    startMarker: "Clearing and resetting the BIOS",
    endMarker: "Using HP PC Hardware Diagnostics (UEFI)",
  },
  {
    id: "run-hp-hardware-diagnostics",
    title: "Run HP PC Hardware Diagnostics UEFI",
    keywords: ["diagnostics", "uefi diagnostics", "hardware test", "press f2", "press esc"],
    category: "diagnostics",
    startMarker: "Using HP PC Hardware Diagnostics (UEFI)",
    endMarker: "Downloading HP PC Hardware Diagnostics (UEFI) to a USB device",
  },
];

function normalizeText(text: string) {
  return text
    .replace(/\f/g, "\n")
    .replace(/�/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSection(text: string, startMarker: string, endMarker: string) {
  const pattern = new RegExp(
    `${escapeRegExp(startMarker)}([\\s\\S]*?)${escapeRegExp(endMarker)}`,
    "i"
  );
  const match = text.match(pattern);

  if (!match) {
    throw new Error(`Could not extract section from "${startMarker}" to "${endMarker}"`);
  }

  return `${startMarker}${match[1]}`.trim();
}

function cleanSection(section: string) {
  return section
    .replace(/^\s*\d+\s+Chapter.*$/gm, "")
    .replace(/^\s*\d+\s+Appendix.*$/gm, "")
    .replace(/^\s*NOTE:\s*/gm, "Note: ")
    .replace(/\n\s*\d+\s+/g, "\n$&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toMarkdownContent(seed: TaskSeed, rawSection: string) {
  const lines = cleanSection(rawSection)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^\d+$/.test(line))
    .filter((line) => !/^[A-Za-z ]+ \d+$/.test(line));

  const body = lines.join("\n");
  return `## ${seed.title}\n\nSource: HP EliteDesk 800 G3 SFF Maintenance and Service Guide (${seed.startMarker}).\n\n${body}`;
}

function main() {
  const raw = readFileSync(inputPath, "utf8");
  const normalized = normalizeText(raw);

  const tasks: TaskDoc[] = taskSeeds.map((seed) => {
    const section = extractSection(normalized, seed.startMarker, seed.endMarker);
    return {
      id: seed.id,
      title: seed.title,
      keywords: seed.keywords,
      category: seed.category,
      content: toMarkdownContent(seed, section),
    };
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");

  console.log(`Wrote ${tasks.length} tasks to ${outputPath}`);
}

main();
