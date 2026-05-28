import type { Asset } from "../data/mock";

export function runHephaestus(
  sourceId: string,
  assets: Asset[]
): { blastRadius: string[]; cascadeDelays: Record<string, number> } {
  // Reverse adjacency: id → [assets that directly depend on it]
  const dependents = new Map<string, string[]>();
  for (const asset of assets) {
    for (const dep of asset.dependsOn) {
      if (!dependents.has(dep)) dependents.set(dep, []);
      dependents.get(dep)!.push(asset.id);
    }
  }

  const visited = new Set<string>([sourceId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: sourceId, depth: 0 }];
  const ordered: Array<{ id: string; delay: number }> = [];
  const cascadeDelays: Record<string, number> = {};

  // Per-category counters for staggering delays within each tier
  let pumpCount = 0;
  let crahCount = 0;
  let computeCount = 0;

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    for (const childId of dependents.get(id) ?? []) {
      if (visited.has(childId)) continue;
      visited.add(childId);

      const asset = assets.find((a) => a.id === childId);
      let delay: number;

      if (childId.includes("pump")) {
        delay = 4 + pumpCount * 2;
        pumpCount++;
      } else if (asset?.zone.includes("Cooling Bay")) {
        delay = 11 + crahCount;
        crahCount++;
      } else if (asset?.type === "Compute") {
        delay = 18 + computeCount * 2;
        computeCount++;
      } else {
        delay = (depth + 1) * 6;
      }

      cascadeDelays[childId] = delay;
      ordered.push({ id: childId, delay });
      queue.push({ id: childId, depth: depth + 1 });
    }
  }

  // Sort blast radius by cascade delay ascending for timeline display
  const blastRadius = [...ordered].sort((a, b) => a.delay - b.delay).map((x) => x.id);

  return { blastRadius, cascadeDelays };
}
