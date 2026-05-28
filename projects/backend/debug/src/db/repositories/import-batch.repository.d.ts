import type { DrizzleDB } from "../drizzle";
import { type ImportBatch, type ImportItem } from "../schema";
interface CreateIngressItemInput {
    ingressKey: string;
    rawPayload: Record<string, unknown>;
    quantity: number;
    sku: string;
    vendor: string;
}
interface ApplyMatchInput {
    itemId: string;
    normalizedName: string;
    category: string;
    confidence: number;
    reasoning: string;
    candidates: Array<Record<string, unknown>>;
}
interface ApplyReviewInput {
    itemId: string;
    technicianDecision: "confirmed" | "edited" | "needs-doc";
    technicianNotes?: string;
    normalizedName?: string;
    category?: string;
}
export interface ImportBatchView extends ImportBatch {
    items: Array<ImportItem & {
        documents: Array<{
            id: string;
            title: string;
            fileName: string;
            contentType: string;
            sizeBytes: number;
            createdAt: Date;
        }>;
    }>;
}
export declare class ImportBatchRepository {
    private readonly db;
    constructor(db: DrizzleDB);
    createFromIngress(sourceLabel: string, items: CreateIngressItemInput[]): Promise<ImportBatchView | null>;
    getBatch(batchId: string): Promise<ImportBatchView | null>;
    applyMatches(batchId: string, matches: ApplyMatchInput[]): Promise<ImportBatchView | null>;
    applyReview(batchId: string, reviews: ApplyReviewInput[]): Promise<ImportBatchView | null>;
    markCommitted(batchId: string): Promise<ImportBatchView | null>;
    addDocument(importItemId: string, document: {
        title: string;
        fileName: string;
        contentType: string;
        sizeBytes: number;
        blob: Uint8Array;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=import-batch.repository.d.ts.map