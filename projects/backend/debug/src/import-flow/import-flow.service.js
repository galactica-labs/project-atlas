"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ImportFlowService", {
    enumerable: true,
    get: function() {
        return ImportFlowService;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _common = require("@nestjs/common");
const _db = require("../db");
const _importmatchingservice = require("./import-matching.service");
const _ingresscontrollerservice = require("./ingress-controller.service");
let ImportFlowService = class ImportFlowService {
    componentCatalogRepository;
    importBatchRepository;
    importMatchingService;
    ingressControllerService;
    constructor(componentCatalogRepository, importBatchRepository, importMatchingService, ingressControllerService){
        this.componentCatalogRepository = componentCatalogRepository;
        this.importBatchRepository = importBatchRepository;
        this.importMatchingService = importMatchingService;
        this.ingressControllerService = ingressControllerService;
    }
    async pullFromIngress() {
        const payload = this.ingressControllerService.pullGenesisPayload();
        return this.importBatchRepository.createFromIngress(payload.sourceLabel, payload.items);
    }
    async getBatch(batchId) {
        const batch = await this.importBatchRepository.getBatch(batchId);
        if (!batch) {
            throw new _common.NotFoundException(`Import batch ${batchId} not found`);
        }
        return batch;
    }
    async runMatching(batchId) {
        const batch = await this.getBatch(batchId);
        const matches = await this.importMatchingService.matchItems(batch.items.map((item)=>({
                id: item.id,
                quantity: item.quantity,
                rawPayload: item.rawPayload,
                sku: item.sku,
                vendor: item.vendor
            })));
        return this.importBatchRepository.applyMatches(batchId, matches);
    }
    async submitReview(batchId, dto) {
        await this.getBatch(batchId);
        return this.importBatchRepository.applyReview(batchId, dto.items);
    }
    async uploadDocument(batchId, itemId, file) {
        const batch = await this.getBatch(batchId);
        const item = batch.items.find((entry)=>entry.id === itemId);
        if (!item) {
            throw new _common.NotFoundException(`Import item ${itemId} not found in batch ${batchId}`);
        }
        if (!file || file.size === 0) {
            throw new _common.BadRequestException("PDF file is required");
        }
        const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
        if (!isPdf) {
            throw new _common.BadRequestException("Only PDF uploads are supported");
        }
        await this.importBatchRepository.addDocument(itemId, {
            title: file.originalname.replace(/\.pdf$/i, ""),
            fileName: file.originalname,
            contentType: "application/pdf",
            sizeBytes: file.size,
            blob: file.buffer
        });
        return this.getBatch(batchId);
    }
    async commitBatch(batchId) {
        const batch = await this.getBatch(batchId);
        const eligibleItems = batch.items.filter((item)=>item.documents.length > 0 && (item.technicianDecision === "confirmed" || item.technicianDecision === "edited") && item.normalizedName && item.category);
        if (eligibleItems.length !== batch.items.length) {
            throw new _common.UnprocessableEntityException("All items must have documents and technician confirmation before commit");
        }
        const catalogEntries = await this.componentCatalogRepository.createFromImportItems(eligibleItems.map((item)=>item.id));
        const committedBatch = await this.importBatchRepository.markCommitted(batchId);
        return {
            batch: committedBatch,
            catalogEntries
        };
    }
};
ImportFlowService = _ts_decorate._([
    (0, _common.Injectable)(),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        typeof _db.ComponentCatalogRepository === "undefined" ? Object : _db.ComponentCatalogRepository,
        typeof _db.ImportBatchRepository === "undefined" ? Object : _db.ImportBatchRepository,
        typeof _importmatchingservice.ImportMatchingService === "undefined" ? Object : _importmatchingservice.ImportMatchingService,
        typeof _ingresscontrollerservice.IngressControllerService === "undefined" ? Object : _ingresscontrollerservice.IngressControllerService
    ])
], ImportFlowService);
