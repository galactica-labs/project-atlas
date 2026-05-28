import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import {
  CreateTranscriptEntryDto,
  ManualTaskCatalogResponseDto,
  ManualTaskSearchRequestDto,
  ManualTaskSearchResponseDto,
  RealtimeSessionRequestDto,
  RealtimeSessionResponseDto,
  TranscriptListResponseDto,
} from "./dto/technician-assist.dto";
import { TechnicianAssistService } from "./technician-assist.service";

@ApiTags("Technician Assist")
@Controller("technician-assist")
export class TechnicianAssistController {
  constructor(private readonly technicianAssistService: TechnicianAssistService) {}

  @Get("manual/tasks")
  @ApiOkResponse({ type: ManualTaskCatalogResponseDto })
  listManualTasks() {
    return {
      tasks: this.technicianAssistService.listManualTasks(),
    };
  }

  @Post("manual/search")
  @ApiCreatedResponse({ type: ManualTaskSearchResponseDto })
  async searchManualTask(@Body() body: ManualTaskSearchRequestDto) {
    return this.technicianAssistService.searchManualTask(body.description);
  }

  @Post("realtime/session")
  @ApiCreatedResponse({ type: RealtimeSessionResponseDto })
  createRealtimeSession(@Body() body: RealtimeSessionRequestDto) {
    return this.technicianAssistService.createRealtimeSession(body);
  }

  @Post("transcripts")
  @ApiCreatedResponse({
    schema: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
      },
    },
  })
  addTranscript(@Body() body: CreateTranscriptEntryDto) {
    return this.technicianAssistService.addTranscript(body);
  }

  @Get("transcripts")
  @ApiOkResponse({ type: TranscriptListResponseDto })
  listTranscripts() {
    return {
      items: this.technicianAssistService.listTranscripts(),
    };
  }
}
