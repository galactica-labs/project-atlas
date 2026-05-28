import { Inject, Injectable } from "@nestjs/common";
import { desc, eq, inArray } from "drizzle-orm";
import type { DrizzleDB } from "../drizzle";
import {
  type ImportBatch,
  type ImportItem,
  importBatches,
  importItemDocuments,
  importItems,
} from "../schema";
import { DRIZZLE } from "../tokens";

interface CreateIngressItemInput {
  ingressKey: string;
  rawPayload: Record<string, unknown>;
  quantity: number;
  sku: string;
  vendor: string;
}

interface ApplyMatchInput {
  itemId: string;
  normalizedName: string;
  category: string;
  confidence: number;
  reasoning: string;
  candidates: Array<Record<string, unknown>>;
}

interface ApplyReviewInput {
  itemId: string;
  technicianDecision: "confirmed" | "edited" | "needs-doc";
  technicianNotes?: string;
  normalizedName?: string;
  category?: string;
}

export interface ImportBatchView extends ImportBatch {
  items: Array<
    ImportItem & {
      documents: Array<{
        id: string;
        title: string;
        fileName: string;
        contentType: string;
        sizeBytes: number;
        createdAt: Date;
      }>;
    }
  >;
}

@Injectable()
export class ImportBatchRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createFromIngress(sourceLabel: string, items: CreateIngressItemInput[]) {
    const [batch] = await this.db
      .insert(importBatches)
      .values({ sourceLabel, status: "ingested" })
      .returning();

    if (items.length > 0) {
      await this.db.insert(importItems).values(
        items.map((item) => ({
          batchId: batch.id,
          ingressKey: item.ingressKey,
          sku: item.sku,
          vendor: item.vendor,
          quantity: item.quantity,
          rawPayload: item.rawPayload,
        }))
      );
    }

    return this.getBatch(batch.id);
  }

  async getBatch(batchId: string): Promise<ImportBatchView | null> {
    const batch = await this.db.query.importBatches.findFirst({
      where: eq(importBatches.id, batchId),
    });

    if (!batch) return null;

    const items = await this.db.query.importItems.findMany({
      where: eq(importItems.batchId, batchId),
      orderBy: [desc(importItems.createdAt)],
    });

    const itemIds = items.map((item) => item.id);
    const documents =
      itemIds.length > 0
        ? await this.db
            .select({
              id: importItemDocuments.id,
              importItemId: importItemDocuments.importItemId,
              title: importItemDocuments.title,
              fileName: importItemDocuments.fileName,
              contentType: importItemDocuments.contentType,
              sizeBytes: importItemDocuments.sizeBytes,
              createdAt: importItemDocuments.createdAt,
            })
            .from(importItemDocuments)
            .where(inArray(importItemDocuments.importItemId, itemIds))
        : [];

    const docsByItemId = new Map<
      string,
      Array<{
        id: string;
        title: string;
        fileName: string;
        contentType: string;
        sizeBytes: number;
        createdAt: Date;
      }>
    >();
    for (const document of documents) {
      const existing = docsByItemId.get(document.importItemId) ?? [];
      existing.push({
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        contentType: document.contentType,
        sizeBytes: document.sizeBytes,
        createdAt: document.createdAt,
      });
      docsByItemId.set(document.importItemId, existing);
    }

    return {
      ...batch,
      items: items.map((item) => ({
        ...item,
        documents: docsByItemId.get(item.id) ?? [],
      })),
    };
  }

  async applyMatches(batchId: string, matches: ApplyMatchInput[]) {
    for (const match of matches) {
      await this.db
        .update(importItems)
        .set({
          normalizedName: match.normalizedName,
          category: match.category,
          confidence: match.confidence,
          reasoning: match.reasoning,
          candidates: match.candidates,
          updatedAt: new Date(),
        })
        .where(eq(importItems.id, match.itemId));
    }

    await this.db
      .update(importBatches)
      .set({ status: "matched", updatedAt: new Date() })
      .where(eq(importBatches.id, batchId));

    return this.getBatch(batchId);
  }

  async applyReview(batchId: string, reviews: ApplyReviewInput[]) {
    for (const review of reviews) {
      await this.db
        .update(importItems)
        .set({
          technicianDecision: review.technicianDecision,
          technicianNotes: review.technicianNotes,
          normalizedName: review.normalizedName,
          category: review.category,
          updatedAt: new Date(),
        })
        .where(eq(importItems.id, review.itemId));
    }

    await this.db
      .update(importBatches)
      .set({ status: "reviewed", updatedAt: new Date() })
      .where(eq(importBatches.id, batchId));

    return this.getBatch(batchId);
  }

  async markCommitted(batchId: string) {
    await this.db
      .update(importBatches)
      .set({ status: "committed", updatedAt: new Date() })
      .where(eq(importBatches.id, batchId));

    return this.getBatch(batchId);
  }

  async addDocument(
    importItemId: string,
    document: {
      title: string;
      fileName: string;
      contentType: string;
      sizeBytes: number;
      blob: Uint8Array;
    }
  ) {
    await this.db.insert(importItemDocuments).values({
      importItemId,
      title: document.title,
      fileName: document.fileName,
      contentType: document.contentType,
      sizeBytes: document.sizeBytes,
      blob: document.blob,
    });
  }
}
