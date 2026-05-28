import { ConfigService } from "@nestjs/config";
interface MatchInput {
    id: string;
    quantity: number;
    rawPayload: Record<string, unknown>;
    sku: string;
    vendor: string;
}
export declare class ImportMatchingService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    matchItems(items: MatchInput[]): Promise<{
        itemId: string;
        normalizedName: string;
        category: string;
        confidence: number;
        reasoning: string;
        candidates: {
            label: string;
            confidence: number;
            notes: string;
        }[];
    }[]>;
    private matchItemsFallback;
    private resolveCategory;
    private resolveNormalizedName;
    private resolveConfidence;
    private resolveFamilyLabel;
    private toStringArray;
    private toText;
}
export {};
//# sourceMappingURL=import-matching.service.d.ts.map