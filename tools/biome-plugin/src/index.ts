import { dirname } from "node:path";
import {
  type CreateNodesContextV2,
  type CreateNodesV2,
  createNodesFromFiles,
  type TargetConfiguration,
} from "@nx/devkit";

export interface BiomePluginOptions {
  lintTargetName?: string;
  checkTargetName?: string;
  formatTargetName?: string;
}

export const createNodesV2: CreateNodesV2<BiomePluginOptions> = [
  "**/package.json",
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) =>
        createNodesInternal(configFile, options, context),
      configFiles,
      options,
      context,
    );
  },
];

async function createNodesInternal(
  configFilePath: string,
  options: BiomePluginOptions | undefined,
  _context: CreateNodesContextV2,
) {
  const root = dirname(configFilePath);

  // IMPORTANT: don't create a project at the workspace root
  if (root === ".") {
    return {};
  }

  const lintTargetName = options?.lintTargetName ?? "biome:lint";
  const checkTargetName = options?.checkTargetName ?? "biome:check";
  const formatTargetName = options?.formatTargetName ?? "biome:format";

  const targets: Record<string, TargetConfiguration> = {
    [lintTargetName]: {
      command: `bun biome lint {projectRoot}`,
      cache: true,
      inputs: [
        "default",
        "^default",
        "{workspaceRoot}/biome.json",
        "{projectRoot}/biome.json",
        { externalDependencies: ["@biomejs/biome"] },
      ],
      outputs: [],
    },
    [checkTargetName]: {
      command: `bun biome check {projectRoot}`,
      cache: true,
      inputs: [
        "default",
        "^default",
        "{workspaceRoot}/biome.json",
        "{projectRoot}/biome.json",
        { externalDependencies: ["@biomejs/biome"] },
      ],
      outputs: [],
    },
    [formatTargetName]: {
      command: `bun biome check --write {projectRoot}`,
      cache: true,
      inputs: [
        "default",
        "^default",
        "{workspaceRoot}/biome.json",
        "{projectRoot}/biome.json",
        { externalDependencies: ["@biomejs/biome"] },
      ],
      outputs: [],
    },
  };

  return {
    projects: {
      [root]: {
        targets,
      },
    },
  };
}
