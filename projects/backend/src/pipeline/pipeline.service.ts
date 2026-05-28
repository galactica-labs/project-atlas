import type { MessageEvent } from "@nestjs/common";
import { HttpException, Inject, Injectable } from "@nestjs/common";
import type { ConfigType } from "@nestjs/config";
import { Observable } from "rxjs";
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

  // ── SSE stream proxies ────────────────────────────────────────────────────

  /**
   * Proxy the Python /telemetry/stream SSE endpoint.
   * Each emitted MessageEvent carries a JSON object:
   *   { ts, ticks: [{asset_id, asset_type, metric, value}] }
   */
  streamTelemetry(): Observable<MessageEvent> {
    return this._proxySSE("/telemetry/stream");
  }

  /**
   * Proxy the Python /logs/stream SSE endpoint.
   * Each emitted MessageEvent carries a Sentinel log entry JSON object:
   *   { seq, ts, agent, asset_id, metric, value, z_score, severity, message }
   */
  streamLogs(): Observable<MessageEvent> {
    return this._proxySSE("/logs/stream");
  }

  private _proxySSE(path: string): Observable<MessageEvent> {
    const url = `${this.baseUrl}${path}`;
    return new Observable<MessageEvent>((subscriber) => {
      const controller = new AbortController();

      (async () => {
        try {
          const res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: "text/event-stream" },
          });

          if (!res.ok || !res.body) {
            subscriber.error(new Error(`SSE upstream ${path} returned ${res.status}`));
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              subscriber.complete();
              break;
            }
            buffer += decoder.decode(value, { stream: true });

            // SSE events are delimited by double newlines.
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";

            for (const part of parts) {
              for (const line of part.split("\n")) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    subscriber.next({ data } as MessageEvent);
                  } catch {
                    // skip malformed JSON frames
                  }
                }
              }
            }
          }
        } catch (err: unknown) {
          if (!controller.signal.aborted) {
            subscriber.error(err);
          }
        }
      })();

      // Teardown: abort the upstream fetch when the subscriber unsubscribes.
      return () => controller.abort();
    });
  }
}
