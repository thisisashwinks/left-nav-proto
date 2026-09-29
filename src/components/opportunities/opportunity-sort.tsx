"use client";

import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Select } from "@/components/page/form-controls";
import { parseMoney, type Opportunity } from "./opportunities-data";

export type OppSortField =
  | "name"
  | "value"
  | "updated"
  | "created"
  | "expectedClose"
  | "contact";
export interface OpportunitySort {
  field: OppSortField;
  dir: "asc" | "desc";
}

export const OPP_SORT_FIELDS: { value: OppSortField; label: string }[] = [
  { value: "name", label: "Opportunity name" },
  { value: "value", label: "Opportunity value" },
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Created" },
  { value: "expectedClose", label: "Expected close date" },
  { value: "contact", label: "Contact name" },
];

/** What the page opens on: most recently touched deals first. */
export const DEFAULT_OPP_SORT: OpportunitySort = { field: "updated", dir: "desc" };

/** "2 days ago" / "1 week ago" → days, so updates sort by recency. */
function ageDays(text: string): number {
  if (/just now|today|hour|minute/.test(text)) return 0;
  if (/yesterday/.test(text)) return 1;
  const m = text.match(/(\d+)\s+(day|week|month|year)/);
  if (!m) return 0;
  const n = Number(m[1]);
  switch (m[2]) {
    case "week":
      return n * 7;
    case "month":
      return n * 30;
    case "year":
      return n * 365;
    default:
      return n;
  }
}

/** Seed order — "o7" → 7 — stands in for creation time. */
function seedOrder(id: string): number {
  const n = Number(id.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Sorts a flat list. The board calls this on the whole cut and then buckets
 * by stage, so each column keeps the same order — cards sort within a stage.
 */
export function sortOpportunities(
  rows: Opportunity[],
  sort: OpportunitySort | null,
): Opportunity[] {
  if (!sort) return rows;
  const sign = sort.dir === "asc" ? 1 : -1;

  if (sort.field === "expectedClose") {
    // Rows without a date sink to the end whichever way the arrow points.
    return [...rows].sort((a, b) => {
      const ta = a.expectedClose ? new Date(a.expectedClose).getTime() : NaN;
      const tb = b.expectedClose ? new Date(b.expectedClose).getTime() : NaN;
      const na = Number.isNaN(ta);
      const nb = Number.isNaN(tb);
      if (na || nb) return na === nb ? 0 : na ? 1 : -1;
      return (ta - tb) * sign;
    });
  }

  const key = (o: Opportunity): string | number => {
    switch (sort.field) {
      case "value":
        return parseMoney(o.value);
      case "updated":
        // Fewer days ago is MORE recent, so negate: descending = newest first.
        return -ageDays(o.updated);
      case "created":
        return seedOrder(o.id);
      case "contact":
        return o.contact.toLowerCase();
      default:
        return o.name.toLowerCase();
    }
  };
  return [...rows].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return (ka < kb ? -1 : ka > kb ? 1 : 0) * sign;
  });
}

/**
 * The Sort button's popover: one field and a direction — the Contacts
 * popover, typed for opportunities. Rendered inside a `relative` wrapper
 * around the Sort button; it anchors itself below the button's left edge.
 */
export function OpportunitySortPopover({
  sort,
  onChange,
  onClose,
}: {
  sort: OpportunitySort | null;
  onChange: (next: OpportunitySort | null) => void;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const dir = sort?.dir ?? "asc";
  const DirIcon = dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <>
      <button
        type="button"
        aria-label="Close sort"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-30 cursor-default"
      />
      <div
        role="dialog"
        aria-label="Sort"
        className="motion-slot-in absolute top-[calc(100%+8px)] left-0 z-40 flex w-[320px] flex-col gap-[12px] rounded-[12px] bg-pg-surface p-[16px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            Sort by
          </span>
          <button
            type="button"
            disabled={!sort}
            onClick={() => onChange(null)}
            className="text-[14px] leading-[20px] text-pg-muted motion-tap enabled:hover:text-pg-heading disabled:text-pg-disabled"
          >
            Clear
          </button>
        </div>
        <div className="flex items-center gap-[8px]">
          <Select
            className="flex-1"
            aria-label="Sort field"
            placeholder="Select field"
            value={sort?.field ?? null}
            options={OPP_SORT_FIELDS}
            onChange={(v) => onChange({ field: v as OppSortField, dir })}
          />
          <button
            type="button"
            disabled={!sort}
            aria-label={
              dir === "asc"
                ? "Ascending — switch to descending"
                : "Descending — switch to ascending"
            }
            title={dir === "asc" ? "Ascending" : "Descending"}
            onClick={() =>
              sort && onChange({ ...sort, dir: dir === "asc" ? "desc" : "asc" })
            }
            className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--brand)_10%,transparent)] text-brand motion-tap enabled:hover:bg-[color-mix(in_oklab,var(--brand)_18%,transparent)] disabled:text-pg-disabled disabled:bg-pg"
          >
            <DirIcon size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
