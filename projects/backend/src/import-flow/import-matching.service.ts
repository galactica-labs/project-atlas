import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

const matchSchema = z.object({
  matches: z.array(
    z.object({
      itemId: z.string().uuid(),
      normalizedName: z.string(),
      category: z.string(),
      confidence: z.number().min(0).max(100),
      reasoning: z.string(),
      candidates: z.array(
        z.object({
          label: z.string(),
          confidence: z.number().min(0).max(100),
          notes: z.string(),
        })
      ),
    })
  ),
});

interface MatchInput {
  id: string;
  quantity: number;
  rawPayload: Record<string, unknown>;
  sku: string;
  vendor: string;
}

@Injectable()
export class ImportMatchingService {
  private readonly logger = new Logger(ImportMatchingService.name);

  constructor(private readonly configService: ConfigService) {}

  async matchItems(items: MatchInput[]) {
    const apiKey = this.configService.get<string>("ai.openRouterApiKey");
    if (!apiKey) {
      this.logger.warn(
        "OPENROUTER_API_KEY missing. Falling back to deterministic Genesis matcher."
      );
      return this.matchItemsFallback(items);
    }

    const modelName = this.configService.get<string>("ai.model", "openai/gpt-oss-120b");
    const openrouter = createOpenRouter({ apiKey });

    const result = await generateObject({
      model: openrouter(modelName),
      schema: matchSchema,
      prompt: [
        "You match raw data center hardware SKUs into canonical Atlas component names.",
        "Return one match per item.",
        "Keep category values concise and operations-friendly.",
        "Use ingress metadata, expected asset names, and floor-plan zones when SKU alone is ambiguous.",
        JSON.stringify(items),
      ].join("\n\n"),
    });

    return result.object.matches;
  }

  private matchItemsFallback(items: MatchInput[]) {
    return items.map((item) => {
      const category = this.resolveCategory(item.sku, item.rawPayload);
      const normalizedName = this.resolveNormalizedName(item);
      const confidence = this.resolveConfidence(item.sku, item.rawPayload);
      const zone = this.toText(item.rawPayload.zone) || "Unknown zone";
      const expectedAssets = this.toStringArray(item.rawPayload.expectedAssets);
      const reasoningTarget = expectedAssets.length > 0 ? expectedAssets.join(", ") : zone;

      return {
        itemId: item.id,
        normalizedName,
        category,
        confidence,
        reasoning: `Genesis fallback matched ${item.sku} to ${normalizedName} for ${reasoningTarget} using zone metadata, expected assets, and SKU family parsing.`,
        candidates: [
          {
            label: normalizedName,
            confidence,
            notes: `Best deterministic match for ${zone.toLowerCase()}`,
          },
          {
            label: `${this.toText(item.rawPayload.zoneLabel) || zone} ${this.resolveFamilyLabel(item.rawPayload)}`,
            confidence: Math.max(42, confidence - 24),
            notes: "Zone-aligned family variant",
          },
        ],
      };
    });
  }

  private resolveCategory(sku: string, rawPayload: Record<string, unknown>) {
    const hintedCategory = this.toText(rawPayload.categoryHint);
    if (hintedCategory) return hintedCategory;
    if (sku.includes("PDU") || sku.includes("SWG") || sku.includes("UPS") || sku.includes("GEN")) {
      return "Power Infrastructure";
    }
    if (sku.includes("N9K") || sku.includes("SW")) return "Network Fabric";
    if (
      sku.includes("CRAH") ||
      sku.includes("CHILLER") ||
      sku.includes("PUMP") ||
      sku.includes("TWR")
    ) {
      return "Cooling Infrastructure";
    }
    if (sku.includes("GPU") || sku.includes("HGX")) return "Accelerated Compute";
    if (sku.includes("R760") || sku.includes("RACK")) return "Rack Compute";
    return "Facility Component";
  }

  private resolveNormalizedName(item: MatchInput) {
    const canonicalName = this.toText(item.rawPayload.canonicalName);
    if (canonicalName) return canonicalName;

    const expectedAssets = this.toStringArray(item.rawPayload.expectedAssets);
    if (expectedAssets.length > 0) {
      return `${this.toText(item.rawPayload.zone) || "Facility"} ${expectedAssets[0]} group`;
    }

    return `${item.vendor} ${item.sku.split("-").join(" ")}`;
  }

  private resolveConfidence(sku: string, rawPayload: Record<string, unknown>) {
    if (
      this.toText(rawPayload.canonicalName) &&
      this.toStringArray(rawPayload.expectedAssets).length > 0
    ) {
      return 95;
    }

    if (sku.includes("GPU") || sku.includes("HGX")) return 82;
    if (sku.includes("PDU") || sku.includes("CRAH") || sku.includes("UPS")) return 90;
    return 92;
  }

  private resolveFamilyLabel(rawPayload: Record<string, unknown>) {
    return this.toText(rawPayload.assetFamily) || "component family";
  }

  private toStringArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === "string")
      : [];
  }

  private toText(value: unknown) {
    return typeof value === "string" ? value : "";
  }
}
