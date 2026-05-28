import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ManualTaskDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  sourceSection!: string;

  @ApiProperty({ type: [String] })
  keywords!: string[];

  @ApiProperty({ type: [String] })
  steps!: string[];
}

export class ManualTaskCatalogResponseDto {
  @ApiProperty({ type: [ManualTaskDto] })
  tasks!: ManualTaskDto[];
}

export class ManualTaskSearchRequestDto {
  @ApiProperty({
    description: "Short task phrase like 'reset bios', 'rear ports', or 'upgrade memory'.",
  })
  @IsString()
  description!: string;
}

export class ManualTaskSearchResponseDto {
  @ApiProperty()
  found!: boolean;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional()
  sourceSection?: string;

  @ApiProperty({ type: [String] })
  steps!: string[];

  @ApiPropertyOptional({ enum: ["direct", "keyword", "token"] })
  matchMethod?: "direct" | "keyword" | "token";

  @ApiPropertyOptional({ type: [String] })
  alternatives?: string[];

  @ApiPropertyOptional({ type: [String] })
  availableTasks?: string[];
}

export class RealtimeSessionRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assetName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taskHint?: string;
}

export class RealtimeSessionResponseDto {
  @ApiProperty()
  value!: string;

  @ApiPropertyOptional()
  expiresAt?: number | null;
}

export class TranscriptEntryDto {
  @ApiProperty()
  engineerId!: string;

  @ApiProperty()
  engineerName!: string;

  @ApiProperty({ enum: ["user", "assistant", "system"] })
  role!: "user" | "assistant" | "system";

  @ApiProperty()
  text!: string;

  @ApiProperty()
  timestamp!: string;
}

export class CreateTranscriptEntryDto {
  @ApiProperty()
  @IsString()
  engineerId!: string;

  @ApiProperty()
  @IsString()
  engineerName!: string;

  @ApiProperty({ enum: ["user", "assistant", "system"] })
  @IsString()
  role!: "user" | "assistant" | "system";

  @ApiProperty()
  @IsString()
  text!: string;

  @ApiProperty()
  @IsString()
  timestamp!: string;
}

export class TranscriptListResponseDto {
  @ApiProperty({ type: [TranscriptEntryDto] })
  items!: TranscriptEntryDto[];
}
