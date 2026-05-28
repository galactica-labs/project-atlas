import type { DrizzleDB } from "../drizzle";
export declare class ComponentCatalogRepository {
    private readonly db;
    constructor(db: DrizzleDB);
    createFromImportItems(itemIds: string[]): Promise<{
        id: string;
        createdAt: Date;
        sku: string;
        vendor: string;
        normalizedName: string;
        category: string;
        confidence: number;
        technicianDecision: "pending" | "confirmed" | "edited" | "needs-doc";
        importItemId: string;
        documentation: Record<string, string | number | null>[];
    }[]>;
}
//# sourceMappingURL=component-catalog.repository.d.ts.map