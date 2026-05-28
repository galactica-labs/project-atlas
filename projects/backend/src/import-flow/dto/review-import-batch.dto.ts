import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

class ImportItemReviewDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ enum: ["confirmed", "edited", "needs-doc"] })
  @IsIn(["confirmed", "edited", "needs-doc"])
  technicianDecision!: "confirmed" | "edited" | "needs-doc";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicianNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  normalizedName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class ReviewImportBatchDto {
  @ApiProperty({ type: [ImportItemReviewDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportItemReviewDto)
  items!: ImportItemReviewDto[];
}
