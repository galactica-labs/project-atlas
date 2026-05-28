"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ImportBatchRepository", {
    enumerable: true,
    get: function() {
        return ImportBatchRepository;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _ts_param = require("@swc/helpers/_/_ts_param");
const _common = require("@nestjs/common");
const _drizzleorm = require("drizzle-orm");
const _schema = require("../schema");
const _tokens = require("../tokens");
let ImportBatchRepository = class ImportBatchRepository {
    db;
    constructor(db){
        this.db = db;
    }
    async createFromIngress(sourceLabel, items) {
        const [batch] = await this.db.insert(_schema.importBatches).values({
            sourceLabel,
            status: "ingested"
        }).returning();
        if (items.length > 0) {
            await this.db.insert(_schema.importItems).values(items.map((item)=>({
                    batchId: batch.id,
                    ingressKey: item.ingressKey,
                    sku: item.sku,
                    vendor: item.vendor,
                    quantity: item.quantity,
                    rawPayload: item.rawPayload
                })));
        }
        return this.getBatch(batch.id);
    }
    async getBatch(batchId) {
        const batch = await this.db.query.importBatches.findFirst({
            where: (0, _drizzleorm.eq)(_schema.importBatches.id, batchId)
        });
        if (!batch) return null;
        const items = await this.db.query.importItems.findMany({
            where: (0, _drizzleorm.eq)(_schema.importItems.batchId, batchId),
            orderBy: [
                (0, _drizzleorm.desc)(_schema.importItems.createdAt)
            ]
        });
        const itemIds = items.map((item)=>item.id);
        const documents = itemIds.length > 0 ? await this.db.select({
            id: _schema.importItemDocuments.id,
            importItemId: _schema.importItemDocuments.importItemId,
            title: _schema.importItemDocuments.title,
            fileName: _schema.importItemDocuments.fileName,
            contentType: _schema.importItemDocuments.contentType,
            sizeBytes: _schema.importItemDocuments.sizeBytes,
            createdAt: _schema.importItemDocuments.createdAt
        }).from(_schema.importItemDocuments).where((0, _drizzleorm.inArray)(_schema.importItemDocuments.importItemId, itemIds)) : [];
        const docsByItemId = new Map();
        for (const document of documents){
            const existing = docsByItemId.get(document.importItemId) ?? [];
            existing.push({
                id: document.id,
                title: document.title,
                fileName: document.fileName,
                contentType: document.contentType,
                sizeBytes: document.sizeBytes,
                createdAt: document.createdAt
            });
            docsByItemId.set(document.importItemId, existing);
        }
        return {
            ...batch,
            items: items.map((item)=>({
                    ...item,
                    documents: docsByItemId.get(item.id) ?? []
                }))
        };
    }
    async applyMatches(batchId, matches) {
        for (const match of matches){
            await this.db.update(_schema.importItems).set({
                normalizedName: match.normalizedName,
                category: match.category,
                confidence: match.confidence,
                reasoning: match.reasoning,
                candidates: match.candidates,
                updatedAt: new Date()
            }).where((0, _drizzleorm.eq)(_schema.importItems.id, match.itemId));
        }
        await this.db.update(_schema.importBatches).set({
            status: "matched",
            updatedAt: new Date()
        }).where((0, _drizzleorm.eq)(_schema.importBatches.id, batchId));
        return this.getBatch(batchId);
    }
    async applyReview(batchId, reviews) {
        for (const review of reviews){
            await this.db.update(_schema.importItems).set({
                technicianDecision: review.technicianDecision,
                technicianNotes: review.technicianNotes,
                normalizedName: review.normalizedName,
                category: review.category,
                updatedAt: new Date()
            }).where((0, _drizzleorm.eq)(_schema.importItems.id, review.itemId));
        }
        await this.db.update(_schema.importBatches).set({
            status: "reviewed",
            updatedAt: new Date()
        }).where((0, _drizzleorm.eq)(_schema.importBatches.id, batchId));
        return this.getBatch(batchId);
    }
    async markCommitted(batchId) {
        await this.db.update(_schema.importBatches).set({
            status: "committed",
            updatedAt: new Date()
        }).where((0, _drizzleorm.eq)(_schema.importBatches.id, batchId));
        return this.getBatch(batchId);
    }
    async addDocument(importItemId, document) {
        await this.db.insert(_schema.importItemDocuments).values({
            importItemId,
            title: document.title,
            fileName: document.fileName,
            contentType: document.contentType,
            sizeBytes: document.sizeBytes,
            blob: document.blob
        });
    }
};
ImportBatchRepository = _ts_decorate._([
    (0, _common.Injectable)(),
    _ts_param._(0, (0, _common.Inject)(_tokens.DRIZZLE)),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        typeof DrizzleDB === "undefined" ? Object : DrizzleDB
    ])
], ImportBatchRepository);
