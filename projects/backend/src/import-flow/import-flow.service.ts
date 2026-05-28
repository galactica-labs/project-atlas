import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ComponentCatalogRepository, ImportBatchRepository } from "../db";
import type { ReviewImportBatchDto } from "./dto/review-import-batch.dto";
import { ImportMatchingService } from "./import-matching.service";
import { IngressControllerService } from "./ingress-controller.service";

@Injectable()
export class ImportFlowService {
  constructor(
    private readonly componentCatalogRepository: ComponentCatalogRepository,
    private readonly importBatchRepository: ImportBatchRepository,
    private readonly importMatchingService: ImportMatchingService,
    private readonly ingressControllerService: IngressControllerService
  ) {}

  async pullFromIngress() {
    const payload = this.ingressControllerService.pullGenesisPayload();
    return this.importBatchRepository.createFromIngress(payload.sourceLabel, payload.items);
  }

  async getBatch(batchId: string) {
    const batch = await this.importBatchRepository.getBatch(batchId);
    if (!batch) {
      throw new NotFoundException(`Import batch ${batchId} not found`);
    }

    return batch;
  }

  async runMatching(batchId: string) {
    const batch = await this.getBatch(batchId);
    const matches = await this.importMatchingService.matchItems(
      batch.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        rawPayload: item.rawPayload,
        sku: item.sku,
        vendor: item.vendor,
      }))
    );

    return this.importBatchRepository.applyMatches(batchId, matches);
  }

  async submitReview(batchId: string, dto: ReviewImportBatchDto) {
    await this.getBatch(batchId);
    return this.importBatchRepository.applyReview(batchId, dto.items);
  }

  async uploadDocument(
    batchId: string,
    itemId: string,
    file:
      | {
          buffer: Uint8Array;
          mimetype: string;
          originalname: string;
          size: number;
        }
      | undefined
  ) {
    const batch = await this.getBatch(batchId);
    const item = batch.items.find((entry) => entry.id === itemId);

    if (!item) {
      throw new NotFoundException(`Import item ${itemId} not found in batch ${batchId}`);
    }

    if (!file || file.size === 0) {
      throw new BadRequestException("PDF file is required");
    }

    const isPdf =
      file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      throw new BadRequestException("Only PDF uploads are supported");
    }

    await this.importBatchRepository.addDocument(itemId, {
      title: file.originalname.replace(/\.pdf$/i, ""),
      fileName: file.originalname,
      contentType: "application/pdf",
      sizeBytes: file.size,
      blob: file.buffer,
    });

    return this.getBatch(batchId);
  }

  async commitBatch(batchId: string) {
    const batch = await this.getBatch(batchId);

    const eligibleItems = batch.items.filter(
      (item) =>
        item.documents.length > 0 &&
        (item.technicianDecision === "confirmed" || item.technicianDecision === "edited") &&
        item.normalizedName &&
        item.category
    );

    if (eligibleItems.length !== batch.items.length) {
      throw new UnprocessableEntityException(
        "All items must have documents and technician confirmation before commit"
      );
    }

    const catalogEntries = await this.componentCatalogRepository.createFromImportItems(
      eligibleItems.map((item) => item.id)
    );

    const committedBatch = await this.importBatchRepository.markCommitted(batchId);

    return {
      batch: committedBatch,
      catalogEntries,
    };
  }
}
