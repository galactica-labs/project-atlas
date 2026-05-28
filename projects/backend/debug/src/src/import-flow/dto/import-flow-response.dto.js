"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CommitImportBatchResponseDto () {
        return CommitImportBatchResponseDto;
    },
    get ImportBatchResponseDto () {
        return ImportBatchResponseDto;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _swagger = require("@nestjs/swagger");
let ImportDocumentResponseDto = class ImportDocumentResponseDto {
    id;
    title;
    fileName;
    contentType;
    sizeBytes;
    createdAt;
};
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportDocumentResponseDto.prototype, "id", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportDocumentResponseDto.prototype, "title", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportDocumentResponseDto.prototype, "fileName", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportDocumentResponseDto.prototype, "contentType", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", Number)
], ImportDocumentResponseDto.prototype, "sizeBytes", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportDocumentResponseDto.prototype, "createdAt", void 0);
let ReasoningCandidateDto = class ReasoningCandidateDto {
    label;
    confidence;
    notes;
};
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ReasoningCandidateDto.prototype, "label", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", Number)
], ReasoningCandidateDto.prototype, "confidence", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ReasoningCandidateDto.prototype, "notes", void 0);
let ImportItemResponseDto = class ImportItemResponseDto {
    id;
    batchId;
    ingressKey;
    sku;
    vendor;
    quantity;
    rawPayload;
    normalizedName;
    category;
    confidence;
    reasoning;
    candidates;
    technicianDecision;
    technicianNotes;
    documents;
    createdAt;
    updatedAt;
};
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportItemResponseDto.prototype, "id", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportItemResponseDto.prototype, "batchId", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportItemResponseDto.prototype, "ingressKey", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportItemResponseDto.prototype, "sku", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportItemResponseDto.prototype, "vendor", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", Number)
], ImportItemResponseDto.prototype, "quantity", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        additionalProperties: true
    }),
    _ts_metadata._("design:type", typeof Record === "undefined" ? Object : Record)
], ImportItemResponseDto.prototype, "rawPayload", void 0);
_ts_decorate._([
    (0, _swagger.ApiPropertyOptional)({
        nullable: true
    }),
    _ts_metadata._("design:type", Object)
], ImportItemResponseDto.prototype, "normalizedName", void 0);
_ts_decorate._([
    (0, _swagger.ApiPropertyOptional)({
        nullable: true
    }),
    _ts_metadata._("design:type", Object)
], ImportItemResponseDto.prototype, "category", void 0);
_ts_decorate._([
    (0, _swagger.ApiPropertyOptional)({
        nullable: true
    }),
    _ts_metadata._("design:type", Object)
], ImportItemResponseDto.prototype, "confidence", void 0);
_ts_decorate._([
    (0, _swagger.ApiPropertyOptional)({
        nullable: true
    }),
    _ts_metadata._("design:type", Object)
], ImportItemResponseDto.prototype, "reasoning", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        type: [
            ReasoningCandidateDto
        ]
    }),
    _ts_metadata._("design:type", Array)
], ImportItemResponseDto.prototype, "candidates", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        enum: [
            "pending",
            "confirmed",
            "edited",
            "needs-doc"
        ]
    }),
    _ts_metadata._("design:type", String)
], ImportItemResponseDto.prototype, "technicianDecision", void 0);
_ts_decorate._([
    (0, _swagger.ApiPropertyOptional)({
        nullable: true
    }),
    _ts_metadata._("design:type", Object)
], ImportItemResponseDto.prototype, "technicianNotes", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        type: [
            ImportDocumentResponseDto
        ]
    }),
    _ts_metadata._("design:type", Array)
], ImportItemResponseDto.prototype, "documents", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportItemResponseDto.prototype, "createdAt", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportItemResponseDto.prototype, "updatedAt", void 0);
let ImportBatchResponseDto = class ImportBatchResponseDto {
    id;
    source;
    sourceLabel;
    status;
    createdAt;
    updatedAt;
    items;
};
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportBatchResponseDto.prototype, "id", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        enum: [
            "ingress-controller"
        ]
    }),
    _ts_metadata._("design:type", String)
], ImportBatchResponseDto.prototype, "source", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportBatchResponseDto.prototype, "sourceLabel", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        enum: [
            "ingested",
            "matched",
            "reviewed",
            "committed"
        ]
    }),
    _ts_metadata._("design:type", String)
], ImportBatchResponseDto.prototype, "status", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportBatchResponseDto.prototype, "createdAt", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ImportBatchResponseDto.prototype, "updatedAt", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        type: [
            ImportItemResponseDto
        ]
    }),
    _ts_metadata._("design:type", Array)
], ImportBatchResponseDto.prototype, "items", void 0);
let ComponentCatalogEntryResponseDto = class ComponentCatalogEntryResponseDto {
    id;
    importItemId;
    sku;
    vendor;
    normalizedName;
    category;
    confidence;
    technicianDecision;
    documentation;
    createdAt;
};
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ComponentCatalogEntryResponseDto.prototype, "id", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ComponentCatalogEntryResponseDto.prototype, "importItemId", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ComponentCatalogEntryResponseDto.prototype, "sku", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ComponentCatalogEntryResponseDto.prototype, "vendor", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ComponentCatalogEntryResponseDto.prototype, "normalizedName", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ComponentCatalogEntryResponseDto.prototype, "category", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", Number)
], ComponentCatalogEntryResponseDto.prototype, "confidence", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        enum: [
            "pending",
            "confirmed",
            "edited",
            "needs-doc"
        ]
    }),
    _ts_metadata._("design:type", String)
], ComponentCatalogEntryResponseDto.prototype, "technicianDecision", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        type: [
            ImportDocumentResponseDto
        ]
    }),
    _ts_metadata._("design:type", Array)
], ComponentCatalogEntryResponseDto.prototype, "documentation", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)(),
    _ts_metadata._("design:type", String)
], ComponentCatalogEntryResponseDto.prototype, "createdAt", void 0);
let CommitImportBatchResponseDto = class CommitImportBatchResponseDto {
    batch;
    catalogEntries;
};
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        type: ImportBatchResponseDto
    }),
    _ts_metadata._("design:type", typeof ImportBatchResponseDto === "undefined" ? Object : ImportBatchResponseDto)
], CommitImportBatchResponseDto.prototype, "batch", void 0);
_ts_decorate._([
    (0, _swagger.ApiProperty)({
        type: [
            ComponentCatalogEntryResponseDto
        ]
    }),
    _ts_metadata._("design:type", Array)
], CommitImportBatchResponseDto.prototype, "catalogEntries", void 0);
