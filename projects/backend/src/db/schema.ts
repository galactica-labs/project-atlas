import {
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType() {
    return "bytea";
  },
});

export const importBatchStatusEnum = pgEnum("import_batch_status", [
  "ingested",
  "matched",
  "reviewed",
  "committed",
]);

export const technicianDecisionEnum = pgEnum("technician_decision", [
  "pending",
  "confirmed",
  "edited",
  "needs-doc",
]);

export const importSourceEnum = pgEnum("import_source", ["ingress-controller"]);

export const importBatches = pgTable(
  "import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: importSourceEnum("source").default("ingress-controller").notNull(),
    sourceLabel: text("source_label").notNull(),
    status: importBatchStatusEnum("status").default("ingested").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("import_batches_status_idx").on(table.status)]
);

export const importItems = pgTable(
  "import_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .references(() => importBatches.id, { onDelete: "cascade" })
      .notNull(),
    ingressKey: text("ingress_key").notNull(),
    sku: text("sku").notNull(),
    vendor: text("vendor").notNull(),
    quantity: integer("quantity").notNull(),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>().notNull(),
    normalizedName: text("normalized_name"),
    category: text("category"),
    confidence: integer("confidence"),
    reasoning: text("reasoning"),
    candidates: jsonb("candidates").$type<Array<Record<string, unknown>>>().default([]).notNull(),
    technicianDecision: technicianDecisionEnum("technician_decision").default("pending").notNull(),
    technicianNotes: text("technician_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("import_items_batch_idx").on(table.batchId),
    index("import_items_sku_idx").on(table.sku),
  ]
);

export const importItemDocuments = pgTable(
  "import_item_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    importItemId: uuid("import_item_id")
      .references(() => importItems.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    blob: bytea("blob").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("import_item_documents_item_idx").on(table.importItemId)]
);

export const componentCatalogEntries = pgTable(
  "component_catalog_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    importItemId: uuid("import_item_id")
      .references(() => importItems.id, { onDelete: "restrict" })
      .notNull(),
    sku: text("sku").notNull(),
    vendor: text("vendor").notNull(),
    normalizedName: text("normalized_name").notNull(),
    category: text("category").notNull(),
    confidence: integer("confidence").notNull(),
    technicianDecision: technicianDecisionEnum("technician_decision").notNull(),
    documentation: jsonb("documentation")
      .$type<Array<Record<string, string | number | null>>>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("component_catalog_entries_import_item_uidx").on(table.importItemId)]
);

export type ImportBatch = typeof importBatches.$inferSelect;
export type ImportItem = typeof importItems.$inferSelect;
export type ImportItemDocument = typeof importItemDocuments.$inferSelect;
export type ComponentCatalogEntry = typeof componentCatalogEntries.$inferSelect;
