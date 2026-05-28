import { createPublicApiClient } from "@atlas/api-client";
import type { components } from "@atlas/api-types";
import {
  BookOpenText,
  Brain,
  CheckCircle,
  Database,
  FileArrowUp,
  PencilSimple,
  SpinnerGap,
  UserFocus,
  WarningCircle,
} from "@phosphor-icons/react";
import { type ChangeEvent, type ReactNode, startTransition, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

type WizardStep = 1 | 2 | 3 | 4;
type BatchResponse = components["schemas"]["ImportBatchResponseDto"];
type CommitResponse = components["schemas"]["CommitImportBatchResponseDto"];
type ImportItem = components["schemas"]["ImportItemResponseDto"];
type ReviewPayload = components["schemas"]["ReviewImportBatchDto"];
type TechnicianDecision = components["schemas"]["ImportItemResponseDto"]["technicianDecision"];
type ReviewDecision = Exclude<TechnicianDecision, "pending">;

const client = createPublicApiClient();

const stepMeta = {
  1: {
    eyebrow: "Step 1",
    title: "Pull genesis batch",
    description: "Bring in the latest facility hardware groups from the ingress controller.",
    icon: FileArrowUp,
    progress: 25,
  },
  2: {
    eyebrow: "Step 2",
    title: "Map to Atlas catalog",
    description:
      "Normalize vendor SKUs into the Atlas component names your ops team uses on the floor.",
    icon: Brain,
    progress: 55,
  },
  3: {
    eyebrow: "Step 3",
    title: "Technician review",
    description:
      "Attach field documentation, correct mismatches, and approve what is safe to publish.",
    icon: UserFocus,
    progress: 82,
  },
  4: {
    eyebrow: "Final",
    title: "Publish catalog updates",
    description: "Write the reviewed Genesis batch into the Atlas component catalog.",
    icon: Database,
    progress: 100,
  },
} as const;

function Panel({
  title,
  subtitle,
  children,
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="rounded-[24px] border border-white/[0.06] bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">{subtitle}</p>
        <h2 className="mt-1 text-[18px] font-semibold text-white">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Request failed";
}

function getDecision(row: ImportItem, draftDecision: Record<string, TechnicianDecision>) {
  return draftDecision[row.id] ?? row.technicianDecision;
}

function toText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default function ImportFlow() {
  const [step, setStep] = useState<WizardStep>(1);
  const [batch, setBatch] = useState<BatchResponse | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftDecision, setDraftDecision] = useState<Record<string, TechnicianDecision>>({});
  const [draftName, setDraftName] = useState<Record<string, string>>({});
  const [draftCategory, setDraftCategory] = useState<Record<string, string>>({});
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"pull" | "match" | "review" | "commit" | "upload" | null>(
    null
  );

  const rows = batch?.items ?? [];
  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId]
  );

  const step1Complete = Boolean(batch && batch.items.length > 0);
  const step2Complete =
    rows.length > 0 && rows.every((row) => row.normalizedName && row.candidates.length > 0);
  const step3Complete =
    rows.length > 0 &&
    rows.every((row) => {
      const decision = getDecision(row, draftDecision);
      return row.documents.length > 0 && decision !== "pending" && decision !== "needs-doc";
    });

  const activeMeta = stepMeta[step];
  const ActiveIcon = activeMeta.icon;

  async function pullIngressBatch() {
    setLoading("pull");
    setErrorMessage(null);

    const { data, error } = await client.POST("/api/import-flows/ingress/pull");

    if (error || !data) {
      setErrorMessage(getErrorMessage(error) || "Failed to pull ingress batch.");
      setLoading(null);
      return;
    }

    startTransition(() => {
      setBatch(data);
      setSelectedId(data.items[0]?.id ?? "");
      setDraftNotes({});
      setDraftDecision({});
      setDraftName({});
      setDraftCategory({});
      setCommitResult(null);
      setLoading(null);
    });
  }

  async function runReasoningLayer() {
    if (!batch) return;

    setLoading("match");
    setErrorMessage(null);

    const { data, error } = await client.POST("/api/import-flows/{batchId}/match", {
      params: { path: { batchId: batch.id } },
    });

    if (error || !data) {
      setErrorMessage(getErrorMessage(error) || "Failed to run reasoning layer.");
      setLoading(null);
      return;
    }

    startTransition(() => {
      setBatch(data);
      setSelectedId(data.items[0]?.id ?? "");
      setLoading(null);
    });
  }

  async function uploadPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!batch || !selectedRow || !file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files can be uploaded.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading("upload");
    setErrorMessage(null);

    const response = await fetch(
      `/api/import-flows/${batch.id}/items/${selectedRow.id}/documents`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      setErrorMessage("Failed to upload PDF for selected item.");
      setLoading(null);
      return;
    }

    const nextBatch = (await response.json()) as BatchResponse;

    startTransition(() => {
      setBatch(nextBatch);
      setSelectedId(selectedRow.id);
      setLoading(null);
    });
  }

  async function submitReview() {
    if (!batch) return;

    const payload: ReviewPayload = {
      items: rows.map((row) => {
        const decision = getDecision(row, draftDecision);
        const reviewDecision: ReviewDecision = decision === "pending" ? "confirmed" : decision;
        const technicianNotes = draftNotes[row.id] ?? toText(row.technicianNotes);
        const normalizedName = draftName[row.id] ?? toText(row.normalizedName);
        const category = draftCategory[row.id] ?? toText(row.category);

        return {
          itemId: row.id,
          technicianDecision: reviewDecision,
          technicianNotes: technicianNotes || undefined,
          normalizedName: normalizedName || undefined,
          category: category || undefined,
        };
      }),
    };

    setLoading("review");
    setErrorMessage(null);

    const { data, error } = await client.POST("/api/import-flows/{batchId}/review", {
      params: { path: { batchId: batch.id } },
      body: payload,
    });

    if (error || !data) {
      setErrorMessage(getErrorMessage(error) || "Failed to submit technician review.");
      setLoading(null);
      return;
    }

    startTransition(() => {
      setBatch(data);
      setSelectedId(data.items[0]?.id ?? "");
      setLoading(null);
    });
  }

  async function commitImport() {
    if (!batch) return;

    setLoading("commit");
    setErrorMessage(null);

    const { data, error } = await client.POST("/api/import-flows/{batchId}/commit", {
      params: { path: { batchId: batch.id } },
    });

    if (error || !data) {
      setErrorMessage(getErrorMessage(error) || "Failed to commit import batch.");
      setLoading(null);
      return;
    }

    startTransition(() => {
      setCommitResult(data);
      setBatch(data.batch);
      setLoading(null);
    });
  }

  return (
    <div className="min-h-full bg-[#050505] px-4 py-4 md:px-6 md:py-5">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <section className="rounded-[28px] border border-white/[0.07] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#0d0d0d_0%,#070707_100%)] px-5 py-5 md:px-7 md:py-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                  Genesis workflow
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                  Facility Alpha
                </span>
              </div>

              <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-white md:text-[34px]">
                Run Genesis from ingress pull to catalog publish for the same power, cooling,
                compute, and network assets shown in Ops.
              </h1>

              <p className="mt-3 max-w-2xl text-[13px] leading-6 text-zinc-400 md:text-[14px]">
                Genesis stages the latest equipment groups, proposes Atlas matches, routes each item
                through technician review, and only publishes after final confirmation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
              {([1, 2, 3, 4] as WizardStep[]).map((item) => {
                const meta = stepMeta[item];
                const Icon = meta.icon;
                const active = step === item;
                const done = item < step;

                return (
                  <div
                    key={item}
                    className={`rounded-[20px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                      active
                        ? "border-blue-500/30 bg-blue-500/[0.08]"
                        : done
                          ? "border-emerald-500/20 bg-emerald-500/[0.05]"
                          : "border-white/[0.06] bg-[#0a0a0a]/90"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`rounded-2xl border border-white/[0.06] bg-black/20 p-2 ${active ? "text-blue-300" : done ? "text-emerald-300" : "text-zinc-300"}`}
                      >
                        <Icon size={16} weight="duotone" />
                      </span>
                      {done && <CheckCircle size={16} weight="fill" className="text-emerald-400" />}
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                      {meta.eyebrow}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-white">{meta.title}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-white/[0.06] bg-[#0a0a0a]/80 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-2 text-blue-300">
                  <ActiveIcon size={18} weight="duotone" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                    Current stage
                  </p>
                  <h2 className="mt-1 text-[18px] font-semibold text-white">{activeMeta.title}</h2>
                  <p className="mt-1 text-[12px] text-zinc-500">{activeMeta.description}</p>
                </div>
              </div>

              <div className="min-w-[180px]">
                <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Progress</span>
                  <span>{activeMeta.progress}%</span>
                </div>
                <Progress value={activeMeta.progress} indicatorClassName="bg-blue-500" />
              </div>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="rounded-[20px] border border-red-500/16 bg-red-500/[0.05] px-4 py-3 text-[13px] text-red-300">
            {errorMessage}
          </div>
        )}

        {step === 1 && (
          <Panel title="Step 1: Pull genesis batch" subtitle="Ingress source">
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[20px] border border-dashed border-white/[0.1] bg-white/[0.02] p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-300">
                    <FileArrowUp size={16} weight="duotone" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">
                      Ingress controller is the Genesis source
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-zinc-500">
                      This pull reflects the same Mechanical, Hall A, and Hall B equipment families
                      shown across Command Center and Floor Plan.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={pullIngressBatch}
                  disabled={loading === "pull"}
                  className="mt-5 h-10 w-full rounded-xl bg-white text-black hover:bg-zinc-100"
                >
                  {loading === "pull" ? (
                    <SpinnerGap className="animate-spin" weight="bold" />
                  ) : (
                    <FileArrowUp weight="bold" />
                  )}
                  Pull Genesis batch
                </Button>
              </div>

              <div className="space-y-3">
                {rows.length > 0 ? (
                  rows.map((row: ImportItem) => (
                    <button
                      type="button"
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={`w-full rounded-[20px] border p-4 text-left transition-colors ${
                        row.id === selectedId
                          ? "border-blue-500/30 bg-blue-500/[0.08]"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-white">{row.sku}</p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {row.vendor} · {row.quantity} units · {batch?.sourceLabel}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/[0.07] px-2 py-0.5 text-[10px] text-zinc-400">
                          Ingress
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4 text-[12px] text-zinc-500">
                    No Genesis batch loaded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!step1Complete}
                className="h-10 rounded-xl bg-white text-black hover:bg-zinc-100 disabled:bg-white/10 disabled:text-zinc-500"
              >
                <Brain weight="bold" />
                Next: map assets
              </Button>
            </div>
          </Panel>
        )}

        {step === 2 && (
          <Panel title="Step 2: Map to Atlas catalog" subtitle="Catalog matching">
            <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-3">
                {rows.map((row: ImportItem) => (
                  <button
                    type="button"
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full rounded-[20px] border p-4 text-left transition-colors ${
                      row.id === selectedId
                        ? "border-blue-500/30 bg-blue-500/[0.08]"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-white">{row.sku}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{row.vendor}</p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-600">
                      <Brain size={12} weight="duotone" />
                      {row.normalizedName
                        ? `${row.confidence ?? 0}% confidence`
                        : "Awaiting matcher"}
                    </div>
                  </button>
                ))}

                <div className="rounded-[20px] border border-emerald-500/16 bg-emerald-500/[0.05] p-4">
                  <p className="text-[13px] font-semibold text-white">Generate catalog matches</p>
                  <p className="mt-1 text-[12px] text-zinc-500">
                    Genesis proposes canonical Atlas names, categories, and likely matches for each
                    equipment group before a technician signs off.
                  </p>
                  <Button
                    type="button"
                    onClick={runReasoningLayer}
                    disabled={!batch || loading === "match"}
                    className="mt-4 h-10 w-full rounded-xl bg-white text-black hover:bg-zinc-100 disabled:bg-white/10 disabled:text-zinc-500"
                  >
                    {loading === "match" ? (
                      <SpinnerGap className="animate-spin" weight="bold" />
                    ) : (
                      <Brain weight="bold" />
                    )}
                    Generate matches
                  </Button>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-4">
                {selectedRow ? (
                  <>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Brain size={16} weight="duotone" />
                      <h3 className="text-[15px] font-semibold text-white">
                        Suggested catalog mapping
                      </h3>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                          Normalized name
                        </p>
                        <div className="mt-2 rounded-[16px] border border-white/[0.06] bg-black/20 px-3 py-3 text-[12px] text-white">
                          {toText(selectedRow.normalizedName) || "Not generated yet"}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                          Category
                        </p>
                        <div className="mt-2 rounded-[16px] border border-white/[0.06] bg-black/20 px-3 py-3 text-[12px] text-white">
                          {toText(selectedRow.category) || "Not generated yet"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[18px] border border-white/[0.06] bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                        Reasoning summary
                      </p>
                      <p className="mt-2 text-[12px] leading-6 text-zinc-400">
                        {toText(selectedRow.reasoning) || "No reasoning generated yet."}
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {selectedRow.candidates.length > 0 ? (
                        selectedRow.candidates.map(
                          (candidate: ImportItem["candidates"][number]) => (
                            <div
                              key={`${selectedRow.id}-${candidate.label}`}
                              className="rounded-[18px] border border-white/[0.06] bg-black/20 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[12px] font-medium text-white">
                                    {candidate.label}
                                  </p>
                                  <p className="mt-1 text-[11px] text-zinc-500">
                                    {candidate.notes}
                                  </p>
                                </div>
                                <span className="text-[11px] font-semibold text-zinc-300">
                                  {candidate.confidence}%
                                </span>
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className="rounded-[18px] border border-white/[0.06] bg-black/20 p-3 text-[12px] text-zinc-500">
                          Generate matches to view candidate catalog associations.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-zinc-500">No row selected.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-between gap-3">
              <Button
                type="button"
                onClick={() => setStep(1)}
                variant="outline"
                className="h-10 rounded-xl border-white/[0.08] bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]"
              >
                <FileArrowUp weight="bold" />
                Back to Genesis pull
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                disabled={!step2Complete}
                className="h-10 rounded-xl bg-white text-black hover:bg-zinc-100 disabled:bg-white/10 disabled:text-zinc-500"
              >
                <UserFocus weight="bold" />
                Next: review batch
              </Button>
            </div>
          </Panel>
        )}

        {step === 3 && (
          <Panel title="Step 3: Technician review" subtitle="Human confirmation">
            <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-3">
                {rows.map((row: ImportItem) => {
                  const decision = getDecision(row, draftDecision);
                  const ready =
                    row.documents.length > 0 && decision !== "pending" && decision !== "needs-doc";

                  return (
                    <button
                      type="button"
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={`w-full rounded-[20px] border p-4 text-left transition-colors ${
                        row.id === selectedId
                          ? "border-blue-500/30 bg-blue-500/[0.08]"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-white">{row.sku}</p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {draftName[row.id] ?? toText(row.normalizedName)}
                          </p>
                        </div>
                        {ready ? (
                          <CheckCircle size={16} weight="fill" className="text-emerald-400" />
                        ) : (
                          <WarningCircle size={16} weight="duotone" className="text-amber-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {selectedRow ? (
                  <>
                    <div className="rounded-[20px] border border-amber-500/18 bg-amber-500/[0.05] p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-amber-500/18 bg-black/20 p-2 text-amber-300">
                          <WarningCircle size={16} weight="duotone" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-white">
                            Technician sign-off gates publication.
                          </p>
                          <p className="mt-1 text-[12px] leading-5 text-zinc-400">
                            Upload the source PDF for each part, correct names or categories, and
                            block any item that still needs evidence.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                            Normalized name
                          </p>
                          <Input
                            value={draftName[selectedRow.id] ?? toText(selectedRow.normalizedName)}
                            onChange={(event) =>
                              setDraftName((current) => ({
                                ...current,
                                [selectedRow.id]: event.target.value,
                              }))
                            }
                            className="mt-2 border-white/[0.08] bg-white/[0.03] text-white"
                          />
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                            Category
                          </p>
                          <Input
                            value={draftCategory[selectedRow.id] ?? toText(selectedRow.category)}
                            onChange={(event) =>
                              setDraftCategory((current) => ({
                                ...current,
                                [selectedRow.id]: event.target.value,
                              }))
                            }
                            className="mt-2 border-white/[0.08] bg-white/[0.03] text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <BookOpenText size={15} weight="duotone" />
                        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                          Documentation
                        </p>
                      </div>

                      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-[16px] border border-dashed border-white/[0.1] bg-black/20 px-4 py-4 text-[12px] text-zinc-300 hover:bg-white/[0.04]">
                        {loading === "upload" ? (
                          <SpinnerGap className="animate-spin" weight="bold" />
                        ) : (
                          <BookOpenText weight="bold" />
                        )}
                        Upload PDF manual or wiring pack
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={uploadPdf}
                        />
                      </label>

                      <div className="mt-3 space-y-2">
                        {selectedRow.documents.length > 0 ? (
                          selectedRow.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="rounded-[16px] border border-white/[0.06] bg-black/20 px-3 py-2 text-[12px] text-zinc-300"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span>{doc.fileName}</span>
                                <span className="text-[11px] text-zinc-500">
                                  {Math.max(1, Math.round(doc.sizeBytes / 1024))} KB
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[16px] border border-red-500/16 bg-red-500/[0.04] px-3 py-2 text-[12px] text-red-300">
                            No PDF documentation uploaded yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <PencilSimple size={15} weight="duotone" />
                        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                          Technician decision
                        </p>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {[
                          { value: "confirmed", label: "Confirm", icon: CheckCircle },
                          { value: "edited", label: "Edit + confirm", icon: PencilSimple },
                          { value: "needs-doc", label: "Block", icon: WarningCircle },
                        ].map(({ value, label, icon: Icon }) => {
                          const active =
                            (draftDecision[selectedRow.id] ?? selectedRow.technicianDecision) ===
                            value;
                          return (
                            <button
                              type="button"
                              key={value}
                              onClick={() =>
                                setDraftDecision((current) => ({
                                  ...current,
                                  [selectedRow.id]: value as TechnicianDecision,
                                }))
                              }
                              className={`rounded-[18px] border px-3 py-3 text-left transition-colors ${
                                active
                                  ? "border-blue-500/30 bg-blue-500/[0.08]"
                                  : "border-white/[0.06] bg-black/20 hover:bg-white/[0.04]"
                              }`}
                            >
                              <Icon size={14} weight="duotone" className="text-zinc-300" />
                              <p className="mt-2 text-[12px] font-medium text-white">{label}</p>
                            </button>
                          );
                        })}
                      </div>

                      <Textarea
                        value={draftNotes[selectedRow.id] ?? toText(selectedRow.technicianNotes)}
                        onChange={(event) =>
                          setDraftNotes((current) => ({
                            ...current,
                            [selectedRow.id]: event.target.value,
                          }))
                        }
                        placeholder="Technician note, model revision, rack orientation, doc warning..."
                        className="mt-3 min-h-[110px] border-white/[0.08] bg-black/20 text-white"
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-zinc-500">No row selected.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-between gap-3">
              <Button
                type="button"
                onClick={() => setStep(2)}
                variant="outline"
                className="h-10 rounded-xl border-white/[0.08] bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]"
              >
                <Brain weight="bold" />
                Back to matching
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={submitReview}
                  disabled={!batch || loading === "review"}
                  variant="outline"
                  className="h-10 rounded-xl border-white/[0.08] bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08] disabled:bg-white/10 disabled:text-zinc-500"
                >
                  {loading === "review" ? (
                    <SpinnerGap className="animate-spin" weight="bold" />
                  ) : (
                    <CheckCircle weight="bold" />
                  )}
                  Save technician review
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!step3Complete}
                  className="h-10 rounded-xl bg-white text-black hover:bg-zinc-100 disabled:bg-white/10 disabled:text-zinc-500"
                >
                  <Database weight="bold" />
                  Next: publish check
                </Button>
              </div>
            </div>
          </Panel>
        )}

        {step === 4 && (
          <Panel title="Final confirmation table" subtitle="Catalog publish">
            <div className="rounded-[20px] border border-emerald-500/16 bg-emerald-500/[0.05] p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-emerald-500/18 bg-black/20 p-2 text-emerald-300">
                  <Database size={16} weight="duotone" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">
                    Final confirmation before Genesis publishes.
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-zinc-400">
                    Review every SKU, mapped catalog name, attached document count, and technician
                    decision before writing to the live component catalog.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[20px] border border-white/[0.06] bg-white/[0.02]">
              <div className="grid grid-cols-[1.2fr_1.1fr_0.8fr_0.7fr_0.9fr] gap-3 border-b border-white/[0.06] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                <span>SKU</span>
                <span>Normalized name</span>
                <span>Category</span>
                <span>Docs</span>
                <span>Decision</span>
              </div>

              {rows.map((row: ImportItem) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.2fr_1.1fr_0.8fr_0.7fr_0.9fr] gap-3 border-b border-white/[0.06] px-4 py-3 text-[12px] text-zinc-300 last:border-b-0"
                >
                  <span className="font-medium text-white">{row.sku}</span>
                  <span>{toText(row.normalizedName)}</span>
                  <span>{toText(row.category)}</span>
                  <span>{row.documents.length}</span>
                  <span className="capitalize">{row.technicianDecision.replace("-", " ")}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between gap-3">
              <Button
                type="button"
                onClick={() => setStep(3)}
                variant="outline"
                className="h-10 rounded-xl border-white/[0.08] bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]"
              >
                <UserFocus weight="bold" />
                Back to technician review
              </Button>
              <Button
                type="button"
                onClick={commitImport}
                disabled={!batch || loading === "commit"}
                className="h-10 rounded-xl bg-white text-black hover:bg-zinc-100 disabled:bg-white/10 disabled:text-zinc-500"
              >
                {loading === "commit" ? (
                  <SpinnerGap className="animate-spin" weight="bold" />
                ) : (
                  <Database weight="bold" />
                )}
                Publish to catalog
              </Button>
            </div>

            {commitResult && (
              <div className="mt-4 rounded-[20px] border border-emerald-500/18 bg-emerald-500/[0.05] p-4 text-[13px] text-emerald-300">
                Genesis batch published. {commitResult.catalogEntries.length} catalog entries were
                written to the Atlas component catalog.
              </div>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
