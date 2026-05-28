import { Inject, Injectable } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import type { DrizzleDB } from "../drizzle";
import {
  type ComponentCatalogEntry,
  componentCatalogEntries,
  importItemDocuments,
  importItems,
} from "../schema";
import { DRIZZLE } from "../tokens";

@Injectable()
export class ComponentCatalogRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createFromImportItems(itemIds: string[]) {
    if (itemIds.length === 0) return [];

    const items = await this.db.query.importItems.findMany({
      where: inArray(importItems.id, itemIds),
    });

    const documents = await this.db.query.importItemDocuments.findMany({
      where: inArray(importItemDocuments.importItemId, itemIds),
      columns: {
        importItemId: true,
        title: true,
        fileName: true,
        contentType: true,
        sizeBytes: true,
      },
    });

    const docsByItemId = new Map<string, Array<Record<string, string | number>>>();
    for (const document of documents) {
      const existing = docsByItemId.get(document.importItemId) ?? [];
      existing.push({
        title: document.title,
        fileName: document.fileName,
        contentType: document.contentType,
        sizeBytes: document.sizeBytes,
      });
      docsByItemId.set(document.importItemId, existing);
    }

    const created: ComponentCatalogEntry[] = [];

    for (const item of items) {
      const existing = await this.db.query.componentCatalogEntries.findFirst({
        where: eq(componentCatalogEntries.importItemId, item.id),
      });

      if (existing) {
        created.push(existing);
        continue;
      }

      const [catalogEntry] = await this.db
        .insert(componentCatalogEntries)
        .values({
          importItemId: item.id,
          sku: item.sku,
          vendor: item.vendor,
          normalizedName: item.normalizedName ?? item.sku,
          category: item.category ?? "Facility Component",
          confidence: item.confidence ?? 0,
          technicianDecision: item.technicianDecision,
          documentation: docsByItemId.get(item.id) ?? [],
        })
        .returning();

      created.push(catalogEntry);
    }

    return created;
  }
}
