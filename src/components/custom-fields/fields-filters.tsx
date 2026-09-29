"use client";

import * as React from "react";
import { Check, Columns3, Search, X } from "lucide-react";
import { Checkbox, Select } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { cn } from "@/lib/utils";
import { FIELD_TYPES, type CustomField, type FieldType } from "./custom-fields-data";

/**
 * The Fields table's filter row: three chips, the column picker and their
 * popovers.
 *
 * Every popover anchors to its trigger in this row rather than in the table,
 * because the table scrolls and a menu anchored inside it would scroll away
 * from the chip that opened it.
 */

/* ─── Created (IST) ─────────────────────────────────────────────────────── */

export type CreatedPeriod =
  | "today"
  | "yesterday"
  | "this-week"
  | "this-month"
  | "this-quarter"
  | "in-month"
  | "this-year";

export interface CreatedFilter {
  op: "is" | "is-not";
  period: CreatedPeriod;
  /** Only for "in-month": 0–11 in the current year. */
  month?: number;
}

const PERIODS: { value: CreatedPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This week" },
  { value: "this-month", label: "This month" },
  { value: "this-quarter", label: "This quarter" },
  { value: "in-month", label: "In month" },
  { value: "this-year", label: "This year" },
];

const MONTHS = Array.from({ length: 12 }, (_, m) =>
  new Date(2000, m, 1).toLocaleDateString("en-US", { month: "long" }),
);

/**
 * The [start, end) window a period covers, measured from now.
 *
 * Weeks start on Sunday, the US calendar the rest of the product uses.
 */
function periodRange(f: CreatedFilter, now: Date): [number, number] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  switch (f.period) {
    case "today":
      return [new Date(y, m, d).getTime(), new Date(y, m, d + 1).getTime()];
    case "yesterday":
      return [new Date(y, m, d - 1).getTime(), new Date(y, m, d).getTime()];
    case "this-week": {
      const start = d - now.getDay();
      return [new Date(y, m, start).getTime(), new Date(y, m, start + 7).getTime()];
    }
    case "this-month":
      return [new Date(y, m, 1).getTime(), new Date(y, m + 1, 1).getTime()];
    case "this-quarter": {
      const q = Math.floor(m / 3) * 3;
      return [new Date(y, q, 1).getTime(), new Date(y, q + 3, 1).getTime()];
    }
    case "in-month": {
      const mm = f.month ?? m;
      return [new Date(y, mm, 1).getTime(), new Date(y, mm + 1, 1).getTime()];
    }
    case "this-year":
      return [new Date(y, 0, 1).getTime(), new Date(y + 1, 0, 1).getTime()];
  }
}

export function matchesCreated(field: CustomField, f: CreatedFilter | null, now: Date): boolean {
  if (!f) return true;
  const [start, end] = periodRange(f, now);
  const t = new Date(field.createdAt).getTime();
  const inside = t >= start && t < end;
  return f.op === "is" ? inside : !inside;
}

export function createdLabel(f: CreatedFilter | null): string {
  if (!f) return "All";
  const op = f.op === "is" ? "Is" : "Is not";
  const period =
    f.period === "in-month"
      ? `in ${MONTHS[f.month ?? new Date().getMonth()]}`
      : PERIODS.find((p) => p.value === f.period)!.label;
  return `${op} ${period}`;
}

/* ─── Source ────────────────────────────────────────────────────────────── */

export type SourceFilter = "all" | CustomField["source"];

const SOURCES: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "custom", label: "Custom field" },
  { value: "standard", label: "Standard field" },
];

/* ─── Columns ───────────────────────────────────────────────────────────── */

export type ColumnId = "name" | "type" | "folder" | "key" | "created" | "description" | "actions";

export const COLUMNS: { id: ColumnId; label: string; locked?: boolean }[] = [
  { id: "name", label: "Field name", locked: true },
  { id: "type", label: "Field type" },
  { id: "folder", label: "Folder name" },
  { id: "key", label: "Key" },
  { id: "created", label: "Created (IST)" },
  { id: "description", label: "Description" },
  { id: "actions", label: "Actions" },
];

export const DEFAULT_HIDDEN: ColumnId[] = ["description"];

/* ─── Popover shell ─────────────────────────────────────────────────────── */

const CARD =
  "absolute top-[calc(100%+4px)] z-[61] rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]";

/**
 * A trigger and the card it opens, over a full-screen click-catcher.
 *
 * The body is a render prop so it mounts on open — a draft held inside it
 * (the Created filter's Is/Is not) starts from the applied value every time
 * without an effect to sync it.
 */
function Popover({
  trigger,
  align = "left",
  className,
  children,
}: {
  trigger: (open: boolean, toggle: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

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

  return (
    <div className="relative shrink-0">
      {trigger(open, () => setOpen((v) => !v))}
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={close}
            className="fixed inset-0 z-[60] cursor-default"
          />
          <div className={cn(CARD, align === "right" ? "right-0" : "left-0", className)}>
            {children(close)}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** "Field type  All  ×" — the label, the applied value, and a reset. */
function Chip({
  label,
  value,
  open,
  active,
  onOpen,
  onReset,
}: {
  label: string;
  value: string;
  open: boolean;
  active: boolean;
  onOpen: () => void;
  onReset: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-[36px] items-center rounded-full bg-pg-surface pr-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
        open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
      )}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onOpen}
        className="flex h-full items-center gap-[8px] rounded-l-full pr-[6px] pl-[12px] text-[14px] leading-[20px] whitespace-nowrap motion-tap"
      >
        <span className="text-pg-text">{label}</span>
        <span className={cn("max-w-[200px] truncate font-medium", active ? "text-brand" : "text-pg-muted")}>
          {value}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Reset ${label}`}
        onClick={onReset}
        className="flex size-[22px] items-center justify-center rounded-full text-pg-faint motion-tap hover:bg-pg hover:text-pg-heading"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ─── The three filters ─────────────────────────────────────────────────── */

const TYPES_SORTED = [...FIELD_TYPES].sort((a, b) => a.label.localeCompare(b.label));

/** Multi-select: an empty list means All. */
export function FieldTypeChip({
  value,
  onChange,
}: {
  value: FieldType[];
  onChange: (next: FieldType[]) => void;
}) {
  const shown =
    value.length === 0
      ? "All"
      : value.length === 1
        ? FIELD_TYPES.find((t) => t.id === value[0])!.label
        : `${value.length} selected`;
  return (
    <Popover
      className="w-[220px]"
      trigger={(open, toggle) => (
        <Chip
          label="Field type"
          value={shown}
          open={open}
          active={value.length > 0}
          onOpen={toggle}
          onReset={() => onChange([])}
        />
      )}
    >
      {() => <FieldTypeList value={value} onChange={onChange} />}
    </Popover>
  );
}

function FieldTypeList({ value, onChange }: { value: FieldType[]; onChange: (next: FieldType[]) => void }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const types = q ? TYPES_SORTED.filter((t) => t.label.toLowerCase().includes(q)) : TYPES_SORTED;
  const showAll = !q || "all".includes(q);

  const row = (key: string, label: string, on: boolean, onClick: () => void) => (
    <button
      key={key}
      type="button"
      role="option"
      aria-selected={on}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left text-[14px] leading-[20px] motion-tap hover:bg-pg",
        on ? "font-medium text-pg-heading" : "text-pg-text",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
    </button>
  );

  return (
    <div className="flex max-h-[340px] flex-col">
      <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
        <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      <div role="listbox" aria-multiselectable="true" className="min-h-0 flex-1 overflow-y-auto p-[4px]">
        {showAll ? row("all", "All", value.length === 0, () => onChange([])) : null}
        {types.map((t) =>
          row(t.id, t.label, value.includes(t.id), () =>
            onChange(value.includes(t.id) ? value.filter((v) => v !== t.id) : [...value, t.id]),
          ),
        )}
        {!showAll && types.length === 0 ? (
          <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No matches</p>
        ) : null}
      </div>
    </div>
  );
}

export function CreatedChip({
  value,
  onChange,
}: {
  value: CreatedFilter | null;
  onChange: (next: CreatedFilter | null) => void;
}) {
  return (
    <Popover
      className="w-[340px] p-[12px]"
      trigger={(open, toggle) => (
        <Chip
          label="Created (IST)"
          value={createdLabel(value)}
          open={open}
          active={value !== null}
          onOpen={toggle}
          onReset={() => onChange(null)}
        />
      )}
    >
      {(close) => (
        <CreatedForm
          value={value}
          onApply={(next) => {
            onChange(next);
            close();
          }}
        />
      )}
    </Popover>
  );
}

/** A draft, so nothing refilters until Apply. */
function CreatedForm({
  value,
  onApply,
}: {
  value: CreatedFilter | null;
  onApply: (next: CreatedFilter | null) => void;
}) {
  const [op, setOp] = React.useState<CreatedFilter["op"]>(value?.op ?? "is");
  const [period, setPeriod] = React.useState<CreatedPeriod | null>(value?.period ?? null);
  const [month, setMonth] = React.useState<number>(value?.month ?? new Date().getMonth());

  return (
    <div className="flex flex-col gap-[12px]">
      <div role="radiogroup" aria-label="Condition" className="flex h-[32px] self-start overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {(
          [
            ["is", "Is"],
            ["is-not", "Is not"],
          ] as const
        ).map(([id, label], i) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={op === id}
            onClick={() => setOp(id)}
            className={cn(
              "px-[12px] text-[14px] leading-[20px] font-medium motion-tap",
              i > 0 && "shadow-[inset_1px_0_0_0_var(--pg-border)]",
              op === id
                ? "bg-[color-mix(in_oklab,var(--brand)_8%,var(--pg-surface))] text-brand"
                : "text-pg-text hover:bg-pg",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <Select
        aria-label="Period"
        value={period}
        options={PERIODS}
        onChange={(v) => setPeriod(v as CreatedPeriod)}
      />
      {period === "in-month" ? (
        <Select
          aria-label="Month"
          value={String(month)}
          options={MONTHS.map((label, m) => ({ value: String(m), label }))}
          onChange={(v) => setMonth(Number(v))}
        />
      ) : null}
      <div className="flex justify-end gap-[12px]">
        <OutlineButton className="h-[36px] text-[14px]" onClick={() => onApply(null)}>
          Clear
        </OutlineButton>
        <PrimaryButton
          className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!period}
          onClick={() =>
            period &&
            onApply({ op, period, ...(period === "in-month" ? { month } : {}) })
          }
        >
          Apply
        </PrimaryButton>
      </div>
    </div>
  );
}

export function SourceChip({
  value,
  onChange,
}: {
  value: SourceFilter;
  onChange: (next: SourceFilter) => void;
}) {
  return (
    <Popover
      className="w-[200px] p-[4px]"
      trigger={(open, toggle) => (
        <Chip
          label="Source"
          value={SOURCES.find((s) => s.value === value)!.label}
          open={open}
          active={value !== "all"}
          onOpen={toggle}
          onReset={() => onChange("all")}
        />
      )}
    >
      {(close) => (
        <div role="listbox">
          {SOURCES.map((s) => {
            const on = s.value === value;
            return (
              <button
                key={s.value}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => {
                  onChange(s.value);
                  close();
                }}
                className={cn(
                  "flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left text-[14px] leading-[20px] motion-tap hover:bg-pg",
                  on ? "font-medium text-pg-heading" : "text-pg-text",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}

/* ─── Column picker ─────────────────────────────────────────────────────── */

export function ColumnPicker({
  hidden,
  onChange,
}: {
  hidden: ColumnId[];
  onChange: (next: ColumnId[]) => void;
}) {
  const visible = COLUMNS.length - hidden.length;
  return (
    <Popover
      align="right"
      className="w-[220px] p-[8px]"
      trigger={(open, toggle) => (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={toggle}
          className={cn(
            "flex h-[36px] items-center gap-[8px] rounded-[8px] px-[10px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-pg-text motion-tap hover:bg-pg",
            open && "bg-pg",
          )}
        >
          <Columns3 size={16} aria-hidden="true" className="text-pg-muted" />
          {visible}/{COLUMNS.length} columns
        </button>
      )}
    >
      {() => (
        <div className="flex flex-col gap-[2px]">
          {COLUMNS.map((c) => (
            <div key={c.id} className="rounded-[6px] px-[8px] py-[6px] hover:bg-pg">
              <Checkbox
                checked={!hidden.includes(c.id)}
                disabled={c.locked}
                label={c.label}
                className="w-full"
                onChange={(on) => onChange(on ? hidden.filter((h) => h !== c.id) : [...hidden, c.id])}
              />
            </div>
          ))}
        </div>
      )}
    </Popover>
  );
}
