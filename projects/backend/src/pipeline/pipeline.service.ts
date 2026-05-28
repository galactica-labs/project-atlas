import { HttpException, Inject, Injectable } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { engineConfig } from "../config";
import type {
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

/**
 * Bridge to the atlas_ml FastAPI engine. Every method is a thin typed proxy:
 * it forwards to the Python engine and surfaces its status/body on error.
 */
@Injectable()
export class PipelineService {
  private readonly baseUrl: string;

  constructor(
    @Inject(engineConfig.KEY)
    config: ConfigType<typeof engineConfig>
  ) {
    this.baseUrl = (config.url ?? "http://localhost:8000").replace(/\/$/, "");
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (cause) {
      throw new HttpException(
        `Atlas engine unreachable at ${this.baseUrl}. Is it running? (uvicorn atlas_ml.service.app:app)`,
        502
      );
    }
    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      const detail = (data && (data.detail ?? data.message)) ?? text;
      throw new HttpException(typeof detail === "string" ? detail : data, res.status);
    }
    return data as T;
  }

  // assets / graph
  listAssets() {
    return this.request<AssetListDto>("GET", "/assets");
  }
  getAsset(id: string) {
    return this.request<AssetDto>("GET", `/assets/${encodeURIComponent(id)}`);
  }
  blastRadius(id: string, hops: number) {
    return this.request<BlastRadiusDto>(
      "GET",
      `/assets/${encodeURIComponent(id)}/blast-radius?hops=${hops}`
    );
  }
  dependencies(id: string) {
    return this.request<DependenciesDto>("GET", `/assets/${encodeURIComponent(id)}/dependencies`);
  }

  // incidents
  simulateIncident(body: SimulateIncidentDto) {
    return this.request<IncidentDto>("POST", "/incidents/simulate", body);
  }
  listIncidents() {
    return this.request<IncidentListDto>("GET", "/incidents");
  }
  decideAction(signalId: string) {
    return this.request<ActionResultDto>(
      "POST",
      `/incidents/${encodeURIComponent(signalId)}/action`
    );
  }
  dispatch(signalId: string) {
    return this.request<DispatchDto>("POST", `/incidents/${encodeURIComponent(signalId)}/dispatch`);
  }
  submitApproval(signalId: string) {
    return this.request<ApprovalRequestDto>(
      "POST",
      `/incidents/${encodeURIComponent(signalId)}/approval`
    );
  }
  resolveApproval(requestId: string, body: ResolveApprovalDto) {
    return this.request<ApprovalDecisionDto>(
      "POST",
      `/approvals/${encodeURIComponent(requestId)}/resolve`,
      body
    );
  }

  // audit
  auditVerify() {
    return this.request<AuditVerifyDto>("GET", "/audit/verify");
  }
  auditReport() {
    return this.request<ComplianceReportDto>("GET", "/audit/report");
  }
}
