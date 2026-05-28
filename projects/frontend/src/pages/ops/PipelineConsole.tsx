/**
 * Live pipeline console — drives the atlas_ml engine end-to-end through the
 * type-safe bridge client. Every call is checked against the generated OpenAPI
 * types (see src/lib/atlasApi.ts). Replaces the /ops/approvals placeholder.
 */
import { useEffect, useState } from "react";
import {
  type ActionResult,
  type ApprovalDecision,
  type ApprovalRequest,
  atlasApi,
  type Dispatch,
  type Incident,
} from "@/lib/atlasApi";

const DEMO_ASSET = "CHILLER-A-03";

type Stage = ActionResult | Dispatch | ApprovalRequest | ApprovalDecision;

export default function PipelineConsole() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [action, setAction] = useState<ActionResult | null>(null);
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);
  const [audit, setAudit] = useState<string>("");

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setIncident(null);
    setAction(null);
    setDispatch(null);
    setApproval(null);
    setDecision(null);
  };

  const simulate = () =>
    run(async () => {
      reset();
      setIncident(await atlasApi.simulateIncident(DEMO_ASSET));
    });

  const decide = () =>
    run(async () => {
      if (!incident) return;
      setAction(await atlasApi.decideAction(incident.signal.id));
    });

  const propose = () =>
    run(async () => {
      if (!incident) return;
      setDispatch(await atlasApi.dispatch(incident.signal.id));
    });

  const askApproval = () =>
    run(async () => {
      if (!incident) return;
      setApproval(await atlasApi.submitApproval(incident.signal.id));
    });

  const resolve = (d: "approve" | "reject") =>
    run(async () => {
      if (!approval) return;
      setDecision(
        await atlasApi.resolveApproval(
          approval.id,
          d,
          "ops_manager",
          d === "reject" ? "Not now" : undefined
        )
      );
      const v = await atlasApi.auditVerify();
      setAudit(`${v.valid ? "VERIFIED" : "COMPROMISED"} · ${v.n_records} records`);
    });

  useEffect(() => {
    void atlasApi
      .auditVerify()
      .then((v) => setAudit(`${v.valid ? "VERIFIED" : "COMPROMISED"} · ${v.n_records} records`))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 min-h-full">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-zinc-600">
          Operations · Live pipeline
        </span>
        <h1 className="text-[22px] font-semibold tracking-tight mt-1">Pipeline Console</h1>
        <p className="text-[13px] text-zinc-600 mt-0.5">
          Sentinel → Triton → Hephaestus → Policy → HITL → Hermes, driven through the typed bridge.
          {audit && <span className="ml-2 text-zinc-500">Audit: {audit}</span>}
        </p>
      </div>

      {err && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] text-[12px] text-red-300">
          {err}
          <p className="text-[11px] text-zinc-500 mt-1">
            Is the engine running? <code>uvicorn atlas_ml.service.app:app --port 8000</code>
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <Btn onClick={simulate} disabled={busy} primary>
          1 · Simulate anomaly
        </Btn>
        <Btn onClick={decide} disabled={busy || !incident}>
          2 · Decide + policy
        </Btn>
        <Btn onClick={propose} disabled={busy || !incident}>
          3 · Dispatch
        </Btn>
        <Btn onClick={askApproval} disabled={busy || !incident}>
          4 · Request approval
        </Btn>
      </div>

      <div className="space-y-3">
        {incident && (
          <Card title={`Sentinel + Triton · ${incident.signal.asset_id}`} tone="red">
            <Row k="z-score" v={incident.signal.z_score.toFixed(2)} />
            <Row k="failure mode" v={incident.triage.failure_mode_hypothesis} />
            <Row k="confidence" v={incident.triage.confidence.toFixed(2)} />
            <Row k="time to failure" v={`${incident.triage.time_to_failure_seconds}s`} />
            <Row
              k="blast radius"
              v={incident.triage.blast_radius.map((b) => b.asset_id).join(", ")}
            />
          </Card>
        )}
        {action && (
          <Card title="Hephaestus + Policy" tone="amber">
            <Row k="action" v={action.action.action_type} />
            <Row k="tags" v={action.action.action_tags.join(", ")} />
            <Row k="cited" v={action.action.cited_manual_sections.join("; ")} />
            <Row k="policy" v={`${action.policy_effect} (${action.policy_rule ?? "default"})`} />
          </Card>
        )}
        {dispatch && (
          <Card title="Hermes dispatch" tone="blue">
            <Row k="chosen tech" v={dispatch.chosen_tech_id} />
            <Row k="eta" v={`${dispatch.eta_minutes} min`} />
            <Row k="parts" v={dispatch.parts_status} />
            <Row k="MILP" v={dispatch.milp_status} />
            <Row k="shortlist" v={dispatch.rag_candidates.join(", ")} />
          </Card>
        )}
        {approval && !decision && (
          <Card title="HITL approval pending" tone="amber">
            <Row k="request" v={approval.id.slice(0, 8)} />
            <Row k="proposed tech" v={approval.dispatch?.chosen_tech_id ?? "—"} />
            <div className="flex gap-2 mt-3">
              <Btn onClick={() => resolve("approve")} disabled={busy} primary>
                Approve
              </Btn>
              <Btn onClick={() => resolve("reject")} disabled={busy}>
                Reject
              </Btn>
            </div>
          </Card>
        )}
        {decision && (
          <Card title="Resolved" tone={decision.decision === "approve" ? "emerald" : "red"}>
            <Row k="decision" v={decision.decision} />
            <Row k="approver" v={decision.approver_id} />
            <Row k="signature" v={decision.signature.slice(0, 16) + "…"} />
          </Card>
        )}
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-[12px] font-medium px-3.5 py-2 rounded-xl ring-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        primary
          ? "bg-white text-black ring-white/20 hover:bg-zinc-200"
          : "bg-white/[0.04] text-zinc-300 ring-white/[0.08] hover:bg-white/[0.07]"
      }`}
    >
      {children}
    </button>
  );
}

const toneRing = {
  red: "ring-red-500/22",
  amber: "ring-amber-500/20",
  blue: "ring-blue-500/18",
  emerald: "ring-emerald-500/22",
} as const;

function Card({
  title,
  tone,
  children,
}: {
  title: string;
  tone: keyof typeof toneRing;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl ring-1 ${toneRing[tone]} bg-[#0a0a0a] px-4 py-4`}>
      <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-zinc-500 mb-2.5">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start gap-3 text-[12px]">
      <span className="text-zinc-600 w-28 flex-shrink-0">{k}</span>
      <span className="text-zinc-200 font-mono text-[11px] break-all">{v}</span>
    </div>
  );
}
