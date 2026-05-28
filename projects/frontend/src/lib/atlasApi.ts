/**
 * Type-safe client for the Atlas pipeline bridge (NestJS -> atlas_ml engine).
 *
 * Types come from @atlas/api-types (generated from the backend OpenAPI schema),
 * so request paths, params, and response shapes are all checked at compile time.
 * Vite proxies /api -> backend :3001, so baseUrl stays relative.
 */
import { createPublicApiClient } from "@atlas/api-client";
import type { components } from "@atlas/api-types";

const client = createPublicApiClient();

// re-export the generated DTOs the UI works with
export type Asset = components["schemas"]["AssetDto"];
export type Incident = components["schemas"]["IncidentDto"];
export type IncidentSummary = components["schemas"]["IncidentSummaryDto"];
export type TriageReport = components["schemas"]["TriageReportDto"];
export type ActionResult = components["schemas"]["ActionResultDto"];
export type Dispatch = components["schemas"]["DispatchDto"];
export type ApprovalRequest = components["schemas"]["ApprovalRequestDto"];
export type ApprovalDecision = components["schemas"]["ApprovalDecisionDto"];
export type BlastRadius = components["schemas"]["BlastRadiusDto"];
export type AuditVerify = components["schemas"]["AuditVerifyDto"];
export type ComplianceReport = components["schemas"]["ComplianceReportDto"];

function unwrap<T>(res: { data?: T; error?: unknown }): T {
  if (res.error) {
    throw new Error(typeof res.error === "string" ? res.error : JSON.stringify(res.error));
  }
  return res.data as T;
}

export const atlasApi = {
  async listAssets() {
    return unwrap(await client.GET("/api/pipeline/assets")).assets;
  },
  async blastRadius(id: string, hops = 3) {
    return unwrap(
      await client.GET("/api/pipeline/assets/{id}/blast-radius", {
        params: { path: { id }, query: { hops: String(hops) } },
      })
    );
  },
  async listIncidents() {
    return unwrap(await client.GET("/api/pipeline/incidents")).incidents;
  },
  async simulateIncident(asset_id: string, metric = "supply_temperature") {
    return unwrap(
      await client.POST("/api/pipeline/incidents/simulate", { body: { asset_id, metric } })
    );
  },
  async decideAction(signalId: string) {
    return unwrap(
      await client.POST("/api/pipeline/incidents/{signalId}/action", {
        params: { path: { signalId } },
      })
    );
  },
  async dispatch(signalId: string) {
    return unwrap(
      await client.POST("/api/pipeline/incidents/{signalId}/dispatch", {
        params: { path: { signalId } },
      })
    );
  },
  async submitApproval(signalId: string) {
    return unwrap(
      await client.POST("/api/pipeline/incidents/{signalId}/approval", {
        params: { path: { signalId } },
      })
    );
  },
  async resolveApproval(
    requestId: string,
    decision: "approve" | "reject" | "modify",
    approver_id = "ops_manager",
    reason?: string
  ) {
    return unwrap(
      await client.POST("/api/pipeline/approvals/{requestId}/resolve", {
        params: { path: { requestId } },
        body: { approver_id, decision, reason },
      })
    );
  },
  async auditVerify() {
    return unwrap(await client.GET("/api/pipeline/audit/verify"));
  },
};
