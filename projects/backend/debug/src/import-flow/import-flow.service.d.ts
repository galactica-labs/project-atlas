import { ComponentCatalogRepository, ImportBatchRepository } from "../db";
import type { ReviewImportBatchDto } from "./dto/review-import-batch.dto";
import { ImportMatchingService } from "./import-matching.service";
import { IngressControllerService } from "./ingress-controller.service";
export declare class ImportFlowService {
    private readonly componentCatalogRepository;
    private readonly importBatchRepository;
    private readonly importMatchingService;
    private readonly ingressControllerService;
    constructor(componentCatalogRepository: ComponentCatalogRepository, importBatchRepository: ImportBatchRepository, importMatchingService: ImportMatchingService, ingressControllerService: IngressControllerService);
    pullFromIngress(): Promise<import("../db").ImportBatchView | null>;
    getBatch(batchId: string): Promise<import("../db").ImportBatchView>;
    runMatching(batchId: string): Promise<import("../db").ImportBatchView | null>;
    submitReview(batchId: string, dto: ReviewImportBatchDto): Promise<import("../db").ImportBatchView | null>;
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
//# sourceMappingURL=import-flow.service.d.ts.map