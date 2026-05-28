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
    get componentCatalogEntries () {
        return componentCatalogEntries;
    },
    get importBatchStatusEnum () {
        return importBatchStatusEnum;
    },
    get importBatches () {
        return importBatches;
    },
    get importItemDocuments () {
        return importItemDocuments;
    },
    get importItems () {
        return importItems;
    },
    get importSourceEnum () {
        return importSourceEnum;
    },
    get technicianDecisionEnum () {
        return technicianDecisionEnum;
    }
});
const _pgcore = require("drizzle-orm/pg-core");
const bytea = (0, _pgcore.customType)({
    dataType () {
        return "bytea";
    }
});
const importBatchStatusEnum = (0, _pgcore.pgEnum)("import_batch_status", [
    "ingested",
    "matched",
    "reviewed",
    "committed"
]);
const technicianDecisionEnum = (0, _pgcore.pgEnum)("technician_decision", [
    "pending",
    "confirmed",
    "edited",
    "needs-doc"
]);
const importSourceEnum = (0, _pgcore.pgEnum)("import_source", [
    "ingress-controller"
]);
const importBatches = (0, _pgcore.pgTable)("import_batches", {
    id: (0, _pgcore.uuid)("id").defaultRandom().primaryKey(),
    source: importSourceEnum("source").default("ingress-controller").notNull(),
    sourceLabel: (0, _pgcore.text)("source_label").notNull(),
    status: importBatchStatusEnum("status").default("ingested").notNull(),
    createdAt: (0, _pgcore.timestamp)("created_at", {
        withTimezone: true
    }).defaultNow().notNull(),
    updatedAt: (0, _pgcore.timestamp)("updated_at", {
        withTimezone: true
    }).defaultNow().notNull()
}, (table)=>[
        (0, _pgcore.index)("import_batches_status_idx").on(table.status)
    ]);
const importItems = (0, _pgcore.pgTable)("import_items", {
    id: (0, _pgcore.uuid)("id").defaultRandom().primaryKey(),
    batchId: (0, _pgcore.uuid)("batch_id").references(()=>importBatches.id, {
        onDelete: "cascade"
    }).notNull(),
    ingressKey: (0, _pgcore.text)("ingress_key").notNull(),
    sku: (0, _pgcore.text)("sku").notNull(),
    vendor: (0, _pgcore.text)("vendor").notNull(),
    quantity: (0, _pgcore.integer)("quantity").notNull(),
    rawPayload: (0, _pgcore.jsonb)("raw_payload").$type().notNull(),
    normalizedName: (0, _pgcore.text)("normalized_name"),
    category: (0, _pgcore.text)("category"),
    confidence: (0, _pgcore.integer)("confidence"),
    reasoning: (0, _pgcore.text)("reasoning"),
    candidates: (0, _pgcore.jsonb)("candidates").$type().default([]).notNull(),
    technicianDecision: technicianDecisionEnum("technician_decision").default("pending").notNull(),
    technicianNotes: (0, _pgcore.text)("technician_notes"),
    createdAt: (0, _pgcore.timestamp)("created_at", {
        withTimezone: true
    }).defaultNow().notNull(),
    updatedAt: (0, _pgcore.timestamp)("updated_at", {
        withTimezone: true
    }).defaultNow().notNull()
}, (table)=>[
        (0, _pgcore.index)("import_items_batch_idx").on(table.batchId),
        (0, _pgcore.index)("import_items_sku_idx").on(table.sku)
    ]);
const importItemDocuments = (0, _pgcore.pgTable)("import_item_documents", {
    id: (0, _pgcore.uuid)("id").defaultRandom().primaryKey(),
    importItemId: (0, _pgcore.uuid)("import_item_id").references(()=>importItems.id, {
        onDelete: "cascade"
    }).notNull(),
    title: (0, _pgcore.text)("title").notNull(),
    fileName: (0, _pgcore.text)("file_name").notNull(),
    contentType: (0, _pgcore.text)("content_type").notNull(),
    sizeBytes: (0, _pgcore.integer)("size_bytes").notNull(),
    blob: bytea("blob").notNull(),
    createdAt: (0, _pgcore.timestamp)("created_at", {
        withTimezone: true
    }).defaultNow().notNull()
}, (table)=>[
        (0, _pgcore.index)("import_item_documents_item_idx").on(table.importItemId)
    ]);
const componentCatalogEntries = (0, _pgcore.pgTable)("component_catalog_entries", {
    id: (0, _pgcore.uuid)("id").defaultRandom().primaryKey(),
    importItemId: (0, _pgcore.uuid)("import_item_id").references(()=>importItems.id, {
        onDelete: "restrict"
    }).notNull(),
    sku: (0, _pgcore.text)("sku").notNull(),
    vendor: (0, _pgcore.text)("vendor").notNull(),
    normalizedName: (0, _pgcore.text)("normalized_name").notNull(),
    category: (0, _pgcore.text)("category").notNull(),
    confidence: (0, _pgcore.integer)("confidence").notNull(),
    technicianDecision: technicianDecisionEnum("technician_decision").notNull(),
    documentation: (0, _pgcore.jsonb)("documentation").$type().notNull(),
    createdAt: (0, _pgcore.timestamp)("created_at", {
        withTimezone: true
    }).defaultNow().notNull()
}, (table)=>[
        (0, _pgcore.uniqueIndex)("component_catalog_entries_import_item_uidx").on(table.importItemId)
    ]);
