"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronDown, Plus, Search, Trash2, X } from "lucide-react";
import { Checkbox, Select, TextInput, type SelectOption } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { useTheme } from "@/components/theme/theme-provider";
import { ME, TEAMMATES } from "@/components/product/conversations/conversations-data";
import { cn } from "@/lib/utils";
import { pipelines, stages, type Opportunity } from "./opportunities-data";
import { UnsavedChangesModal } from "./opportunity-delete-modal";

export type BulkPatch = Partial<
  Pick<
    Opportunity,
    "stageId" | "status" | "value" | "owner" | "followers" | "source" | "expectedClose" | "lostReason"
  >
> & { pipelineId?: string };

type FieldKey =
  | "pipeline"
  | "stage"
  | "status"
  | "value"
  | "owner"
  | "followers"
  | "source"
  | "expectedClose"
  | "lostReason";

type Values = Partial<Record<FieldKey, string | string[]>>;

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "pipeline", label: "Pipeline" },
  { key: "stage", label: "Stage" },
  { key: "status", label: "Status" },
  { key: "value", label: "Value" },
  { key: "owner", label: "Owner" },
  { key: "followers", label: "Followers" },
  { key: "source", label: "Source" },
  { key: "expectedClose", label: "Expected close date" },
  { key: "lostReason", label: "Lost reason" },
];
const LABEL = Object.fromEntries(FIELDS.map((f) => [f.key, f.label])) as Record<FieldKey, string>;

const PIPELINE_OPTIONS: SelectOption[] = pipelines.map((p) => ({ value: p.id, label: p.label }));
const STAGE_OPTIONS: SelectOption[] = stages.map((s) => ({ value: s.id, label: s.label }));
const STATUS_OPTIONS: SelectOption[] = [
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "abandoned", label: "Abandoned" },
];
const PEOPLE = [ME, ...TEAMMATES];
const OWNER_OPTIONS: SelectOption[] = PEOPLE.map((p) => ({
  value: p.name,
  label: p.name,
  hint: p.id === ME.id ? "You" : undefined,
}));
const LOST_REASONS: SelectOption[] = [
  "Budget constraints",
  "Chose a competitor",
  "No response",
  "Timing isn't right",
  "Not a fit",
].map((r) => ({ value: r, label: r }));

const BTN = "h-[36px] text-[14px]";
const PRIMARY_DISABLED =
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100";

function filled(v: string | string[] | undefined) {
  return Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim() !== "";
}

/** Why a field in the picker cannot be picked yet, or null when it can. */
function lockReason(key: FieldKey, fields: FieldKey[], values: Values): string | null {
  if (key === "stage" && !fields.includes("pipeline")) return "Pick a pipeline first";
  if (key === "lostReason" && values.status !== "lost") return "Set status to Lost first";
  return null;
}

/** Why an added field cannot be removed on its own, or null when it can. */
function requiredBy(key: FieldKey, fields: FieldKey[], values: Values): string | null {
  if (key === "stage" && fields.includes("pipeline")) return "Stage is required when you change the pipeline";
  if (key === "lostReason" && values.status === "lost") return "Lost reason is required when status is Lost";
  return null;
}

/**
 * Edit a set of fields across every selected opportunity at once.
 *
 * Two steps in one panel: pick a field, then give it a value. Fields that
 * only make sense together arrive together — a new pipeline needs a stage in
 * it, and a lost deal needs a reason — so picking the first adds the second,
 * and the second cannot be removed while the first stands.
 *
 * Portalled to the body (so no page overflow or transform can clip the fixed
 * card) and re-stamped with the page theme, which the portal leaves behind.
 */
export function BulkEditDrawer({
  count,
  onClose,
  onSave,
}: {
  count: number;
  onClose: () => void;
  onSave: (patch: BulkPatch) => void;
}) {
  const { effective } = useTheme();
  const [fields, setFields] = React.useState<FieldKey[]>([]);
  const [values, setValues] = React.useState<Values>({});
  const [step, setStep] = React.useState<"picker" | "editor">("picker");
  const [query, setQuery] = React.useState("");
  const [groupOpen, setGroupOpen] = React.useState(true);
  const [confirming, setConfirming] = React.useState(false);

  const requestClose = React.useCallback(() => {
    if (fields.length > 0) setConfirming(true);
    else onClose();
  }, [fields.length, onClose]);

  /*
   * Bubble phase on the document: an open Select, the followers menu and the
   * unsaved-changes Modal all catch Escape in the capture phase and stop it,
   * so by the time it reaches here nothing above the drawer wanted it.
   */
  React.useEffect(() => {
    if (confirming) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirming, requestClose]);

  const addField = (key: FieldKey) => {
    setFields((cur) => {
      const next = [...cur, key];
      if (key === "pipeline" && !next.includes("stage")) next.push("stage");
      return next;
    });
    setQuery("");
    setStep("editor");
  };

  const removeField = (key: FieldKey) => {
    const drop: FieldKey[] =
      key === "pipeline" ? ["pipeline", "stage"] : key === "status" ? ["status", "lostReason"] : [key];
    const nextFields = fields.filter((f) => !drop.includes(f));
    setFields(nextFields);
    setValues((cur) => {
      const next = { ...cur };
      for (const d of drop) delete next[d];
      return next;
    });
    if (nextFields.length === 0) setStep("picker");
  };

  const setValue = (key: FieldKey, v: string | string[]) => {
    setValues((cur) => {
      const next: Values = { ...cur, [key]: v };
      // A pipeline has its own stages, so a stage picked for the old one is void.
      if (key === "pipeline" && cur.pipeline !== v) delete next.stage;
      if (key === "status" && v !== "lost") delete next.lostReason;
      return next;
    });
    if (key === "status") {
      setFields((cur) => {
        if (v === "lost") return cur.includes("lostReason") ? cur : [...cur, "lostReason"];
        return cur.filter((f) => f !== "lostReason");
      });
    }
  };

  const ready = fields.length > 0 && fields.every((f) => filled(values[f]));

  const save = () => {
    if (!ready) return;
    const patch: BulkPatch = {};
    const str = (k: FieldKey) => (values[k] as string).trim();
    for (const f of fields) {
      switch (f) {
        case "pipeline":
          patch.pipelineId = str(f);
          break;
        case "stage":
          patch.stageId = str(f);
          break;
        case "status":
          patch.status = str(f) as NonNullable<Opportunity["status"]>;
          break;
        case "value": {
          const n = Number(str(f));
          patch.value = `$${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
          break;
        }
        case "owner":
          patch.owner = str(f);
          break;
        case "followers":
          patch.followers = [...(values.followers as string[])];
          break;
        case "source":
          patch.source = str(f);
          break;
        case "expectedClose":
          patch.expectedClose = str(f);
          break;
        case "lostReason":
          patch.lostReason = str(f);
          break;
      }
    }
    onSave(patch);
  };

  const available = FIELDS.filter((f) => !fields.includes(f.key));
  const shown = query
    ? available.filter((f) => f.label.toLowerCase().includes(query.trim().toLowerCase()))
    : available;
  const canAddMore = available.some((f) => lockReason(f.key, fields, values) === null);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div data-page-theme={effective.appTheme} className="contents">
      <button
        type="button"
        aria-label="Close bulk edit"
        tabIndex={-1}
        onClick={requestClose}
        className="motion-fade-in fixed inset-0 z-[80] cursor-default bg-[#1018284d]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Bulk edit"
        style={{ width: 380 }}
        className="motion-slot-in fixed top-[8px] right-[8px] bottom-[8px] z-[80] flex max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[0_12px_32px_-8px_rgba(15,23,42,0.22),0_0_0_1px_var(--pg-card-border)]"
      >
        <header className="flex shrink-0 items-start gap-[8px] border-b border-pg-head-border px-[16px] pt-[12px] pb-[12px]">
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
              Bulk edit
            </h2>
            <p className="truncate text-[13px] leading-[18px] text-pg-muted">
              Editing {count.toLocaleString("en-US")} {count === 1 ? "opportunity" : "opportunities"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={requestClose}
            className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading active:scale-90"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-[16px] py-[16px]">
          {step === "picker" ? (
            <div className="flex flex-col gap-[12px]">
              {fields.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep("editor")}
                  className="-ml-[4px] flex h-[28px] w-fit items-center gap-[6px] rounded-[6px] px-[4px] text-[13px] leading-[18px] font-medium text-pg-muted motion-tap hover:text-pg-heading"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  Back to fields
                </button>
              ) : null}
              <div className="relative">
                <Search
                  size={15}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-pg-faint"
                />
                <TextInput
                  autoFocus
                  aria-label="Search fields"
                  placeholder="Search fields"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-[34px]"
                />
              </div>
              <h3 className="text-[14px] leading-[20px] font-medium text-pg-heading">
                Select a field to edit
              </h3>
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-expanded={groupOpen}
                  onClick={() => setGroupOpen((v) => !v)}
                  className="flex h-[32px] items-center gap-[6px] rounded-[6px] text-left text-[13px] leading-[18px] font-semibold text-pg-text-strong motion-tap"
                >
                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className={cn("shrink-0 text-pg-faint transition-transform duration-150", !groupOpen && "-rotate-90")}
                  />
                  <span className="flex-1">Opportunity details</span>
                  <span className="text-[12px] leading-[16px] font-medium tabular-nums text-pg-faint">
                    {shown.length}
                  </span>
                </button>
                {groupOpen ? (
                  <ul className="flex flex-col py-[2px]">
                    {shown.length === 0 ? (
                      <li className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                        No fields match
                      </li>
                    ) : null}
                    {shown.map((f) => {
                      const lock = lockReason(f.key, fields, values);
                      return (
                        <li key={f.key} className="group relative">
                          <button
                            type="button"
                            aria-disabled={lock ? true : undefined}
                            aria-describedby={lock ? `lock-${f.key}` : undefined}
                            onClick={() => {
                              if (!lock) addField(f.key);
                            }}
                            className={cn(
                              "flex h-[36px] w-full items-center rounded-[6px] px-[10px] pl-[31px] text-left text-[14px] leading-[20px]",
                              lock
                                ? "cursor-not-allowed text-pg-faint"
                                : "text-pg-text motion-tap hover:bg-pg",
                            )}
                          >
                            {f.label}
                          </button>
                          {lock ? (
                            <span
                              id={`lock-${f.key}`}
                              role="tooltip"
                              className="pointer-events-none absolute top-1/2 right-[8px] z-[1] -translate-y-1/2 rounded-[6px] bg-pg-overlay px-[8px] py-[4px] text-[12px] leading-[16px] font-medium whitespace-nowrap text-pg-surface opacity-0 shadow-[0_4px_12px_rgba(16,24,40,0.18)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                            >
                              {lock}
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-[16px]">
              {fields.map((f) => {
                const locked = requiredBy(f, fields, values);
                return (
                  <div key={f} className="flex flex-col gap-[4px]">
                    <span id={`bulk-${f}`} className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
                      {LABEL[f]}
                      <span className="text-[var(--hr-error-500)]"> *</span>
                    </span>
                    <div className="flex items-start gap-[8px]">
                      <div className="min-w-0 flex-1">
                        <FieldControl
                          field={f}
                          value={values[f]}
                          onChange={(v) => setValue(f, v)}
                        />
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${LABEL[f].toLowerCase()}`}
                        title={locked ?? `Remove ${LABEL[f].toLowerCase()}`}
                        disabled={locked !== null}
                        onClick={() => removeField(f)}
                        className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap enabled:hover:text-pg-danger enabled:hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {canAddMore ? (
                <button
                  type="button"
                  onClick={() => setStep("picker")}
                  className="-ml-[4px] flex h-[32px] w-fit items-center gap-[6px] rounded-[6px] px-[4px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:brightness-110"
                >
                  <Plus size={15} aria-hidden="true" />
                  Add field
                </button>
              ) : null}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center gap-[12px] border-t border-pg-head-border px-[16px] py-[12px]">
          <span className="flex-1" />
          <OutlineButton onClick={requestClose} className={BTN}>
            Cancel
          </OutlineButton>
          <PrimaryButton disabled={!ready} onClick={save} className={cn(BTN, PRIMARY_DISABLED)}>
            Save
          </PrimaryButton>
        </footer>
      </aside>

      {confirming ? (
        <UnsavedChangesModal onKeepEditing={() => setConfirming(false)} onDiscard={onClose} />
      ) : null}
    </div>,
    document.body,
  );
}

/* ─── Controls ──────────────────────────────────────────────────────────── */

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldKey;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  const str = typeof value === "string" ? value : "";
  const labelledBy = `bulk-${field}`;
  switch (field) {
    case "pipeline":
      return <Select aria-label="Pipeline" value={str || null} options={PIPELINE_OPTIONS} onChange={onChange} placeholder="Select pipeline" />;
    case "stage":
      return <Select aria-label="Stage" value={str || null} options={STAGE_OPTIONS} onChange={onChange} placeholder="Select stage" />;
    case "status":
      return <Select aria-label="Status" value={str || null} options={STATUS_OPTIONS} onChange={onChange} placeholder="Select status" />;
    case "owner":
      return <Select aria-label="Owner" value={str || null} options={OWNER_OPTIONS} onChange={onChange} placeholder="Select owner" />;
    case "lostReason":
      return <Select aria-label="Lost reason" value={str || null} options={LOST_REASONS} onChange={onChange} placeholder="Select reason" />;
    case "value":
      return (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-[14px] leading-[20px] text-pg-muted"
          >
            $
          </span>
          <TextInput
            aria-labelledby={labelledBy}
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="0"
            value={str}
            onChange={(e) => onChange(e.target.value)}
            className="pl-[24px] tabular-nums"
          />
        </div>
      );
    case "source":
      return (
        <TextInput
          aria-labelledby={labelledBy}
          placeholder="Enter source"
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "expectedClose":
      return (
        <TextInput
          aria-labelledby={labelledBy}
          type="date"
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "followers":
      return (
        <FollowersSelect
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          labelledBy={labelledBy}
        />
      );
  }
}

/** A multi-select that shows its picks as removable chips. */
function FollowersSelect({
  value,
  onChange,
  labelledBy,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  labelledBy: string;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((n) => n !== name) : [...value, name]);

  return (
    <div className="relative min-w-0">
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelledBy}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={cn(
          "flex min-h-[36px] w-full cursor-pointer flex-wrap items-center gap-[4px] rounded-[8px] bg-pg-surface py-[4px] pr-[32px] pl-[6px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] focus:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        {value.length === 0 ? (
          <span className="px-[6px] text-[14px] leading-[20px] text-pg-faint">Select followers</span>
        ) : (
          value.map((name) => (
            <span
              key={name}
              className="flex h-[26px] max-w-full items-center gap-[4px] rounded-[6px] bg-pg pr-[2px] pl-[8px] text-[13px] leading-[18px] text-pg-text"
            >
              <span className="truncate">{name}</span>
              <button
                type="button"
                aria-label={`Remove ${name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(name);
                }}
                className="flex size-[20px] shrink-0 items-center justify-center rounded-[4px] text-pg-muted motion-tap hover:text-pg-heading"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute top-[10px] right-[12px] text-pg-faint"
        />
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close options"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default"
          />
          <div
            role="listbox"
            aria-multiselectable="true"
            className="absolute top-[calc(100%+4px)] left-0 z-[61] flex max-h-[280px] w-full min-w-[220px] flex-col overflow-y-auto rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {PEOPLE.map((p) => (
              <Checkbox
                key={p.id}
                checked={value.includes(p.name)}
                onChange={() => toggle(p.name)}
                label={p.id === ME.id ? `${p.name} (you)` : p.name}
                className="w-full rounded-[6px] px-[10px] py-[7px] hover:bg-pg"
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
