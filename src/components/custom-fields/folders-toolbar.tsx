"use client";

import * as React from "react";
import { ChevronDown, Columns3, X } from "lucide-react";
import { Checkbox, Select } from "@/components/page/form-controls";
import type { PagerState } from "@/components/page/table-card";
import { cn } from "@/lib/utils";

/* ─── Created filter ────────────────────────────────────────────────────── */

export type Period =
  | "today"
  | "yesterday"
  | "this-week"
  | "this-month"
  | "this-quarter"
  | "in-month"
  | "this-year";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This week" },
  { value: "this-month", label: "This month" },
  { value: "this-quarter", label: "This quarter" },
  { value: "in-month", label: "In month" },
  { value: "this-year", label: "This year" },
];

export interface CreatedFilter {
  negate: boolean;
  period: Period;
  /** "2026-08" — only read when the period is "in-month". */
  month: string;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

/** The last 24 months, newest first — what "In month" can pick from. */
function recentMonths(now: Date): { value: string; label: string }[] {
  return Array.from({ length: 24 }, (_, i) => {
    const key = monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1));
    return { value: key, label: monthLabel(key) };
  });
}

/** [start, end) of a period, in local time — the IST of the column header. */
function periodRange(f: CreatedFilter, now: Date): [Date, Date] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = new Date(y, m, now.getDate());
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  switch (f.period) {
    case "today":
      return [today, addDays(today, 1)];
    case "yesterday":
      return [addDays(today, -1), today];
    case "this-week": {
      const start = addDays(today, -today.getDay());
      return [start, addDays(start, 7)];
    }
    case "this-month":
      return [new Date(y, m, 1), new Date(y, m + 1, 1)];
    case "this-quarter": {
      const q = Math.floor(m / 3) * 3;
      return [new Date(y, q, 1), new Date(y, q + 3, 1)];
    }
    case "in-month": {
      const [yy, mm] = f.month.split("-").map(Number);
      return [new Date(yy, mm - 1, 1), new Date(yy, mm, 1)];
    }
    case "this-year":
      return [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
  }
}

export function matchesCreated(iso: string, f: CreatedFilter | null, now: Date): boolean {
  if (!f) return true;
  const [start, end] = periodRange(f, now);
  const t = new Date(iso).getTime();
  const inside = t >= start.getTime() && t < end.getTime();
  return f.negate ? !inside : inside;
}

function describe(f: CreatedFilter | null): string {
  if (!f) return "All";
  const period = f.period === "in-month" ? `In ${monthLabel(f.month)}` : PERIODS.find((p) => p.value === f.period)!.label;
  return `${f.negate ? "Is not" : "Is"} ${period}`;
}

const POPOVER =
  "absolute top-[calc(100%+6px)] left-0 z-40 rounded-[8px] bg-pg-surface p-[12px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]";

/**
 * The "Created (IST) All ×" chip and its popover.
 *
 * The popover edits a draft and only Apply commits it, like the live filter;
 * Clear drops the filter outright. The chip's × does the same without
 * opening anything.
 */
export function CreatedFilterChip({
  value,
  onChange,
}: {
  value: CreatedFilter | null;
  onChange: (next: CreatedFilter | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [negate, setNegate] = React.useState(false);
  const [period, setPeriod] = React.useState<Period | null>(null);
  const [month, setMonth] = React.useState("");
  // Computed once per mount; nobody leaves this tab open across midnight.
  const [months] = React.useState(() => recentMonths(new Date()));

  const openPopover = () => {
    setNegate(value?.negate ?? false);
    setPeriod(value?.period ?? null);
    setMonth(value?.month ?? months[0].value);
    setOpen(true);
  };

  const apply = () => {
    if (!period) return;
    onChange({ negate, period, month });
    setOpen(false);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "flex h-[32px] items-center rounded-full bg-pg-surface text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand)]",
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => (open ? setOpen(false) : openPopover())}
          className="motion-tap flex h-full items-center gap-[8px] pr-[4px] pl-[10px]"
        >
          <span className="text-pg-text-strong">Created (IST)</span>
          <span className={value ? "font-medium text-brand" : "text-pg-muted"}>{describe(value)}</span>
        </button>
        <button
          type="button"
          aria-label="Clear created filter"
          onClick={() => onChange(null)}
          className="motion-tap mr-[6px] flex size-[20px] items-center justify-center rounded-full text-pg-faint hover:bg-pg hover:text-pg-heading"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close filter"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div role="dialog" aria-label="Created (IST) filter" className={cn(POPOVER, "flex w-[380px] flex-col gap-[12px]")}>
            <div className="flex h-[32px] self-start overflow-hidden rounded-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
              {(
                [
                  [false, "Is"],
                  [true, "Is not"],
                ] as const
              ).map(([v, label], i) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={negate === v}
                  onClick={() => setNegate(v)}
                  className={cn(
                    "motion-tap px-[10px] text-[14px] leading-[20px]",
                    i > 0 && "shadow-[inset_1px_0_0_0_var(--pg-border)]",
                    negate === v
                      ? "bg-[color-mix(in_oklab,var(--brand)_8%,var(--pg-surface))] font-medium text-brand"
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
              onChange={(v) => setPeriod(v as Period)}
            />
            {period === "in-month" ? (
              <Select aria-label="Month" value={month} options={months} onChange={setMonth} />
            ) : null}

            <div className="grid grid-cols-2 gap-[8px]">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="motion-tap h-[32px] rounded-[6px] bg-pg-surface text-[14px] leading-[20px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={!period}
                onClick={apply}
                className="motion-tap h-[32px] rounded-[6px] bg-brand text-[14px] leading-[20px] font-semibold text-brand-fg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ─── Columns ───────────────────────────────────────────────────────────── */

export interface ColumnDef<K extends string> {
  key: K;
  label: string;
  /** The name column cannot be hidden — a table of counts with no names. */
  locked?: boolean;
}

export function ColumnsPicker<K extends string>({
  columns,
  visible,
  onToggle,
}: {
  columns: ColumnDef<K>[];
  visible: Set<K>;
  onToggle: (key: K) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex h-[36px] items-center gap-[8px] rounded-[8px] px-[10px] text-[14px] leading-[20px] font-medium text-pg-text-strong hover:bg-pg"
      >
        <Columns3 size={16} aria-hidden="true" className="text-pg-muted" />
        {visible.size}/{columns.length} columns
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close columns"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className={cn(POPOVER, "right-0 left-auto flex w-[220px] flex-col gap-[2px] p-[6px]")}>
            {columns.map((c) => (
              <div key={c.key} className="rounded-[6px] px-[8px] py-[6px] hover:bg-pg">
                <Checkbox
                  checked={visible.has(c.key)}
                  disabled={c.locked}
                  onChange={() => onToggle(c.key)}
                  label={c.label}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ─── Pager ─────────────────────────────────────────────────────────────── */

const PER_PAGE = [10, 20, 50, 100];

/** Five page numbers, windowed around the current one. */
function slots(page: number, count: number): number[] {
  const n = Math.min(5, count);
  const start = Math.min(Math.max(1, page - 2), count - n + 1);
  return Array.from({ length: n }, (_, i) => start + i);
}

const STEP = "motion-tap flex h-[28px] items-center rounded-[6px] px-[8px] text-[13px] leading-[18px] font-medium";

/**
 * The live footer's shape — "Folders per page 20⌄ · 1 - 20 of 97 · Previous
 * 1 2 3 4 5 Next" — rather than table-card's pager, which reads "10 / page"
 * and sits inside its own card. The paging state is still usePagination's.
 */
export function FoldersPager({ state, noun }: { state: PagerState; noun: string }) {
  const { page, perPage, pageCount, total, setPage, setPerPage } = state;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-[8px] pt-[12px] text-[13px] leading-[18px] text-pg-text">
      <span className="text-pg-text-strong">{noun} per page</span>
      <span className="relative flex h-[28px] items-center gap-[6px] rounded-[6px] px-[8px] text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {perPage}
        <ChevronDown size={13} aria-hidden="true" className="text-pg-muted" />
        <select
          aria-label={`${noun} per page`}
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {PER_PAGE.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </span>
      <span className="tabular-nums">
        {from} - {to} of {total.toLocaleString("en-US")}
      </span>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className={cn(
          STEP,
          "shadow-[inset_0_0_0_1px_var(--pg-border)]",
          page <= 1 ? "cursor-not-allowed text-pg-disabled" : "text-pg-text-strong hover:bg-pg",
        )}
      >
        Previous
      </button>
      {slots(page, pageCount).map((n) => (
        <button
          key={n}
          type="button"
          aria-current={n === page ? "page" : undefined}
          onClick={() => setPage(n)}
          className={cn(
            STEP,
            "min-w-[28px] justify-center",
            n === page
              ? "font-semibold text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
              : "text-pg-text hover:bg-pg hover:text-pg-text-strong",
          )}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => setPage(page + 1)}
        className={cn(
          STEP,
          "shadow-[inset_0_0_0_1px_var(--pg-border)]",
          page >= pageCount ? "cursor-not-allowed text-pg-disabled" : "text-pg-text-strong hover:bg-pg",
        )}
      >
        Next
      </button>
    </div>
  );
}
