declare class ImportDocumentResponseDto {
    id: string;
    title: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    createdAt: string;
}
declare class ReasoningCandidateDto {
    label: string;
    confidence: number;
    notes: string;
}
declare class ImportItemResponseDto {
    id: string;
    batchId: string;
    ingressKey: string;
    sku: string;
    vendor: string;
    quantity: number;
    rawPayload: Record<string, unknown>;
    normalizedName: string | null;
    category: string | null;
    confidence: number | null;
    reasoning: string | null;
    candidates: ReasoningCandidateDto[];
    technicianDecision: "pending" | "confirmed" | "edited" | "needs-doc";
    technicianNotes: string | null;
    documents: ImportDocumentResponseDto[];
    createdAt: string;
    updatedAt: string;
}
export declare class ImportBatchResponseDto {
    id: string;
    source: "ingress-controller";
    sourceLabel: string;
    status: "ingested" | "matched" | "reviewed" | "committed";
    createdAt: string;
    updatedAt: string;
    items: ImportItemResponseDto[];
}
declare class ComponentCatalogEntryResponseDto {
    id: string;
    importItemId: string;
    sku: string;
    vendor: string;
    normalizedName: string;
    category: string;
    confidence: number;
    technicianDecision: "pending" | "confirmed" | "edited" | "needs-doc";
    documentation: ImportDocumentResponseDto[];
    createdAt: string;
}
export declare class CommitImportBatchResponseDto {
    batch: ImportBatchResponseDto;
    catalogEntries: ComponentCatalogEntryResponseDto[];
}
export {};
//# sourceMappingURL=import-flow-response.dto.d.ts.map