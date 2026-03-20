"use client";

import { hasCompletePrizeGroups, isPrizeNumberValid, prizeTypeMetadataList } from "@thai-lottery-checker/domain";
import type { AdminResultDetail, AdminResultWriteRequest, PrizeGroup, PrizeType } from "@thai-lottery-checker/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  AdminApiError,
  correctAdminResult,
  createAdminResult,
  publishAdminResult,
  releaseAdminResultGroup,
  unreleaseAdminResultGroup,
  updateAdminResult
} from "../../admin/api";

interface ResultEditorFormProps {
  initialResult?: AdminResultDetail;
}

type PrizeGroupInputState = Record<PrizeType, string>;

type ValidationMessage = {
  count?: string;
  format?: string;
  canRelease: boolean;
};

function toInputState(prizeGroups: PrizeGroup[] | undefined): PrizeGroupInputState {
  return prizeTypeMetadataList.reduce((accumulator, metadata) => {
    const group = prizeGroups?.find((item) => item.type === metadata.type);
    accumulator[metadata.type] = group ? group.numbers.join("\n") : "";
    return accumulator;
  }, {} as PrizeGroupInputState);
}

function parseGroupNumbers(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function buildPayload(drawDate: string, drawCode: string, groupState: PrizeGroupInputState): AdminResultWriteRequest {
  return {
    drawDate,
    drawCode: drawCode.trim() === "" ? null : drawCode.trim(),
    prizeGroups: prizeTypeMetadataList.map((metadata) => ({
      type: metadata.type,
      numbers: parseGroupNumbers(groupState[metadata.type])
    }))
  };
}

export function ResultEditorForm({ initialResult }: ResultEditorFormProps) {
  const router = useRouter();
  const existingResult = initialResult ?? null;
  const [drawDate, setDrawDate] = useState(initialResult?.drawDate ?? "");
  const [drawCode, setDrawCode] = useState(initialResult?.drawCode ?? "");
  const [groupState, setGroupState] = useState<PrizeGroupInputState>(() => toInputState(initialResult?.prizeGroups));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [actingPrizeType, setActingPrizeType] = useState<PrizeType | null>(null);

  const mode = existingResult ? (existingResult.status === "published" ? "correct" : "edit") : "create";
  const payload = useMemo(() => buildPayload(drawDate, drawCode, groupState), [drawDate, drawCode, groupState]);
  const initialPayloadSnapshot = useMemo(
    () =>
      existingResult && existingResult.status === "draft"
        ? JSON.stringify({
            drawDate: existingResult.drawDate,
            drawCode: existingResult.drawCode ?? null,
            prizeGroups: existingResult.prizeGroups.map((group) => ({
              type: group.type,
              numbers: group.numbers
            }))
          })
        : null,
    [existingResult]
  );
  const hasUnsavedDraftChanges =
    existingResult?.status === "draft" &&
    initialPayloadSnapshot !== null &&
    initialPayloadSnapshot !== JSON.stringify(payload);

  const releasedPrizeTypes = useMemo(() => {
    return new Set(
      initialResult?.prizeGroups.filter((group) => group.isReleased).map((group) => group.type) ?? []
    );
  }, [initialResult?.prizeGroups]);

  const validation = useMemo(() => {
    return prizeTypeMetadataList.reduce<Record<PrizeType, ValidationMessage>>((accumulator, metadata) => {
      const numbers = parseGroupNumbers(groupState[metadata.type]);
      const invalidNumber = numbers.find((number) => !isPrizeNumberValid(metadata.type, number));
      const hasExactCount = numbers.length === metadata.expectedCount;

      accumulator[metadata.type] = {
        count:
          numbers.length > 0 && !hasExactCount
            ? `Expected ${metadata.expectedCount} number${metadata.expectedCount > 1 ? "s" : ""}`
            : undefined,
        format: invalidNumber ? `Invalid number: ${invalidNumber}` : undefined,
        canRelease: hasExactCount && !invalidNumber
      };

      return accumulator;
    }, {} as Record<PrizeType, ValidationMessage>);
  }, [groupState]);

  const isComplete = useMemo(() => hasCompletePrizeGroups(payload.prizeGroups), [payload.prizeGroups]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      if (mode === "create") {
        const response = await createAdminResult(payload);
        setSuccessMessage("Draft result created.");
        router.replace(`/admin/results/${response.result.id}`);
        router.refresh();
        return;
      }

      if (mode === "edit" && existingResult) {
        await updateAdminResult(existingResult.id, payload);
        setSuccessMessage("Draft result saved.");
        router.refresh();
        return;
      }

      if (!existingResult) {
        throw new Error("Expected an existing result in correction mode");
      }

      await correctAdminResult(existingResult.id, payload);
      setSuccessMessage("Published result corrected.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Failed to save result");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    if (!existingResult || existingResult.status !== "draft") {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isComplete) {
      setErrorMessage("Result prize groups are incomplete or invalid for publish/correction");
      return;
    }

    setIsPublishing(true);

    try {
      await publishAdminResult(existingResult.id);
      setSuccessMessage("Result published.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Failed to publish result");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleGroupRelease(prizeType: PrizeType, shouldRelease: boolean) {
    if (!existingResult || existingResult.status !== "draft") {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (hasUnsavedDraftChanges) {
      setErrorMessage("Save the draft before changing release state.");
      return;
    }

    if (shouldRelease && !validation[prizeType].canRelease) {
      setErrorMessage("This prize group must be complete and valid before release.");
      return;
    }

    setActingPrizeType(prizeType);

    try {
      if (shouldRelease) {
        await releaseAdminResultGroup(existingResult.id, prizeType);
        setSuccessMessage(`${prizeType} released.`);
      } else {
        await unreleaseAdminResultGroup(existingResult.id, prizeType);
        setSuccessMessage(`${prizeType} hidden from public view.`);
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Failed to update release state");
    } finally {
      setActingPrizeType(null);
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSave}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            {mode === "create" ? "New draft" : mode === "edit" ? "Draft editor" : "Published correction"}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {mode === "create" ? "Create result draft" : mode === "edit" ? "Edit draft result" : "Correct published result"}
          </h2>
          {existingResult?.publishedAt ? (
            <p className="mt-2 text-sm text-slate-600">Published at {new Date(existingResult.publishedAt).toLocaleString()}</p>
          ) : null}
        </div>
        <Link
          className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
          href="/admin/results"
        >
          Back to results
        </Link>
      </div>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Draw date</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600"
              onChange={(event) => setDrawDate(event.target.value)}
              required
              type="date"
              value={drawDate}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Draw code</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600"
              onChange={(event) => setDrawCode(event.target.value)}
              placeholder="Optional manual code"
              value={drawCode}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        {prizeTypeMetadataList.map((metadata) => {
          const messages = validation[metadata.type];
          const isReleased = releasedPrizeTypes.has(metadata.type);
          const isActing = actingPrizeType === metadata.type;

          return (
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]" key={metadata.type}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">{metadata.type}</h3>
                    {mode === "edit" ? (
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          isReleased ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isReleased ? "Released" : "Hidden"}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-600">
                    Expected {metadata.expectedCount} number{metadata.expectedCount > 1 ? "s" : ""} • {metadata.digitLength} digits each
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">One number per line</span>
                  {mode === "edit" ? (
                    <button
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isReleased
                          ? "border-amber-300 text-amber-700 hover:border-amber-500"
                          : "border-emerald-300 text-emerald-700 hover:border-emerald-500"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                      disabled={isActing || isSaving || isPublishing || hasUnsavedDraftChanges || (releasedPrizeTypes.has(metadata.type) ? false : !messages.canRelease)}
                      onClick={() => void handleGroupRelease(metadata.type, !isReleased)}
                      type="button"
                    >
                      {isActing ? "Updating..." : isReleased ? "Unrelease" : "Release"}
                    </button>
                  ) : null}
                </div>
              </div>
              <textarea
                className="mt-4 min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none transition focus:border-slate-600"
                onChange={(event) =>
                  setGroupState((current) => ({
                    ...current,
                    [metadata.type]: event.target.value
                  }))
                }
                value={groupState[metadata.type]}
              />
              {messages.format ? <p className="mt-2 text-sm text-rose-600">{messages.format}</p> : null}
              {messages.count ? <p className="mt-2 text-sm text-amber-600">{messages.count}</p> : null}
            </article>
          );
        })}
      </section>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              {isComplete ? "Canonical prize structure is complete." : "Prize structure is incomplete for publish/correction."}
            </p>
            {hasUnsavedDraftChanges && mode === "edit" ? (
              <p className="text-sm text-amber-700">Save the draft before changing release state.</p>
            ) : null}
            {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
            {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSaving || actingPrizeType !== null}
              type="submit"
            >
              {isSaving
                ? "Saving..."
                : mode === "create"
                  ? "Create draft"
                  : mode === "edit"
                    ? "Save draft"
                    : "Apply correction"}
            </button>
            {existingResult?.status === "draft" ? (
              <button
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPublishing || !isComplete || actingPrizeType !== null}
                onClick={() => void handlePublish()}
                type="button"
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}
