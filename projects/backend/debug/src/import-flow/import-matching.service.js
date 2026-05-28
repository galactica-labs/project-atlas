"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ImportMatchingService", {
    enumerable: true,
    get: function() {
        return ImportMatchingService;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _aisdkprovider = require("@openrouter/ai-sdk-provider");
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _ai = require("ai");
const _zod = require("zod");
const matchSchema = _zod.z.object({
    matches: _zod.z.array(_zod.z.object({
        itemId: _zod.z.string().uuid(),
        normalizedName: _zod.z.string(),
        category: _zod.z.string(),
        confidence: _zod.z.number().min(0).max(100),
        reasoning: _zod.z.string(),
        candidates: _zod.z.array(_zod.z.object({
            label: _zod.z.string(),
            confidence: _zod.z.number().min(0).max(100),
            notes: _zod.z.string()
        }))
    }))
});
let ImportMatchingService = class ImportMatchingService {
    configService;
    logger = new _common.Logger(ImportMatchingService.name);
    constructor(configService){
        this.configService = configService;
    }
    async matchItems(items) {
        const apiKey = this.configService.get("ai.openRouterApiKey");
        if (!apiKey) {
            this.logger.warn("OPENROUTER_API_KEY missing. Falling back to deterministic Genesis matcher.");
            return this.matchItemsFallback(items);
        }
        const modelName = this.configService.get("ai.model", "openai/gpt-oss-120b");
        const openrouter = (0, _aisdkprovider.createOpenRouter)({
            apiKey
        });
        const result = await (0, _ai.generateObject)({
            model: openrouter(modelName),
            schema: matchSchema,
            prompt: [
                "You match raw data center hardware SKUs into canonical Atlas component names.",
                "Return one match per item.",
                "Keep category values concise and operations-friendly.",
                "Use ingress metadata, expected asset names, and floor-plan zones when SKU alone is ambiguous.",
                JSON.stringify(items)
            ].join("\n\n")
        });
        return result.object.matches;
    }
    matchItemsFallback(items) {
        return items.map((item)=>{
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
                        notes: `Best deterministic match for ${zone.toLowerCase()}`
                    },
                    {
                        label: `${this.toText(item.rawPayload.zoneLabel) || zone} ${this.resolveFamilyLabel(item.rawPayload)}`,
                        confidence: Math.max(42, confidence - 24),
                        notes: "Zone-aligned family variant"
                    }
                ]
            };
        });
    }
    resolveCategory(sku, rawPayload) {
        const hintedCategory = this.toText(rawPayload.categoryHint);
        if (hintedCategory) return hintedCategory;
        if (sku.includes("PDU") || sku.includes("SWG") || sku.includes("UPS") || sku.includes("GEN")) {
            return "Power Infrastructure";
        }
        if (sku.includes("N9K") || sku.includes("SW")) return "Network Fabric";
        if (sku.includes("CRAH") || sku.includes("CHILLER") || sku.includes("PUMP") || sku.includes("TWR")) {
            return "Cooling Infrastructure";
        }
        if (sku.includes("GPU") || sku.includes("HGX")) return "Accelerated Compute";
        if (sku.includes("R760") || sku.includes("RACK")) return "Rack Compute";
        return "Facility Component";
    }
    resolveNormalizedName(item) {
        const canonicalName = this.toText(item.rawPayload.canonicalName);
        if (canonicalName) return canonicalName;
        const expectedAssets = this.toStringArray(item.rawPayload.expectedAssets);
        if (expectedAssets.length > 0) {
            return `${this.toText(item.rawPayload.zone) || "Facility"} ${expectedAssets[0]} group`;
        }
        return `${item.vendor} ${item.sku.split("-").join(" ")}`;
    }
    resolveConfidence(sku, rawPayload) {
        if (this.toText(rawPayload.canonicalName) && this.toStringArray(rawPayload.expectedAssets).length > 0) {
            return 95;
        }
        if (sku.includes("GPU") || sku.includes("HGX")) return 82;
        if (sku.includes("PDU") || sku.includes("CRAH") || sku.includes("UPS")) return 90;
        return 92;
    }
    resolveFamilyLabel(rawPayload) {
        return this.toText(rawPayload.assetFamily) || "component family";
    }
    toStringArray(value) {
        return Array.isArray(value) ? value.filter((entry)=>typeof entry === "string") : [];
    }
    toText(value) {
        return typeof value === "string" ? value : "";
    }
};
ImportMatchingService = _ts_decorate._([
    (0, _common.Injectable)(),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], ImportMatchingService);
