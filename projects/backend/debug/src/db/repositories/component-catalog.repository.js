"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ComponentCatalogRepository", {
    enumerable: true,
    get: function() {
        return ComponentCatalogRepository;
    }
});
const _ts_decorate = require("@swc/helpers/_/_ts_decorate");
const _ts_metadata = require("@swc/helpers/_/_ts_metadata");
const _ts_param = require("@swc/helpers/_/_ts_param");
const _common = require("@nestjs/common");
const _drizzleorm = require("drizzle-orm");
const _schema = require("../schema");
const _tokens = require("../tokens");
let ComponentCatalogRepository = class ComponentCatalogRepository {
    db;
    constructor(db){
        this.db = db;
    }
    async createFromImportItems(itemIds) {
        if (itemIds.length === 0) return [];
        const items = await this.db.query.importItems.findMany({
            where: (0, _drizzleorm.inArray)(_schema.importItems.id, itemIds)
        });
        const documents = await this.db.query.importItemDocuments.findMany({
            where: (0, _drizzleorm.inArray)(_schema.importItemDocuments.importItemId, itemIds),
            columns: {
                importItemId: true,
                title: true,
                fileName: true,
                contentType: true,
                sizeBytes: true
            }
        });
        const docsByItemId = new Map();
        for (const document of documents){
            const existing = docsByItemId.get(document.importItemId) ?? [];
            existing.push({
                title: document.title,
                fileName: document.fileName,
                contentType: document.contentType,
                sizeBytes: document.sizeBytes
            });
            docsByItemId.set(document.importItemId, existing);
        }
        const created = [];
        for (const item of items){
            const existing = await this.db.query.componentCatalogEntries.findFirst({
                where: (0, _drizzleorm.eq)(_schema.componentCatalogEntries.importItemId, item.id)
            });
            if (existing) {
                created.push(existing);
                continue;
            }
            const [catalogEntry] = await this.db.insert(_schema.componentCatalogEntries).values({
                importItemId: item.id,
                sku: item.sku,
                vendor: item.vendor,
                normalizedName: item.normalizedName ?? item.sku,
                category: item.category ?? "Facility Component",
                confidence: item.confidence ?? 0,
                technicianDecision: item.technicianDecision,
                documentation: docsByItemId.get(item.id) ?? []
            }).returning();
            created.push(catalogEntry);
        }
        return created;
    }
};
ComponentCatalogRepository = _ts_decorate._([
    (0, _common.Injectable)(),
    _ts_param._(0, (0, _common.Inject)(_tokens.DRIZZLE)),
    _ts_metadata._("design:type", Function),
    _ts_metadata._("design:paramtypes", [
        typeof DrizzleDB === "undefined" ? Object : DrizzleDB
    ])
], ComponentCatalogRepository);
