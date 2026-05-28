import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class ImportDocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  sizeBytes!: number;

  @ApiProperty()
  createdAt!: string;
}

class ReasoningCandidateDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  confidence!: number;

  @ApiProperty()
  notes!: string;
}

class ImportItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  batchId!: string;

  @ApiProperty()
  ingressKey!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  vendor!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ additionalProperties: true })
  rawPayload!: Record<string, unknown>;

  @ApiPropertyOptional({ nullable: true })
  normalizedName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  category!: string | null;

  @ApiPropertyOptional({ nullable: true })
  confidence!: number | null;

  @ApiPropertyOptional({ nullable: true })
  reasoning!: string | null;

  @ApiProperty({ type: [ReasoningCandidateDto] })
  candidates!: ReasoningCandidateDto[];

  @ApiProperty({ enum: ["pending", "confirmed", "edited", "needs-doc"] })
  technicianDecision!: "pending" | "confirmed" | "edited" | "needs-doc";

  @ApiPropertyOptional({ nullable: true })
  technicianNotes!: string | null;

  @ApiProperty({ type: [ImportDocumentResponseDto] })
  documents!: ImportDocumentResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ImportBatchResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ["ingress-controller"] })
  source!: "ingress-controller";

  @ApiProperty()
  sourceLabel!: string;

  @ApiProperty({ enum: ["ingested", "matched", "reviewed", "committed"] })
  status!: "ingested" | "matched" | "reviewed" | "committed";

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: [ImportItemResponseDto] })
  items!: ImportItemResponseDto[];
}

class ComponentCatalogEntryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  importItemId!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  vendor!: string;

  @ApiProperty()
  normalizedName!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  confidence!: number;

  @ApiProperty({ enum: ["pending", "confirmed", "edited", "needs-doc"] })
  technicianDecision!: "pending" | "confirmed" | "edited" | "needs-doc";

  @ApiProperty({ type: [ImportDocumentResponseDto] })
  documentation!: ImportDocumentResponseDto[];

  @ApiProperty()
  createdAt!: string;
}

export class CommitImportBatchResponseDto {
  @ApiProperty({ type: ImportBatchResponseDto })
  batch!: ImportBatchResponseDto;

  @ApiProperty({ type: [ComponentCatalogEntryResponseDto] })
  catalogEntries!: ComponentCatalogEntryResponseDto[];
}
