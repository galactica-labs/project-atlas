import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import {
  ActionResultDto,
  ApprovalDecisionDto,
  ApprovalRequestDto,
  AssetDto,
  AssetListDto,
  AuditVerifyDto,
  BlastRadiusDto,
  ComplianceReportDto,
  DependenciesDto,
  DispatchDto,
  IncidentDto,
  IncidentListDto,
  ResolveApprovalDto,
  SimulateIncidentDto,
} from "./dto/pipeline.dto";
import { PipelineService } from "./pipeline.service";

@ApiTags("Pipeline")
@Controller("pipeline")
export class PipelineController {
  constructor(private readonly pipeline: PipelineService) {}

  @Get("assets")
  @ApiOkResponse({ type: AssetListDto })
  listAssets() {
    return this.pipeline.listAssets();
  }

  @Get("assets/:id")
  @ApiOkResponse({ type: AssetDto })
  getAsset(@Param("id") id: string) {
    return this.pipeline.getAsset(id);
  }

  @Get("assets/:id/blast-radius")
  @ApiOkResponse({ type: BlastRadiusDto })
  blastRadius(@Param("id") id: string, @Query("hops") hops?: string) {
    return this.pipeline.blastRadius(id, hops ? Number.parseInt(hops, 10) : 3);
  }

  @Get("assets/:id/dependencies")
  @ApiOkResponse({ type: DependenciesDto })
  dependencies(@Param("id") id: string) {
    return this.pipeline.dependencies(id);
  }

  @Post("incidents/simulate")
  @ApiCreatedResponse({ type: IncidentDto })
  simulateIncident(@Body() body: SimulateIncidentDto) {
    return this.pipeline.simulateIncident(body);
  }

  @Get("incidents")
  @ApiOkResponse({ type: IncidentListDto })
  listIncidents() {
    return this.pipeline.listIncidents();
  }

  @Post("incidents/:signalId/action")
  @ApiCreatedResponse({ type: ActionResultDto })
  decideAction(@Param("signalId") signalId: string) {
    return this.pipeline.decideAction(signalId);
  }

  @Post("incidents/:signalId/dispatch")
  @ApiCreatedResponse({ type: DispatchDto })
  dispatch(@Param("signalId") signalId: string) {
    return this.pipeline.dispatch(signalId);
  }

  @Post("incidents/:signalId/approval")
  @ApiCreatedResponse({ type: ApprovalRequestDto })
  submitApproval(@Param("signalId") signalId: string) {
    return this.pipeline.submitApproval(signalId);
  }

  @Post("approvals/:requestId/resolve")
  @ApiCreatedResponse({ type: ApprovalDecisionDto })
  resolveApproval(@Param("requestId") requestId: string, @Body() body: ResolveApprovalDto) {
    return this.pipeline.resolveApproval(requestId, body);
  }

  @Get("audit/verify")
  @ApiOkResponse({ type: AuditVerifyDto })
  auditVerify() {
    return this.pipeline.auditVerify();
  }

  @Get("audit/report")
  @ApiOkResponse({ type: ComplianceReportDto })
  auditReport() {
    return this.pipeline.auditReport();
  }
}
