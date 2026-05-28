declare class ImportItemReviewDto {
    itemId: string;
    technicianDecision: "confirmed" | "edited" | "needs-doc";
    technicianNotes?: string;
    normalizedName?: string;
    category?: string;
}
export declare class ReviewImportBatchDto {
    items: ImportItemReviewDto[];
}
export {};
//# sourceMappingURL=review-import-batch.dto.d.ts.map