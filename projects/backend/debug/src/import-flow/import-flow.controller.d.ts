import { ReviewImportBatchDto } from "./dto/review-import-batch.dto";
import { ImportFlowService } from "./import-flow.service";
export declare class ImportFlowController {
    private readonly importFlowService;
    constructor(importFlowService: ImportFlowService);
    pullFromIngress(): Promise<import("../db").ImportBatchView | null>;
    getBatch(batchId: string): Promise<import("../db").ImportBatchView>;
    runMatching(batchId: string): Promise<import("../db").ImportBatchView | null>;
    submitReview(batchId: string, body: ReviewImportBatchDto): Promise<import("../db").ImportBatchView | null>;
    uploadDocument(batchId: string, itemId: string, file: {
        buffer: Uint8Array;
        mimetype: string;
        originalname: string;
        size: number;
    } | undefined): Promise<import("../db").ImportBatchView>;
    commitBatch(batchId: string): Promise<{
        batch: import("../db").ImportBatchView | null;
        catalogEntries: {
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
        }[];
    }>;
}
//# sourceMappingURL=import-flow.controller.d.ts.map