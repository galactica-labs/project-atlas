import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import {
  CommitImportBatchResponseDto,
  ImportBatchResponseDto,
} from "./dto/import-flow-response.dto";
import { ReviewImportBatchDto } from "./dto/review-import-batch.dto";
import { ImportFlowService } from "./import-flow.service";

@ApiTags("Genesis")
@Controller("import-flows")
export class ImportFlowController {
  constructor(private readonly importFlowService: ImportFlowService) {}

  @Post("ingress/pull")
  @ApiCreatedResponse({ type: ImportBatchResponseDto })
  pullFromIngress() {
    return this.importFlowService.pullFromIngress();
  }

  @Get(":batchId")
  @ApiOkResponse({ type: ImportBatchResponseDto })
  getBatch(@Param("batchId") batchId: string) {
    return this.importFlowService.getBatch(batchId);
  }

  @Post(":batchId/match")
  @ApiCreatedResponse({ type: ImportBatchResponseDto })
  runMatching(@Param("batchId") batchId: string) {
    return this.importFlowService.runMatching(batchId);
  }

  @Post(":batchId/review")
  @ApiCreatedResponse({ type: ImportBatchResponseDto })
  submitReview(@Param("batchId") batchId: string, @Body() body: ReviewImportBatchDto) {
    return this.importFlowService.submitReview(batchId, body);
  }

  @Post(":batchId/items/:itemId/documents")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 15 * 1024 * 1024 } }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
      required: ["file"],
    },
  })
  @ApiCreatedResponse({ type: ImportBatchResponseDto })
  uploadDocument(
    @Param("batchId") batchId: string,
    @Param("itemId") itemId: string,
    @UploadedFile()
    file:
      | {
          buffer: Uint8Array;
          mimetype: string;
          originalname: string;
          size: number;
        }
      | undefined
  ) {
    return this.importFlowService.uploadDocument(batchId, itemId, file);
  }

  @Post(":batchId/commit")
  @ApiCreatedResponse({ type: CommitImportBatchResponseDto })
  commitBatch(@Param("batchId") batchId: string) {
    return this.importFlowService.commitBatch(batchId);
  }
}
