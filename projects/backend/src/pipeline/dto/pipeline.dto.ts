import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

// ── requests ────────────────────────────────────────────────────────────────
export class SimulateIncidentDto {
  @ApiProperty({ example: "CHILLER-A-03" })
  @IsString()
  asset_id!: string;

  @ApiProperty({ example: "supply_temperature", default: "supply_temperature" })
  @IsOptional()
  @IsString()
  metric!: string;
}

export class ResolveApprovalDto {
  @ApiProperty({ example: "ops_manager", default: "ops_manager" })
  @IsOptional()
  @IsString()
  approver_id!: string;

  @ApiProperty({ enum: ["approve", "reject", "modify"], example: "approve" })
  @IsIn(["approve", "reject", "modify"])
  decision!: "approve" | "reject" | "modify";

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  reason?: string | null;
}

// ── assets / graph ───────────────────────────────────────────────────────────
export class AssetDto {
  @ApiProperty() id!: string;
  @ApiProperty() asset_type!: string;
  @ApiProperty() model!: string;
  @ApiProperty({ enum: ["low", "medium", "high", "critical"] }) criticality!: string;
  @ApiProperty({ type: Object, additionalProperties: true }) location!: Record<string, unknown>;
  @ApiProperty({ type: [String] }) manual_ids!: string[];
}

export class AssetListDto {
  @ApiProperty({ type: () => AssetDto, isArray: true }) assets!: AssetDto[];
}

export class BlastRadiusNodeDto {
  @ApiProperty() asset_id!: string;
  @ApiProperty() hops_from_source!: number;
  @ApiProperty() estimated_impact_at!: string;
  @ApiProperty({
    enum: ["loss_of_cooling", "loss_of_power", "loss_of_capacity", "degraded"],
  })
  impact_type!: string;
}

export class BlastRadiusDto {
  @ApiProperty() asset_id!: string;
  @ApiProperty({ type: () => BlastRadiusNodeDto, isArray: true }) nodes!: BlastRadiusNodeDto[];
}

export class DependenciesDto {
  @ApiProperty() asset_id!: string;
  @ApiProperty({ type: [String] }) dependencies!: string[];
  @ApiProperty({ type: [String] }) dependents!: string[];
}

// ── incident / triage ────────────────────────────────────────────────────────
export class AnomalySignalDto {
  @ApiProperty() id!: string;
  @ApiProperty() asset_id!: string;
  @ApiProperty() metric!: string;
  @ApiProperty() current_value!: number;
  @ApiProperty() baseline_mean!: number;
  @ApiProperty() baseline_std!: number;
  @ApiProperty() z_score!: number;
  @ApiProperty({ enum: ["info", "warn", "critical"] }) severity!: string;
  @ApiProperty() detected_at!: string;
}

export class QuantileForecastDto {
  @ApiProperty() metric!: string;
  @ApiProperty() horizon_seconds!: number;
  @ApiProperty({ type: [Number] }) q05!: number[];
  @ApiProperty({ type: [Number] }) q50!: number[];
  @ApiProperty({ type: [Number] }) q95!: number[];
  @ApiProperty() threshold!: number;
  @ApiProperty({ enum: ["above", "below"] }) threshold_direction!: string;
  @ApiPropertyOptional({ nullable: true, type: Number })
  time_to_q50_crosses_threshold?: number | null;
  @ApiPropertyOptional({ nullable: true, type: Number })
  time_to_q95_crosses_threshold?: number | null;
  @ApiProperty() uncertainty_band_width!: number;
}

export class TriageReportDto {
  @ApiProperty() signal_id!: string;
  @ApiProperty() failure_mode_hypothesis!: string;
  @ApiProperty() time_to_failure_seconds!: number;
  @ApiProperty() confidence!: number;
  @ApiProperty({ type: () => QuantileForecastDto }) quantile_forecast!: QuantileForecastDto;
  @ApiProperty({ type: () => BlastRadiusNodeDto, isArray: true })
  blast_radius!: BlastRadiusNodeDto[];
  @ApiProperty() reasoning!: string;
}

export class IncidentDto {
  @ApiProperty({ type: () => AnomalySignalDto }) signal!: AnomalySignalDto;
  @ApiProperty({ type: () => TriageReportDto }) triage!: TriageReportDto;
}

export class IncidentSummaryDto {
  @ApiProperty() signal_id!: string;
  @ApiProperty() asset_id!: string;
  @ApiProperty() metric!: string;
  @ApiProperty() z_score!: number;
  @ApiProperty() severity!: string;
  @ApiProperty() failure_mode!: string;
  @ApiProperty() confidence!: number;
  @ApiProperty() time_to_failure_seconds!: number;
  @ApiProperty() detected_at!: string;
}

export class IncidentListDto {
  @ApiProperty({ type: () => IncidentSummaryDto, isArray: true }) incidents!: IncidentSummaryDto[];
}

// ── action / policy ──────────────────────────────────────────────────────────
export class ProposedActionDto {
  @ApiProperty() id!: string;
  @ApiProperty() triage_id!: string;
  @ApiProperty({
    enum: ["dispatch_tech", "shutdown", "throttle", "wait", "schedule_maintenance"],
  })
  action_type!: string;
  @ApiProperty({ type: [String] }) action_tags!: string[];
  @ApiProperty() target_asset_id!: string;
  @ApiProperty() rationale!: string;
  @ApiProperty({ type: [String] }) cited_manual_sections!: string[];
  @ApiProperty() agent_confidence!: number;
  @ApiProperty() requires_approval!: boolean;
  @ApiPropertyOptional({ type: String, nullable: true }) approval_reason?: string | null;
}

export class ActionResultDto {
  @ApiProperty({ type: () => ProposedActionDto }) action!: ProposedActionDto;
  @ApiProperty({ enum: ["auto_execute", "require_approval", "block"] }) policy_effect!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) policy_rule?: string | null;
  @ApiProperty({ type: [String] }) approvers!: string[];
}

// ── dispatch ─────────────────────────────────────────────────────────────────
export class DispatchDto {
  @ApiProperty() id!: string;
  @ApiProperty() action_id!: string;
  @ApiProperty() chosen_tech_id!: string;
  @ApiProperty({ type: [String] }) rag_candidates!: string[];
  @ApiProperty({ type: Object, isArray: true }) milp_alternatives!: Record<string, unknown>[];
  @ApiProperty() explanation!: string;
  @ApiProperty() eta_minutes!: number;
  @ApiProperty({ type: [String] }) parts_needed!: string[];
  @ApiProperty({ enum: ["in_van", "in_warehouse", "to_order"] }) parts_status!: string;
  @ApiProperty({ enum: ["optimal", "fallback_rag", "infeasible"] }) milp_status!: string;
}

// ── approvals ────────────────────────────────────────────────────────────────
export class ApprovalRequestDto {
  @ApiProperty() id!: string;
  @ApiProperty({ type: () => ProposedActionDto }) action!: ProposedActionDto;
  @ApiProperty({ type: () => TriageReportDto }) triage!: TriageReportDto;
  @ApiPropertyOptional({ type: () => DispatchDto, nullable: true }) dispatch?: DispatchDto | null;
  @ApiProperty({ type: [String] }) sent_to!: string[];
  @ApiProperty() sent_at!: string;
  @ApiProperty() expires_at!: string;
}

export class ApprovalDecisionDto {
  @ApiProperty() request_id!: string;
  @ApiProperty() approver_id!: string;
  @ApiProperty({ enum: ["approve", "reject", "modify"] }) decision!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) reason?: string | null;
  @ApiPropertyOptional({ type: Object, nullable: true, additionalProperties: true })
  modified_action?: Record<string, unknown> | null;
  @ApiProperty() signature!: string;
  @ApiProperty() decided_at!: string;
}

// ── audit ────────────────────────────────────────────────────────────────────
export class AuditVerifyDto {
  @ApiProperty() valid!: boolean;
  @ApiProperty() n_records!: number;
  @ApiProperty({ type: Object, isArray: true }) issues!: Record<string, unknown>[];
}

export class ComplianceReportDto {
  @ApiProperty() generated_at!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) window_start?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) window_end?: string | null;
  @ApiProperty() total_events!: number;
  @ApiProperty({ type: Object, additionalProperties: true }) by_action!: Record<string, number>;
  @ApiProperty({ type: Object, isArray: true }) approval_decisions!: Record<string, unknown>[];
  @ApiProperty({ enum: ["VERIFIED", "COMPROMISED"] }) chain_integrity!: string;
  @ApiProperty({ type: Object, isArray: true }) integrity_issues!: Record<string, unknown>[];
  @ApiPropertyOptional({ type: String, nullable: true }) html_path?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) pdf_path?: string | null;
}
